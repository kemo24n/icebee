"use client";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ScoopSpec = { slug: string; color: string };
export type ProductLook = { look: string; color: string; accent: string };
export type TreatSpec = { base: "CONE" | "CUP" | "WAFFLE" | "NONE" | "PRODUCT"; scoops: ScoopSpec[]; toppings: string[]; product?: ProductLook };

const noise = new ImprovedNoise();
const RADII = [0.64, 0.58, 0.52];

/* ---------------- textures ---------------- */
let waffleTex: THREE.CanvasTexture | null = null;
function waffleTexture() {
  if (waffleTex) return waffleTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 256, 256);
  grd.addColorStop(0, "#E2A256"); grd.addColorStop(1, "#C98A3E");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#9A5E22"; g.lineWidth = 9;
  for (let i = -256; i < 512; i += 42) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 256, 256); g.stroke();
    g.beginPath(); g.moveTo(i + 256, 0); g.lineTo(i, 256); g.stroke();
  }
  g.strokeStyle = "rgba(255,226,170,.35)"; g.lineWidth = 2;
  for (let i = -256; i < 512; i += 42) { g.beginPath(); g.moveTo(i + 4, 0); g.lineTo(i + 260, 256); g.stroke(); }
  waffleTex = new THREE.CanvasTexture(c);
  waffleTex.wrapS = waffleTex.wrapT = THREE.RepeatWrapping;
  waffleTex.colorSpace = THREE.SRGBColorSpace;
  waffleTex.anisotropy = 4;
  return waffleTex;
}
let cupTex: THREE.CanvasTexture | null = null;
function cupTexture() {
  if (cupTex) return cupTex;
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, 1024, 256);
  g.fillStyle = "#E53935"; g.fillRect(0, 0, 1024, 56); g.fillRect(0, 200, 1024, 56);
  g.font = "bold 72px Arial, sans-serif"; g.textAlign = "left"; g.textBaseline = "middle";
  const letters = ["i", "c", "e", " ", "b", "e", "e"], cols = ["#E53935", "#1E88E5", "#43A047", "", "#FFB300", "#FF6B1A", "#8E24AA"];
  for (let k = 0; k < 2; k++) { let x = 120 + k * 512; letters.forEach((ch, i) => { if (ch !== " ") { g.fillStyle = cols[i]; g.fillText(ch, x, 130); } x += ch === " " ? 22 : g.measureText(ch).width + 4; }); }
  cupTex = new THREE.CanvasTexture(c);
  cupTex.wrapS = THREE.RepeatWrapping; cupTex.colorSpace = THREE.SRGBColorSpace; cupTex.anisotropy = 4;
  return cupTex;
}
let shadowTex: THREE.CanvasTexture | null = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(0,0,0,.55)"); r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

/* ---------------- scoop ---------------- */
type FlavorLook = { inclusions?: { color: string[]; n: number; size: number; shape?: "chunk" | "fleck" }; ribbon?: string; rough?: number; sheen?: number };
const LOOK: Record<string, FlavorLook> = {
  pistachio: { inclusions: { color: ["#5E8F2E", "#7FB045", "#C9B37A"], n: 70, size: 0.05 } },
  qashta: { rough: 0.7, inclusions: { color: ["#93C25E"], n: 26, size: 0.035, shape: "fleck" } },
  "honey-walnut": { ribbon: "#C97C05", inclusions: { color: ["#7A4A22", "#9C6634"], n: 34, size: 0.06 } },
  "dark-chocolate": { rough: 0.45, sheen: 0.4, inclusions: { color: ["#2A140A"], n: 30, size: 0.045 } },
  strawberry: { ribbon: "#C2184B", inclusions: { color: ["#B3123F", "#E0325E"], n: 34, size: 0.055 } },
  mango: { ribbon: "#F07C00" },
  "lemon-mint": { inclusions: { color: ["#3E7D2B", "#5FA03E"], n: 46, size: 0.03, shape: "fleck" } },
  "wild-berry": { ribbon: "#3B1C8C", inclusions: { color: ["#2E1B6B", "#8E2A6A"], n: 40, size: 0.05 } },
  "salted-caramel": { ribbon: "#8A4A12", inclusions: { color: ["#F5EBDC"], n: 30, size: 0.02, shape: "fleck" } },
  coffee: { inclusions: { color: ["#2B170D", "#3D2213"], n: 60, size: 0.022, shape: "fleck" } },
  vanilla: { rough: 0.7, inclusions: { color: ["#2B170D"], n: 18, size: 0.018, shape: "fleck" } },
  chocolate: { rough: 0.45, sheen: 0.4, inclusions: { color: ["#2A140A"], n: 24, size: 0.04 } },
  cherry: { ribbon: "#8E0F22", inclusions: { color: ["#8E0F22", "#C8102E"], n: 30, size: 0.05 } },
  almond: { inclusions: { color: ["#E9D2A6", "#C9A46A"], n: 34, size: 0.04 } },
  orange: { ribbon: "#E86A00", inclusions: { color: ["#F28C28"], n: 20, size: 0.03, shape: "fleck" } },
  "caramel-cheesecake": { ribbon: "#8A4A12", inclusions: { color: ["#E3B97A", "#B9773A"], n: 30, size: 0.05 } },
  "bee-love": { ribbon: "#FFC21A", inclusions: { color: ["#D1306B", "#F8B8CF"], n: 40, size: 0.045, shape: "fleck" } },
};

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967295; }
function rng(seed: number) { let x = Math.floor(seed * 1e9) || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 1 | x) + 0x6d2b79f5) >>> 0) / 4294967296 % 1; }

let DETAIL = 1;
function makeScoop(spec: ScoopSpec, r: number, seed: number): THREE.Group {
  const look = LOOK[spec.slug] ?? {};
  const geo = new THREE.SphereGeometry(r, Math.round(96 * DETAIL), Math.round(72 * DETAIL));
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(spec.color);
  const rib = look.ribbon ? new THREE.Color(look.ribbon) : null;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const so = seed * 50;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); n.copy(v).normalize();
    const theta = Math.atan2(n.z, n.x);
    let d = 1
      + 0.07 * noise.noise(n.x * 2.2 + so, n.y * 2.2, n.z * 2.2)
      + 0.025 * noise.noise(n.x * 7 + so, n.y * 7, n.z * 7)
      + 0.008 * noise.noise(n.x * 22, n.y * 22 + so, n.z * 22);
    let y = n.y;
    // scooped ruffle skirt on the lower half
    if (y < 0.05) {
      const t = THREE.MathUtils.smoothstep(-y, -0.05, 0.6);
      d += t * (0.16 + 0.07 * Math.sin(theta * 9 + so) + 0.05 * noise.noise(theta * 3, so, 0));
    }
    let px = n.x * r * d, pz = n.z * r * d, py = y * r * (y > 0 ? 0.9 : 1);
    if (py < -r * 0.42) py = -r * 0.42 - (py + r * 0.42) * 0.12; // flatten bottom
    pos.setXYZ(i, px, py, pz);
    // colour variation + ribbon swirls
    const shade = 0.93 + 0.1 * noise.noise(n.x * 5 + so, n.y * 5, n.z * 5) - Math.max(0, -y) * 0.08;
    const c = base.clone().multiplyScalar(shade);
    if (rib) {
      const sw = noise.noise(n.x * 3.2 + so, n.y * 3.2 + theta * 0.6, n.z * 3.2);
      if (sw > 0.22) c.lerp(rib, THREE.MathUtils.smoothstep(sw, 0.22, 0.32) * 0.85);
    }
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: look.rough ?? 0.62, sheen: look.sheen ?? 0.9, sheenRoughness: 0.55,
    sheenColor: base.clone().lerp(new THREE.Color("#ffffff"), 0.6), clearcoat: 0.08, clearcoatRoughness: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  const g = new THREE.Group(); g.add(mesh);

  if (look.inclusions) {
    const inc = look.inclusions;
    const rand = rng(hash(spec.slug) + seed);
    const ig = inc.shape === "fleck" ? new THREE.IcosahedronGeometry(inc.size * r, 0) : new THREE.DodecahedronGeometry(inc.size * r, 0);
    if (inc.shape === "fleck") ig.scale(1.4, 0.35, 1);
    const im = new THREE.InstancedMesh(ig, new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 }), inc.n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    let k = 0, guard = 0;
    while (k < inc.n && guard++ < 4000) {
      const vi = Math.floor(rand() * pos.count);
      p.fromBufferAttribute(pos, vi);
      if (p.y < -r * 0.1) continue;
      n.fromBufferAttribute(geo.attributes.normal as THREE.BufferAttribute, vi);
      p.addScaledVector(n, -inc.size * r * 0.25);
      q.setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6));
      const s = 0.6 + rand() * 0.8; sc.set(s, s, s);
      m.compose(p, q, sc); im.setMatrixAt(k, m);
      im.setColorAt(k, new THREE.Color(inc.color[Math.floor(rand() * inc.color.length)]));
      k++;
    }
    im.count = k;
    g.add(im);
  }
  return g;
}

/* ---------------- bases ---------------- */
function makeBase(kind: TreatSpec["base"]): THREE.Group {
  const g = new THREE.Group();
  if (kind === "NONE") return g;
  if (kind === "CONE") {
    const pts = [new THREE.Vector2(0.001, -2.0), new THREE.Vector2(0.56, 0), new THREE.Vector2(0.6, 0.02)];
    const geo = new THREE.LatheGeometry(pts, 96);
    const tex = waffleTexture().clone(); tex.needsUpdate = true; tex.repeat.set(7, 3.2);
    const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 3, roughness: 0.78, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(geo, mat); cone.castShadow = true; g.add(cone);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.07, 20, 96), new THREE.MeshStandardMaterial({ color: "#C88637", roughness: 0.6 }));
    lip.rotation.x = Math.PI / 2; lip.position.y = 0.02; g.add(lip);
    g.position.y = 0;
  } else if (kind === "CUP") {
    const pts = [new THREE.Vector2(0.001, -1.15), new THREE.Vector2(0.4, -1.15), new THREE.Vector2(0.44, -1.1), new THREE.Vector2(0.66, 0.05)];
    const geo = new THREE.LatheGeometry(pts, 96);
    const mat = new THREE.MeshPhysicalMaterial({ map: cupTexture(), roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
    const cup = new THREE.Mesh(geo, mat); cup.castShadow = true; g.add(cup);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.035, 16, 96), new THREE.MeshStandardMaterial({ color: "#E53935", roughness: 0.4 }));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.05; g.add(rim);
  } else {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(new THREE.Vector2(0.001 + 0.82 * Math.sin(t * Math.PI / 2), -0.75 + 0.8 * (1 - Math.cos(t * Math.PI / 2)))); }
    const geo = new THREE.LatheGeometry(pts, 128);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > -0.05) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, y + 0.08 * Math.sin(a * 8)); } }
    geo.computeVertexNormals();
    const tex = waffleTexture().clone(); tex.needsUpdate = true; tex.repeat.set(9, 2);
    const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 3, roughness: 0.78, side: THREE.DoubleSide });
    const bowl = new THREE.Mesh(geo, mat); bowl.castShadow = true; g.add(bowl);
  }
  return g;
}

/* ---------------- toppings ---------------- */
function drizzle(r: number, cy: number, color: string, honey: boolean, seed: number) {
  const pts: THREE.Vector3[] = [];
  const turns = honey ? 2.2 : 3;
  for (let i = 0; i <= 80; i++) {
    const t = i / 80, a = t * Math.PI * 2 * turns + seed;
    const yy = 0.85 - t * (honey ? 1.05 : 0.7) + (honey ? 0 : 0.18 * Math.sin(t * 40));
    const ny = Math.max(-0.35, Math.min(0.95, yy));
    const rad = Math.sqrt(Math.max(0, 1 - ny * ny)) * r * (ny < 0 ? 1.12 : 1.02) + r * 0.03;
    pts.push(new THREE.Vector3(Math.cos(a) * rad, cy + ny * r * 0.9, Math.sin(a) * rad));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 160, r * (honey ? 0.055 : 0.04), 12, false);
  const mat = honey
    ? new THREE.MeshPhysicalMaterial({ color, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, emissive: "#7A3A00", emissiveIntensity: 0.25 })
    : new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.1 });
  return new THREE.Mesh(geo, mat);
}
function sprinkle(r: number, cy: number, colors: string[], n: number, size: number, seed: number, rounded = false) {
  const geo = rounded ? new THREE.SphereGeometry(size, 10, 8) : new THREE.DodecahedronGeometry(size, 0);
  if (rounded) geo.scale(1.3, 0.8, 1);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.5 }), n);
  const rand = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, ny = 0.35 + rand() * 0.62, rad = Math.sqrt(1 - ny * ny) * r * 0.98;
    p.set(Math.cos(a) * rad, cy + ny * r * 0.88, Math.sin(a) * rad);
    q.setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6));
    const k = 0.6 + rand() * 0.9; s.set(k, k * (rounded ? 1 : 0.6), k);
    m.compose(p, q, s); im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color(colors[Math.floor(rand() * colors.length)]));
  }
  return im;
}
function lotus(r: number, cy: number, oreo = false) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = oreo ? "#1E1410" : "#B8743A"; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = oreo ? "#3A2A22" : "#8C5222"; g.lineWidth = 6; g.strokeRect(14, 14, 228, 100);
  g.fillStyle = oreo ? "#3A2A22" : "#8C5222"; g.font = "bold 34px Arial"; g.textAlign = "center"; g.fillText("BEE", 128, 78);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(r * 0.75, r * 0.42, r * 0.09, 3, 0.02),
    [0, 1, 2, 3].map(() => new THREE.MeshStandardMaterial({ color: oreo ? "#F4EFE6" : "#A9672F", roughness: 0.8 })).concat([
     new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })]));
  mesh.position.set(r * 0.25, cy + r * 0.92, r * 0.1);
  mesh.rotation.set(-0.25, 0.4, 0.35);
  return mesh;
}

/* ---------------- assemble ---------------- */
export function buildTreat(spec: TreatSpec): { group: THREE.Group; scoops: THREE.Group[]; topY: number } {
  if (spec.base === "PRODUCT" && spec.product) return { group: buildProduct(spec.product), scoops: [], topY: 0 };
  const root = new THREE.Group();
  root.add(makeBase(spec.base));
  const scoops: THREE.Group[] = [];
  let y = spec.base === "NONE" ? 0 : spec.base === "CUP" ? 0.22 : spec.base === "WAFFLE" ? 0.25 : 0.32;
  let prevR = 0;
  spec.scoops.forEach((sc, i) => {
    const r = RADII[i] ?? 0.5;
    if (i > 0) y += prevR * 0.66 + r * 0.42;
    const g = makeScoop(sc, r, i * 0.37 + hash(sc.slug));
    g.position.y = y;
    g.rotation.y = i * 1.7;
    g.rotation.z = (i % 2 ? 1 : -1) * 0.05;
    root.add(g); scoops.push(g);
    prevR = r;
  });
  const topY = y, topR = prevR || 0.6;
  if (spec.scoops.length) {
    const t = new THREE.Group();
    if (spec.toppings.includes("honey-drizzle")) t.add(drizzle(topR, topY, "#F2A20C", true, 0.3));
    if (spec.toppings.includes("chocolate-drizzle")) t.add(drizzle(topR, topY, "#2B140B", false, 1.4));
    if (spec.toppings.includes("crushed-pistachio")) t.add(sprinkle(topR, topY, ["#6C9E35", "#8DBB4E", "#B9C97A"], 70, topR * 0.05, 7));
    if (spec.toppings.includes("roasted-nuts")) t.add(sprinkle(topR, topY, ["#9A6232", "#B97D45", "#7E4C24"], 16, topR * 0.085, 11, true));
    if (spec.toppings.includes("lotus")) t.add(lotus(topR, topY));
    if (spec.toppings.includes("oreo")) { const o = lotus(topR, topY, true); o.position.x -= topR * 0.5; o.rotation.y = -0.6; t.add(o); }
    if (spec.toppings.includes("cornflakes")) t.add(sprinkle(topR, topY, ["#E8B04A", "#D9962E", "#F2C46B"], 26, topR * 0.09, 13));
    t.name = "toppings";
    root.add(t);
  }
  return { group: root, scoops, topY };
}

function dispose(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((k) => k.dispose()); else mat?.dispose();
  });
}

function lights(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight("#FFF1DA", 2.4); key.position.set(2.5, 4, 3); scene.add(key);
  const pink = new THREE.PointLight("#FF4FA3", 14, 12); pink.position.set(-3, 1.5, -2.2); scene.add(pink);
  const honey = new THREE.PointLight("#FFC21A", 12, 12); honey.position.set(3, 0.5, -2.5); scene.add(honey);
  scene.add(new THREE.HemisphereLight("#BFD2FF", "#2A1A10", 0.5));
}

function shadowPlane(y: number) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = y;
  return m;
}

function frame(camera: THREE.PerspectiveCamera, obj: THREE.Object3D, pad = 1.18, target?: THREE.Vector3) {
  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const h = Math.max(size.y, size.x * 1.05) * pad;
  const dist = h / 2 / Math.tan((camera.fov * Math.PI) / 360);
  const dir = new THREE.Vector3(0, 0.28, 1).normalize();
  camera.position.copy(c).addScaledVector(dir, dist);
  camera.lookAt(c);
  target?.copy(c);
  return { center: c, bottom: box.min.y };
}

/* ---------------- interactive stage ---------------- */
export class TreatStage {
  renderer: THREE.WebGLRenderer; scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  controls: OrbitControls; current: THREE.Group | null = null; shadow: THREE.Mesh | null = null;
  raf = 0; el: HTMLElement; ro: ResizeObserver; drop: { g: THREE.Group; to: number; t0: number } | null = null;
  lastCount = 0; visible = true; io: IntersectionObserver;
  constructor(el: HTMLElement) {
    this.el = el;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "pan-y";
    lights(this.scene, this.renderer);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enablePan: false, enableZoom: false, autoRotate: true, autoRotateSpeed: 1.6, enableDamping: true, minPolarAngle: 0.9, maxPolarAngle: 1.75 });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize();
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }); this.io.observe(el);
    const loop = (t: number) => { this.raf = requestAnimationFrame(loop); if (this.visible && document.visibilityState === "visible") this.tick(t); };
    this.raf = requestAnimationFrame(loop);
  }
  resize() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 300;
    this.renderer.setSize(w, h, false); this.renderer.domElement.style.width = "100%"; this.renderer.domElement.style.height = "100%";
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  set(spec: TreatSpec) {
    if (this.current) { this.scene.remove(this.current); dispose(this.current); }
    if (this.shadow) this.scene.remove(this.shadow);
    const { group, scoops } = buildTreat(spec);
    this.current = group; this.scene.add(group);
    // frame as if full (3 scoops) so camera doesn't jump while building
    const ghost = spec.base === "PRODUCT" ? buildTreat(spec) : buildTreat({ ...spec, scoops: [spec.scoops[0] ?? { slug: "qashta", color: "#fff" }, { slug: "x", color: "#fff" }, { slug: "x", color: "#fff" }], toppings: [] });
    const { bottom } = frame(this.camera, ghost.group, spec.base === "PRODUCT" ? 1.45 : 1.12, this.controls.target);
    dispose(ghost.group);
    this.shadow = shadowPlane(bottom + 0.01); this.scene.add(this.shadow);
    if (spec.scoops.length > this.lastCount && scoops.length) {
      const g = scoops[scoops.length - 1];
      this.drop = { g, to: g.position.y, t0: performance.now() };
      g.position.y += 1.6;
    }
    this.lastCount = spec.scoops.length;
  }
  tick(t: number) {
    if (this.drop) {
      const k = Math.min(1, (t - this.drop.t0) / 650);
      const e = k < 0.7 ? (k / 0.7) ** 2 : 1 - Math.sin((k - 0.7) / 0.3 * Math.PI) * 0.06;
      this.drop.g.position.y = this.drop.to + (1 - Math.min(1, e)) * 1.6;
      const sq = k > 0.6 && k < 0.95 ? 1 - Math.sin((k - 0.6) / 0.35 * Math.PI) * 0.08 : 1;
      this.drop.g.scale.set(2 - sq, sq, 2 - sq);
      if (k >= 1) { this.drop.g.position.y = this.drop.to; this.drop.g.scale.set(1, 1, 1); this.drop = null; }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  snapshot(): string { this.renderer.render(this.scene, this.camera); return this.renderer.domElement.toDataURL("image/png"); }
  destroy() {
    cancelAnimationFrame(this.raf); this.ro.disconnect(); this.io.disconnect(); this.controls.dispose();
    if (this.current) dispose(this.current);
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}

/* ---------------- offscreen thumbnails ---------------- */
let thumbR: THREE.WebGLRenderer | null = null, thumbScene: THREE.Scene | null = null;
const cache = new Map<string, string>();
const queue: { key: string; spec: TreatSpec; size: number; res: (s: string) => void }[] = [];
let busy = false;

export function specKey(spec: TreatSpec) { return JSON.stringify(spec); }

const LS = "ib3d_v1:";
export function renderThumb(spec: TreatSpec, size = 384): Promise<string> {
  const key = specKey(spec) + size;
  let hit = cache.get(key);
  if (!hit) { try { hit = localStorage.getItem(LS + key) ?? undefined; if (hit) cache.set(key, hit); } catch {} }
  if (hit) return Promise.resolve(hit);
  return new Promise((res) => { queue.push({ key, spec, size, res }); pump(); });
}
function pump() {
  if (busy || !queue.length) return;
  busy = true;
  const job = queue.shift()!;
  const run = () => {
    try {
      if (!thumbR) {
        thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure = 1.05; thumbR.outputColorSpace = THREE.SRGBColorSpace;
        thumbScene = new THREE.Scene(); lights(thumbScene, thumbR);
      }
      thumbR.setPixelRatio(1); thumbR.setSize(job.size, job.size, false);
      const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      DETAIL = 0.75;
      const { group } = buildTreat(job.spec);
      DETAIL = 1;
      group.rotation.y = 0.6;
      thumbScene!.add(group);
      const { bottom } = frame(cam, group, job.spec.base === "NONE" ? 1.25 : job.spec.base === "PRODUCT" ? 1.12 : 1.1);
      const sh = shadowPlane(bottom + 0.005); thumbScene!.add(sh);
      thumbR.render(thumbScene!, cam);
      const url = thumbR.domElement.toDataURL("image/webp", 0.9);
      thumbScene!.remove(group); thumbScene!.remove(sh); dispose(group);
      cache.set(job.key, url); try { localStorage.setItem(LS + job.key, url); } catch {} job.res(url);
    } catch {
      job.res("");
    }
    busy = false;
    setTimeout(pump, 0);
  };
  const ric = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback;
  if (ric) ric(run); else setTimeout(run, 16);
}

/* ================= menu products (drinks, desserts, tubs) ================= */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, rep?: [number, number]) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const glassMat = () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.2, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, side: THREE.DoubleSide, depthWrite: false });
function lathe(points: [number, number][], seg = 72) { return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg); }
function liquid(rb: number, rt: number, y0: number, y1: number, color: string, top?: string) {
  const geo = new THREE.CylinderGeometry(rt, rb, y1 - y0, 64, 12);
  if (top) {
    const pos = geo.attributes.position as THREE.BufferAttribute, cols = new Float32Array(pos.count * 3);
    const a = new THREE.Color(color), b = new THREE.Color(top), h = y1 - y0;
    for (let i = 0; i < pos.count; i++) { const k = THREE.MathUtils.smoothstep((pos.getY(i) + h / 2) / h, 0.45, 0.7); const c = a.clone().lerp(b, k); cols.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  }
  const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: top ? "#ffffff" : color, vertexColors: !!top, roughness: 0.25, clearcoat: 0.6 }));
  m.position.y = (y0 + y1) / 2; return m;
}
function whipped(r: number, h: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([Math.max(0.001, r * (1 - t) * (1 + 0.12 * Math.sin(t * Math.PI * 5))), h * t]); }
  const geo = lathe(pts, 96);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    const a = Math.atan2(z, x) + (y / h) * 4, rr = Math.hypot(x, z) * (1 + 0.1 * Math.sin(a * 8));
    pos.setXYZ(i, Math.cos(a) * rr, y, Math.sin(a) * rr);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: "#FFF9F0", roughness: 0.6, sheen: 1, sheenColor: new THREE.Color("#ffffff") }));
}
function straw(h: number, color: string) {
  const tex = canvasTex(64, 256, (g) => { g.fillStyle = "#fff"; g.fillRect(0, 0, 64, 256); g.fillStyle = color; for (let y = 0; y < 256; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 24); g.lineTo(64, y + 44); g.lineTo(0, y + 20); g.fill(); } });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, h, 20), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }));
  m.rotation.z = -0.28; return m;
}
function cherry() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 24), new THREE.MeshPhysicalMaterial({ color: "#C8102E", roughness: 0.15, clearcoat: 1 })));
  const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0.05, 0.25, 0), new THREE.Vector3(0.14, 0.34, 0)]), 12, 0.012, 6), new THREE.MeshStandardMaterial({ color: "#4E6B1F" }));
  g.add(stem); return g;
}
function iceCubes(n: number, r: number, y: number) {
  const g = new THREE.Group(), mat = new THREE.MeshPhysicalMaterial({ color: "#EAF6FF", transparent: true, opacity: 0.55, roughness: 0.1, clearcoat: 1 });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.22, 0.22, 2, 0.04), mat); const a = (i / n) * Math.PI * 2; m.position.set(Math.cos(a) * r, y + (i % 2) * 0.06, Math.sin(a) * r); m.rotation.set(i, i * 2, 0.4); g.add(m); }
  return g;
}
function plate(r = 1.1) {
  const m = new THREE.Mesh(lathe([[0.001, 0], [r * 0.7, 0], [r * 0.85, 0.03], [r, 0.09], [r * 0.98, 0.1], [r * 0.82, 0.05], [0.001, 0.04]], 96), new THREE.MeshPhysicalMaterial({ color: "#F7F4EE", roughness: 0.25, clearcoat: 0.8 }));
  return m;
}
function sprinkleOn(surface: (u: number, v: number) => THREE.Vector3, colors: string[], n: number, size: number, seed = 3) {
  const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(size, 0), new THREE.MeshStandardMaterial({ roughness: 0.5 }), n);
  const rand = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < n; i++) { q.setFromEuler(new THREE.Euler(rand() * 6, rand() * 6, rand() * 6)); m.compose(surface(rand(), rand()), q, new THREE.Vector3(1, 0.6, 1)); im.setMatrixAt(i, m); im.setColorAt(i, new THREE.Color(colors[Math.floor(rand() * colors.length)])); }
  return im;
}

export function buildProduct(p: ProductLook): THREE.Group {
  const g = new THREE.Group();
  const darker = new THREE.Color(p.color).multiplyScalar(0.6).getStyle();
  switch (p.look) {
    case "shake": {
      g.add(new THREE.Mesh(lathe([[0.001, -1.05], [0.3, -1.05], [0.32, -1.0], [0.24, -0.95], [0.4, -0.85], [0.52, 0.45]]), glassMat()));
      g.add(liquid(0.4, 0.49, -0.84, 0.4, p.color));
      const w = whipped(0.5, 0.55); w.position.y = 0.38; g.add(w);
      g.add(drizzle(0.42, 0.62, darker, false, 0.6));
      g.add(sprinkleOn((u, v) => { const a = u * 6.28, rr = 0.15 + v * 0.3; return new THREE.Vector3(Math.cos(a) * rr, 0.38 + 0.55 * (1 - rr / 0.5) + 0.03, Math.sin(a) * rr); }, [p.accent, "#93C25E", "#FF4FA3"], 40, 0.03));
      const st = straw(1.5, "#FF4FA3"); st.position.set(0.18, 0.7, 0.05); g.add(st);
      const c = cherry(); c.position.y = 0.98; g.add(c);
      break;
    }
    case "juice": {
      g.add(new THREE.Mesh(lathe([[0.001, -0.9], [0.4, -0.9], [0.5, 0.5]]), glassMat()));
      g.add(liquid(0.38, 0.47, -0.86, 0.32, p.color));
      g.add(iceCubes(4, 0.22, 0.2));
      const slice = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 40), new THREE.MeshPhysicalMaterial({ color: p.accent, roughness: 0.3, clearcoat: 0.6 }));
      slice.rotation.set(Math.PI / 2, 0, 0.3); slice.position.set(0.5, 0.45, 0); g.add(slice);
      const st = straw(1.4, p.color); st.position.set(-0.12, 0.6, 0); g.add(st);
      break;
    }
    case "iced-coffee": {
      g.add(new THREE.Mesh(lathe([[0.001, -1.0], [0.38, -1.0], [0.46, 0.55]]), glassMat()));
      g.add(liquid(0.36, 0.44, -0.96, 0.4, p.color, p.accent));
      g.add(iceCubes(4, 0.2, 0.25));
      const w = whipped(0.42, 0.4); w.position.y = 0.4; g.add(w);
      g.add(drizzle(0.34, 0.55, "#3B2213", false, 1.2));
      const st = straw(1.5, "#0B1020"); st.position.set(0.16, 0.7, 0.05); g.add(st);
      break;
    }
    case "coffee": {
      const sau = plate(0.8); sau.position.y = -0.5; g.add(sau);
      g.add(new THREE.Mesh(lathe([[0.001, -0.45], [0.32, -0.45], [0.42, -0.3], [0.5, 0.15], [0.52, 0.18], [0.48, 0.18], [0.46, 0.14], [0.39, -0.28], [0.001, -0.38]]), new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.2, clearcoat: 1 })));
      const art = canvasTex(256, 256, (c) => { c.fillStyle = p.color; c.fillRect(0, 0, 256, 256); c.fillStyle = p.accent; c.beginPath(); c.moveTo(128, 200); c.bezierCurveTo(20, 120, 70, 40, 128, 95); c.bezierCurveTo(186, 40, 236, 120, 128, 200); c.fill(); });
      const top = new THREE.Mesh(new THREE.CircleGeometry(0.47, 48), new THREE.MeshPhysicalMaterial({ map: art, roughness: 0.3, clearcoat: 0.6 }));
      top.rotation.x = -Math.PI / 2; top.position.y = 0.1; g.add(top);
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 16, 32, Math.PI * 1.3), new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.2, clearcoat: 1 }));
      h.position.set(0.55, -0.12, 0); h.rotation.z = -Math.PI * 0.65; g.add(h);
      break;
    }
    case "waffle": {
      g.add(plate(1.15));
      const tex = canvasTex(256, 256, (c) => { c.fillStyle = "#E3A24E"; c.fillRect(0, 0, 256, 256); c.fillStyle = "#B8742C"; for (let x = 8; x < 256; x += 42) for (let y = 8; y < 256; y += 42) c.fillRect(x, y, 30, 30); });
      const wf = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.2, 1.1, 3, 0.06), new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 4, roughness: 0.7 }));
      wf.position.y = 0.2; wf.rotation.y = 0.3; g.add(wf);
      const sc = makeScoop({ slug: "pistachio", color: p.accent }, 0.42, 0.3); sc.position.set(0.1, 0.55, 0); g.add(sc);
      g.add(drizzle(0.42, 0.55, p.color, true, 2));
      const sauce = drizzle(0.75, 0.22, "#3B2213", false, 4); sauce.scale.set(1, 0.15, 0.75); sauce.position.y = 0.2; g.add(sauce);
      break;
    }
    case "crepe": {
      g.add(plate(1.15));
      const sh = new THREE.Shape(); sh.moveTo(-0.9, -0.5); sh.quadraticCurveTo(0, -0.62, 0.9, -0.5); sh.quadraticCurveTo(0.2, 0.2, 0, 0.75); sh.quadraticCurveTo(-0.2, 0.2, -0.9, -0.5);
      const tex = canvasTex(256, 256, (c) => { c.fillStyle = p.color; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(140,80,30,${Math.random() * 0.35})`; c.beginPath(); c.arc(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 9, 0, 7); c.fill(); } }, [2, 2]);
      const cr = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4 }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
      cr.rotation.x = -Math.PI / 2; cr.position.y = 0.14; g.add(cr);
      for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.7 + i * 0.32, 0.36, 0.45), new THREE.Vector3(-0.55 + i * 0.32, 0.37, 0), new THREE.Vector3(-0.7 + i * 0.32, 0.36, -0.4)]), 20, 0.03, 8), new THREE.MeshPhysicalMaterial({ color: p.accent, roughness: 0.2, clearcoat: 1 })); g.add(t); }
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), new THREE.MeshPhysicalMaterial({ color: "#D7193E", roughness: 0.3, clearcoat: 0.6 })); b.scale.set(1, 1.2, 1); b.position.set(-0.6 + i * 0.4, 0.38, 0.62 - (i % 2) * 0.1); g.add(b); }
      for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 24), new THREE.MeshStandardMaterial({ color: "#F6E7B4", roughness: 0.6 })); b.position.set(-0.4 + i * 0.4, 0.33, -0.65); g.add(b); }
      break;
    }
    case "pancake": {
      g.add(plate(1.1));
      for (let i = 0; i < 3; i++) { const pc = new THREE.Mesh(new THREE.CylinderGeometry(0.72 - i * 0.02, 0.74 - i * 0.02, 0.17, 64), new THREE.MeshStandardMaterial({ color: i % 2 ? "#E8B163" : p.color, roughness: 0.7 })); pc.position.y = 0.18 + i * 0.17; g.add(pc); }
      const honey = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.66, 0.05, 64), new THREE.MeshPhysicalMaterial({ color: p.accent, roughness: 0.08, clearcoat: 1, emissive: "#7A3A00", emissiveIntensity: 0.2 }));
      honey.position.y = 0.62; g.add(honey);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.18 + (i % 3) * 0.08, 6, 12), honey.material); d.position.set(Math.cos(a) * 0.7, 0.5 - (i % 3) * 0.04, Math.sin(a) * 0.7); g.add(d); }
      const butter = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.14, 0.26, 2, 0.03), new THREE.MeshStandardMaterial({ color: "#FFE58A", roughness: 0.4 }));
      butter.position.y = 0.72; butter.rotation.y = 0.5; g.add(butter);
      break;
    }
    case "sundae": {
      g.add(new THREE.Mesh(lathe([[0.001, -1.1], [0.32, -1.1], [0.1, -1.0], [0.07, -0.55], [0.3, -0.4], [0.55, -0.1], [0.62, 0.2]]), glassMat()));
      g.add(liquid(0.22, 0.52, -0.4, -0.05, p.accent));
      const a = makeScoop({ slug: "qashta", color: p.color }, 0.44, 0.2); a.position.set(-0.2, 0.12, 0); g.add(a);
      const b = makeScoop({ slug: "pistachio", color: p.accent }, 0.42, 0.9); b.position.set(0.22, 0.14, 0.05); g.add(b);
      const w = whipped(0.36, 0.42); w.position.set(0, 0.42, 0); g.add(w);
      g.add(drizzle(0.38, 0.38, "#3B2213", false, 0.4));
      const c = cherry(); c.position.y = 0.92; g.add(c);
      break;
    }
    case "softserve":
    case "softserve-cup": {
      const base = makeBase(p.look === "softserve-cup" ? "CUP" : "CONE"); g.add(base);
      const pts: THREE.Vector3[] = [];
      const turns = 4.2, N = 260;
      for (let i = 0; i <= N; i++) { const t = i / N, a = t * Math.PI * 2 * turns, r = 0.5 * (1 - t) ** 0.85 + 0.03; pts.push(new THREE.Vector3(Math.cos(a) * r, 0.18 + t * 1.25, Math.sin(a) * r)); }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.TubeGeometry(curve, 400, 0.17, 24, false);
      const pos = tube.attributes.position as THREE.BufferAttribute, cols = new Float32Array(pos.count * 3);
      const c1 = new THREE.Color(p.color), c2 = new THREE.Color(p.accent);
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const a = Math.atan2(v.z, v.x) + v.y * 3; const k = Math.sin(a * 2) > 0 ? 1 : 0; const c = c1.clone().lerp(c2, k); cols.set([c.r, c.g, c.b], i * 3); }
      tube.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      // scale tube radius down towards the tip
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); const t = (v.y - 0.18) / 1.25; const ax = curve.getPointAt(Math.min(1, Math.max(0, t))); const k = 1 - 0.55 * Math.max(0, t); pos.setXYZ(i, ax.x + (v.x - ax.x) * k, v.y, ax.z + (v.z - ax.z) * k); }
      tube.computeVertexNormals();
      const m = new THREE.Mesh(tube, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffffff"), clearcoat: 0.15 }));
      m.castShadow = true; g.add(m);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshPhysicalMaterial({ color: c2, roughness: 0.5, sheen: 1 })); tip.scale.set(1, 1.6, 1); tip.position.y = 1.47; g.add(tip);
      break;
    }
    case "cupcake": {
      const liner = lathe([[0.001, -0.5], [0.42, -0.5], [0.56, 0.12]], 48);
      const lp = liner.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), z = lp.getZ(i); const a = Math.atan2(z, x), k = 1 + 0.05 * Math.sign(Math.sin(a * 24)); lp.setX(i, x * k); lp.setZ(i, z * k); }
      liner.computeVertexNormals();
      g.add(new THREE.Mesh(liner, new THREE.MeshStandardMaterial({ color: p.accent, roughness: 0.6, side: THREE.DoubleSide })));
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.6, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.85 }));
      top.scale.set(1, 0.75, 1); top.position.y = 0.1; g.add(top);
      g.add(sprinkleOn((u, vv) => { const a = u * 6.28, r = vv * 0.5; return new THREE.Vector3(Math.cos(a) * r, 0.1 + 0.45 * Math.sqrt(Math.max(0, 1 - (r / 0.6) ** 2)), Math.sin(a) * r); }, ["#3B2213", "#2B140B"], 40, 0.045, 5));
      break;
    }
    case "croissant": {
      const mat = new THREE.MeshPhysicalMaterial({ color: p.color, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.4 });
      for (let i = -3; i <= 3; i++) {
        const t = i / 3, s = 0.42 * (1 - Math.abs(t) * 0.55);
        const seg = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), mat);
        seg.scale.set(0.24, s, s * 1.05);
        const a = t * 1.1; seg.position.set(Math.sin(a) * 0.9, s * 0.8, -Math.cos(a) * 0.9 + 0.9); seg.rotation.y = -a;
        g.add(seg);
      }
      if (p.accent && p.accent !== p.color) g.add(sprinkleOn((u) => new THREE.Vector3(-0.7 + u * 1.4, 0.75 + Math.sin(u * 3) * 0.02, 0.05), [p.accent], 18, 0.04, 9));
      break;
    }
    case "donut": {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.28, 32, 64), new THREE.MeshStandardMaterial({ color: "#D99A4E", roughness: 0.7 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.28; g.add(ring);
      const glaze = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.285, 32, 64, Math.PI * 2), new THREE.MeshPhysicalMaterial({ color: p.color, roughness: 0.25, clearcoat: 0.9 }));
      glaze.rotation.x = Math.PI / 2; glaze.position.y = 0.33; glaze.scale.set(1, 1, 0.75); g.add(glaze);
      g.add(sprinkleOn((u, vv) => { const a = u * 6.28, r = 0.4 + vv * 0.3; return new THREE.Vector3(Math.cos(a) * r, 0.6, Math.sin(a) * r); }, [p.accent, "#FFFFFF", "#43A047", "#1E88E5"], 60, 0.03, 4));
      break;
    }
    case "cookie": {
      const ck = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.78, 0.18, 48, 2), new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.9 }));
      const cp = ck.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < cp.count; i++) { const y = cp.getY(i); if (y > 0) cp.setY(i, y + 0.04 * noise.noise(cp.getX(i) * 4, 1, cp.getZ(i) * 4)); }
      ck.geometry.computeVertexNormals(); ck.position.y = 0.1; g.add(ck);
      g.add(sprinkleOn((u, vv) => { const a = u * 6.28, r = vv * 0.62; return new THREE.Vector3(Math.cos(a) * r, 0.2, Math.sin(a) * r); }, [p.accent], 16, 0.09, 8));
      break;
    }
    case "tub":
    default: {
      const label = canvasTex(1024, 256, (c) => { c.fillStyle = "#FFC21A"; c.fillRect(0, 0, 1024, 256); c.fillStyle = "#0B1020"; c.fillRect(0, 70, 1024, 116); c.fillStyle = "#FFC21A"; c.font = "bold 64px Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ICE BEE", 256, 128); c.fillText("ICE BEE", 768, 128); });
      g.add(new THREE.Mesh(lathe([[0.001, -0.6], [0.62, -0.6], [0.74, 0.35]]), new THREE.MeshPhysicalMaterial({ map: label, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide })));
      const surf = new THREE.Mesh(new THREE.CircleGeometry(0.72, 64), new THREE.MeshPhysicalMaterial({ color: p.color, roughness: 0.6, sheen: 0.8 }));
      surf.rotation.x = -Math.PI / 2; surf.position.y = 0.3; g.add(surf);
      const a = makeScoop({ slug: "qashta", color: p.color }, 0.36, 0.5); a.position.set(-0.22, 0.42, 0.05); g.add(a);
      const b = makeScoop({ slug: "pistachio", color: p.accent }, 0.33, 1.4); b.position.set(0.26, 0.4, -0.08); g.add(b);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.08, 64), new THREE.MeshPhysicalMaterial({ color: "#FFC21A", roughness: 0.3, clearcoat: 0.8 }));
      lid.position.set(-0.9, -0.1, -0.5); lid.rotation.set(Math.PI / 2.6, 0, 0.3); g.add(lid);
      break;
    }
  }
  return g;
}
