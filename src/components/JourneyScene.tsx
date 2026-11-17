"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import {
  buildCloud,
  DT,
  FLOATS,
  PATH_TIME,
  pickMapPoints,
  sampleAt,
  viewProjection,
  type Cloud,
} from "@/lib/lorenz";
import { type LandCell, VIEW_COLS, landCells } from "@/lib/world-dots";

export type SceneStep = {
  id: string;
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
 *      there the scroll flies the camera along one curve through it;
 *   3. each section fades in and out in turn over the cloud;
 *   4. one step is the journey map: the cloud's points fly across the screen
 *      and settle into the continents, the card (places, arcs, list, details)
 *      appears on them and stays while you use it, and when you scroll on the
 *      map breaks back into the cloud and the flight carries on. While the map
 *      is up nothing of the cloud is left behind it, and the camera waits.
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
const ZOOM = 1.4;
const STEP = 1.25;
/** Flight before the map, the points forming it, the hold, the points breaking up. */
const MAP_LEAD = 0.6;
const MAP_FORM = 0.85;
const MAP_HOLD = 1.3;
const MAP_LEN = MAP_FORM * 2 + MAP_HOLD;
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
    return { a, b: v, map };
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
  if (kind > 1.5) size = 20.0 * uPx;
  else if (kind > 0.5) size = clamp(uPx * 2.6 / d, 1.3 * uPx, 8.0 * uPx);
  else size = clamp(uPx * 1.9 / d, 1.0 * uPx, 7.0 * uPx);
  vec3 ink = vec3(0.122, 0.169, 0.153);
  vec3 deep = vec3(0.333, 0.388, 0.227);
  vec3 col = ink;
  float a = 0.2;
  if (kind > 1.5) {
    a = 1.0;
  } else if (kind > 0.5) {
    float done = step(aMeta.x, uProg);
    col = mix(ink, deep, done);
    a = mix(0.4, 0.92, done);
  }
  a *= near * far * uFade;
  if (kind < 1.5) a *= clamp(1.7 / max(size / uPx, 1.0), 0.35, 1.0);
  a *= 1.0 - behind;

  // Into the map. A point with a target flies to it, each at its own moment;
  // every other point fades away, so none of the cloud is left behind the map.
  float isMap = step(0.5, aMap.z);
  float m = smoothstep(0.0, 1.0, clamp((uMorph - aMeta.x * 0.5) / 0.5, 0.0, 1.0)) * isMap;
  a *= 1.0 - clamp(uMorph * 1.8, 0.0, 1.0) * (1.0 - isMap);
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
  if (vKind > 1.5) {
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
    prog: number;
    fade: number;
    shift: [number, number];
    /** 0 is the cloud, 1 is the map. */
    morph: number;
  }) => void;
  resize: (cssW: number, cssH: number) => void;
  /** Where each of the first `count` points goes, as x, y, kind (NDC, 1 land, 2 coast). */
  setMap: (data: Float32Array, count: number, cellPx: number) => void;
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
  const bindHead = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, headBuf);
    gl.enableVertexAttribArray(loc.pos);
    gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(loc.meta);
    gl.vertexAttribPointer(loc.meta, 2, gl.FLOAT, false, stride, 12);
    gl.disableVertexAttribArray(loc.map);
    gl.vertexAttrib3f(loc.map, 0, 0, 0);
  };

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const vp = new Float32Array(16);
  const fovY = (mobile ? 70 : 64) * (Math.PI / 180);
  let dpr = 1;
  let cssH = 1;
  let w = 1;
  let h = 1;
  let mapCount = 0;
  let cellPx = 0;

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
    setMap(data, count, cs) {
      mapCount = count;
      cellPx = cs;
      gl.bindBuffer(gl.ARRAY_BUFFER, mapBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    },
    draw({ eye, target, head, prog: progress, fade, shift, morph }) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (fade <= 0.002) return;
      viewProjection(vp, eye, target, w / h, fovY);
      gl.uniformMatrix4fv(loc.vp, false, vp);
      gl.uniform2f(loc.shift, shift[0], shift[1]);
      gl.uniform1f(loc.px, dpr * Math.min(1.25, Math.max(0.75, cssH / 900)));
      gl.uniform2f(loc.mapPx, cellPx * 0.54 * dpr, cellPx * 0.72 * dpr);
      gl.uniform1f(loc.prog, progress);
      gl.uniform1f(loc.fade, fade);
      gl.uniform1f(loc.morph, morph);

      // Once every point is in place only the map's own points are drawn.
      bindMain();
      gl.drawArrays(gl.POINTS, 0, morph >= 0.999 && mapCount > 0 ? mapCount : cloud.count);

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
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
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
    const mapLen = mapSeg ? mapSeg.b - mapSeg.a : 0;

    const introEl = st.querySelector<HTMLElement>("[data-intro]");
    const fadeEls = Array.from(st.querySelectorAll<HTMLElement>("[data-intro-fade]"));
    const zoomEl = st.querySelector<HTMLElement>("[data-zoom]");
    const stepEls = Array.from(st.querySelectorAll<HTMLElement>("[data-step]"));
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

    // --- the map: where each of the cloud's points goes --------------------
    let cells: LandCell[] = [];
    let mapCount = 0;
    let mapData: Float32Array | null = null;

    const placeMap = () => {
      if (!renderer || !mapStageEl || !mapStepEl || !mapCount) return;
      const keep = mapStepEl.style.transform;
      mapStepEl.style.transform = "none";
      const r = mapStageEl.getBoundingClientRect();
      const s = st.getBoundingClientRect();
      mapStepEl.style.transform = keep;
      if (!r.width) return;
      const cs = r.width / VIEW_COLS;
      const data = mapData ?? (mapData = new Float32Array(mapCount * 3));
      for (let k = 0; k < mapCount; k++) {
        const cell = cells[k];
        data[k * 3] = ((r.left - s.left + (cell.c + 0.5) * cs) / vw) * 2 - 1;
        data[k * 3 + 1] = 1 - ((r.top - s.top + (cell.r + 0.5) * cs) / vh) * 2;
        data[k * 3 + 2] = cell.coast ? 2 : 1;
      }
      renderer.setMap(data, mapCount, cs);
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
      // A phone does not form the map from the cloud (its map pans), so only a
      // wider screen sets aside the points that will.
      if (mapSeg && !mobile) {
        cells = landCells();
        mapCount = pickMapPoints(built, cells.length);
      }
      await idleTick();
      if (disposed) return;
      cloud = built;
      renderer = createRenderer(cv, built, mobile);
      if (renderer) {
        renderer.resize(st.clientWidth, st.clientHeight);
        placeMap();
        frame();
      }
    };

    // --- scroll -> state --------------------------------------------------
    let want = 0;
    let cur = 0;
    let raf = 0;
    const stepOn = stepEls.map(() => true);
    let introOn = true;
    let mapShown = false;

    const setInert = (el: HTMLElement, on: boolean) => {
      (el as HTMLElement & { inert: boolean }).inert = !on;
      el.style.pointerEvents = on ? "auto" : "none";
    };

    const apply = (v: number) => {
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
      let morph = 0;
      let mapUi = 0;
      if (mapSeg) {
        morph = Math.min(smooth01((v - mapSeg.a) / MAP_FORM), smooth01((mapSeg.b - v) / MAP_FORM));
        mapUi =
          smooth01((v - (mapSeg.a + MAP_FORM - 0.15)) / 0.3) *
          smooth01((mapSeg.b - MAP_FORM + 0.15 - v) / 0.3);
      }

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
        const fin = smooth01((v - (sg.a - 0.12)) / 0.42);
        const fout = i === stepEls.length - 1 ? 0 : smooth01((v - (sg.b - 0.62)) / 0.34);
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

      // On a phone the card draws its own dots: tell it when it is revealed.
      const formsFromCloud = mapCount > 0;
      if (mapCard && !formsFromCloud) {
        if (mapUi > 0.25 && !mapShown) {
          mapShown = true;
          mapCard.dispatchEvent(new Event("jmap-show"));
        } else if (mapUi < 0.02) {
          mapShown = false;
        }
      }

      // The cloud and its camera. The camera waits while the map is up.
      if (renderer && cloud) {
        const vEff = !mapSeg ? v : v >= mapSeg.b ? v - mapLen : Math.min(v, mapSeg.a);
        const start = ZOOM * 0.8;
        const u = clamp01((vEff - start) / Math.max(0.01, total - mapLen - start));
        const t = u * PATH_TIME;
        const idx = t / DT;
        sampleAt(cloud.eye, idx, eyeP);
        sampleAt(cloud.look, idx, lookP);
        sampleAt(cloud.path, (t + 0.9) / DT, headP);
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
        renderer.draw({
          eye: eyeP,
          target: lookP,
          head: headP,
          prog: (t + 0.9) / DT / cloud.samples,
          // With no points to form the map, the cloud simply fades out for it.
          fade: smooth01((z - 0.48) / 0.45) * (formsFromCloud ? 1 : 1 - morph),
          shift: desktop ? [0.3, 0] : [0, 0.34],
          morph: formsFromCloud ? morph : 0,
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

    function frame() {
      raf = 0;
      want = read();
      cur += (want - cur) * 0.2;
      if (Math.abs(want - cur) < 0.0008) cur = want;
      if (visible()) apply(cur);
      if (cur !== want) raf = requestAnimationFrame(frame);
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
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.replace(/\/$/, "") !== window.location.pathname.replace(/\/$/, "")) return;
      const i = ids.indexOf(url.hash.slice(1));
      if (i < 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      window.history.replaceState(null, "", url.hash);
      goTo(i, true);
    };
    const onHash = () => {
      const i = ids.indexOf(window.location.hash.slice(1));
      if (i >= 0) goTo(i, false);
    };

    // --- start ------------------------------------------------------------
    measure();
    cur = want = read();
    apply(cur);

    const onResize = () => {
      measure();
      renderer?.resize(st.clientWidth, st.clientHeight);
      placeMap();
      cur = want = read();
      apply(cur);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(st);
    // The card's map can change size on its own (a short screen shrinks it).
    const mapRo = mapStageEl
      ? new ResizeObserver(() => {
          placeMap();
          apply(cur);
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

    track.dataset.scene = "live";

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
      </div>
    </div>
  );
}
