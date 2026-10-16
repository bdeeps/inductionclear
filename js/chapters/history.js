// Chapter 6: how induction got into the kitchen (models are generic, not any maker's design).
// Dates (see history.json for sources): Faraday's ring, 29 August 1831; eddy currents studied by Foucault
// in the 1850s; Kjellin's induction furnace at Gysinge, Sweden, 1899–1900 (his obituary says 1899);
// Northrup's high-frequency furnace c. 1914–1918 (US); induction-cooking patents: Arthur Berry (UK, applied
// 1906, published 1907), Simon Hohlfeld (Germany, 1909); Frigidaire (General Motors) demonstration stoves in
// the mid-1950s that boiled water through a sheet of newspaper, never sold; Westinghouse's Cool Top shown
// in 1971 (Houston), Cool Top 2 made 1973–75 at about $1,500, four 1,600 W zones at about 27 kHz; the IGBT
// conceived at GE by B. Jayant Baliga in the late 1970s; Matsushita's first IH rice cooker, 1988;
// India: Go Electric campaign (19 February 2021), EESL's National Efficient Cooking Programme (November
// 2023, 20 lakh induction cooktops planned), BEE star label for induction hobs notified 8 December 2025.
import { THREE, M, box, torus, rod, clamp, approach } from '../kit.js';
import { makeHob, makePan, spiral, copperMat, fitNarrow, inReel, TAU, link } from '../induction.js';

const STOPS = [
  { v: 'ring', year: '1831', x: -12, t: 'Faraday’s ring', d: 'Michael Faraday winds two coils on one iron ring. Switching one on makes a brief current in the other: induction.' },
  { v: 'furnace', year: '1899', x: -7.2, t: 'Melting metal by induction', d: 'In Sweden, F. A. Kjellin builds an induction furnace for steel. Later, E. F. Northrup’s high-frequency furnace (USA, c. 1914–18) melts metal in a crucible inside a coil.' },
  { v: 'paper', year: 'c. 1956', x: -2.4, t: 'Boiling water through newspaper', d: 'Frigidaire, part of General Motors, tours a demonstration stove that boils a pot of water with a sheet of newspaper between it and the hob. It is never sold.' },
  { v: 'cooltop', year: '1971', x: 2.4, t: 'An early induction range', d: 'Westinghouse shows its Cool Top in 1971. The Cool Top 2, made from 1973 to 1975, cost about $1,500 and ran four 1,600 W zones at about 27 kHz.' },
  { v: 'rice', year: '1988', x: 7.2, t: 'Rice cookers and cheaper switches', d: 'Matsushita (now Panasonic) sells the first induction rice cooker in Japan. Fast, cheap IGBT switches, conceived at GE by India-born B. Jayant Baliga, make home units affordable.' },
  { v: 'india', year: '2020s', x: 12, t: 'India’s single-zone hob', d: 'Countertop hobs of 1.2–2 kW spread across India. The government’s Go Electric campaign (2021) and EESL’s cooking programme (2023) push electric cooking; BEE’s star label follows.' },
];
const VIEW = { pos: [0, 5.2, 18.5], target: [0, 1.8, 0] };

export default {
  id: 'history',
  short: 'How it got here',
  title: 'From a ring of iron to your kitchen',
  subtitle: 'Induction melted steel for decades before anyone cooked dal with it.',
  view: VIEW,
  learn: `<p>Induction began with <b>Michael Faraday</b> in 1831, who found that a changing magnetic field makes a current in a nearby wire. By 1900 engineers in Sweden and later the USA were using it to <b>melt steel</b>: put the metal inside a coil and its own eddy currents heat it.</p>
    <p>Cooking with it was patented early in the 1900s, and in the 1950s <b>Frigidaire</b> showed a stove that boiled water through a sheet of newspaper. One of the first induction ranges you could buy was <b>Westinghouse's Cool Top</b>, shown in 1971. It was expensive because its power switches were.</p>
    <p>What changed was the switch. The <b>IGBT</b>, conceived in the late 1970s by India-born engineer <b>B. Jayant Baliga</b> at General Electric, made fast, tough, cheap switching possible. In 1988 Japan got the first <b>induction rice cooker</b>. Today a single-zone hob is a common sight in Indian kitchens, and government programmes push electric cooking. ${link('pressurecookerclear', 'PressureCookerClear')} shows the other great Indian kitchen machine, and it works on a hob if its base is magnetic.</p>
    <p class="tip"><b>Try it:</b> step through the stops and look at what each one heats.</p>`,
  terms: [
    { t: 'Induction furnace', d: 'A furnace that melts metal with eddy currents from a coil around the crucible.' },
    { t: 'Cool Top', d: 'Westinghouse’s induction range of the early 1970s, one of the first sold for homes.' },
    { t: 'IH rice cooker', d: 'A rice cooker whose inner pot is heated by induction instead of a hot plate.' },
  ],
  defaults: { stop: 'ring' },
  controls: [
    { key: 'stop', type: 'seg', label: 'Stop', options: STOPS.map((s) => ({ v: s.v, label: s.year })), fmt: (v) => (STOPS.find((s) => s.v === v) || STOPS[0]).t },
  ],
  quiz: [
    { q: 'What was induction heating used for long before cooking?', options: ['Melting and heating metals in industry', 'Lighting streets', 'Radio', 'Refrigerators'], answer: 0, why: 'Induction furnaces melted steel from about 1900. Kitchens came much later.' },
    { q: 'Frigidaire’s 1950s demonstration boiled water with what between the pot and the hob?', options: ['A sheet of ice', 'A sheet of newspaper', 'A wooden board', 'Nothing'], answer: 1, why: 'Paper is not heated by the field, and the hob stays cool, so the paper does not burn.' },
    { q: 'Which invention made home induction hobs cheap?', options: ['The vacuum tube', 'Fast, low-cost power switches such as the IGBT', 'Glass-ceramic', 'LPG'], answer: 1, why: 'The hob needs switches that flip tens of thousands of times a second at high current. IGBTs made that cheap.' },
  ],
  reel: [
    { ms: 5200, caption: 'Induction melted steel for seventy years before Westinghouse showed an induction range in 1971.', set: { stop: 'furnace' }, anim: { stop: ['furnace', 'cooltop'] }, view: { pos: [-8.7, 4.0, 4.3], target: [-2.4, 1.6, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const plinths = STOPS.map((s) => { const p = box(4.0, 0.3, 3.4, M.matte(0x2a2e37)); p.position.set(s.x, 0.15, 0); root.add(p); return p; });
    const labels = STOPS.map((s) => stage.label(`<b>${s.year}</b> · ${s.t}`, [s.x, -0.2, 2.0], root));
    const hot = [];
    // 1831: iron ring with two coils.
    { const ring = torus(1.0, 0.18, M.metal(0x6d7380, { roughness: 0.55 })); ring.position.set(STOPS[0].x, 1.6, 0); root.add(ring);
      for (const a of [Math.PI, 0]) { const c = new THREE.Group(); for (let i = 0; i < 9; i++) { const t = torus(0.24, 0.035, copperMat()); const b = a - 0.5 + (i / 8) * 1.0; t.position.set(Math.cos(b) * 1.0, Math.sin(b) * 1.0, 0); t.rotation.y = Math.PI / 2; t.rotation.x = b; c.add(t); } c.position.set(STOPS[0].x, 1.6, 0); root.add(c); } }
    // 1899: a crucible inside a coil, with glowing metal.
    { const x = STOPS[1].x; const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.55, 1.6, 32, 1, true), M.matte(0x8a6a50, { side: THREE.DoubleSide })); cr.position.set(x, 1.3, 0); root.add(cr);
      const melt = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.3, 32), M.glow(0xff8a3a)); melt.position.set(x, 1.6, 0); root.add(melt); hot.push(melt);
      for (let i = 0; i < 7; i++) { const t = torus(0.95, 0.07, copperMat()); t.rotation.x = Math.PI / 2; t.position.set(x, 0.65 + i * 0.22, 0); root.add(t); } }
    // c. 1956: hob, newspaper, pot.
    { const x = STOPS[2].x; const hb = box(3.0, 0.5, 2.4, M.plastic(0xe9e6dc)); hb.position.set(x, 0.55, 0); root.add(hb);
      const paper = box(2.6, 0.02, 2.0, M.matte(0xe8e2cf)); paper.position.set(x, 0.82, 0); paper.rotation.y = 0.15; root.add(paper);
      for (let i = 0; i < 6; i++) { const ln = box(1.0, 0.005, 0.06, M.matte(0x55524a)); ln.position.set(x - 0.6 + (i % 2) * 1.2, 0.835, -0.7 + Math.floor(i / 2) * 0.5); ln.rotation.y = 0.15; root.add(ln); }
      const pot = makePan({ r: 0.9, h: 0.9, handle: false }); pot.group.position.set(x, 0.84, 0); pot.setWater(0.6); pot.outerMat.color.setHex(0x2b2b30); root.add(pot.group); hot.push(pot); }
    // 1971: a generic four-zone range top.
    { const x = STOPS[3].x; const rng = box(3.4, 1.0, 2.8, M.plastic(0xd9d4c7)); rng.position.set(x, 0.8, 0); root.add(rng);
      const top = box(3.2, 0.06, 2.6, M.clear(0xe6e2d6, 0.9, { depthWrite: true })); top.position.set(x, 1.33, 0); root.add(top);
      for (const [dx, dz] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]]) { const r = torus(0.55, 0.02, M.glow(0x6a7080)); r.rotation.x = Math.PI / 2; r.position.set(x + dx, 1.37, dz); root.add(r); }
      const pot = makePan({ r: 0.55, h: 0.6, handle: false }); pot.group.position.set(x - 0.8, 1.37, 0.6); root.add(pot.group); hot.push(pot); }
    // 1988: a generic rice cooker, cut open to show the coil under the inner pot.
    { const x = STOPS[4].x; const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.1, 1.5, 40, 1, false, Math.PI * 0.5, Math.PI * 1.5), M.plastic(0xf2f0e8, { side: THREE.DoubleSide })); body.position.set(x, 1.05, 0); root.add(body);
      const lidm = new THREE.Mesh(new THREE.SphereGeometry(1.22, 32, 12, 0, TAU, 0, Math.PI / 2), M.plastic(0xf2f0e8)); lidm.scale.y = 0.35; lidm.position.set(x, 1.8, 0); root.add(lidm);
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.85, 1.0, 40, 1, true), M.metal(0x9aa3b2, { side: THREE.DoubleSide, emissive: new THREE.Color(0, 0, 0) })); inner.position.set(x, 1.2, 0); root.add(inner); hot.push({ outerMat: inner.material });
      const c = spiral(0.2, 0.85, 6, 0.6, 0.035, copperMat()); c.position.x = x; root.add(c); }
    // 2020s: today's single-zone countertop hob with a pressure-cooker-like pot (generic).
    { const x = STOPS[5].x; const hb = makeHob(); hb.group.scale.setScalar(0.5); hb.group.position.set(x, 0.3, 0); hb.cord.visible = false; root.add(hb.group); hb.setDisplay('8', true);
      const pot = makePan({ r: 0.95, h: 1.1 }); pot.group.position.set(x, 0.3 + 0.65 + 0.01, 0); pot.setWater(0.5); root.add(pot.group); hot.push(pot); }
    const spot = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), M.ghost(0xffb547, 0.18)); spot.rotation.x = -Math.PI / 2; spot.position.y = 0.32; root.add(spot);

    let at = 0, ph = 0, cur = '';
    return {
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, []);
        const i = Math.max(0, STOPS.findIndex((x) => x.v === s.stop));
        at = approach(at, STOPS[i].x, 4, dt);
        spot.position.x = at;
        if (s.stop !== cur) {
          cur = s.stop;
          if (!inReel()) { const v = narrow ? { pos: [STOPS[i].x, 5.0, 11.5], target: [STOPS[i].x, 1.6, 0] } : { pos: [STOPS[i].x * 0.6, 5.0, 13.5], target: [STOPS[i].x * 0.75, 1.6, 0] }; stage.setView(v.pos, v.target, 1.0); }
        }
        labels.forEach((l, k) => { l.visible = !narrow || k === i; l.element.style.opacity = k === i ? 1 : 0.55; });
        ph += dt;
        const g = 0.5 + 0.5 * Math.sin(ph * 3);
        hot.forEach((h, k) => { if (h.isMesh) return; h.outerMat.emissive?.setRGB(0.35 * g, 0.07 * g, 0); });
        plinths.forEach((p, k) => p.material.color.setHex(k === i ? 0x3a3f4b : 0x2a2e37));
      },
      readout: (s) => {
        const st = STOPS.find((x) => x.v === s.stop) || STOPS[0];
        return `<div class="big">${st.year}: ${st.t}</div>${st.d}`;
      },
    };
  },
};
