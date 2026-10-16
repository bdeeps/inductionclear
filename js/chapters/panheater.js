// Chapter 2: the pan is the heater (1 scene unit = 5 cm; the base layers are drawn thicker).
// The coil's alternating field induces eddy currents in the pan's base (Faraday's law: see FaradayClear,
// whose pickups chapter uses the same numbers). The currents crowd into a skin of depth
// δ = √(2ρ ÷ (ω μ)). For a base much thicker than δ, the heat per square metre for a field H at the
// surface is H² ρ/δ = H² √(π f μ ρ), so a resistive, magnetic metal heats far better at the same coil
// current. At 24 kHz: cast iron δ ≈ 0.23 mm, magnetic 430 steel ≈ 0.18 mm, 304 steel ≈ 2.8 mm,
// aluminium ≈ 0.53 mm, copper ≈ 0.42 mm. Heating relative to cast iron: 430 steel 77%, 304 steel 6%,
// aluminium 1.2%, copper 0.9%. 304's skin depth is larger than a 1–2 mm base, so the thick-base formula
// is only a rough guide for it. Hysteresis adds a little more heat in iron (a minor share above
// saturation; not modelled). Iron stays magnetic up to its Curie point, about 770 °C, far above cooking.
// Coil model (induction.js): N = 20 turns over a 6.5 cm wide ring, H ≈ N I ÷ W with ferrite backing,
// heated area 0.023 m². A clad ("tri-ply") base with a magnetic-steel outer layer heats like that layer,
// since 0.5 mm is about three skin depths.
import { THREE, M, box, clamp, approach } from '../kit.js';
import { makeHob, makePan, eddyRings, ringDots, coilField, PANS, skin, surfR, relHeat, panPower, panR, HOB, fmt0, mm, si, link, board, panelBg, axes, title, COL, fitNarrow, placeBoards, TAU } from '../induction.js';

const KEYS = ['iron', 'steel', 'clad', 'ss304', 'alu', 'copper', 'clay'];
const NAME = { clad: 'Aluminium with a steel plate' };
const mat = (k) => (k === 'clad' ? PANS.steel : PANS[k] || PANS.iron);
const label = (k) => NAME[k] || (PANS[k] || PANS.iron).label;
const BASE_MM = 3;                                // a typical pan base, mm
const VIEW = { pos: [2.6, 4.6, 11.4], target: [2.0, 1.9, 0] };

export default {
  id: 'panheater',
  short: 'The pan is the heater',
  title: 'The pan is the heater',
  subtitle: 'Eddy currents swirl in the pan’s base, squeezed into a skin thinner than a hair’s width in iron.',
  view: VIEW,
  learn: `<p>The coil carries an <b>alternating current</b> that swings back and forth about <b>24,000 times a second</b> (hobs use roughly 20 to 100 kHz). So its magnetic field keeps flipping. A changing field through a piece of metal pushes its electrons round in loops: <b>eddy currents</b>. That is Faraday's law, shown step by step in ${link('faradayclear', 'FaradayClear', 'pickups')}.</p>
    <p>The currents meet the metal's <b>resistance</b>, and that makes heat right inside the base: the pan is the heater. In iron the flipping magnetism also wastes a little energy each cycle (<b>hysteresis</b>), adding a bit more.</p>
    <p>Why not aluminium? At these frequencies the currents crowd into a thin outer layer, the <b>skin depth</b>. In iron, which is magnetic and fairly resistive, that skin is only about <b>0.2 mm</b>, so the current is squeezed into a thin, high-resistance layer and makes lots of heat. Aluminium and copper conduct so well that the same coil current makes under 2% of the heat. The hob notices and refuses to start.</p>
    <p><b>The magnet test:</b> if a fridge magnet sticks firmly to the bottom of a pan, it will work. Many steel pans and pressure cookers have a magnetic steel plate fixed under an aluminium body for exactly this reason.</p>
    <p class="tip"><b>Try it:</b> switch the pan between cast iron and aluminium and watch the skin depth and the heat. Then try the magnet test.</p>`,
  terms: [
    { t: 'Eddy currents', d: 'Loops of current that a changing magnetic field drives round inside a piece of metal.' },
    { t: 'Skin depth', d: 'How deep high-frequency current reaches into a metal. It falls to about a third at this depth.' },
    { t: 'Ferromagnetic', d: 'Strongly magnetic, like iron and some steels. A magnet sticks to it.' },
    { t: 'Hysteresis', d: 'The small energy lost each time a magnetic material is magnetised one way and then the other.' },
    { t: 'Clad base', d: 'A pan base made of layers, such as aluminium for spreading heat with magnetic steel outside for induction.' },
  ],
  defaults: { pan: 'iron', I: 14, f: 24, magnet: false },
  controls: [
    { key: 'pan', type: 'seg', label: 'Pan base', options: KEYS.map((k) => ({ v: k, label: k === 'clad' ? 'Clad' : (PANS[k] || {}).short })), fmt: (v) => label(v) },
    { key: 'I', type: 'range', label: 'Current in the coil', min: 0, max: 25, step: 0.5, ends: ['0 A', '25 A'], fmt: (v) => v.toFixed(1) + ' A' },
    { key: 'f', type: 'range', label: 'Frequency', min: 20, max: 100, step: 1, ends: ['20 kHz', '100 kHz'], fmt: (v) => v + ' kHz', hint: 'Higher frequency thins the skin and heats more, but switching losses rise.' },
    { key: 'magnet', type: 'toggle', label: 'Magnet test' },
  ],
  quiz: [
    { q: 'Why does a cast-iron pan heat well on induction but an aluminium one barely does?', options: ['Aluminium is too light', 'Iron is magnetic and resistive, so its eddy currents crowd into a thin, high-resistance skin and make far more heat', 'Aluminium reflects the field like a mirror', 'Iron conducts electricity better'], answer: 1, why: 'Heat for the same coil current grows as √(f μ ρ). Iron’s high μ and ρ give it about 80 times aluminium’s heating.' },
    { q: 'At 24 kHz, roughly how deep do the eddy currents reach in cast iron?', options: ['About 0.2 mm', 'About 2 cm', 'Right through the pan', 'About 2 m'], answer: 0, why: 'δ = √(2ρ ÷ (ωμ)) ≈ 0.23 mm. Nearly all the heat is made in that thin layer at the bottom.' },
    { q: 'A magnet sticks firmly to the bottom of your steel pressure cooker. What does that tell you?', options: ['It will work on induction', 'It will not work on induction', 'It is made of aluminium', 'It is unsafe'], answer: 0, why: 'A magnet sticks only to ferromagnetic metal like iron or magnetic steel, which is what an induction hob needs.' },
  ],
  reel: [
    { ms: 5200, caption: 'The coil’s field flips 24,000 times a second and drives eddy currents round inside the pan’s base.', set: { pan: 'iron', f: 24, magnet: false }, anim: { I: [4, 14] }, view: { pos: [0.7, 5.3, 5.0], target: [0, 4.0, 0] }, spin: 0.15 },
    { ms: 5200, caption: 'Swap in aluminium and the same current makes about 1% of the heat. The hob refuses to start.', set: { I: 14, f: 24 }, anim: { pan: ['iron', 'alu'] }, view: { pos: [0.7, 5.3, 5.0], target: [0, 4.0, 0] }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    // A cut-away hob: only the glass, coil and ferrite, opened at the front.
    const h = makeHob(); root.add(h.group);
    h.pcb.visible = false; h.tray.visible = false; h.cord.visible = false; h.sensor.visible = false;
    h.glassMat.opacity = 0.35; h.glassMat.depthWrite = false;
    const pan = makePan({ r: 1.9, h: 1.4, cut: true, handle: false }); pan.group.position.y = HOB.TOP + 0.01; root.add(pan.group);
    pan.setWater(0.75);
    const ed = eddyRings(pan.group, 5, 0.5, 1.7, 0.0);
    const dots = ringDots(pan.group, [0.8, 1.3], -0.005, 5, 0xffe08a, 0.05);
    const coilDots = ringDots(root, [0.9, 1.5], HOB.TOP - 0.3, 5, 0x8ef0ff, 0.05);
    const field = coilField({ a: 1.15, reach: 3.0, floorY: -0.2 }); field.position.y = HOB.TOP - 0.3; root.add(field);
    // A fridge magnet for the test: it sticks to the base, or slides off.
    const magnet = box(0.6, 0.45, 0.1, M.plastic(0xd8343a)); root.add(magnet);
    const lMag = stage.label('', [-2.2, 0.2, 2.6], root);
    const lPan = stage.label('', [0.2, 0.3, 2.6], root, 'hot');
    const lEddy = stage.label('Eddy currents in the base', [-2.4, 1.6, 1.6], root);
    const lCoil = stage.label('Coil under the glass', [-2.4, 0.5, 2.4], root);

    // Board: how deep the current reaches, and the heat each base makes at this coil current.
    const S = { k: 'iron', f: 24, I: 14 };
    const bd = board(root, 3.9, 3.22, 620, 512, (g, w, hh) => {
      panelBg(g, w, hh);
      title(g, 'How deep the current reaches', 24, 38);
      const f = S.f * 1e3, cur = mat(S.k), dCur = skin(cur, f);
      const ax = axes(g, w, 300, { x0: 70, x1: w - 26, y0: 262, y1: 64, xMax: BASE_MM, yMax: 1, xTicks: [0, 1, 2, 3], yTicks: [0, 0.5, 1], xFmt: (v) => v + ' mm', yFmt: (v) => Math.round(v * 100) + '%', xLabel: 'depth into the base', yLabel: 'current' });
      // Others, faint.
      for (const k of ['iron', 'ss304', 'alu']) {
        if (k === S.k) continue; const d = skin(PANS[k], f);
        g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.beginPath();
        for (let i = 0; i <= 120; i++) { const z = (BASE_MM * i) / 120, y = Math.exp(-z / (d * 1000)); i ? g.lineTo(ax.X(z), ax.Y(y)) : g.moveTo(ax.X(z), ax.Y(y)); }
        g.stroke();
      }
      if (isFinite(dCur)) {
        g.fillStyle = 'rgba(255,181,71,.25)'; g.strokeStyle = COL.hot; g.lineWidth = 4; g.beginPath(); g.moveTo(ax.X(0), ax.Y(0));
        for (let i = 0; i <= 160; i++) { const z = (BASE_MM * i) / 160; g.lineTo(ax.X(z), ax.Y(Math.exp(-z / (dCur * 1000)))); }
        g.lineTo(ax.X(BASE_MM), ax.Y(0)); g.closePath(); g.fill();
        g.beginPath(); for (let i = 0; i <= 160; i++) { const z = (BASE_MM * i) / 160, y = ax.Y(Math.exp(-z / (dCur * 1000))); i ? g.lineTo(ax.X(z), y) : g.moveTo(ax.X(z), y); } g.stroke();
        const zd = Math.min(BASE_MM, dCur * 1000);
        g.setLineDash([6, 6]); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(ax.X(zd), ax.y1); g.lineTo(ax.X(zd), ax.y0); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; const t = `δ = ${mm(dCur)}`; g.fillText(t, Math.min(ax.X(zd) + 8, w - 26 - g.measureText(t).width), ax.y1 + 22);
      } else { g.fillStyle = COL.red; g.font = 'bold 24px sans-serif'; g.fillText('No free electrons: no current at all', 90, 170); }
      // Heat bars at this coil current.
      const y0 = 330; g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText(`Heat at ${S.I.toFixed(1)} A in the coil`, 24, y0);
      const rows = [['iron', 'Cast iron'], ['steel', 'Magnetic steel'], ['ss304', '304 steel'], ['alu', 'Aluminium'], ['copper', 'Copper']];
      const Pmax = 2500;
      rows.forEach(([k, n], i) => {
        const P = panPower(PANS[k], S.I, f), y = y0 + 18 + i * 32, on = mat(S.k) === PANS[k];
        g.fillStyle = on ? '#fff' : 'rgba(255,255,255,.6)'; g.font = (on ? 'bold ' : '') + '18px sans-serif'; g.fillText(n, 24, y + 19);
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(180, y + 2, w - 300, 22);
        g.fillStyle = on ? COL.hot : 'rgba(255,181,71,.55)'; g.fillRect(180, y + 2, Math.max(2, (w - 300) * clamp(P / Pmax, 0, 1)), 22);
        g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '18px sans-serif'; const t = P >= 10 ? fmt0(P) + ' W' : P.toFixed(1) + ' W'; g.fillText(t, w - 110, y + 19);
      });
    }, [4.75, 2.3, -0.4]);
    bd.mesh.rotation.y = -0.12;

    let phase = 0, key = '', T = 30, magY = 0, magV = 0, magOn = false;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lEddy, lCoil]);
        const tall = placeBoards(stage, [[bd, [0, 6.7, -1.0], 1.2]]) === 'reel';
        const p = mat(s.pan), f = s.f * 1e3, P = panPower(p, s.I, f), rel = relHeat(p, f);
        const k = `${s.pan}|${s.f}|${s.I.toFixed(1)}`;
        if (k !== key) { key = k; Object.assign(S, { k: s.pan, f: s.f, I: s.I }); bd.redraw(); }
        const ref = PANS[s.pan] ? PANS[s.pan] : PANS.alu;
        pan.outerMat.color.setHex(s.pan === 'clad' ? PANS.steel.col : p.col);
        pan.coreMat.color.setHex(s.pan === 'clad' ? PANS.alu.col : (s.pan === 'clay' ? p.col : ref.col));
        pan.wallMat.color.setHex(s.pan === 'clay' ? 0xb8643f : s.pan === 'iron' ? 0x2b2b30 : s.pan === 'copper' ? 0xc8773a : 0xb9bec8);
        pan.wallMat.metalness = pan.outerMat.metalness = s.pan === 'clay' ? 0 : 0.9;
        // Show the field slowed down: one swing every ~0.6 s.
        phase += dt * 1.7;
        const swing = Math.sin(phase * TAU), amp = clamp(s.I / 14, 0, 1.6);
        field.fade(amp > 0.02 ? 0.25 + 0.6 * amp * Math.abs(swing) : 0);
        const heat = clamp(P / 2000, 0, 1.2), eAmp = amp * Math.sqrt(clamp(rel, 0, 1.5));
        ed.rings.forEach((r) => { r.visible = isFinite(p.rho) && eAmp > 0.01; });
        ed.mat.opacity = clamp(0.15 + 0.85 * eAmp * Math.abs(swing), 0, 1);
        const flow = Math.sign(swing) * dt * 2.5;
        dots.set(-phase * 2.5 * Math.sign(swing), isFinite(p.rho) ? clamp(eAmp, 0, 1.2) : 0);
        coilDots.set(phase * 2.5 * Math.sign(swing), amp > 0.02 ? 1 : 0);
        void flow;
        // The base warms towards a temperature set by the power (shown, not a measurement).
        T = approach(T, 30 + 220 * heat, 0.6, dt);
        const glow = clamp((T - 30) / 220, 0, 1);
        pan.outerMat.emissive.setRGB(0.55 * glow, 0.12 * glow, 0);
        h.coilMat.emissive.setRGB(0.45 * amp * Math.abs(swing), 0.18 * amp * Math.abs(swing), 0);
        // Magnet test: it sticks to the side of the base if the metal is ferromagnetic.
        const sticks = s.pan === 'iron' || s.pan === 'steel' || s.pan === 'clad';
        if (s.magnet && !magOn) { magOn = true; magY = 0; magV = 0; }
        if (!s.magnet) magOn = false;
        magnet.visible = s.magnet;
        if (s.magnet) {
          if (!sticks) { magV += 9.8 * 2 * dt; magY = Math.min(1.4, magY + magV * dt); } else { magY = approach(magY, 0, 8, dt); magV = 0; }
          // Held flat against the front-left of the pan's wall, near the base. Off a non-magnetic pan it drops and tips.
          const th = -0.75, R = 1.9 + 0.08 + (sticks ? 0 : magY * 0.25);
          magnet.position.set(R * Math.sin(th), HOB.TOP + 0.4 - magY * 0.8, R * Math.cos(th));
          magnet.rotation.set(sticks ? 0 : magY * 0.9, th, 0);
        }
        lMag.visible = s.magnet;
        lMag.element.innerHTML = sticks ? 'Magnet <b>sticks</b>: induction-ready' : 'Magnet <b>falls off</b>';
        lPan.element.innerHTML = !isFinite(p.rho) ? `${label(s.pan)} · <b>no current, no heat</b>` : rel < 0.3 ? `${label(s.pan)} · <b>hob won’t start</b>` : `${label(s.pan)} · <b>${fmt0(P)} W</b>`;
        lPan.position.set(tall ? 0 : 0.2, tall ? 3.2 : 0.3, tall ? 0 : 2.6);
        void narrow;
      },
      readout: (s) => {
        const p = mat(s.pan), f = s.f * 1e3, d = skin(p, f), P = panPower(p, s.I, f), rel = relHeat(p, f), R = panR(p, f);
        if (!isFinite(p.rho)) return `<div class="big no">${label(s.pan)}: no eddy currents</div>It has no free electrons to push round, so it stays cold and the hob will not start.`;
        return `<div class="big ${rel < 0.3 ? 'no' : ''}">${rel < 0.3 ? 'Too little heat: the hob refuses' : `${fmt0(P)} W made in the base`}</div>
          <div class="row"><span>Skin depth at ${s.f} kHz</span><b>${mm(d)}</b></div>
          <div class="row"><span>Heat vs cast iron, same coil current</span><b>${(rel * 100).toFixed(rel < 0.1 ? 1 : 0)}%</b></div>
          <div class="row"><span>Resistance the coil “sees”</span><b>${si(R, 'Ω')}</b></div>
          <div class="row"><span>Current for 2 kW</span><b>${R > 0 ? Math.sqrt(2000 / R).toFixed(0) + ' A' : '–'}</b></div>
          <small>${d * 1000 > 2 ? 'The skin is deeper than the base, so this estimate is rough. ' : ''}Heat ∝ √(f μ ρ) at the same coil current. A simplified coil model.</small>`;
      },
    };
  },
};
