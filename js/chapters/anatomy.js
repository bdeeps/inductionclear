// Chapter 1: take a generic single-zone countertop hob apart (1 scene unit = 5 cm).
// Power levels: Indian countertop hobs are sold at about 1,200–2,000 W on a 230 V supply. The level
// buttons here step 200 → 2,000 W. Current from the wall I = P ÷ V (power factor taken as 1; a real
// hob draws a little more). Coil current from the simplified coil model (induction.js) with a cast-iron
// pan: P = I² R_pan, so I = √(P ÷ R_pan).
import { THREE, M, exploder, approach } from '../kit.js';
import { makeHob, makePan, eddyRings, coilField, PANS, panR, HOB_F, MAINS, fmt0, link, fitNarrow, inReel, TAU } from '../induction.js';

const LEVELS = [0, 200, 500, 800, 1200, 1600, 2000];
const VIEW = { pos: [7.4, 7.6, 10.8], target: [1.6, 3.0, 0.2] };

export default {
  id: 'anatomy',
  short: 'Inside the hob',
  title: 'Inside an induction hob',
  subtitle: 'A sheet of glass, a flat copper coil, some ferrite and a box of fast electronics.',
  view: VIEW,
  learn: `<p>Lift the black <b>glass-ceramic</b> top off an induction hob and you will not find a heating element. Right under the glass sits a flat spiral <b>coil</b> of copper, wound from many thin strands twisted together (<b>Litz wire</b>). Under the coil, bars of <b>ferrite</b> point outwards like spokes. They steer the magnetic field up into the pan instead of down into the box.</p>
    <p>Below that is the <b>power board</b>. A <b>bridge rectifier</b> turns the 230 V mains into DC. Then fast switches called <b>IGBTs</b>, bolted to a finned <b>heat sink</b>, flip that DC back and forth tens of thousands of times a second through the coil and a <b>capacitor</b>. A <b>fan</b> blows the electronics cool. A <b>temperature sensor</b> presses up against the underside of the glass.</p>
    <p>The last part is not in the box at all: the <b>pan</b>. Its base must be magnetic, usually iron or magnetic steel. It is the pan, not the hob, that gets hot. ${link('faradayclear', 'FaradayClear')} shows the law behind it.</p>
    <p class="tip"><b>Try it:</b> take it apart, then turn the power up and watch the coil current and the eddy currents in the pan.</p>`,
  terms: [
    { t: 'Glass-ceramic', d: 'The tough black top. It hardly expands when heated, so it does not crack from a hot pan.' },
    { t: 'Litz wire', d: 'Wire made of many thin insulated strands twisted together, so high-frequency current flows through all of it.' },
    { t: 'Ferrite', d: 'A magnetic ceramic that guides the coil’s field but does not carry eddy currents itself.' },
    { t: 'Rectifier', d: 'Diodes that let current through one way only, turning AC into DC.' },
    { t: 'IGBT', d: 'Insulated-gate bipolar transistor: a fast electronic switch for high currents and voltages.' },
  ],
  defaults: { explode: 0, level: 5, xray: false },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'exploded'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'level', type: 'seg', label: 'Power level', options: LEVELS.map((w, i) => ({ v: i, label: i ? String(i) : 'Off' })), fmt: (v) => (LEVELS[v] ? fmt0(LEVELS[v]) + ' W' : 'off') },
    { key: 'xray', type: 'toggle', label: 'See-through glass and pan' },
  ],
  quiz: [
    { q: 'What gets hot first on an induction hob?', options: ['A red-hot wire under the glass', 'The glass top', 'The base of the pan itself', 'The fan'], answer: 2, why: 'The coil’s changing field drives currents inside the pan’s base, and they heat it. The glass only warms up from the hot pan.' },
    { q: 'What are the ferrite bars under the coil for?', options: ['To hold the glass up', 'To guide the magnetic field up into the pan', 'To store electricity', 'To make the hob heavier'], answer: 1, why: 'Ferrite is magnetic but a poor conductor, so it steers the field upwards without heating up itself.' },
    { q: 'Why does a hob need a fan when the coil is not a heater?', options: ['To cool the pan', 'To cool the electronics, which lose a few percent of the power as heat', 'To blow steam away', 'It doesn’t need one'], answer: 1, why: 'The switches and coil waste a little power as heat. At 2,000 W, even 5% is 100 W, so the heat sink needs moving air.' },
  ],
  reel: [
    { ms: 5600, caption: 'Under the glass of an induction hob: a flat copper coil, ferrite bars and a box of fast electronics.', set: { level: 5, xray: false }, anim: { explode: [0, 1] }, view: { pos: [6.3, 5.9, 7.6], target: [2.4, 2.8, 0.4] }, spin: 0.4 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const h = makeHob(); root.add(h.group);
    const pan = makePan({ r: 1.9, h: 1.5 }); pan.group.position.y = 1.31; root.add(pan.group);
    pan.outerMat.color.setHex(PANS.steel.col);
    const panTag = new THREE.Group(); pan.group.add(panTag);
    const ed = eddyRings(pan.group, 4, 0.6, 1.6, 0.02);
    const field = coilField({ a: 1.15, reach: 3.2, floorY: -0.25 }); field.position.y = 1.0; root.add(field);
    const fieldTag = new THREE.Group(); root.add(fieldTag);

    const setExplode = exploder([
      { obj: pan.group, off: [0, 3.6, 0] },
      { obj: field, off: [0, 2.1, 0] },
      { obj: h.glass, off: [0, 2.6, 0] },
      { obj: h.sensor, off: [0, 1.9, 0] },
      { obj: h.coil, off: [0, 1.35, 0] },
      { obj: h.ferrite, off: [0, 0.75, 0] },
      { obj: h.pcb, off: [4.6, -0.2, 2.2] },
    ]);
    const L = (t, parent, pos, cls) => stage.label(t, pos, parent, cls);
    const lPan = L('Pan with a magnetic base', pan.group, [2.6, 1.3, 0.6], 'hot');
    const lGlass = L('Glass-ceramic top', h.glass, [-3.4, 1.35, 1.6]);
    const inner = [
      L('Coil of Litz wire', h.coil, [-2.5, 1.0, 1.0], 'hot'),
      L('Ferrite bars', h.ferrite, [2.2, 0.9, 1.2]),
      L('Temperature sensor', h.sensor, [0.25, 1.15, 0.2]),
      L('IGBT switches on a heat sink', h.pcb, [0.9, 1.2, -1.2]),
      L('Rectifier', h.pcb, [-2.5, 0.75, -0.9]),
      L('Resonant capacitor', h.pcb, [-0.6, 0.9, -0.6]),
      L('Fan', h.pcb, [2.5, 1.25, -2.4]),
    ];

    let phase = 0, P = 0, spin = 0;
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [inner[2], inner[4], inner[5], lGlass]);
        setExplode(s.explode);
        inner.forEach((l, i) => { l.visible = s.explode > 0.35 && !(narrow && [2, 4, 5].includes(i)); });
        lGlass.visible = !narrow;
        const target = LEVELS[s.level] || 0;
        P = approach(P, target, 4, dt);
        const k = P / 2000;
        // The field flips 24,000 times a second: shown as a slow pulse.
        phase += dt * 1.6;
        const swing = Math.sin(phase * TAU);
        field.fade(k > 0.01 ? 0.25 + 0.75 * k * Math.abs(swing) : 0);
        ed.mat.opacity = k > 0.01 ? 0.25 + 0.7 * k * Math.abs(swing) : 0;
        ed.rings.forEach((r) => { r.visible = k > 0.01; });
        h.coilMat.emissive.setRGB(0.5 * k * Math.abs(swing), 0.2 * k * Math.abs(swing), 0);
        pan.outerMat.emissive.setRGB(0.35 * k, 0.07 * k, 0);
        spin += dt * (target ? 14 : 0); h.rotor.rotation.z = spin;
        h.setDisplay(target ? String(s.level) : '--', !!target);
        const see = s.xray || s.explode > 0.05;
        h.glassMat.opacity = see ? 0.3 : 0.86; h.glassMat.depthWrite = !see;
        pan.wallMat.transparent = s.xray; pan.wallMat.opacity = s.xray ? 0.35 : 1; pan.wallMat.depthWrite = !s.xray;
      },
      readout: (s) => {
        const W = LEVELS[s.level] || 0;
        if (!W) return '<div class="big">Switched off</div>Pick a power level to start the coil.';
        const Iw = W / MAINS.V, Ic = Math.sqrt(W / panR(PANS.iron));
        return `<div class="big">Level ${s.level}: ${fmt0(W)} W into the pan</div>
          <div class="row"><span>From the wall at 230 V</span><b>${Iw.toFixed(1)} A</b></div>
          <div class="row"><span>Current in the coil (model)</span><b>${Ic.toFixed(1)} A</b></div>
          <div class="row"><span>Field swings back and forth</span><b>${fmt0(HOB_F)} times a second</b></div>
          <small>The field reverses far too fast to see, so it is shown slowed down.</small>`;
      },
    };
  },
};
