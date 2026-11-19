"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { EQUATION } from "@/lib/equation-points";
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
  /** The section's own name, for the dot rail. */
  label: string;
  node: ReactNode;
  /** This step is the map: the point cloud flies into it, then breaks up again. */
  map?: boolean;
};

/**
 * The homepage as one scrolling journey.
 *
 * The page's own sections are the content. This component pins a stage to the
 * screen and lets the scroll drive it:
 *
 *   1. the opening zooms into the equation on the hoodie in the portrait;
 *   2. the zoom lands in a 3D cloud of points, the Lorenz attractor, and from
 *      there the scroll flies the camera along one curve through it (the
 *      camera chases the scroll at a calm speed of its own, with a ceiling, so
 *      a fast scroll does not make the curve race; see FLIGHT_MAX);
 *   3. each section fades in and out in turn over the cloud;
 *   4. one step is the journey map: the cloud's points fly across the screen
 *      and settle into the continents, the card (places, arcs, list, details)
 *      appears on them and stays while you use it, and when you scroll on the
 *      map breaks back into the cloud and the flight carries on. While the map
 *      is up nothing of the cloud is left behind it, but the camera never
 *      stops: it flies on under the map (slower, unseen), so the points form
 *      the map and leave it while the curve is moving, as they do for the
 *      equation at the end;
 *   5. at the end the cloud condenses once more, into the equation on the
 *      hoodie, which closes the loop with the opening.
 *
 * A row of dots down the right edge names the sections and jumps between them.
 *
 * Without script, with reduced motion, or before it has started, the stage is
 * not pinned and the sections are an ordinary page, one under the next (see
 * `.journey` in globals.css). Everything is server-rendered and stays in the
 * page whichever way it is shown. The cloud is plain WebGL, built when the
 * browser is idle after load; if WebGL is missing the journey still runs, only
 * without the cloud. On a phone the cloud fades for the map and the card draws
 * its own dots instead (see JourneyMap), because the map there pans.
 *
 * Scroll lengths below are in viewport heights.
 */
const ZOOM = 1.1;
const STEP = 1.1;
/**
 * Flight before the map (after the zoom: the camera following the point through
 * the curve, with the other points moving), the points forming it, the hold, the
 * points breaking up.
 */
const MAP_LEAD = 1.7;
const MAP_FORM = 0.7;
const MAP_HOLD = 1.1;
const MAP_LEN = MAP_FORM * 2 + MAP_HOLD;
/**
 * Scroll after the map has broken up and before the next card arrives: the
 * curve alone, with the camera circling the point, so the break-up is seen
 * flying on and does not run straight into a card.
 */
const MAP_TAIL = 1;
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
/**
 * How fast the camera flies while the map is fully up, against its speed in the
 * open cloud (1). It never stops: it eases down to this and back up with the
 * points, so the flight is one movement from the landing to the end.
 */
const MAP_PACE = 0.4;
/**
 * How the camera flies along the curve. It does not follow the scroll one for
 * one: it chases the scroll at a speed of its own, with a ceiling, so a quick
 * flick of the wheel does not send the curve racing through space. The camera
 * takes its time and arrives calmly, at one smooth speed however fast you
 * scroll. FLIGHT_MAX is that ceiling in screens of scroll a second, GAIN how
 * hard it chases a gap (a second order follower, so it eases in and out), and
 * LAG how gently its speed changes. PATH_SHARE is how much of the recorded
 * curve's length the whole scroll flies through (the rest is only ever
 * cloud). The point is moved by distance along the curve, not by time (it
 * would otherwise speed up and slow down fivefold as it loops), so this sets
 * its one even speed: 0.14 is about 1.5 scene units a second at the fastest
 * flight (the camera rides the curve now, so the view swings with the point
 * and this keeps it from spinning too fast).
 */
const FLIGHT_MAX = 0.7;
const FLIGHT_GAIN = 2;
const FLIGHT_LAG = 0.12;
const PATH_SHARE = 0.14;
/** A step fades in over IN, holds, and fades out over OUT before its end. */
const FADE_IN = 0.3;
const FADE_OUT_AT = 0.5;
const FADE_OUT = 0.3;
/** Where the equation sits in the portrait image, as fractions of its box. */
const EQ_X = 0.375;
const EQ_Y = 0.82;
/** How much of the portrait's width the equation takes up. */
const EQ_W = 0.49;

type Seg = { a: number; b: number; map: boolean };

function layoutOf(flags: boolean[]): { segs: Seg[]; total: number } {
  let v = ZOOM;
  const segs = flags.map((map) => {
    if (map) v += MAP_LEAD;
    const a = v;
    v += map ? MAP_LEN : STEP;
    const seg = { a, b: v, map };
    // The map's own range ends where its points have gone; the curve then has
    // MAP_TAIL to itself before the next card.
    if (map) v += MAP_TAIL;
    return seg;
  });
  return { segs, total: v };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth01 = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const VERTEX = `
attribute vec3 aPos;
attribute vec2 aMeta;
attribute vec3 aMap;
uniform mat4 uVP;
uniform vec2 uShift;
uniform float uPx;
uniform vec2 uMapPx;
uniform float uProg;
uniform float uFade;
uniform float uMorph;
uniform float uGhost;
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
  vec3 ink = vec3(0.122, 0.169, 0.153);
  vec3 deep = vec3(0.333, 0.388, 0.227);
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
  vec2 from = mix(ndc, aMap.xy, behind);
  vec2 pos = mix(from, aMap.xy, m);
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
    vec3 yellow = vec3(0.969, 0.937, 0.588);
    vec3 ink = vec3(0.122, 0.169, 0.153);
    vec3 c = mix(yellow, ink, smoothstep(0.3, 0.36, r));
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
    px: gl.getUniformLocation(prog, "uPx"),
    mapPx: gl.getUniformLocation(prog, "uMapPx"),
    prog: gl.getUniformLocation(prog, "uProg"),
    fade: gl.getUniformLocation(prog, "uFade"),
    morph: gl.getUniformLocation(prog, "uMorph"),
    ghost: gl.getUniformLocation(prog, "uGhost"),
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
    draw({ eye, target, head, others, prog: progress, fade, shift, morph, ghost }) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (fade <= 0.002) return;
      viewProjection(vp, eye, target, w / h, fovY);
      gl.uniformMatrix4fv(loc.vp, false, vp);
      gl.uniform2f(loc.shift, shift[0], shift[1]);
      gl.uniform1f(loc.px, dpr * Math.min(1.25, Math.max(0.75, cssH / 900)));
      gl.uniform2f(loc.mapPx, pxInner * dpr, pxRim * dpr);
      gl.uniform1f(loc.prog, progress);
      gl.uniform1f(loc.fade, fade);
      gl.uniform1f(loc.morph, morph);
      gl.uniform1f(loc.ghost, ghost);

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
  const flags = steps.map((s) => !!s.map).join(",");
  const layout = useMemo(() => layoutOf(flags.split(",").map((f) => f === "true")), [flags]);
  const { total } = layout;

  useEffect(() => {
    const track = root.current;
    const st = stage.current;
    const cv = canvas.current;
    if (!track || !st || !cv) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const { segs } = layout;
    const mapIdx = segs.findIndex((s) => s.map);
    const mapSeg = mapIdx >= 0 ? segs[mapIdx] : null;
    const endSeg = segs[segs.length - 1];

    /** How far the cloud has become the map at scroll position v (0 to 1). */
    const mapMorphAt = (v: number) =>
      mapSeg
        ? Math.min(smooth01((v - mapSeg.a) / MAP_FORM), smooth01((mapSeg.b - v) / MAP_FORM))
        : 0;
    // How far along the curve the camera has flown at scroll position v: the
    // scroll's own length, slowed a little (never to nothing) while the map is
    // up. The cloud is away then, so the slowing is not seen, and the whole
    // curve is still flown by the last step.
    const PACE_N = 400;
    const flownTable = new Float32Array(PACE_N + 1);
    for (let i = 0; i < PACE_N; i++) {
      const mid = ((i + 0.5) / PACE_N) * total;
      flownTable[i + 1] =
        flownTable[i] + (total / PACE_N) * (1 - (1 - MAP_PACE) * mapMorphAt(mid));
    }
    const flown = (v: number) => {
      const f = clamp01(v / total) * PACE_N;
      const i = Math.min(PACE_N - 1, Math.floor(f));
      return flownTable[i] + (flownTable[i + 1] - flownTable[i]) * (f - i);
    };

    const introEl = st.querySelector<HTMLElement>("[data-intro]");
    const fadeEls = Array.from(st.querySelectorAll<HTMLElement>("[data-intro-fade]"));
    const zoomEl = st.querySelector<HTMLElement>("[data-zoom]");
    const stepEls = Array.from(st.querySelectorAll<HTMLElement>("[data-step]"));
    const railEls = Array.from(st.querySelectorAll<HTMLElement>("[data-rail]"));
    const ids = stepEls.map((el) => el.id);
    const mapStepEl = mapSeg ? stepEls[mapIdx] : null;
    const mapCard = mapStepEl?.querySelector<HTMLElement>(".jmap") ?? null;
    const mapStageEl = mapStepEl?.querySelector<HTMLElement>("[data-map-stage]") ?? null;

    track.dataset.scene = "live";

    // --- geometry ---------------------------------------------------------
    let vw = 1;
    let vh = 1;
    let desktop = true;
    let eqX = 0;
    let eqY = 0;
    let tgtX = 0;
    let tgtY = 0;
    let zoomScale = 4;

    const measure = () => {
      vw = st.clientWidth;
      vh = st.clientHeight;
      desktop = vw >= 1024;
      if (zoomEl) {
        const keep = zoomEl.style.transform;
        zoomEl.style.transform = "none";
        const r = zoomEl.getBoundingClientRect();
        const s = st.getBoundingClientRect();
        zoomEl.style.transform = keep;
        eqX = r.left - s.left + EQ_X * r.width;
        eqY = r.top - s.top + EQ_Y * r.height;
        tgtX = vw * (desktop ? 0.6 : 0.5);
        tgtY = vh * (desktop ? 0.5 : 0.4);
        zoomScale = Math.max(2.2, (1.3 * 0.78 * vw) / (EQ_W * r.width));
        zoomEl.style.transformOrigin = `${EQ_X * 100}% ${EQ_Y * 100}%`;
      }
    };

    // --- the cloud --------------------------------------------------------
    let cloud: Cloud | null = null;
    let renderer: Renderer | null = null;
    const eyeP = [0, 0, 0];
    const lookP = [0, 0, 0];
    const headP = [0, 0, 0];
    const othersP = new Float32Array(FOLLOWERS * FOLLOWER_TRAIL * 3);

    // --- the shapes the cloud becomes: the map, then the equation -----------
    let cells: LandCell[] = [];
    let eqPts: Float32Array | null = null;
    /** How many points are set aside for each shape (0 when it is not formed). */
    let mapCount = 0;
    let eqCount = 0;
    let setAside = 0;
    let targets: Float32Array | null = null;
    /** Which shape the points are currently aimed at. */
    let aimed: "map" | "eq" | null = null;

    const placeTargets = (want: "map" | "eq") => {
      if (!renderer || !targets) return;
      if (want === "map") {
        // A phone has no points set aside for the map: its card draws its own.
        if (!mapStageEl || !mapStepEl || !mapCount) {
          aimed = "map";
          return;
        }
        const keep = mapStepEl.style.transform;
        mapStepEl.style.transform = "none";
        const r = mapStageEl.getBoundingClientRect();
        const s = st.getBoundingClientRect();
        mapStepEl.style.transform = keep;
        if (!r.width) return;
        const cs = r.width / VIEW_COLS;
        targets.fill(0);
        for (let k = 0; k < mapCount; k++) {
          const cell = cells[k];
          targets[k * 3] = ((r.left - s.left + (cell.c + 0.5) * cs) / vw) * 2 - 1;
          targets[k * 3 + 1] = 1 - ((r.top - s.top + (cell.r + 0.5) * cs) / vh) * 2;
          targets[k * 3 + 2] = cell.coast ? 2 : 1;
        }
        renderer.setTargets(targets, mapCount, cs * 0.54, cs * 0.72);
        aimed = "map";
        return;
      }
      if (!eqPts || !eqCount) return;
      targets.fill(0);
      // The equation sits to the right of the contact card on a wide screen,
      // and above it on a narrow one.
      const wEq = desktop ? vw * 0.4 : vw * 0.84;
      const hEq = wEq / EQUATION.aspect;
      const cx = desktop ? vw * 0.75 : vw * 0.5;
      const cy = desktop ? vh * 0.5 : vh * 0.27;
      for (let k = 0; k < eqCount; k++) {
        const px = cx - wEq / 2 + eqPts[k * 2] * wEq;
        const py = cy - hEq / 2 + eqPts[k * 2 + 1] * hEq;
        targets[k * 3] = (px / vw) * 2 - 1;
        targets[k * 3 + 1] = 1 - (py / vh) * 2;
        targets[k * 3 + 2] = 2;
      }
      renderer.setTargets(targets, eqCount, desktop ? 2.4 : 2, desktop ? 2.4 : 2);
      aimed = "eq";
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
      eqCount = EQUATION.count;
      // A phone does not form the map from the cloud (its map pans), but it does
      // form the equation; a wider screen forms both.
      if (mapSeg && !mobile) {
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
        renderer.resize(st.clientWidth, st.clientHeight);
        frame();
      }
    };

    // --- scroll -> state --------------------------------------------------
    let want = 0;
    let cur = 0;
    /** Where the camera is on the scroll's scale, and how fast it is going. */
    let flight = 0;
    let flightVel = 0;
    let lastT = 0;
    let raf = 0;
    const stepOn = stepEls.map(() => true);
    let introOn = true;
    let mapShown = false;
    let railNow = "";

    const setInert = (el: HTMLElement, on: boolean) => {
      (el as HTMLElement & { inert: boolean }).inert = !on;
      el.style.pointerEvents = on ? "auto" : "none";
    };

    /** `v` is the scroll's position, `f` where the camera has got to (see FLIGHT_MAX). */
    const apply = (v: number, f: number) => {
      const z = clamp01(v / ZOOM);

      // The opening.
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

      // The map: how far the cloud has become it, and how visible its card is.
      let mapMorph = 0;
      let mapUi = 0;
      if (mapSeg) {
        mapMorph = mapMorphAt(v);
        // The card comes up while the last of the points are still settling.
        mapUi =
          smooth01((v - (mapSeg.a + MAP_FORM - 0.35)) / 0.4) *
          smooth01((mapSeg.b - MAP_FORM + 0.35 - v) / 0.4);
      }
      // The equation: the cloud condenses into it as the last step arrives.
      const eqMorph = smooth01((v - (endSeg.a - 0.3)) / 0.8);
      // Between the two there is a stretch where the cloud is whole, and that is
      // where the points are re-aimed from the map to the equation.
      const useEq = v > (mapSeg ? mapSeg.b + 0.45 : ZOOM + 0.45);

      // The steps: in, hold, out, with a clear gap between neighbours.
      for (let i = 0; i < stepEls.length; i++) {
        const sg = segs[i];
        const el = stepEls[i];
        if (sg.map) {
          el.style.opacity = mapUi.toFixed(3);
          el.style.transform = "none";
          const on = mapUi > 0.45;
          if (on !== stepOn[i]) {
            stepOn[i] = on;
            setInert(el, on);
          }
          continue;
        }
        const fin = smooth01((v - (sg.a - 0.1)) / FADE_IN);
        const fout = i === stepEls.length - 1 ? 0 : smooth01((v - (sg.b - FADE_OUT_AT)) / FADE_OUT);
        const o = fin * (1 - fout);
        const dy = (1 - fin) * 18 - fout * 18;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0,${dy.toFixed(1)}px,0)`;
        const on = o > 0.45;
        if (on !== stepOn[i]) {
          stepOn[i] = on;
          setInert(el, on);
        }
      }

      // The dot rail: which section is showing.
      let now = "hero";
      if (v >= ZOOM * 0.6) {
        now = ids[ids.length - 1];
        for (let i = 0; i < segs.length; i++) {
          if (v < segs[i].b + (segs[i].map ? MAP_TAIL : 0) - 0.2) {
            now = ids[i];
            break;
          }
        }
      }
      if (now !== railNow) {
        railNow = now;
        for (const el of railEls) {
          if (el.dataset.rail === now) el.setAttribute("aria-current", "true");
          else el.removeAttribute("aria-current");
        }
      }

      // On a phone the card draws its own dots: tell it when it is revealed.
      if (mapCard && mapCount === 0) {
        if (mapUi > 0.25 && !mapShown) {
          mapShown = true;
          mapCard.dispatchEvent(new Event("jmap-show"));
        } else if (mapUi < 0.02) {
          mapShown = false;
        }
      }

      // The cloud and its camera. The camera never stops: it flies on through
      // the map, so the points form it, and leave it, while the curve moves.
      if (renderer && cloud) {
        const want2 = useEq ? "eq" : "map";
        if (aimed !== want2) placeTargets(want2);

        const start = ZOOM * 0.8;
        const u = clamp01((flown(f) - flown(start)) / Math.max(0.01, flown(total) - flown(start)));
        // How far along the path the camera is, by distance, so the point goes
        // at one even speed; the head is drawn a little further on.
        const idx = indexAtShare(cloud, u * PATH_SHARE);
        const headIdx = indexAtShare(cloud, u * PATH_SHARE, HEAD_ARC);
        sampleAt(cloud.eye, idx, eyeP);
        sampleAt(cloud.look, idx, lookP);
        sampleAt(cloud.path, headIdx, headP);
        followerPoints(cloud, pathArcAt(cloud, u * PATH_SHARE) + HEAD_ARC, othersP);
        // While the map is up the camera leaves the point and draws back to a
        // face-on view of the whole curve, swaying a little as the point goes on,
        // so the curve sits behind the card as a faint, slowly turning mark with
        // the other points running through it.
        const ghostOn = !useEq && mapCount > 0;
        if (ghostOn && mapMorph > 0) {
          const k = smooth01(mapMorph);
          const yaw = GHOST_YAW + GHOST_SWAY * Math.sin(pathArcAt(cloud, u * PATH_SHARE) * 0.3);
          const ring = Math.cos(GHOST_TILT) * GHOST_DIST;
          eyeP[0] += (-Math.cos(yaw) * ring - eyeP[0]) * k;
          eyeP[1] += (-Math.sin(yaw) * ring - eyeP[1]) * k;
          eyeP[2] += (Math.sin(GHOST_TILT) * GHOST_DIST - eyeP[2]) * k;
          lookP[0] *= 1 - k;
          lookP[1] *= 1 - k;
          lookP[2] *= 1 - k;
        }
        // Land from outside: start pulled back along the view, close in as
        // the zoom ends.
        const back = 0.8 + 2.6 * (1 - smooth01((z - 0.4) / 0.6));
        if (back > 0.001) {
          const fx = lookP[0] - eyeP[0];
          const fy = lookP[1] - eyeP[1];
          const fz = lookP[2] - eyeP[2];
          const fl = Math.hypot(fx, fy, fz) || 1;
          eyeP[0] -= (fx / fl) * back;
          eyeP[1] -= (fy / fl) * back;
          eyeP[2] -= (fz / fl) * back;
        }

        // The shape being formed now, and how far it is: the map, the equation,
        // or (a phone's map) nothing, with the cloud fading instead.
        const shapeOk = useEq ? eqCount > 0 : mapCount > 0;
        const morph = useEq ? eqMorph : mapMorph;
        // The cloud stays faintly behind the map (not on a phone, where it fades).
        const ghost = ghostOn ? 1 : 0;
        // Where there is no card beside it (the stretch before the map, the map
        // itself, and the stretch after it) the curve drifts from its place beside
        // the cards towards the middle of the screen, then back as the next card
        // arrives.
        const alone = mapSeg
          ? smooth01((v - (ZOOM + 0.1)) / 0.6) *
            (1 - smooth01((v - (mapSeg.b + MAP_TAIL - 0.6)) / 0.5))
          : 0;
        renderer.draw({
          eye: eyeP,
          target: lookP,
          head: headP,
          others: othersP,
          prog: headIdx / cloud.samples,
          fade: smooth01((z - 0.48) / 0.45) * (shapeOk ? 1 : 1 - morph),
          shift: desktop ? [0.3 - 0.25 * alone, 0] : [0, 0.34],
          morph: shapeOk ? morph : 0,
          ghost,
        });
      }
    };

    const read = () => {
      const r = track.getBoundingClientRect();
      return Math.min(total, Math.max(0, -r.top / vh));
    };
    const visible = () => {
      const r = track.getBoundingClientRect();
      return r.bottom > -vh * 0.5 && r.top < vh * 1.5;
    };

    function frame(now?: number) {
      raf = 0;
      want = read();
      cur += (want - cur) * 0.2;
      if (Math.abs(want - cur) < 0.0008) cur = want;

      // The camera chases the scroll at a speed of its own: its speed follows the
      // gap (capped), and eases towards that, so it starts and stops softly.
      const t = now ?? performance.now();
      const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
      lastT = t;
      if (visible()) {
        const aim = Math.max(-FLIGHT_MAX, Math.min(FLIGHT_MAX, (cur - flight) * FLIGHT_GAIN));
        flightVel += (aim - flightVel) * (1 - Math.exp(-dt / FLIGHT_LAG));
        flight += flightVel * dt;
        if (Math.abs(cur - flight) < 0.002 && Math.abs(flightVel) < 0.01) {
          flight = cur;
          flightVel = 0;
        }
        apply(cur, flight);
      } else {
        // Off screen there is nothing to fly through: stay with the scroll.
        flight = cur;
        flightVel = 0;
      }
      if (cur !== want || flight !== cur) raf = requestAnimationFrame(frame);
      else lastT = 0;
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // --- links to a step: "/#contact" and the like -------------------------
    const goTo = (i: number, smoothly: boolean) => {
      const r = track.getBoundingClientRect();
      const top = window.scrollY + r.top;
      const sg = segs[i];
      const v =
        i === ids.length - 1
          ? total
          : sg.map
            ? sg.a + MAP_FORM + MAP_HOLD / 2
            : sg.a + (sg.b - sg.a) / 2;
      window.scrollTo({ top: top + v * vh, behavior: smoothly ? "smooth" : "auto" });
    };
    const goTop = (smoothly: boolean) => {
      const r = track.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top, behavior: smoothly ? "smooth" : "auto" });
    };
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.replace(/\/$/, "") !== window.location.pathname.replace(/\/$/, "")) return;
      const hash = url.hash.slice(1);
      const i = ids.indexOf(hash);
      if (i < 0 && hash !== "hero") return;
      ev.preventDefault();
      ev.stopPropagation();
      window.history.replaceState(null, "", url.hash);
      if (hash === "hero") goTop(true);
      else goTo(i, true);
    };
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      const i = ids.indexOf(hash);
      if (i >= 0) goTo(i, false);
      else if (hash === "hero") goTop(false);
    };

    // --- start ------------------------------------------------------------
    measure();
    cur = want = flight = read();
    apply(cur, flight);

    const onResize = () => {
      measure();
      renderer?.resize(st.clientWidth, st.clientHeight);
      if (aimed) placeTargets(aimed);
      cur = want = flight = read();
      flightVel = 0;
      apply(cur, flight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(st);
    // The card's map can change size on its own (a short screen shrinks it).
    const mapRo = mapStageEl
      ? new ResizeObserver(() => {
          if (aimed === "map") placeTargets("map");
          apply(cur, flight);
        })
      : null;
    if (mapStageEl) mapRo?.observe(mapStageEl);
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("click", onClick, true);
    window.addEventListener("hashchange", onHash);

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

    // A page opened on "/#contact" goes straight to that step.
    if (ids.includes(window.location.hash.slice(1))) {
      requestAnimationFrame(() => requestAnimationFrame(onHash));
    }

    const onReduce = () => {
      if (reduce.matches) window.location.reload();
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      ro.disconnect();
      mapRo?.disconnect();
      window.removeEventListener("scroll", kick);
      window.removeEventListener("load", begin);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("click", onClick, true);
      reduce.removeEventListener("change", onReduce);
      if (raf) cancelAnimationFrame(raf);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      window.clearTimeout(wait);
      disposed = true;
      renderer?.dispose();
      delete track.dataset.scene;
      for (const el of [...fadeEls, ...stepEls, ...(zoomEl ? [zoomEl] : [])]) {
        el.style.opacity = "";
        el.style.transform = "";
        el.style.pointerEvents = "";
        (el as HTMLElement & { inert: boolean }).inert = false;
      }
      for (const el of railEls) el.removeAttribute("aria-current");
      if (introEl) (introEl as HTMLElement & { inert: boolean }).inert = false;
    };
  }, [layout, total]);

  return (
    <div
      ref={root}
      className="journey"
      style={{ "--k": total + 1 } as CSSProperties}
    >
      <div ref={stage} className="journey-stage">
        <canvas ref={canvas} aria-hidden="true" className="journey-canvas" />
        {intro}
        {steps.map((s) => (
          <section
            key={s.id}
            id={s.id}
            data-step
            data-map={s.map ? "" : undefined}
            className="journey-step"
          >
            {s.node}
          </section>
        ))}
        {/* The dot rail: one dot a section, to see where you are and to jump. */}
        <nav aria-label="Sections" className="journey-rail">
          <a href="#hero" data-rail="hero" className="journey-dot">
            <span className="journey-dot-label label">Top</span>
          </a>
          {steps.map((s) => (
            <a key={s.id} href={`#${s.id}`} data-rail={s.id} className="journey-dot">
              <span className="journey-dot-label label">{s.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
