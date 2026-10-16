// Chapter 4: boil a litre three ways (1 scene unit = 5 cm).
// Energy to heat water: m c ΔT, c = 4,186 J/kg·K. 1 kg from 25 °C to 100 °C is 313,950 J ≈ 314 kJ
// (the same figure as BoilClear). Each cooker puts the same power in (default 2 kW: an Indian induction
// hob's top setting, and about a big LPG burner's heat output as in BoilClear). Time = energy ÷
// (power × efficiency). Efficiencies come in labelled sets (see EFF in induction.js):
// ENERGY STAR (US EPA, 2021), US DOE test measurements (2014), or Indian lab minimums (BEE label for
// induction hobs ≥ 80%, IS 4246 for LPG burners ≥ 68%). Real pots and habits do worse than lab tests.
// Cost: electricity in kWh × tariff; LPG in kg (46 MJ/kg) × cylinder price ÷ 14.2 kg. The tariff and
// cylinder price are user inputs: tariffs vary by state and slab, and cylinder prices change monthly.
// The race is shown time-lapsed, 40× real speed.
import { THREE, M, box, torus, clamp } from '../kit.js';
import { makeHob, makePan, spiral, EFF, eHeat, LPG_J, CYL_KG, fmt0, fmtT, rupees, link, board, panelBg, title, COL, fitNarrow, placeBoards, TAU } from '../induction.js';

const LAPSE = 40;
const VIEW = { pos: [0.4, 8.4, 14.2], target: [0.4, 2.6, 0] };
const WAYS = [
  { id: 'ind', name: 'Induction', col: COL.violet },
  { id: 'coil', name: 'Electric coil', col: COL.red },
  { id: 'gas', name: 'Gas', col: COL.blue },
];
function calc(s) {
  const E = eHeat(s.L, s.T0), set = EFF[s.src] || EFF.es, P = s.P * 1000;
  return WAYS.map((w) => {
    const eta = set[w.id], Ein = E / eta, t = Ein / P;
    const cost = w.id === 'gas' ? (Ein / LPG_J) * (s.cyl / CYL_KG) : (Ein / 3.6e6) * s.tariff;
    const qty = w.id === 'gas' ? `${((Ein / LPG_J) * 1000).toFixed(1)} g LPG` : `${((Ein / 3.6e6) * 1000).toFixed(0)} Wh`;
    return { ...w, name: w.id === 'gas' ? set.gasName : w.name, eta, Ein, t, cost, qty };
  });
}

export default {
  id: 'power',
  short: 'Power and speed',
  title: 'Boil a litre three ways',
  subtitle: 'The same 314 kJ goes into the water each time. What differs is how much is wasted on the way.',
  view: VIEW,
  learn: `<p>Heating 1 litre of water from 25 °C to boiling takes <b>314 kJ</b>: 1 kg × 4,186 J per kg per degree × 75 degrees. That part never changes. The difference between stoves is how much <b>extra</b> they burn to get those 314 kJ into the water.</p>
    <p>A gas flame heats the air around the pot too, and much of it streams past the sides. An electric coil first heats itself and the plate, then passes heat up by touch. Induction makes the heat <b>inside</b> the pan's base, so less escapes. The US <b>ENERGY STAR</b> programme puts induction at about <b>85%</b>, electric coils at 75–80% and gas hobs at about 32%. US government lab tests found smaller gaps. In India, a BEE star label for induction hobs needs at least <b>80%</b> in a lab test, and every LPG burner must reach <b>68%</b> under the BIS standard <b>IS 4246</b>. Indian stoves are tested with a well-fitting pan, so they score far higher than US gas hobs.</p>
    <p>Cost depends on your <b>tariff</b> and your <b>cylinder price</b>, so set your own. Boiling a litre costs under a rupee either way; over a year of meals the gap adds up. ${link('boilclear', 'BoilClear', 'curve')} shows why the water stops at 100 °C however hard you heat it.</p>
    <p class="tip"><b>Try it:</b> start the race, then switch between the sets of figures. Type in your own tariff and cylinder price.</p>`,
  terms: [
    { t: 'Efficiency', d: 'The share of the energy you pay for that ends up in the food or water.' },
    { t: 'Kilowatt-hour (kWh)', d: 'One unit on your electricity bill: 1,000 W for an hour, or 3.6 million joules.' },
    { t: 'Specific heat', d: 'Energy to warm 1 kg by 1 °C. For water it is about 4,186 J.' },
    { t: 'Star label', d: 'BEE’s energy label in India. More stars means less energy for the same job.' },
  ],
  defaults: { L: 1, T0: 25, P: 2, src: 'es', tariff: 7, cyl: 900 },
  controls: [
    { key: 'src', type: 'seg', label: 'Efficiency figures from', options: Object.entries(EFF).map(([v, e]) => ({ v, label: e.label })), fmt: (v) => '' },
    { key: 'L', type: 'range', label: 'Water', min: 0.5, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) + ' L' },
    { key: 'T0', type: 'range', label: 'Starting temperature', min: 10, max: 35, step: 1, fmt: (v) => v + ' °C' },
    { key: 'P', type: 'range', label: 'Power going in (each stove)', min: 1.2, max: 2.0, step: 0.1, fmt: (v) => v.toFixed(1) + ' kW', hint: 'Indian induction hobs are sold at about 1.2 to 2 kW. A big LPG burner gives about 2 kW.' },
    { key: 'tariff', type: 'range', label: 'Your electricity tariff', min: 2, max: 12, step: 0.5, fmt: (v) => '₹' + v.toFixed(1) + ' per unit', hint: 'From your bill. It varies by state and by how many units you use.' },
    { key: 'cyl', type: 'range', label: 'Your 14.2 kg LPG cylinder', min: 400, max: 1400, step: 10, fmt: (v) => '₹' + fmt0(v), hint: 'The price you pay per refill. It changes from month to month.' },
    { key: 'go', type: 'buttons', label: 'Race', items: [{ label: 'Start the race', act: (s, inst) => inst.race() }] },
  ],
  quiz: [
    { q: 'How much energy does it take to heat 1 litre of water from 25 °C to 100 °C?', options: ['About 31 J', 'About 314 kJ', 'About 3.14 MJ', 'It depends on the stove'], answer: 1, why: '1 kg × 4,186 J/kg·K × 75 K = 313,950 J. The stove changes how much extra is wasted, not this.' },
    { q: 'Why is induction more efficient than a gas flame?', options: ['Its electricity is free', 'The heat is made inside the pan’s base, so less escapes into the air', 'It makes water boil below 100 °C', 'It uses microwaves'], answer: 1, why: 'A flame heats the air round the pot and much of it streams away. Induction heats the pan directly.' },
    { q: 'Indian LPG stoves must reach at least 68% efficiency in the BIS test. Why is that higher than the 32% often quoted for US gas hobs?', options: ['Indian LPG is a different gas', 'Different burners and test methods: Indian stoves are tested with a close-fitting pan right over a small, hot flame', 'Indian water boils at a lower temperature', 'It is a typing error'], answer: 1, why: 'Efficiency depends on the burner, the pan and the test. Always check which test a figure comes from.' },
  ],
  reel: [
    { ms: 5600, caption: 'One litre to the boil needs 314 kJ. Induction wastes the least getting it into the pot.', set: { L: 1, T0: 25, P: 2, src: 'es' }, act: (s, inst) => inst.race(), view: { pos: [-4.7, 5.6, 5.4], target: [1.6, 2.2, 0] }, spin: 0 },
    { ms: 5000, caption: 'Indian lab rules: induction hobs at least 80%, LPG burners at least 68%. Real kitchens do worse.', set: { L: 1, T0: 25, P: 2, src: 'in' }, act: (s, inst) => inst.race(), view: { pos: [-4.7, 5.6, 5.4], target: [1.6, 2.2, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const X = [-5.4, 0, 5.4];
    // 1. Induction hob.
    const hob = makeHob(); hob.group.position.x = X[0]; hob.group.scale.setScalar(0.72); root.add(hob.group); hob.cord.visible = false;
    // 2. Electric coil hot plate: a grey box with a black plate and a spiral element that glows.
    const coilBox = box(5.0, 0.9, 4.0, M.plastic(0xd9d4c7)); coilBox.position.set(X[1], 0.45, 0); root.add(coilBox);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.12, 48), M.metal(0x2a2a2e, { roughness: 0.6 })); plate.position.set(X[1], 0.96, 0); root.add(plate);
    const elMat = M.metal(0x3a3a3e, { roughness: 0.5, emissive: new THREE.Color(0, 0, 0) });
    const el = spiral(0.25, 1.35, 4.5, 1.04, 0.07, elMat); el.position.x = X[1]; root.add(el);
    // 3. LPG burner: a steel stove top with a brass burner and a flame ring.
    const stove = box(5.0, 0.6, 4.0, M.metal(0x9aa3b2, { roughness: 0.4 })); stove.position.set(X[2], 0.3, 0); root.add(stove);
    const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.25, 32), M.metal(0xb08d57, { roughness: 0.4 })); burner.position.set(X[2], 0.72, 0); root.add(burner);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; const arm = box(1.8, 0.08, 0.12, M.matte(0x1a1a1a)); arm.position.set(X[2] + Math.cos(a) * 0.9, 1.0, Math.sin(a) * 0.9); arm.rotation.y = -a; root.add(arm); }
    const flameMat = M.glow(0x5aa8ff, { transparent: true, opacity: 0.85 });
    const flames = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; const f = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), flameMat); f.position.set(X[2] + Math.cos(a) * 0.68, 0.98, Math.sin(a) * 0.68); f.rotation.z = -Math.cos(a) * 0.5; f.rotation.x = Math.sin(a) * 0.5; root.add(f); flames.push(f); }
    // The same pot of water on each.
    const pots = X.map((x, i) => { const p = makePan({ r: 1.25, h: 1.4, handle: false }); p.group.position.set(x, [0.94, 1.04, 1.06][i], 0); root.add(p.group); return p; });
    const lT = X.map((x, i) => stage.label('', [x, 3.4, 0], root, 'hot'));
    const lName = X.map((x) => stage.label('', [x, -0.15, 2.4], root));
    const steam = X.map((x) => { const g = new THREE.Group(); g.position.set(x, 2.6, 0); root.add(g); for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), M.ghost(0xffffff, 0.35)); g.add(m); } return g; });

    const S = { rows: calc({ L: 1, T0: 25, P: 2, src: 'es', tariff: 7, cyl: 900 }), t: 0, s: null };
    const bd = board(root, 7.6, 3.0, 900, 356, (g, w, hh) => {
      panelBg(g, w, hh); title(g, `Heat ${S.s ? S.s.L.toFixed(1) : '1.0'} L from ${S.s ? S.s.T0 : 25} °C to boiling`, 22, 38);
      const rows = S.rows, tMax = Math.max(...rows.map((r) => r.t));
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '17px sans-serif'; g.fillText('time to boil', 260, 70); g.fillText('energy used · cost', w - 250, 70);
      rows.forEach((r, i) => {
        const y = 90 + i * 74;
        g.fillStyle = r.col; g.font = 'bold 21px sans-serif'; g.fillText(r.name, 22, y + 26);
        g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '17px sans-serif'; g.fillText(`${Math.round(r.eta * 100)}% gets in`, 22, y + 50);
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(260, y + 8, 340, 30);
        g.fillStyle = r.col; g.fillRect(260, y + 8, 340 * clamp(r.t / tMax, 0, 1), 30);
        g.fillStyle = '#fff'; g.font = 'bold 19px sans-serif'; g.fillText(fmtT(r.t), 270, y + 30);
        g.font = '19px sans-serif'; g.fillText(`${r.qty} · ${rupees(r.cost)}`, w - 250, y + 30);
      });
    }, [1.2, 5.6, -2.6]);

    let race = 0, key = '', ph = 0;
    const api = { race: () => { race = 0; } };
    return {
      ...api,
      update(dt, s) {
        dt = Math.max(0, dt);
        fitNarrow(stage, lName);
        if (!placeBoards(stage, [[bd, [1.6, 5.9, -0.6], 0.95, null, 0.8, -0.86]])) bd.mesh.visible = false;   // the readout carries the same numbers on a wide screen
        const k = JSON.stringify([s.L, s.T0, s.P, s.src, s.tariff, s.cyl]);
        const rows = calc(s);
        if (k !== key) { key = k; S.rows = rows; S.s = { ...s }; bd.redraw(); }
        race += dt * LAPSE;
        const set = EFF[s.src] || EFF.es;
        ph += dt;
        rows.forEach((r, i) => {
          const tEnd = r.t, T = Math.min(100, s.T0 + (100 - s.T0) * clamp(race / tEnd, 0, 1));
          lT[i].element.innerHTML = `${T >= 100 ? 'Boiling' : Math.round(T) + ' °C'} · <b>${fmtT(Math.min(race, tEnd))}</b>`;
          lName[i].element.innerHTML = `${r.name}, ${Math.round(r.eta * 100)}%`;
          pots[i].setWater(0.35 + 0.3 * s.L);
                    steam[i].visible = T >= 98;
          steam[i].children.forEach((m, j) => { const u = (ph * 0.6 + j / 6) % 1; m.position.set(Math.sin(j * 2.1) * 0.5, u * 1.6, Math.cos(j * 1.7) * 0.4); m.scale.setScalar(0.6 + u); m.material.opacity = 0.35 * (1 - u); });
        });
        // Look of each heat source.
        hob.setDisplay(String(Math.round(s.P * 1000)), true);
        pots[0].outerMat.emissive.setRGB(0.3, 0.06, 0);
        elMat.emissive.setRGB(0.9, 0.22, 0.05);
        flames.forEach((f, i) => { f.scale.y = 0.9 + 0.2 * Math.sin(ph * 12 + i); });
        void set;
      },
      readout: (s) => {
        const rows = calc(s), E = eHeat(s.L, s.T0), set = EFF[s.src] || EFF.es, best = [...rows].sort((a, b) => a.cost - b.cost)[0];
        return `<div class="big">${(E / 1000).toFixed(0)} kJ must reach the water</div>
          ${rows.map((r) => `<div class="row"><span>${r.name} (${Math.round(r.eta * 100)}%)</span><b>${fmtT(r.t)} · ${rupees(r.cost)}</b></div>`).join('')}
          <div class="row"><span>Cheapest at your prices</span><b>${best.name}</b></div>
          <small>${set.note} Tariff and cylinder price are yours to set.</small>`;
      },
    };
  },
};
