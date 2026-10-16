// Shared parts for InductionClear: the physics used in readouts (skin depth, eddy heating, the
// resonant circuit, boiling energy and running costs), a generic single-zone countertop hob, a generic
// pan, chart boards and small layout helpers. +x right, +y up, 1 scene unit = 5 cm unless a chapter says so.
// The board, axes, fitNarrow and reelPlace helpers follow FaradayClear's js/faraday.js so the boxes look alike.
import { THREE, M, box, tube, torus, canvasTexture, clamp } from './kit.js';

// ---------------------------------------------------------------- constants
export const TAU = Math.PI * 2;
export const MU0 = 4e-7 * Math.PI;          // T·m/A
export const MAINS = { V: 230, f: 50 };     // Indian mains: 230 V rms, 50 Hz
export const VDC = MAINS.V * Math.SQRT2;    // 325 V: the peak the bridge rectifier charges the DC bus to
export const C_WATER = 4186;                // J/kg·K
export const LPG_J = 46e6;                  // J/kg, net heat from burning LPG (same as BoilClear)
export const CYL_KG = 14.2;                 // an Indian domestic LPG cylinder holds 14.2 kg
export const HOB_F = 24e3;                  // Hz: FaradayClear's hob frequency. Hobs run at about 20–100 kHz
                                            // (German BfS), most at ~25–50 kHz (ACEEE 2014, via Wikipedia).

// ---------------------------------------------------------------- pan materials
// ρ at room temperature; μr is an effective value for the strong fields under a hob (iron saturates,
// so it is far below the low-field figure). Values match FaradayClear's pickups chapter:
// cast iron ρ ≈ 1.0 × 10⁻⁶ Ω·m, μr ≈ 200; ferritic (magnetic, grade 430) stainless ρ ≈ 6.0 × 10⁻⁷,
// μr ≈ 200; austenitic (grade 304, non-magnetic) stainless ρ ≈ 7.2 × 10⁻⁷, μr ≈ 1; aluminium
// 2.65 × 10⁻⁸; copper 1.68 × 10⁻⁸ (CRC Handbook values at 20 °C).
export const PANS = {
  iron: { label: 'Cast iron', short: 'Cast iron', rho: 1.0e-6, mu: 200, col: 0x2b2b30, magnet: true },
  steel: { label: 'Magnetic steel (430)', short: 'Magnetic steel', rho: 6.0e-7, mu: 200, col: 0x9aa3b2, magnet: true },
  ss304: { label: 'Non-magnetic steel (304)', short: '304 steel', rho: 7.2e-7, mu: 1, col: 0xc4cad3, magnet: false },
  alu: { label: 'Aluminium', short: 'Aluminium', rho: 2.65e-8, mu: 1, col: 0xd3d7dd, magnet: false },
  copper: { label: 'Copper', short: 'Copper', rho: 1.68e-8, mu: 1, col: 0xc8773a, magnet: false },
  clay: { label: 'Clay or glass', short: 'Clay or glass', rho: Infinity, mu: 1, col: 0xb8643f, magnet: false },
};
// Skin depth δ = √(2ρ ÷ (ω μ)): how deep the eddy currents reach (they fall to 37% at δ).
export const skin = (p, f = HOB_F) => (isFinite(p.rho) ? Math.sqrt((2 * p.rho) / (TAU * f * MU0 * p.mu)) : Infinity);
// Surface resistance ρ ÷ δ = √(π f μ ρ). For a thick base and a given field at its surface (set by the
// coil current), the heat per square metre is H² × this. So it compares pans at the same coil current.
export const surfR = (p, f = HOB_F) => (isFinite(p.rho) ? Math.sqrt(Math.PI * f * MU0 * p.mu * p.rho) : 0);
// The coil, as a flat current sheet backed by ferrite: N turns across a ring of radial width W, so the
// field at the pan's surface is about H = N I ÷ W. Heated area A of the ring under the pan.
// N = 20, W = 6.5 cm (r = 2.5–9 cm): a simplified model, not one maker's coil.
export const COIL = { N: 20, W: 0.065, A: Math.PI * (0.09 ** 2 - 0.025 ** 2), Rwire: 0.1 };
export const panPower = (p, I, f = HOB_F) => surfR(p, f) * ((COIL.N * I) / COIL.W) ** 2 * COIL.A;  // W
// The same, seen from the coil's terminals: the pan looks like a resistance R = P ÷ I².
export const panR = (p, f = HOB_F) => surfR(p, f) * (COIL.N / COIL.W) ** 2 * COIL.A;             // Ω
export const relHeat = (p, f = HOB_F) => surfR(p, f) / surfR(PANS.iron, f);

// ---------------------------------------------------------------- the resonant circuit
// Series resonant tank of a half-bridge hob: coil L in series with capacitor C. With an iron pan the
// coil is about 90 µH; with no pan about 110 µH; a non-magnetic pan's eddy currents cancel some flux and
// cut it to about 70 µH. C = 0.27 µF. These are illustrative values in the range used in single-zone
// designs. f0 = 1 ÷ (2π √(LC)) ≈ 32 kHz with the iron pan.
export const TANK = { C: 0.27e-6, L: { pan: 90e-6, none: 110e-6, nonmag: 70e-6 } };
export const tankL = (key) => (key === 'none' || key === 'clay' ? TANK.L.none : PANS[key]?.mu > 1 ? TANK.L.pan : TANK.L.nonmag);
export const tankR = (key) => COIL.Rwire + (key === 'none' || key === 'clay' ? 0 : panR(PANS[key]));
export const f0 = (L, C = TANK.C) => 1 / (TAU * Math.sqrt(L * C));
// A half-bridge swings the coil between 0 and the DC bus, a square wave of ±VDC/2. Its fundamental has
// rms (4/π)(VDC/2)/√2 ≈ 146 V. Power into the tank at drive frequency f: V² R ÷ (R² + X²).
export const V1 = ((4 / Math.PI) * (VDC / 2)) / Math.SQRT2;
export function tankPower(f, L, R, C = TANK.C) { const w = TAU * f, X = w * L - 1 / (w * C); return (V1 * V1 * R) / (R * R + X * X); }
export const quality = (L, R, C = TANK.C) => (TAU * f0(L, C) * L) / R;

// ---------------------------------------------------------------- boiling and money
export const eHeat = (kg, T0, T1 = 100) => kg * C_WATER * (T1 - T0);
// Efficiency sets (share of the energy put in that ends up in the water), labelled by source:
//  ENERGY STAR (US EPA), Emerging Technology Award 2021, residential induction cooking tops:
//    induction about 85%, electric resistance 75–80% (77.5% used), gas about 32%.
//  US DOE test-procedure measurements, Federal Register 79(232), 3 December 2014 (as summarised on
//    Wikipedia's "Induction cooking"): induction 70.7–73.6% (72% used), electric coil 71.9%, gas 43.9%.
//  India: lab minimums. BEE's star label for countertop induction hobs (Ministry of Power notification
//    of 8 December 2025 under IS 19014:2022; mandatory from 1 January 2027) requires at least 80%.
//    IS 4246 asks every burner of a domestic LPG stove for at least 68% in its pan test. No Indian figure
//    for coil hot plates was found, so ENERGY STAR's is used and labelled.
export const EFF = {
  es: { label: 'ENERGY STAR (US)', ind: 0.85, coil: 0.775, gas: 0.32, gasName: 'Gas (US hob)', note: 'US EPA ENERGY STAR, 2021: induction ≈85%, electric resistance 75–80%, gas ≈32%.' },
  doe: { label: 'US DOE tests', ind: 0.72, coil: 0.719, gas: 0.439, gasName: 'Gas (US hob)', note: 'US DOE test-procedure measurements (2014): induction 70.7–73.6%, coil 71.9%, gas 43.9%.' },
  in: { label: 'Indian lab minimums', ind: 0.80, coil: 0.775, gas: 0.68, gasName: 'LPG (Indian stove)', note: 'BEE star label (induction ≥ 80%) and IS 4246 (LPG burner ≥ 68%) are lab minimums; a real pot does worse. Coil: ENERGY STAR figure.' },
};

// ---------------------------------------------------------------- number formats
export const fmt0 = (v) => Math.round(v).toLocaleString('en-IN');
export function si(v, unit, sig = 2) {
  const a = Math.abs(v);
  if (!isFinite(v)) return '∞ ' + unit;
  if (a < 1e-12) return '0 ' + unit;
  const pre = a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'k'] : a >= 1 ? [1, ''] : a >= 1e-3 ? [1e-3, 'm'] : a >= 1e-6 ? [1e-6, 'µ'] : [1e-9, 'n'];
  const x = v / pre[0], ax = Math.abs(x);
  const d = ax >= 100 ? 0 : ax >= 10 ? Math.max(0, sig - 2) : Math.max(0, sig - 1);
  return `${x.toFixed(d)} ${pre[1]}${unit}`;
}
export const fmtT = (s) => (s < 90 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`);
export const rupees = (v) => '₹' + (v < 10 ? v.toFixed(2) : fmt0(v));
export const mm = (m) => (m * 1000 < 1 ? (m * 1000).toFixed(2) : (m * 1000).toFixed(1)) + ' mm';
export const link = (slug, name, hash = '') => `<a href="https://glassbox.how/${slug}/${hash ? '#' + hash : ''}">${name}</a>`;

// ---------------------------------------------------------------- boards and charts
export const COL = { hot: '#ffb547', cyan: '#8ef0ff', red: '#ff6b5a', green: '#5ce1a9', violet: '#c49bff', grey: '#9aa3b2', blue: '#7aa2ff' };
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function title(g, text, x = 24, y = 40, col = '#fff') { g.fillStyle = col; g.font = 'bold 26px sans-serif'; g.fillText(text, x, y); }
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '' }) {
  const X = (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 12);
  return { X, Y, x0, x1, y0, y1 };
}
export function dot(g, x, y, col, r = 9) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }

// ---------------------------------------------------------------- layout
export const inReel = () => document.body.classList.contains('gb-reel');
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -0.12 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen. In the tall reel they move to `reelPos`; on a phone
// (where the readout covers the top of the stage) to `phonePos` below the model, or they hide.
export function placeBoards(stage, boards) {
  const reel = inReel(), phone = !reel && stage.host.clientWidth < 560;
  boards.forEach(([b, pos, scale = 1.2, phonePos = null, phoneScale = 0.8, reelRot = 0]) => {
    if (!b.home) b.home = { p: b.mesh.position.clone(), r: b.mesh.rotation.y };
    b.mesh.visible = !phone || !!phonePos;
    if (reel) { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); b.mesh.rotation.y = reelRot; }
    else if (phone && phonePos) { b.mesh.position.set(...phonePos); b.mesh.scale.setScalar(phoneScale); b.mesh.rotation.y = 0; }
    else { b.mesh.position.copy(b.home.p); b.mesh.scale.setScalar(1); b.mesh.rotation.y = b.home.r; }
  });
  return reel ? 'reel' : phone ? 'phone' : '';
}

// ---------------------------------------------------------------- parts
// A flat spiral (the coil) in the XZ plane at height y, from radius r0 to r1 with n turns.
export function spiral(r0, r1, n, y, wire, mat) {
  const pts = [], N = Math.round(n * 48);
  for (let i = 0; i <= N; i++) { const t = i / N, a = t * n * TAU, r = r0 + (r1 - r0) * t; pts.push([r * Math.cos(a), y, r * Math.sin(a)]); }
  return tube(pts, wire, mat, false, N);
}
export const copperMat = () => M.metal(0xc8773a, { roughness: 0.32, emissive: new THREE.Color(0, 0, 0) });

// A generic single-zone countertop hob, about 36 × 28 × 6 cm (7.2 × 5.6 × 1.2 units), its cooking
// zone centred at the origin, its glass top at y = TOP. No maker's styling: a plain black glass slab on
// a grey tray with a touch strip along the front (+z).
export const HOB = { w: 7.2, d: 5.6, TOP: 1.3, zone: 0, coilR0: 0.5, coilR1: 1.8 };
export function makeHob() {
  const g = new THREE.Group();
  const P = {};
  const trayMat = M.plastic(0x3a3f4a, { roughness: 0.55 });
  P.tray = new THREE.Group(); g.add(P.tray);
  const floor = box(HOB.w, 0.1, HOB.d, trayMat); floor.position.y = 0.15; P.tray.add(floor);
  for (const [w, d, x, z] of [[HOB.w, 0.1, 0, HOB.d / 2 - 0.05], [HOB.w, 0.1, 0, -HOB.d / 2 + 0.05], [0.1, HOB.d, HOB.w / 2 - 0.05, 0], [0.1, HOB.d, -HOB.w / 2 + 0.05, 0]]) {
    const wall = box(w, 1.0, d, trayMat); wall.position.set(x, 0.65, z); P.tray.add(wall);
  }
  // Feet.
  for (const [x, z] of [[-3.1, -2.3], [3.1, -2.3], [-3.1, 2.3], [3.1, 2.3]]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.12, 16), M.matte(0x15171c)); f.position.set(x, 0.06, z); P.tray.add(f); }
  // Vent slots on the back wall (the fan blows out here).
  for (let i = 0; i < 9; i++) { const s = box(0.08, 0.5, 0.02, M.matte(0x101216)); s.position.set(1.4 + i * 0.22, 0.7, -HOB.d / 2 - 0.01); P.tray.add(s); }

  // Glass-ceramic top with the printed zone ring.
  P.glassMat = M.clear(0x101218, 0.86, { roughness: 0.08, metalness: 0.1, depthWrite: true });
  P.glass = new THREE.Group(); g.add(P.glass);
  const top = box(HOB.w, 0.1, HOB.d, P.glassMat); top.position.y = HOB.TOP - 0.05; top.castShadow = false; P.glass.add(top);
  P.ring = torus(1.95, 0.018, M.glow(0x6a7080)); P.ring.rotation.x = Math.PI / 2; P.ring.position.y = HOB.TOP + 0.005; P.glass.add(P.ring);
  // Touch strip and display at the front.
  P.dispState = { text: '', on: false };
  P.disp = canvasTexture(512, 96, (c, W, H) => {
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '30px sans-serif';
    ['−', '+', '⏻'].forEach((t, i) => c.fillText(t, [26, 120, 450][i], 62));
    c.fillStyle = P.dispState.on ? '#ff5a3c' : 'rgba(255,90,60,.25)'; c.font = 'bold 54px monospace';
    const t = P.dispState.text || '--'; c.fillText(t, 290 - c.measureText(t).width / 2, 68);
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.75), new THREE.MeshBasicMaterial({ map: P.disp.tex, transparent: true, toneMapped: false }));
  panel.rotation.x = -Math.PI / 2; panel.position.set(0.4, HOB.TOP + 0.006, 2.35); P.glass.add(panel);
  P.setDisplay = (text, on) => { if (text === P.dispState.text && on === P.dispState.on) return; P.dispState.text = text; P.dispState.on = on; P.disp.redraw(); };

  // Temperature sensor (a thermistor pressed up under the glass, in the middle of the coil).
  P.sensor = new THREE.Group(); g.add(P.sensor);
  const sens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16), M.plastic(0xe9e6dc)); sens.position.y = HOB.TOP - 0.25; P.sensor.add(sens);
  const sTip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), M.metal(0xb9bec8)); sTip.position.y = HOB.TOP - 0.1; P.sensor.add(sTip);

  // The coil: flat spiral of Litz wire on a round holder.
  P.coil = new THREE.Group(); g.add(P.coil);
  P.coilMat = copperMat();
  P.coil.add(spiral(HOB.coilR0, HOB.coilR1, 14, HOB.TOP - 0.3, 0.045, P.coilMat));
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.08, 48), M.plastic(0xd9d4c7)); holder.position.y = HOB.TOP - 0.38; P.coil.add(holder);
  // Ferrite bars underneath, pointing outwards like spokes.
  P.ferrite = new THREE.Group(); g.add(P.ferrite);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2, b = box(1.35, 0.1, 0.24, M.matte(0x2a2c31, { roughness: 0.7 }));
    b.position.set(Math.cos(a) * 1.15, HOB.TOP - 0.47, Math.sin(a) * 1.15); b.rotation.y = -a; P.ferrite.add(b);
  }

  // The electronics board under the coil, towards the back.
  P.pcb = new THREE.Group(); g.add(P.pcb);
  const pcb = box(5.6, 0.06, 2.0, M.matte(0x1f6b45, { roughness: 0.6 })); pcb.position.set(-0.2, 0.32, -1.5); P.pcb.add(pcb);
  // Bridge rectifier, smoothing choke, resonant capacitor, filter capacitor, control chip.
  P.bridge = box(0.5, 0.18, 0.3, M.plastic(0x15161a)); P.bridge.position.set(-2.4, 0.44, -1.2); P.pcb.add(P.bridge);
  P.choke = torus(0.24, 0.1, M.metal(0xc8773a, { roughness: 0.4 })); P.choke.rotation.x = Math.PI / 2; P.choke.position.set(-1.6, 0.46, -1.1); P.pcb.add(P.choke);
  P.capRes = box(0.6, 0.35, 0.3, M.plastic(0xd9b84a)); P.capRes.position.set(-0.6, 0.53, -1.0); P.pcb.add(P.capRes);
  P.capDC = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 20), M.plastic(0x2f5fb3)); P.capDC.position.set(-1.1, 0.58, -2.0); P.pcb.add(P.capDC);
  const chip = box(0.3, 0.06, 0.3, M.plastic(0x111215)); chip.position.set(-2.3, 0.38, -2.0); P.pcb.add(chip);
  // Heat sink with fins, and the IGBT switches clamped to it.
  P.sink = new THREE.Group(); P.pcb.add(P.sink);
  const sinkBase = box(1.6, 0.12, 0.5, M.metal(0xc0c6cf, { roughness: 0.45 })); sinkBase.position.set(0.9, 0.42, -1.5); P.sink.add(sinkBase);
  for (let i = 0; i < 8; i++) { const fin = box(0.04, 0.55, 0.5, M.metal(0xc0c6cf, { roughness: 0.45 })); fin.position.set(0.2 + i * 0.2, 0.75, -1.5); P.sink.add(fin); }
  P.igbt = [];
  for (const x of [0.55, 1.25]) { const q = box(0.36, 0.42, 0.08, M.plastic(0x15161a)); q.position.set(x, 0.66, -1.22); P.sink.add(q); P.igbt.push(q); }
  // Fan behind the heat sink, blowing out of the back vent.
  P.fan = new THREE.Group(); P.fan.position.set(2.1, 0.7, -2.35); P.pcb.add(P.fan);
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 32, 1, true), M.plastic(0x22252c, { side: THREE.DoubleSide })); shroud.rotation.x = Math.PI / 2; P.fan.add(shroud);
  P.rotor = new THREE.Group(); P.fan.add(P.rotor);
  for (let i = 0; i < 7; i++) { const bl = box(0.34, 0.1, 0.02, M.plastic(0x2c3038)); bl.position.x = 0.2; const arm = new THREE.Group(); arm.add(bl); arm.rotation.z = (i / 7) * TAU; bl.rotation.x = 0.5; P.rotor.add(arm); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), M.plastic(0x15161a)); hub.rotation.x = Math.PI / 2; P.rotor.add(hub);
  // Mains cord leaving the back.
  P.cord = tube([[-2.8, 0.5, -2.6], [-2.9, 0.4, -3.4], [-3.1, 0.12, -4.6], [-3.6, 0.1, -6]], 0.08, M.plastic(0x1a1a1a), false, 40);
  g.add(P.cord);
  return { group: g, ...P };
}

// A generic pan: a straight-sided pot of radius r (scene units) with a layered base. Layers from
// the bottom up: outer (the layer the hob "sees"), core, inner. `cut` leaves a quarter open.
export function makePan({ r = 2.0, h = 1.5, cut = false, handle = true } = {}) {
  const g = new THREE.Group();
  const phi = cut ? [Math.PI * 0.5, Math.PI * 1.5] : [0, TAU];
  const outerMat = M.metal(0x9aa3b2, { roughness: 0.38, emissive: new THREE.Color(0, 0, 0), side: THREE.DoubleSide });
  const coreMat = M.metal(0xd3d7dd, { roughness: 0.3, side: THREE.DoubleSide });
  const wallMat = M.metal(0xb9bec8, { roughness: 0.3, side: THREE.DoubleSide, emissive: new THREE.Color(0, 0, 0) });
  const disc = (y, t, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, t, 64, 1, false, ...phi), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const outer = disc(0.04, 0.08, outerMat);
  const core = disc(0.12, 0.08, coreMat);
  const inner = disc(0.18, 0.04, wallMat);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.05, r, h, 64, 1, true, ...phi), wallMat); wall.position.y = h / 2 + 0.05; wall.castShadow = true; g.add(wall);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r + 0.06, 0.04, 8, 64, phi[1]), wallMat); rim.rotation.x = Math.PI / 2; rim.rotation.z = -phi[0] + Math.PI; rim.position.y = h + 0.05; g.add(rim);
  if (cut) { // the cut faces of the base, so the layers show
    for (const a of [phi[0], phi[0] + phi[1]]) {
      const face = new THREE.Group(); face.rotation.y = -a + Math.PI / 2;
      [[0.04, 0.08, outerMat], [0.12, 0.08, coreMat], [0.18, 0.04, wallMat]].forEach(([y, t, m]) => { const p = box(r, t, 0.005, m); p.position.set(r / 2, y, 0); face.add(p); });
      g.add(face);
    }
  }
  let hdl = null;
  if (handle) { hdl = box(2.0, 0.16, 0.34, M.plastic(0x1c1c1f)); hdl.position.set(r + 1.05, h - 0.1, 0); g.add(hdl); }
  const waterMat = M.clear(0x5aa8ff, 0.42, { depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.04, r - 0.04, 1, 64, 1, false, ...phi), waterMat); water.position.y = 0.7; g.add(water);
  const setWater = (depth) => { water.visible = depth > 0.02; water.scale.y = Math.max(0.01, depth); water.position.y = 0.2 + depth / 2; };
  setWater(0.9);
  return { group: g, outer, core, inner, wall, handle: hdl, water, waterMat, outerMat, coreMat, wallMat, setWater, r, h };
}

// Glowing eddy-current rings in the pan base: n rings between r0 and r1 at height y.
export function eddyRings(parent, n, r0, r1, y, color = 0xffb547) {
  const mat = M.glow(color, { transparent: true, opacity: 0.9 });
  const rings = [];
  for (let i = 0; i < n; i++) { const r = r0 + ((r1 - r0) * i) / Math.max(1, n - 1); const t = torus(r, 0.03, mat, 64); t.rotation.x = Math.PI / 2; t.position.y = y; parent.add(t); rings.push(t); }
  return { rings, mat };
}

// Arrow-head dots that run round the coil or the rings (the direction of the current).
export function ringDots(parent, radii, y, n = 6, color = 0xffe08a, size = 0.06) {
  const total = radii.length * n;
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 10, 8), M.glow(color), total);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parent.add(mesh);
  const o = new THREE.Object3D();
  return {
    mesh,
    set(phase, amp = 1) {
      let k = 0;
      for (const r of radii) for (let i = 0; i < n; i++) { const a = phase + (i / n) * TAU; o.position.set(r * Math.cos(a), y, r * Math.sin(a)); o.scale.setScalar(Math.max(0.001, amp)); o.updateMatrix(); mesh.setMatrixAt(k++, o.matrix); }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// Field lines of the coil (a ring current of radius a at the origin, axis +y), traced in one
// half-plane and copied round the axis. Uses the exact loop field from the vector potential, sampled
// numerically. Returns a group; g.fade(k) sets opacity, g.flip(sign) shows the direction.
export function coilField({ a = 1.15, starts = [0.25, 0.55, 0.85, 1.05], copies = 8, reach = 4.2, color = 0x8ef0ff, opacity = 0.55, floorY = -0.6 } = {}) {
  const g = new THREE.Group();
  // Field of a single circular loop by Biot–Savart, summed over 72 segments (relative units).
  const B = (x, y) => {
    let bx = 0, by = 0;
    for (let k = 0; k < 72; k++) {
      const t = (k / 72) * TAU, dt = TAU / 72;
      const px = a * Math.cos(t), pz = a * Math.sin(t), dlx = -a * Math.sin(t) * dt, dlz = a * Math.cos(t) * dt;
      const rx = x - px, ry = y, rz = -pz, r3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5) + 1e-9;
      // dl × r, dl = (dlx, 0, dlz)
      bx += (0 * rz - dlz * ry) / r3; by += (dlz * rx - dlx * rz) / r3;
    }
    return [bx, by];
  };
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  for (const s of starts) {
    const pts = [];
    let x = s, y = 0;
    for (let i = 0; i < 900; i++) {
      pts.push(new THREE.Vector3(x, y, 0));
      const [bx, by] = B(x, y), n = Math.hypot(bx, by) || 1, st = 0.025;
      x += (bx / n) * st; y += (by / n) * st;
      if (i > 20 && Math.abs(y) < 0.02 && x < a) break;
      if (Math.hypot(x, y) > reach || y < floorY) break;
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    for (let k = 0; k < copies; k++) { const l = new THREE.Line(geo, mat); l.rotation.y = (k / copies) * TAU; g.add(l); }
  }
  g.fade = (k) => { mat.opacity = opacity * clamp(k, 0, 1); g.visible = k > 0.01; };
  return g;
}

export { clamp };
