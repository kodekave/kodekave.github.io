// TYCHO-6 blueprint viewer. Renders the real CAD tessellation (cad/src/tycho -> web/tycho_mesh.json)
// as hidden-line blueprint, x-ray, full-mesh or solid. No external requests: three.js is vendored.
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

const SUB = {
  Structure:   { c: "#1f64b8", label: "Structure" },
  Cabin:       { c: "#1f64b8", label: "Pressure cabin" },
  Mobility:    { c: "#1f64b8", label: "Mobility" },
  Power:       { c: "#1f64b8", label: "Power" },
  Thermal:     { c: "#1f64b8", label: "Thermal" },
  Avionics:    { c: "#1f64b8", label: "Avionics and comms" },
  ECLSS:       { c: "#1f64b8", label: "Life support" },
  EVA:         { c: "#1f64b8", label: "EVA / suit-ports" },
  Manipulator: { c: "#1f64b8", label: "Arm and rails" },
};
// explode vectors in metres, by part number; sy = side sign (+1 left / -1 right)
const EX = (p, sy) => ({
  "TYC-110": [0, 0, -0.6], "TYC-120": [0, 0, -1.3], "TYC-130": [0, sy * 0.35, -0.3], "TYC-140": [0, 0, 1.2], "TYC-150": [0, sy * 1.0, 0],
  "TYC-160": [1.3, 0, 0], "TYC-170": [-1.2, 0, 0], "TYC-180": [0, sy * 0.4, 0.8],
  "TYC-210": [0, 0, 1.4], "TYC-220": [1.0, 0, 2.1], "TYC-230": [0, 0, 0.55], "TYC-240": [0, 0, 1.0], "TYC-250": [0.6, 0, 1.0], "TYC-260": [-0.4, 0, 1.0],
  "TYC-270": [-1.5, 0, 0.9], "TYC-280": [0, sy * 1.2, 0.4],
  "TYC-310": [0, sy * 1.9, 0], "TYC-311": [0, sy * 1.9, 0], "TYC-312": [0, sy * 1.35, 0], "TYC-320": [0, sy * 0.85, 0], "TYC-331": [0, sy * 0.45, 0],
  "TYC-330": [0, 0, 0], "TYC-340": [0, sy * 0.1, -0.25], "TYC-341": [0, sy * 0.1, 0.25], "TYC-350": [0, 0, -0.4], "TYC-360": [0, 0, -0.5],
  "TYC-410": [0, 0, -0.9], "TYC-420": [0, sy * 0.4, 1.4], "TYC-430": [0, 0, 1.1], "TYC-440": [-1.3, 0, -0.3],
  "TYC-510": [0, sy * 1.3, 0.9], "TYC-520": [0, sy * 0.9, 0.6],
  "TYC-610": [0, 0, 1.8], "TYC-620": [0, 0, 2.5], "TYC-630": [0, 0, 3.0], "TYC-631": [0, 0, 3.0], "TYC-640": [1.4, 0, 0], "TYC-641": [-1.4, 0, 0], "TYC-650": [0.6, 0, 0.7], "TYC-660": [1.6, 0, 0],
  "TYC-710": [-1.6, 0, -0.3], "TYC-720": [0, 0, -1.0],
  "TYC-810": [1.0, 0, 0], "TYC-811": [1.3, 0, 0], "TYC-812": [1.6, 0, 0], "TYC-813": [1.9, 0, 0], "TYC-814": [2.2, 0, 0], "TYC-820": [-1.5, 0, 0.5],
}[p] || [0, 0, 0]);

const CALL = [
  { t: "Ka-band HGA O1.04 m", p: [0.15, 0, 4.4], s: "Avionics" },
  { t: "Solar array 16 m2 GaAs", p: [-1, 1.6, 3.5], s: "Power" },
  { t: "Radiator 12.5 m2", p: [-0.7, -1.3, 2.9], s: "Thermal" },
  { t: "Pressure hull O2.2 m, 15.5 m3", p: [0.4, -1.1, 2.2], s: "Cabin" },
  { t: "Panoramic canopy", p: [2.3, 0, 2.7], s: "Cabin" },
  { t: "Suit-ports x2", p: [-2.15, 0.4, 1.95], s: "EVA" },
  { t: "NiTi mesh tyre O1.2 m", p: [2.2, 1.7, 0.1], s: "Mobility" },
  { t: "Li-S 80 kWh pack", p: [0.9, 0, 0.55], s: "Power" },
  { t: "Sample arm", p: [3.7, 0, 1.4], s: "Manipulator" },
  { t: "O2 / N2 vessels", p: [-2.8, 0.5, 0.9], s: "ECLSS" },
];

const $ = (s, r = document) => r.querySelector(s);
const host = $("#viewer"), canvasWrap = $("#viewer-canvas");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.localClippingEnabled = true;
canvasWrap.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color("#ffffff");
scene.fog = new THREE.Fog("#ffffff", 18, 46);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
camera.up.set(0, 0, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.499;
controls.minDistance = 4; controls.maxDistance = 40; controls.target.set(0, 0, 1.5);
controls.autoRotate = true; controls.autoRotateSpeed = 0.6;

// ---- ground: blueprint grid + range rings
const gridMat = new THREE.LineBasicMaterial({ color: 0x1f64b8, transparent: true, opacity: 0.6 });
const grid = new THREE.GridHelper(40, 40, 0x1f64b8, 0x1f64b8); grid.rotation.x = Math.PI / 2; grid.material.transparent = true; grid.material.opacity = 0.35;
scene.add(grid);
for (const r of [3, 6, 10, 15]) {
  const pts = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.002)); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
}
const axes = new THREE.Group();
[["#1f64b8", [1, 0, 0]], ["#1f64b8", [0, 1, 0]], ["#1f64b8", [0, 0, 1]]].forEach(([c, d]) => {
  axes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.2, -3.6, 0.01), new THREE.Vector3(-4.2 + d[0] * 1.2, -3.6 + d[1] * 1.2, 0.01 + d[2] * 1.2)]), new THREE.LineBasicMaterial({ color: c })));
});
scene.add(axes);

// ---- state
const state = { mode: "blueprint", color: true, explode: 0, target: 0, selected: null, vis: Object.fromEntries(Object.keys(SUB).map(k => [k, true])), clip: { axis: "off", pos: 0 }, dims: false, calls: true };
const parts = []; const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6);

function b64(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }

async function load() {
  const res = await fetch("tycho_mesh.json"); const d = await res.json();
  const lo = d.bounds.slice(0, 3), hi = d.bounds.slice(3);
  const root = new THREE.Group(); scene.add(root);
  let tris = 0;
  for (const p of d.parts) {
    const q = new Uint16Array(b64(p.v)); const idx = p.i32 ? new Uint32Array(b64(p.i)) : new Uint16Array(b64(p.i));
    const pos = new Float32Array(q.length);
    for (let i = 0; i < q.length; i += 3) for (let k = 0; k < 3; k++) pos[i + k] = (lo[k] + q[i + k] / 65535 * (hi[k] - lo[k])) / 1000;
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, clippingPlanes: [plane] });
    const fill = new THREE.Mesh(g, fm); fill.userData.part = p.id;
    const eg = new THREE.EdgesGeometry(g, p.pn === "TYC-311" || p.pn === "TYC-310" ? 30 : 22);
    const lm = new THREE.LineBasicMaterial({ color: SUB[p.sub].c, clippingPlanes: [plane], transparent: true });
    const edges = new THREE.LineSegments(eg, lm);
    const grp = new THREE.Group(); grp.add(fill, edges); root.add(grp);
    const sy = Math.sign(p.cg[1]) || 1; const ex = EX(p.pn, sy);
    parts.push({ ...p, v: null, i: null, g, fill, edges, grp, fm, lm, wire: null, ex: new THREE.Vector3(...ex) });
    tris += p.nt;
  }
  $("#stat-parts").textContent = parts.length; $("#stat-tris").textContent = (tris / 1000).toFixed(0) + "k";
  buildLegend(); applyMode(); view("iso", true); $("#loading").remove();
}

function buildLegend() {
  const box = $("#legend"); box.innerHTML = "";
  for (const [k, s] of Object.entries(SUB)) {
    const list = parts.filter(p => p.sub === k); if (!list.length) continue;
    const kg = list.reduce((a, p) => a + p.mass, 0);
    const b = document.createElement("button"); b.className = "leg on"; b.dataset.sub = k; b.type = "button";
    b.innerHTML = `<i style="background:${s.c}"></i><span>${s.label}</span><em>${list.length}</em>`;
    b.title = `${s.label}: ${list.length} modelled parts, ${Math.round(kg)} kg allocated. Double-click to isolate.`;
    b.addEventListener("click", () => { state.vis[k] = !state.vis[k]; b.classList.toggle("on", state.vis[k]); applyVis(); });
    b.addEventListener("dblclick", () => { Object.keys(state.vis).forEach(x => state.vis[x] = x === k); box.querySelectorAll(".leg").forEach(e => e.classList.toggle("on", e.dataset.sub === k)); applyVis(); });
    box.appendChild(b);
  }
}
function applyVis() { for (const p of parts) p.grp.visible = state.vis[p.sub]; }

function applyMode() {
  const m = state.mode;
  for (const p of parts) {
    p.fill.visible = m !== "mesh"; p.edges.visible = m !== "mesh";
    p.fm.depthWrite = true; p.fm.transparent = false; p.fm.opacity = 1;
    if (m === "blueprint") p.fm.color.set(0x1f64b8);
    if (m === "xray") { p.fm.transparent = true; p.fm.opacity = 0.07; p.fm.depthWrite = false; p.fm.color.set(0x1f64b8); }
    if (m === "solid") p.fm.color.set(0x2f7fd6);
    if (m === "mesh") {
      if (!p.wire) { p.wire = new THREE.LineSegments(new THREE.WireframeGeometry(p.g), new THREE.LineBasicMaterial({ color: SUB[p.sub].c, transparent: true, opacity: 0.55, clippingPlanes: [plane] })); p.grp.add(p.wire); }
      p.wire.visible = true;
    } else if (p.wire) p.wire.visible = false;
  }
  document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === m));
  select(state.selected);
}

// ---- selection
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; controls.autoRotate = false; $("#opt-rot").checked = false; });
renderer.domElement.addEventListener("pointerup", e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
  const r = renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  const pickable = parts.filter(p => p.grp.visible).map(p => { p.fill.visible = true; return p.fill; });
  const hits = ray.intersectObjects(pickable, false).filter(h => plane.distanceToPoint(h.point) >= 0);
  if (state.mode === "mesh") parts.forEach(p => p.fill.visible = false);
  select(hits.length ? hits[0].object.userData.part : null);
});
const filled = () => state.mode === "blueprint" || state.mode === "solid";
function colorOf(p) { return filled() ? "#ffffff" : "#1f64b8"; }
function select(id) {
  state.selected = id;
  for (const p of parts) {
    const on = p.id === id; const base = state.mode === "xray" ? 0.8 : 1;
    if (filled()) p.fm.color.set(on ? 0x0b2a52 : state.mode === "solid" ? 0x2f7fd6 : 0x1f64b8);
    p.lm.color.set(on && !filled() ? "#0b2a52" : colorOf(p)); p.lm.opacity = id && !on ? base * 0.45 : base;
    if (p.wire) p.wire.material.color.set(on ? "#0b2a52" : colorOf(p));
  }
  const card = $("#info"); if (!id) { card.hidden = true; return; }
  const p = parts.find(x => x.id === id); card.hidden = false;
  $("#info-pn").textContent = p.id; $("#info-name").textContent = p.name;
  $("#info-body").innerHTML = `<dt>Subsystem</dt><dd>${SUB[p.sub].label}</dd><dt>Material</dt><dd>${p.mat}</dd><dt>Allocated mass</dt><dd>${p.mass} kg</dd><dt>CG (X, Y, Z mm)</dt><dd>${p.cg.join(", ")}</dd><dt>Mesh</dt><dd>${p.nt.toLocaleString()} triangles</dd>`;
}
$("#info-close").addEventListener("click", () => select(null));

// ---- controls
document.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => { state.mode = b.dataset.mode; applyMode(); }));
$("#opt-color").addEventListener("change", e => { state.color = e.target.checked; select(state.selected); });
$("#opt-dims").addEventListener("change", e => { state.dims = e.target.checked; dimGroup.visible = state.dims; });
$("#opt-calls").addEventListener("change", e => { state.calls = e.target.checked; });
$("#opt-rot").addEventListener("change", e => { controls.autoRotate = e.target.checked; });
$("#explode").addEventListener("input", e => { state.target = +e.target.value / 100; $("#explode-v").textContent = Math.round(state.target * 100) + "%"; });
const cs = $("#clip-axis"), cp = $("#clip-pos");
function setClip() {
  const ax = cs.value; cp.disabled = ax === "off";
  if (ax === "off") { plane.normal.set(0, 0, -1); plane.constant = 1e6; $("#clip-v").textContent = "off"; return; }
  const n = ax === "x" ? [-1, 0, 0] : ax === "y" ? [0, -1, 0] : [0, 0, -1];
  const ext = ax === "x" ? [-3.1, 4.1] : ax === "y" ? [-2.5, 2.5] : [0, 4.7];
  const v = ext[0] + (ext[1] - ext[0]) * (+cp.value / 100);
  plane.normal.set(...n); plane.constant = v; $("#clip-v").textContent = `${ax.toUpperCase()} = ${v.toFixed(2)} m`;
}
cs.addEventListener("change", setClip); cp.addEventListener("input", setClip); setClip();

const VIEWS = { iso: [11.2, -10.8, 6.0], front: [14.5, 0, 2.4], side: [0, -13.5, 2.4], top: [0.01, -0.01, 16.5], rear: [-14.5, 0, 2.4], low: [8, -6.5, 1.1] };
let tween = null;
function view(name, instant) {
  const v = new THREE.Vector3(...VIEWS[name]);
  tween = { from: camera.position.clone(), to: v, k: instant ? 1 : 0 }; if (instant) { camera.position.copy(v); controls.update(); }
  document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("on", b.dataset.view === name));
}
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => { controls.autoRotate = false; $("#opt-rot").checked = false; view(b.dataset.view); }));

// ---- dimensions (3-D lines with HTML labels) and callouts
const dimGroup = new THREE.Group(); dimGroup.visible = false; scene.add(dimGroup);
const labels = []; const overlay = $("#overlay");
function mkLabel(text, cls) { const e = document.createElement("div"); e.className = cls; e.textContent = text; overlay.appendChild(e); return e; }
const dimMat = new THREE.LineBasicMaterial({ color: 0x1f64b8 });
function dimLine(a, b, text) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  dimGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([A, B]), dimMat));
  const d = B.clone().sub(A).normalize(); const o = Math.abs(d.z) > 0.9 ? new THREE.Vector3(0, 0.18, 0) : new THREE.Vector3(0, 0, 0.18);
  const o2 = Math.abs(d.z) > 0.9 ? new THREE.Vector3(0.18, 0, 0) : new THREE.Vector3(0, 0.18, 0);
  for (const t of [A, B]) dimGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([t.clone().add(o2), t.clone().sub(o2)]), dimMat));
  labels.push({ el: mkLabel(text, "lbl dim"), p: A.clone().add(B).multiplyScalar(0.5), dim: true });
}
dimLine([-3.015, -3.0, 0.01], [3.99, -3.0, 0.01], "L 7,005");
dimLine([-3.3, -2.363, 0.01], [-3.3, 2.363, 0.01], "W 4,725 deployed");
dimLine([4.4, -0.6, 0.01], [4.4, -0.6, 4.587], "H 4,587");
dimLine([-2.2, 2.9, 0.01], [2.2, 2.9, 0.01], "wheelbase 4,400");
dimLine([2.2, -1.45, 0.01], [2.2, 1.45, 0.01], "track 2,900");
for (const c of CALL) { const l = { el: mkLabel(c.t, "lbl call"), p: new THREE.Vector3(...c.p), call: true, sub: c.s }; l.el.style.setProperty("--c", SUB[c.s].c); labels.push(l); }

const v3 = new THREE.Vector3();
function placeLabels() {
  const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
  for (const l of labels) {
    const show = l.dim ? state.dims : state.calls && state.vis[l.sub] && state.explode < 0.15;
    if (!show) { l.el.style.display = "none"; continue; }
    v3.copy(l.p).project(camera);
    if (v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05) { l.el.style.display = "none"; continue; }
    l.el.style.display = ""; l.el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * w}px, ${(-v3.y * 0.5 + 0.5) * h}px)`;
  }
}

// ---- loop
function resize() {
  const w = canvasWrap.clientWidth, h = canvasWrap.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  // keep a constant horizontal field of view so the whole vehicle fits on narrow screens
  const hf = 48 * Math.PI / 180; camera.fov = Math.min(62, Math.max(30, 2 * Math.atan(Math.tan(hf / 2) / camera.aspect) * 180 / Math.PI));
  // on wide screens shift the model left of the control panel
  if (w > 820) camera.setViewOffset(w, h, 120, 0, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvasWrap); resize();
let visible = true; new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.02 }).observe(host);
function tick() {
  requestAnimationFrame(tick); if (!visible || document.hidden) return;
  if (tween && tween.k < 1) { tween.k = Math.min(1, tween.k + 0.045); const e = 1 - Math.pow(1 - tween.k, 3); camera.position.lerpVectors(tween.from, tween.to, e); }
  state.explode += (state.target - state.explode) * 0.12; if (Math.abs(state.target - state.explode) < 0.001) state.explode = state.target;
  for (const p of parts) p.grp.position.copy(p.ex).multiplyScalar(state.explode);
  controls.update(); renderer.render(scene, camera); placeLabels();
}
load().then(tick).catch(err => { console.error(err); const l = $("#loading"); if (l) l.textContent = "3D model failed to load. See the drawing sheets below."; });
window.__tycho = { state, parts, camera, controls, view };
