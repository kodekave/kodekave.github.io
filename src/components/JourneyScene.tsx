"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { EQUATION } from "@/lib/equation-points";
import { cssUnit, onTheme } from "@/lib/theme";
import {
  buildCloud,
  followerPoints,
  FOLLOWER_TRAIL,
  FOLLOWERS,
  HEAD_ARC,
  FLOATS,
  indexAtShare,
  pathArcAt,
  pickMapPoints,
  sampleAt,
  viewProjection,
  type Cloud,
} from "@/lib/lorenz";
import { type LandCell, VIEW_COLS, landCells } from "@/lib/world-dots";

export type SceneStep = {
  id: string;
  node: ReactNode;
};

/**
 * The homepage's opening, and the two places the point cloud appears.
 *
 * The page is an ordinary page that scrolls. Two things are scripted:
 *
 *   1. The opening is pinned for ZOOM screens of scroll while the portrait zooms
 *      into the equation on the hoodie and fades, and the copy and the pattern
 *      behind it fall away first. After it the page is plain paper and the plus
 *      grid on the body.
 *   2. A fixed canvas holds the Lorenz point cloud. It is only drawn around two
 *      anchors in the page: the map card (`[data-map-stage]`), where the points
 *      fly in and settle into the continents, and the equation slot
 *      (`[data-eq-slot]`), where they condense into the equation on the hoodie.
 *      The points aim at their anchor's box, which moves with the page, so the
 *      shape scrolls with its card. Everywhere else the canvas is empty.
 *
 * Without script, with reduced motion, or before it has started, the opening is
 * one screen and the rest follows it: everything is server-rendered. The cloud
 * is plain WebGL, built when the browser is idle after load; if WebGL is missing
 * the page still works, only without the cloud (the map card draws its own dots
 * and the equation slot stays closed). On a phone the map card draws its own
 * dots, because the map there pans.
 *
 * Scroll lengths below are in viewport heights.
 */
const ZOOM = 1;
/** How much of the recorded curve's length the whole page scrolls through. */
const PATH_SHARE = 0.14;
/**
 * While the map is up the rest of the cloud is not gone but faint behind it,
 * and the other points keep their trails, so the curve keeps moving behind the
 * still dots. These are how much of its strength each keeps (0 to 1).
 */
const GHOST_CLOUD = 0.18;
const GHOST_OTHERS = 0.8;
/**
 * The view of the whole curve while the map is up: from GHOST_YAW round the
 * attractor (face on), swaying GHOST_SWAY, looking down GHOST_TILT from
 * GHOST_DIST away from its centre.
 */
const GHOST_YAW = 1.75;
const GHOST_SWAY = 0.25;
const GHOST_TILT = 0.25;
const GHOST_DIST = 2.3;
/** Where the equation sits in the portrait image, as fractions of its box. */
const EQ_X = 0.375;
const EQ_Y = 0.82;
/** How much of the portrait's width the equation takes up. */
const EQ_W = 0.49;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth01 = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * The two colours the cloud is drawn in: the ink, and the olive a point turns
 * once the yellow one has passed it. They are read off the stylesheet, so the
 * dark theme gets its own (see `readPalette`, called when the theme changes).
 */
const palette = {
  ink: [0.055, 0.141, 0.098] as [number, number, number],
  deep: [0.106, 0.42, 0.27] as [number, number, number],
};
function readPalette() {
  palette.ink = cssUnit("--color-ink", palette.ink);
  palette.deep = cssUnit("--color-brass-deep", palette.deep);
}

const VERTEX = `
attribute vec3 aPos;
attribute vec2 aMeta;
attribute vec3 aMap;
uniform mat4 uVP;
uniform vec2 uShift;
uniform float uPx;
uniform vec2 uMapPx;
uniform vec2 uOff;
uniform float uProg;
uniform float uFade;
uniform float uMorph;
uniform float uGhost;
uniform vec3 uInk;
uniform vec3 uDeep;
varying vec4 vCol;
varying float vKind;
void main() {
  vec4 p = uVP * vec4(aPos, 1.0);
  float behind = step(p.w, 0.02);
  float d = max(p.w, 0.0001);
  vec2 ndc = p.xy / max(p.w, 0.02) + uShift;
  float kind = aMeta.y;
  vKind = kind;
  float near = smoothstep(0.05, 0.4, d);
  float far = 1.0 - smoothstep(2.4, 7.0, d);
  float size;
  if (kind > 2.5) size = clamp(uPx * 5.6 / d, 2.2 * uPx, 9.0 * uPx) * (1.0 - 0.6 * aMeta.x) * (aMeta.x < 0.001 ? 1.9 : 1.0);
  else if (kind > 1.5) size = 20.0 * uPx;
  else if (kind > 0.5) size = clamp(uPx * 2.6 / d, 1.3 * uPx, 8.0 * uPx);
  else size = clamp(uPx * 1.9 / d, 1.0 * uPx, 7.0 * uPx);
  vec3 ink = uInk;
  vec3 deep = uDeep;
  vec3 col = ink;
  float a = 0.2;
  if (kind > 2.5) {
    // The other points: a dot with a trail that fades with its age (aMeta.x).
    a = pow(1.0 - aMeta.x, 1.3) * 0.95;
  } else if (kind > 1.5) {
    a = 1.0;
  } else if (kind > 0.5) {
    float done = step(aMeta.x, uProg);
    col = mix(ink, deep, done);
    a = mix(0.4, 0.92, done);
  }
  a *= near * far * uFade;
  if (kind < 1.5) a *= clamp(1.7 / max(size / uPx, 1.0), 0.35, 1.0);
  a *= 1.0 - behind;

  // Into a shape (the map, or the equation). A point with a target flies to it,
  // each at its own moment; every other point fades away, so none of the cloud
  // is left behind the shape.
  float isMap = step(0.5, aMap.z);
  float m = smoothstep(0.0, 1.0, clamp((uMorph - aMeta.x * 0.5) / 0.5, 0.0, 1.0)) * isMap;
  // While the map is up (uGhost) the rest of the cloud and the other points keep
  // a faint trace of themselves, so the curve keeps moving behind the still dots.
  // The yellow point does not: the map has its own.
  float keep = kind > 2.5 ? uGhost * ${GHOST_OTHERS.toFixed(2)} : (kind > 1.5 ? 0.0 : uGhost * ${GHOST_CLOUD.toFixed(2)});
  a *= 1.0 - clamp(uMorph * 1.8, 0.0, 1.0) * (1.0 - isMap) * (1.0 - keep);
  vec2 tgt = aMap.xy + uOff * isMap;
  vec2 from = mix(ndc, tgt, behind);
  vec2 pos = mix(from, tgt, m);
  float mapSize = aMap.z > 1.5 ? uMapPx.y : uMapPx.x;
  float mapAlpha = aMap.z > 1.5 ? 0.75 : 0.3;
  size = mix(size, mapSize, m);
  a = mix(a, mapAlpha, m);
  col = mix(col, ink, m);

  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = size;
  vCol = vec4(col, a);
}`;

const FRAGMENT = `
precision mediump float;
varying vec4 vCol;
varying float vKind;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  if (vKind > 1.5 && vKind < 2.5) {
    vec3 yellow = vec3(0.914, 1.0, 0.243);
    vec3 c = mix(yellow, vCol.rgb, smoothstep(0.3, 0.36, r));
    float a = vCol.a * (1.0 - smoothstep(0.46, 0.5, r));
    gl_FragColor = vec4(c * a, a);
    return;
  }
  float a = vCol.a * (1.0 - smoothstep(0.25, 0.5, r));
  gl_FragColor = vec4(vCol.rgb * a, a);
}`;

type Renderer = {
  draw: (o: {
    eye: number[];
    target: number[];
    head: number[];
    /** The other points and their trails: xyz, FOLLOWER_TRAIL per point, newest first. */
    others: Float32Array;
    prog: number;
    fade: number;
    shift: [number, number];
    /** 0 is the cloud, 1 is the shape (the map or the equation). */
    morph: number;
    /** 1 while the map is up: the cloud and the other points stay faintly visible. */
    ghost: number;
    /** Where the shape's box has moved to since the points were aimed at it (NDC). */
    off: [number, number];
  }) => void;
  resize: (cssW: number, cssH: number) => void;
  /**
   * Where each of the first `count` points goes, as x, y, kind (NDC; 1 is a
   * land dot, 2 a stronger one), and the dots' sizes in CSS pixels. The array
   * covers every set-aside point, zero past `count`.
   */
  setTargets: (data: Float32Array, count: number, inner: number, rim: number) => void;
  dispose: () => void;
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function createRenderer(canvas: HTMLCanvasElement, cloud: Cloud, mobile: boolean): Renderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const loc = {
    pos: gl.getAttribLocation(prog, "aPos"),
    meta: gl.getAttribLocation(prog, "aMeta"),
    map: gl.getAttribLocation(prog, "aMap"),
    vp: gl.getUniformLocation(prog, "uVP"),
    shift: gl.getUniformLocation(prog, "uShift"),
    off: gl.getUniformLocation(prog, "uOff"),
    px: gl.getUniformLocation(prog, "uPx"),
    mapPx: gl.getUniformLocation(prog, "uMapPx"),
    prog: gl.getUniformLocation(prog, "uProg"),
    fade: gl.getUniformLocation(prog, "uFade"),
    morph: gl.getUniformLocation(prog, "uMorph"),
    ghost: gl.getUniformLocation(prog, "uGhost"),
    ink: gl.getUniformLocation(prog, "uInk"),
    deep: gl.getUniformLocation(prog, "uDeep"),
  };

  const main = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, main);
  gl.bufferData(gl.ARRAY_BUFFER, cloud.vertices, gl.STATIC_DRAW);
  const mapBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, mapBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cloud.count * 3), gl.DYNAMIC_DRAW);
  const headBuf = gl.createBuffer();
  const headData = new Float32Array([0, 0, 0, 0, 2]);
  gl.bindBuffer(gl.ARRAY_BUFFER, headBuf);
  gl.bufferData(gl.ARRAY_BUFFER, headData, gl.DYNAMIC_DRAW);
  // The other points: kind 3, with each trail point's age (0 newest, 1 oldest).
  const othersBuf = gl.createBuffer();
  const othersN = FOLLOWERS * FOLLOWER_TRAIL;
  const othersData = new Float32Array(othersN * FLOATS);
  for (let i = 0; i < othersN; i++) {
    othersData[i * FLOATS + 3] = (i % FOLLOWER_TRAIL) / (FOLLOWER_TRAIL - 1);
    othersData[i * FLOATS + 4] = 3;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, othersBuf);
  gl.bufferData(gl.ARRAY_BUFFER, othersData, gl.DYNAMIC_DRAW);

  const stride = FLOATS * 4;
  const bindMain = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, main);
    gl.enableVertexAttribArray(loc.pos);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(loc.meta);
    gl.vertexAttribPointer(loc.meta, 2, gl.FLOAT, false, stride, 12);
    gl.bindBuffer(gl.ARRAY_BUFFER, mapBuf);
    gl.enableVertexAttribArray(loc.map);
    gl.vertexAttribPointer(loc.map, 3, gl.FLOAT, false, 12, 0);
  };
  const bindOwn = (buf: WebGLBuffer | null) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc.pos);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(loc.meta);
    gl.vertexAttribPointer(loc.meta, 2, gl.FLOAT, false, stride, 12);
    gl.disableVertexAttribArray(loc.map);
    gl.vertexAttrib3f(loc.map, 0, 0, 0);
  };
  const bindHead = () => bindOwn(headBuf);
  const bindOthers = () => bindOwn(othersBuf);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const vp = new Float32Array(16);
  const fovY = (mobile ? 70 : 64) * (Math.PI / 180);
  let dpr = 1;
  let cssH = 1;
  let w = 1;
  let h = 1;
  let targetCount = 0;
  let pxInner = 0;
  let pxRim = 0;

  return {
    resize(cssW, cssHeight) {
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
      cssH = cssHeight;
      w = Math.max(1, Math.round(cssW * dpr));
      h = Math.max(1, Math.round(cssHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    },
    setTargets(data, count, inner, rim) {
      targetCount = count;
      pxInner = inner;
      pxRim = rim;
      gl.bindBuffer(gl.ARRAY_BUFFER, mapBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    },
    draw({ eye, target, head, others, prog: progress, fade, shift, morph, ghost, off }) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (fade <= 0.002) return;
      viewProjection(vp, eye, target, w / h, fovY);
      gl.uniformMatrix4fv(loc.vp, false, vp);
      gl.uniform2f(loc.shift, shift[0], shift[1]);
      gl.uniform2f(loc.off, off[0], off[1]);
      gl.uniform1f(loc.px, dpr * Math.min(1.25, Math.max(0.75, cssH / 900)));
      gl.uniform2f(loc.mapPx, pxInner * dpr, pxRim * dpr);
      gl.uniform1f(loc.prog, progress);
      gl.uniform1f(loc.fade, fade);
      gl.uniform1f(loc.morph, morph);
      gl.uniform1f(loc.ghost, ghost);
      gl.uniform3f(loc.ink, palette.ink[0], palette.ink[1], palette.ink[2]);
      gl.uniform3f(loc.deep, palette.deep[0], palette.deep[1], palette.deep[2]);

      // Once every point is in place only the shape's own points are drawn,
      // unless the cloud is meant to stay faintly behind the map (ghost).
      bindMain();
      gl.drawArrays(gl.POINTS, 0, morph >= 0.999 && targetCount > 0 && ghost <= 0 ? targetCount : cloud.count);

      if (morph < 0.99 || ghost > 0) {
        for (let i = 0; i < othersN; i++) {
          othersData[i * FLOATS] = others[i * 3];
          othersData[i * FLOATS + 1] = others[i * 3 + 1];
          othersData[i * FLOATS + 2] = others[i * 3 + 2];
        }
        bindOthers();
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, othersData);
        gl.drawArrays(gl.POINTS, 0, othersN);
      }

      if (morph < 0.99) {
        headData[0] = head[0];
        headData[1] = head[1];
        headData[2] = head[2];
        bindHead();
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, headData);
        gl.drawArrays(gl.POINTS, 0, 1);
      }
    },
    dispose() {
      gl.deleteBuffer(main);
      gl.deleteBuffer(mapBuf);
      gl.deleteBuffer(headBuf);
      gl.deleteBuffer(othersBuf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** The equation's points, as fractions of its box (0..1), decoded once. */
function equationPoints(): Float32Array {
  const bin = atob(EQUATION.data);
  const out = new Float32Array(EQUATION.count * 2);
  for (let i = 0; i < EQUATION.count; i++) {
    const o = i * 4;
    out[i * 2] = (bin.charCodeAt(o) | (bin.charCodeAt(o + 1) << 8)) / 4095;
    out[i * 2 + 1] = (bin.charCodeAt(o + 2) | (bin.charCodeAt(o + 3) << 8)) / 4095;
  }
  return out;
}

export default function JourneyScene({
  intro,
  steps,
}: {
  intro: ReactNode;
  steps: SceneStep[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const track = root.current;
    const st = stage.current;
    const cv = canvas.current;
    if (!track || !st || !cv) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const introEl = st.querySelector<HTMLElement>("[data-intro]");
    const fadeEls = Array.from(st.querySelectorAll<HTMLElement>("[data-intro-fade]"));
    const zoomEl = st.querySelector<HTMLElement>("[data-zoom]");
    const mapStageEl = track.querySelector<HTMLElement>("[data-map-stage]");
    const eqSlotEl = track.querySelector<HTMLElement>("[data-eq-slot]");

    track.dataset.scene = "live";

    // --- the opening's geometry ---------------------------------------------
    let vw = 1;
    let vh = 1;
    let eqX = 0;
    let eqY = 0;
    let tgtX = 0;
    let tgtY = 0;
    let zoomScale = 4;

    const measure = () => {
      vw = st.clientWidth;
      vh = st.clientHeight;
      if (zoomEl) {
        const keep = zoomEl.style.transform;
        zoomEl.style.transform = "none";
        const r = zoomEl.getBoundingClientRect();
        const s = st.getBoundingClientRect();
        zoomEl.style.transform = keep;
        eqX = r.left - s.left + EQ_X * r.width;
        eqY = r.top - s.top + EQ_Y * r.height;
        tgtX = vw * 0.5;
        tgtY = vh * 0.5;
        zoomScale = Math.max(2.2, (1.3 * 0.78 * vw) / (EQ_W * r.width));
        zoomEl.style.transformOrigin = `${EQ_X * 100}% ${EQ_Y * 100}%`;
      }
    };

    // --- the cloud ----------------------------------------------------------
    let cloud: Cloud | null = null;
    let renderer: Renderer | null = null;
    const eyeP = [0, 0, 0];
    const lookP = [0, 0, 0];
    const headP = [0, 0, 0];
    const othersP = new Float32Array(FOLLOWERS * FOLLOWER_TRAIL * 3);

    // The shapes the cloud becomes: the map, then the equation.
    let cells: LandCell[] = [];
    let eqPts: Float32Array | null = null;
    /** How many points are set aside for each shape (0 when it is not formed). */
    let mapCount = 0;
    let eqCount = 0;
    let setAside = 0;
    let targets: Float32Array | null = null;
    /** Which shape the points are currently aimed at, and where its box was. */
    let aimed: "map" | "eq" | null = null;
    let baseLeft = 0;

    /**
     * Aim the points at a box in the page. Their targets are worked out as if the
     * box's top were at the top of the screen, and `off` (see `apply`) slides them
     * to wherever the box is now, so the shape follows the scroll.
     */
    const placeTargets = (want: "map" | "eq") => {
      const anchor = want === "map" ? mapStageEl : eqSlotEl;
      if (!renderer || !targets || !anchor) return;
      const cw = cv.clientWidth || vw;
      const ch = cv.clientHeight || vh;
      const r = anchor.getBoundingClientRect();
      if (!r.width) return;
      targets.fill(0);
      if (want === "map") {
        if (!mapCount) return;
        const cs = r.width / VIEW_COLS;
        for (let k = 0; k < mapCount; k++) {
          const cell = cells[k];
          targets[k * 3] = ((r.left + (cell.c + 0.5) * cs) / cw) * 2 - 1;
          targets[k * 3 + 1] = 1 - (((cell.r + 0.5) * cs) / ch) * 2;
          targets[k * 3 + 2] = cell.coast ? 2 : 1;
        }
        renderer.setTargets(targets, mapCount, cs * 0.54, cs * 0.72);
      } else {
        if (!eqPts || !eqCount) return;
        for (let k = 0; k < eqCount; k++) {
          targets[k * 3] = ((r.left + eqPts[k * 2] * r.width) / cw) * 2 - 1;
          targets[k * 3 + 1] = 1 - ((eqPts[k * 2 + 1] * r.height) / ch) * 2;
          targets[k * 3 + 2] = 2;
        }
        const px = r.width > 520 ? 2.4 : 2;
        renderer.setTargets(targets, eqCount, px, px);
      }
      baseLeft = r.left;
      aimed = want;
    };

    // Start-up is split over two idle moments (the points, then the GL context),
    // so neither is one long task on a slow phone.
    const idleTick = () =>
      new Promise<void>((resolve) => {
        if ("requestIdleCallback" in window) window.requestIdleCallback(() => resolve(), { timeout: 800 });
        else setTimeout(resolve, 40);
      });
    let disposed = false;
    let starting = false;
    const setup = async () => {
      if (renderer || starting) return;
      starting = true;
      const mobile = window.innerWidth < 768;
      const built = buildCloud(mobile ? 0.5 : 1);
      eqPts = equationPoints();
      eqCount = eqSlotEl ? EQUATION.count : 0;
      // A phone does not form the map from the cloud (its map pans), but it does
      // form the equation; a wider screen forms both.
      if (mapStageEl && !mobile) {
        cells = landCells();
        mapCount = cells.length;
      }
      setAside = pickMapPoints(built, Math.max(mapCount, eqCount));
      mapCount = Math.min(mapCount, setAside);
      targets = new Float32Array(setAside * 3);
      await idleTick();
      if (disposed) return;
      cloud = built;
      renderer = createRenderer(cv, built, mobile);
      if (renderer) {
        renderer.resize(cv.clientWidth, cv.clientHeight);
        // The map card and the equation slot know the cloud is going to draw
        // them (see `.journey[data-map]` and `[data-eq]` in globals.css).
        if (mapCount > 0) track.dataset.map = "cloud";
        if (eqCount > 0) track.dataset.eq = "cloud";
        kick();
      }
    };

    // --- scroll -> state ------------------------------------------------------
    let raf = 0;
    let lastT = 0;
    let introOn = true;
    /** The cloud's own state, eased towards where the scroll says it should be. */
    let morphS = 0;
    let visS = 0;
    let uS = 0;

    const setInert = (el: HTMLElement, on: boolean) => {
      (el as HTMLElement & { inert: boolean }).inert = !on;
      el.style.pointerEvents = on ? "auto" : "none";
    };

    /** Returns true while anything is still easing. */
    const apply = (dt: number): boolean => {
      // The opening: the copy and its pattern fall away, the portrait zooms into
      // the equation and fades, and the Lorenz drawing is left behind the page.
      const z = clamp01(-track.getBoundingClientRect().top / (ZOOM * vh));
      const copy = 1 - smooth01(z / 0.3);
      for (const el of fadeEls) el.style.opacity = copy.toFixed(3);
      if (zoomEl) {
        const e = easeInOut((z - 0.04) / 0.88);
        const sc = Math.exp(Math.log(zoomScale) * e);
        zoomEl.style.transform = `translate3d(${((tgtX - eqX) * e).toFixed(1)}px,${(
          (tgtY - eqY) *
          e
        ).toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
        zoomEl.style.opacity = (1 - smooth01((z - 0.5) / 0.42)).toFixed(3);
      }
      const nowIntro = z < 0.7;
      if (introEl && nowIntro !== introOn) {
        introOn = nowIntro;
        setInert(introEl, nowIntro);
      }

      if (!renderer || !cloud) return false;

      const cw = cv.clientWidth || vw;
      const ch = cv.clientHeight || vh;
      const mR = mapStageEl && mapCount > 0 ? mapStageEl.getBoundingClientRect() : null;
      const eR = eqSlotEl && eqCount > 0 ? eqSlotEl.getBoundingClientRect() : null;
      const mapOk = !!mR && mR.width > 0;
      const eqOk = !!eR && eR.width > 0;
      // Each anchor's centre, in screens from the top of the viewport.
      const mc = mapOk ? (mR.top + mR.height / 2) / ch : 9;
      const ec = eqOk ? (eR.top + eR.height / 2) / ch : 9;

      // The map: the points start to come in as it nears the bottom of the
      // screen, are all in place by the time it is a little below the middle, are
      // held while it is read, and break up as it leaves the top. The cloud is
      // seen a little before and after, so points are never made or lost out of
      // thin air.
      const mapMorphT = mapOk ? smooth01((1.0 - mc) / 0.4) * smooth01((mc + 0.15) / 0.5) : 0;
      const mapVisT = mapOk ? smooth01((1.4 - mc) / 0.4) * smooth01((mc + 0.5) / 0.35) : 0;
      // The equation: the points condense into it and stay.
      const eqMorphT = eqOk ? smooth01((1.1 - ec) / 0.5) : 0;
      const eqVisT = eqOk ? smooth01((1.5 - ec) / 0.4) * smooth01((ec + 0.7) / 0.5) : 0;

      // Aim at the map until it has gone by, then at the equation. The change is
      // only made while the cloud is empty, so the points never jump.
      const want: "map" | "eq" | null = mapOk && (!eqOk || mc > -0.6) ? "map" : eqOk ? "eq" : null;
      if (want && (aimed === null || (aimed !== want && morphS < 0.02 && visS < 0.05))) {
        placeTargets(want);
      }
      const a = aimed === "map" && !mapOk ? null : aimed === "eq" && !eqOk ? null : aimed;
      const morphT = a === "eq" ? eqMorphT : a === "map" ? mapMorphT : 0;
      const visT = a === "eq" ? eqVisT : a === "map" ? mapVisT : 0;

      const k = 1 - Math.exp(-dt / 0.14);
      morphS += (morphT - morphS) * k;
      visS += (visT - visS) * k;
      if (Math.abs(morphT - morphS) < 0.002) morphS = morphT;
      if (Math.abs(visT - visS) < 0.002) visS = visT;

      // The camera rides the curve as the page is scrolled, at an easy pace.
      const maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const uT = clamp01(window.scrollY / maxY);
      uS += (uT - uS) * k;
      if (Math.abs(uT - uS) < 0.0004) uS = uT;

      const idx = indexAtShare(cloud, uS * PATH_SHARE);
      const headIdx = indexAtShare(cloud, uS * PATH_SHARE, HEAD_ARC);
      sampleAt(cloud.eye, idx, eyeP);
      sampleAt(cloud.look, idx, lookP);
      sampleAt(cloud.path, headIdx, headP);
      followerPoints(cloud, pathArcAt(cloud, uS * PATH_SHARE) + HEAD_ARC, othersP);
      // While the map is up the camera leaves the point and draws back to a
      // face-on view of the whole curve, swaying a little as the point goes on,
      // so the curve sits behind the card as a faint, slowly turning mark with
      // the other points running through it.
      const ghostOn = a === "map";
      if (ghostOn && morphS > 0) {
        const kk = smooth01(morphS);
        const yaw = GHOST_YAW + GHOST_SWAY * Math.sin(pathArcAt(cloud, uS * PATH_SHARE) * 0.3);
        const ring = Math.cos(GHOST_TILT) * GHOST_DIST;
        eyeP[0] += (-Math.cos(yaw) * ring - eyeP[0]) * kk;
        eyeP[1] += (-Math.sin(yaw) * ring - eyeP[1]) * kk;
        eyeP[2] += (Math.sin(GHOST_TILT) * GHOST_DIST - eyeP[2]) * kk;
        lookP[0] *= 1 - kk;
        lookP[1] *= 1 - kk;
        lookP[2] *= 1 - kk;
      }

      // Where the aimed box is now, against where it was when the points were
      // aimed at it.
      const ar = a === "eq" ? eR : a === "map" ? mR : null;
      const off: [number, number] = ar ? [(2 * (ar.left - baseLeft)) / cw, (-2 * ar.top) / ch] : [0, 0];

      renderer.draw({
        eye: eyeP,
        target: lookP,
        head: headP,
        others: othersP,
        prog: headIdx / cloud.samples,
        fade: visS,
        shift: [0, 0],
        morph: morphS,
        ghost: ghostOn ? 1 : 0,
        off,
      });

      return morphS !== morphT || visS !== visT || uS !== uT;
    };

    function frame(now?: number) {
      raf = 0;
      const t = now ?? performance.now();
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
      lastT = t;
      const moving = apply(dt);
      if (moving) raf = requestAnimationFrame(frame);
      else lastT = 0;
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    // --- start --------------------------------------------------------------
    measure();
    apply(1 / 60);

    const onResize = () => {
      measure();
      renderer?.resize(cv.clientWidth, cv.clientHeight);
      if (aimed) placeTargets(aimed);
      kick();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(cv);
    // The map card and the equation slot can change size on their own (a font
    // loads, a screen is rotated): the points are aimed at them again.
    const boxRo = new ResizeObserver(() => {
      if (aimed) placeTargets(aimed);
      kick();
    });
    if (mapStageEl) boxRo.observe(mapStageEl);
    if (eqSlotEl) boxRo.observe(eqSlotEl);
    window.addEventListener("scroll", kick, { passive: true });
    readPalette();
    const offTheme = onTheme(() => {
      readPalette();
      kick();
    });

    let idle = 0;
    let wait = 0;
    const begin = () => {
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(setup, { timeout: 1500 });
      } else {
        wait = setTimeout(setup, 300) as unknown as number;
      }
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });

    // The opening is taller once the page is live, so a page opened on "/#contact"
    // is taken to its section again.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && hash !== "hero") {
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          document.getElementById(hash)?.scrollIntoView({ behavior: "instant" as ScrollBehavior })
        )
      );
    }

    const onReduce = () => {
      if (reduce.matches) window.location.reload();
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      offTheme();
      ro.disconnect();
      boxRo.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("load", begin);
      reduce.removeEventListener("change", onReduce);
      if (raf) cancelAnimationFrame(raf);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      window.clearTimeout(wait);
      disposed = true;
      renderer?.dispose();
      delete track.dataset.scene;
      delete track.dataset.map;
      delete track.dataset.eq;
      for (const el of [...fadeEls, ...(zoomEl ? [zoomEl] : [])]) {
        el.style.opacity = "";
        el.style.transform = "";
        el.style.pointerEvents = "";
        (el as HTMLElement & { inert: boolean }).inert = false;
      }
      if (introEl) (introEl as HTMLElement & { inert: boolean }).inert = false;
    };
  }, []);

  return (
    <div ref={root} className="journey" style={{ "--zoom": ZOOM } as CSSProperties}>
      <canvas ref={canvas} aria-hidden="true" className="journey-canvas" />
      <div className="journey-hero">
        <div ref={stage} className="journey-stage">
          {intro}
        </div>
      </div>
      <div className="journey-flow">
        {steps.map((s) => (
          <section key={s.id} id={s.id} className="journey-step">
            {s.node}
          </section>
        ))}
      </div>
    </div>
  );
}
