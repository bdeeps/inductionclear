// Chapter 5: using it safely (1 scene unit = 5 cm).
// Current: I = P ÷ V. 2,000 W at 230 V is 8.7 A (power factor taken as 1). Ratings as in
// ExtensionBoardClear: 6 A (0.75 mm² cord) = 1,380 W, 10 A = 2,300 W, 16 A = 3,680 W at 230 V. Its
// advice: give every heater, kettle, iron and induction hob its own 16 A wall socket. Wall circuits are
// guarded by MCBs sized for the wall wiring (see MCBClear), so an overloaded thin cord may not trip anything.
// Empty pan: a 0.6 kg steel pan (c ≈ 500 J/kg·K, 300 J/K) with 1,700 W reaching it (2 kW × 85%), losing
// about 1.2 W/K to the room, climbs about 5.7 °C a second at first: past 250 °C in under a minute. With
// 30 g of oil (c ≈ 2,000 J/kg·K) it passes refined sunflower oil's smoke point, 232 °C (TadkaClear's
// value), in about 45 s. The sensor under the glass only feels the pan through the glass, so it lags.
// Oil fire: TadkaClear's line: never put water on burning oil; switch off and cover with a metal lid.
// Fields: German BfS: hobs use about 20–100 kHz; they usually stay below ICNIRP's 2010 reference value of
// 27 µT at normal distances; advice: use a pan that covers the zone, keep 5–10 cm from the front edge;
// people with pacemakers or other active implants should ask their doctor. The stray field of a coil falls
// roughly as 1 ÷ r³ once you are a coil's width away (a magnetic dipole): drawn as relative values only.
import { THREE, M, box, tube, clamp, approach } from '../kit.js';
import { makeHob, makePan, coilField, HOB, fmt0, link, board, panelBg, axes, title, COL, fitNarrow, placeBoards, TAU } from '../induction.js';

const SUPPLY = {
  wall16: { label: '16 A wall socket', A: 16 },
  board10: { label: '10 A board', A: 10 },
  board6: { label: '6 A board', A: 6 },
};
const PAN_C = 300, OIL_C = 0.03 * 2000, LOSS = 1.2, SMOKE = 232, ROOM = 30;
const VIEWS = {
  socket: { pos: [2.4, 6.4, 12.6], target: [1.6, 1.4, -0.6] },
  heat: { pos: [1.4, 6.4, 10.4], target: [0.6, 1.8, 0] },
  field: { pos: [4.6, 6.8, 13.2], target: [3.6, 2.2, 0] },
};

export default {
  id: 'safety',
  short: 'Using it safely',
  title: 'Using an induction hob safely',
  subtitle: 'A 2 kW load, a pan that heats in seconds, and a field that fades within a hand’s width.',
  view: VIEWS.socket,
  learn: `<p><b>Give it a proper socket.</b> At 2,000 W the hob draws <b>8.7 A</b> from a 230 V supply. That is fine for a <b>16 A wall socket</b>, but far too much for a thin 6 A extension board, whose cord can quietly overheat without tripping anything. ${link('extensionboardclear', 'ExtensionBoardClear')} and ${link('mcbclear', 'MCBClear')} show why.</p>
    <p><b>The pan heats very fast.</b> With nothing in it, a light steel pan can pass <b>250 °C in under a minute</b>, and two spoons of oil in it start to smoke in under a minute too. Never leave an empty or oiled pan heating unattended. The hob's sensor feels the pan only through the glass, so it reacts late. After you lift a pan, the glass under it stays <b>hot from the pan</b> for a while; many hobs show a warning light.</p>
    <p><b>If oil catches fire:</b> switch the hob off and cover the pan with a metal lid. <b>Never pour water on burning oil</b>: it flashes to steam and throws the burning oil out (see ${link('tadkaclear', 'TadkaClear', 'pop')}). Call the fire service on <b>101</b> or <b>112</b> if it spreads.</p>
    <p><b>Magnetic fields.</b> The field is strongest right at the zone and fades quickly with distance. Germany's radiation protection office (BfS) says hobs usually stay below the international (ICNIRP) reference value of <b>27 µT</b> at normal distances. Its advice: use a pan that covers the zone and stand 5 to 10 cm from the front edge. If you have a <b>pacemaker</b> or other implant, follow your doctor's and the device maker's advice.</p>
    <p><b>Never</b> block the fan vents, open the case or try to get round the pan detection or the overheat cut-out: the inside runs at mains voltage. In India, induction hobs must be certified under <b>IS 302-2-6</b>, and BEE's star label for them becomes compulsory from 1 January 2027.</p>
    <p class="tip"><b>Try it:</b> plug the hob into a 6 A board, then into the wall. Switch on an empty pan and watch the clock.</p>`,
  terms: [
    { t: 'Rated current', d: 'The current a socket, plug or cord is built to carry all day: 6 A, 10 A or 16 A.' },
    { t: 'Smoke point', d: 'The temperature at which an oil starts to smoke and break down. Fire follows if it keeps heating.' },
    { t: 'Residual heat', d: 'Heat left in the glass from a hot pan after the hob or the pan is removed.' },
    { t: 'Reference level', d: 'A safe-exposure screening value set by ICNIRP. Below it, the basic health limits are met.' },
    { t: 'Thermal cut-out', d: 'A protection that switches the hob off when the sensor or the electronics get too hot.' },
  ],
  defaults: { focus: 'socket', supply: 'wall16', P: 2000, contents: 'empty', dist: 10 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'socket', label: 'The socket' }, { v: 'heat', label: 'Hot pans' }, { v: 'field', label: 'The field' }] },
    { key: 'supply', type: 'seg', label: 'Plugged into', options: Object.entries(SUPPLY).map(([v, o]) => ({ v, label: o.label })) },
    { key: 'P', type: 'range', label: 'Hob power', min: 400, max: 2000, step: 100, fmt: (v) => fmt0(v) + ' W' },
    { key: 'contents', type: 'seg', label: 'In the pan', options: [{ v: 'empty', label: 'Nothing' }, { v: 'oil', label: '2 tbsp oil' }] },
    { key: 'go', type: 'buttons', label: 'Hot pan', items: [{ label: 'Switch on and time it', act: (s, inst) => { s.focus = 'heat'; inst.heat(); } }, { label: 'Oil fire: what to do', act: (s, inst) => { s.focus = 'heat'; inst.fire(); } }] },
    { key: 'dist', type: 'range', label: 'You stand from the zone’s edge', min: 2, max: 60, step: 1, fmt: (v) => v + ' cm' },
  ],
  quiz: [
    { q: 'A 2,000 W hob on 230 V draws about…', options: ['0.9 A', '8.7 A', '87 A', '460 A'], answer: 1, why: 'I = P ÷ V = 2,000 ÷ 230 ≈ 8.7 A. That needs a 16 A wall socket, not a thin 6 A board.' },
    { q: 'Oil in a pan on the hob catches fire. What should you do?', options: ['Pour water on it', 'Carry it to the sink', 'Switch off the hob and cover the pan with a metal lid', 'Turn the power up'], answer: 2, why: 'Water flashes to steam under the oil and throws it out. A lid cuts off the air.' },
    { q: 'What happens to the hob’s magnetic field as you step back?', options: ['It stays the same', 'It falls quickly with distance', 'It gets stronger', 'It turns into heat'], answer: 1, why: 'Away from the coil the field falls off roughly with the cube of distance, so a short step back cuts it a lot.' },
  ],
  reel: [
    { ms: 5200, caption: 'At 2 kW the hob draws 8.7 A. Give it a 16 A wall socket, not a thin extension board.', set: { focus: 'socket', P: 2000 }, anim: { supply: ['board6', 'wall16'] }, view: { pos: [2.3, 5.3, 8.9], target: [1.8, 1.6, -0.6] }, spin: 0.05 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const counter = box(16, 0.3, 7, M.matte(0x3d3a36)); counter.position.set(2.5, -0.15, -0.5); root.add(counter);
    const h = makeHob(); root.add(h.group); h.cord.visible = false;
    const pan = makePan({ r: 1.8, h: 1.2 }); pan.group.position.y = HOB.TOP + 0.01; root.add(pan.group); pan.setWater(0);
    const oil = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.04, 48), M.clear(0xf0d77a, 0.7)); oil.position.y = 0.22; pan.group.add(oil);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 0.06, 48), M.metal(0xc9ced8, { roughness: 0.3 })); pan.group.add(lid);
    const fireMat = M.glow(0xff7a2a, { transparent: true, opacity: 0.85 });
    const fire = new THREE.Group(); pan.group.add(fire);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, r = 0.4 + (i % 3) * 0.45; const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.2, 10), fireMat); c.position.set(Math.cos(a) * r, 0.8, Math.sin(a) * r); fire.add(c); }
    // Wall with a 16 A socket and, on the counter, a 6 A board; the cord goes to whichever is chosen.
    const wall = box(16, 7, 0.3, M.matte(0x4a4f5a)); wall.position.set(2.5, 3.2, -4.15); root.add(wall);
    const sock = box(1.3, 1.3, 0.2, M.plastic(0xe9e6dc)); sock.position.set(7.2, 2.4, -3.95); root.add(sock);
    for (const [dx, dy, r] of [[0, 0.3, 0.14], [-0.3, -0.2, 0.1], [0.3, -0.2, 0.1]]) { const hole = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 12), M.matte(0x111111)); hole.rotation.x = Math.PI / 2; hole.position.set(7.2 + dx, 2.4 + dy, -3.84); root.add(hole); }
    const bboard = box(3.0, 0.4, 1.0, M.plastic(0xf2f0e8)); bboard.position.set(7.0, 0.2, 1.2); root.add(bboard);
    for (let i = 0; i < 4; i++) { const sk = box(0.5, 0.02, 0.5, M.plastic(0xdcd8cc)); sk.position.set(5.9 + i * 0.72, 0.41, 1.2); root.add(sk); }
    const boardCord = tube([[8.5, 0.2, 1.2], [9.3, 0.15, 0.2], [9.0, 0.6, -3.0], [7.6, 2.1, -3.9]], 0.05, M.plastic(0xe6e6e6), false, 60); root.add(boardCord);
    const cordMat = M.plastic(0x1a1a1a, { emissive: new THREE.Color(0, 0, 0) });
    const cordWall = tube([[-2.8, 0.5, -2.6], [-1.0, 0.25, -3.6], [4.0, 0.25, -3.8], [6.6, 1.4, -3.95], [7.0, 2.2, -3.9]], 0.07, cordMat, false, 80); root.add(cordWall);
    const cordBoard = tube([[-2.8, 0.5, -2.6], [-2.0, 0.2, -3.2], [3.0, 0.15, -1.4], [5.5, 0.3, 0.6], [5.9, 0.45, 1.2]], 0.07, cordMat, false, 80); root.add(cordBoard);
    const lSup = stage.label('', [7.2, 3.5, -3.8], root, 'hot');
    const lBoard = stage.label('', [7.0, 0.9, 1.8], root);
    const lPan = stage.label('', [0, 3.6, 0], root, 'hot');
    // The field and a distance marker.
    const field = coilField({ a: 1.15, reach: 3.6, floorY: -0.2, opacity: 0.6 }); field.position.y = HOB.TOP - 0.3; root.add(field);
    const person = new THREE.Group(); root.add(person);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 3.6, 6, 16), M.ghost(0x8ef0ff, 0.25)); body.position.y = 2.6; person.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), M.ghost(0x8ef0ff, 0.25)); head.position.y = 5.3; person.add(head);
    const lDist = stage.label('', [0, 0.4, 0], person, 'hot');

    const S = { dist: 10 };
    const fb = board(root, 4.4, 3.0, 600, 410, (g, w, hh) => {
      panelBg(g, w, hh); title(g, 'Field compared with the zone’s edge', 20, 36);
      const ax = axes(g, w, hh, { x0: 76, y0: hh - 60, y1: 70, xMin: 2, xMax: 60, yMax: 1, xTicks: [2, 10, 20, 30, 40, 50, 60], yTicks: [0, 0.5, 1], xFmt: (v) => v + ' cm', yFmt: (v) => Math.round(v * 100) + '%', xLabel: 'distance from the zone’s edge' });
      g.strokeStyle = COL.cyan; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 200; i++) { const d = 2 + (58 * i) / 200, y = rel(d); i ? g.lineTo(ax.X(d), ax.Y(y)) : g.moveTo(ax.X(d), ax.Y(y)); }
      g.stroke();
      g.fillStyle = 'rgba(92,225,169,.18)'; g.fillRect(ax.X(5), ax.y1, ax.X(10) - ax.X(5), ax.y0 - ax.y1);
      g.fillStyle = COL.green; g.font = '16px sans-serif'; g.fillText('BfS: 5–10 cm', ax.X(5) + 4, ax.y1 + 18);
      const d = S.dist; g.fillStyle = '#fff'; g.beginPath(); g.arc(ax.X(d), ax.Y(rel(d)), 9, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '15px sans-serif'; g.fillText('Shape only (≈ 1 ÷ r³ from the coil centre), not a measurement.', 20, hh - 14);
    }, [7.6, 3.6, 0.6]);
    // Relative field, measured from the coil's centre: the zone's edge is ~10 cm from the centre.
    function rel(dcm) { const r0 = 10, r = r0 + dcm, ref = r0 + 2; return Math.pow(ref / r, 3); }

    const st = { T: ROOM, t: 0, on: false, fire: false, lid: 0 };
    let focus = '', key = '', ph = 0;
    const api = {
      heat: () => Object.assign(st, { T: ROOM, t: 0, on: true, fire: false, lid: 0 }),
      fire: () => Object.assign(st, { T: 340, t: 0, on: false, fire: true, lid: 0, ft: 0 }),
    };
    return {
      ...api,
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lBoard]);
        placeBoards(stage, [[fb, [3.6, 7.6, -1.0], 1.0]]);
        if (s.focus !== focus) { focus = s.focus; const v = VIEWS[focus] || VIEWS.socket; if (!document.body.classList.contains('gb-reel')) stage.setView(v.pos, v.target, 1.1); }
        const f = s.focus;
        // Socket.
        const sup = SUPPLY[s.supply] || SUPPLY.wall16, I = s.P / 230, load = I / sup.A;
        const wallOn = s.supply === 'wall16';
        cordWall.visible = wallOn; cordBoard.visible = !wallOn;
        const hot = !wallOn && load > 1;
        ph += dt;
        cordMat.emissive.setRGB(hot ? 0.5 + 0.2 * Math.sin(ph * 4) : 0, hot ? 0.08 : 0, 0);
        lSup.visible = f === 'socket'; lBoard.visible = f === 'socket' && !narrow;
        lSup.element.innerHTML = wallOn ? `16 A wall socket · <b>${Math.round(load * 100)}% of rating</b>` : 'Wall socket';
        lBoard.element.innerHTML = wallOn ? '6 A board, unused' : `${sup.label} · <b class="${load > 1 ? 'no' : ''}">${Math.round(load * 100)}% of rating</b>`;
        // Hot pan.
        const Pin = s.P * 0.85;
        if (st.on) {
          const C = PAN_C + (s.contents === 'oil' ? OIL_C : 0), n = Math.max(1, Math.ceil(dt / 0.02));
          for (let i = 0; i < n; i++) { st.T += ((Pin - LOSS * (st.T - ROOM)) / C) * (dt / n); }
          st.t += dt; if (st.T > 300) st.on = false;
        } else if (!st.fire) st.T = approach(st.T, ROOM, 0.01, dt);
        if (st.fire) { st.ft = (st.ft || 0) + dt; st.lid = clamp((st.ft - 1.2) / 0.8, 0, 1); }
        oil.visible = s.contents === 'oil' || st.fire;
        fire.visible = st.fire && st.lid < 0.98;
        fire.children.forEach((c, i) => { c.scale.set(1 - st.lid, (0.8 + 0.4 * Math.sin(ph * 9 + i)) * (1 - st.lid), 1 - st.lid); });
        lid.visible = st.fire; lid.position.set(0, 1.25 + 3 * (1 - st.lid), 0);
        const glow = clamp((st.T - 100) / 250, 0, 1);
        pan.outerMat.emissive.setRGB(0.6 * glow, 0.12 * glow, 0); pan.wallMat.emissive.setRGB(0.3 * glow, 0.05 * glow, 0);
        h.setDisplay(st.on ? String(Math.round(s.P / 100) / 10) : st.T > 60 ? 'H' : '--', st.on || st.T > 60);
        lPan.visible = f === 'heat';
        lPan.element.innerHTML = st.fire ? (st.lid < 1 ? '<b>Oil fire:</b> hob off, lid on' : 'Lid on: <b>no air, fire out</b>') : `Pan <b>${Math.round(st.T)} °C</b> after ${Math.round(st.t)} s${s.contents === 'oil' && st.T > SMOKE ? ' · <b>oil smoking</b>' : ''}`;
        // Field.
        field.visible = f === 'field'; field.fade(f === 'field' ? 0.4 + 0.5 * Math.abs(Math.sin(ph * 3)) : 0);
        fb.mesh.visible = fb.mesh.visible && f === 'field'; person.visible = f === 'field';
        person.position.set(2.0 + s.dist / 5, 0, 1.0);
        lDist.element.innerHTML = `${s.dist} cm · field <b>${Math.round(rel(s.dist) * 100)}%</b>`;
        if (s.dist !== S.dist || key !== f) { S.dist = s.dist; key = f; fb.redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'heat') {
          const C = PAN_C + (s.contents === 'oil' ? OIL_C : 0), Pin = s.P * 0.85, rate = (Pin - LOSS * 0) / C;
          const tTo = (T) => -(C / LOSS) * Math.log(1 - (LOSS * (T - ROOM)) / Pin);
          const target = s.contents === 'oil' ? SMOKE : 250;
          return `<div class="big">${s.contents === 'oil' ? `Oil smokes after about ${Math.round(tTo(SMOKE))} s` : `Empty pan passes 250 °C in about ${Math.round(tTo(250))} s`}</div>
            <div class="row"><span>Heat into a 0.6 kg steel pan</span><b>${fmt0(Pin)} W</b></div>
            <div class="row"><span>It climbs at first by</span><b>${rate.toFixed(1)} °C every second</b></div>
            <div class="row"><span>Time to ${target} °C</span><b>${Math.round(tTo(target))} s</b></div>
            <small>Never heat an empty or oiled pan unattended. On fire: hob off, metal lid on, never water.</small>`;
        }
        if (s.focus === 'field') {
          return `<div class="big">${s.dist} cm away: ${Math.round(rel(s.dist) * 100)}% of the field at the edge</div>
            <div class="row"><span>ICNIRP reference value (BfS)</span><b>27 µT</b></div>
            <div class="row"><span>BfS advice</span><b>5–10 cm, pan covers the zone</b></div>
            <div class="row"><span>Pacemaker or implant</span><b>ask your doctor</b></div>
            <small>The curve shows how the field fades, not measured values. Hobs usually stay below 27 µT at normal distances (BfS).</small>`;
        }
        const sup = SUPPLY[s.supply] || SUPPLY.wall16, I = s.P / 230, load = I / sup.A;
        return `<div class="big ${load > 1 ? 'no' : ''}">${fmt0(s.P)} W draws ${I.toFixed(1)} A: ${load > 1 ? 'too much for a ' + sup.label : 'fine on a ' + sup.label}</div>
          <div class="row"><span>Rating of the ${sup.label}</span><b>${sup.A} A = ${fmt0(sup.A * 230)} W</b></div>
          <div class="row"><span>Load</span><b class="${load > 1 ? 'no' : ''}">${Math.round(load * 100)}%</b></div>
          <small>${load > 1 ? 'An overloaded cord heats up, and the wall MCB may not trip: it protects the wall wiring, not the board.' : 'Use a 16 A wall socket for heat-making appliances. Never block the vents.'}</small>`;
      },
    };
  },
};
