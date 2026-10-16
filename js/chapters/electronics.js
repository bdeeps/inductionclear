// Chapter 3: from the wall socket to a field that flips 30,000 times a second (schematic, not to scale).
// Chain: 230 V, 50 Hz mains → bridge rectifier → DC bus (peak 230 × √2 ≈ 325 V; hobs use a small film
// capacitor here, so the bus ripples at 100 Hz) → two IGBTs in a half-bridge → series resonant tank:
// the coil (with the pan sitting on it) and a capacitor.
// Tank values (illustrative, in the range used in single-zone designs): C = 0.27 µF; coil L ≈ 90 µH with a
// magnetic pan, ≈ 110 µH with none, ≈ 70 µH with a non-magnetic pan (its eddy currents cancel some flux).
// The pan adds the resistance from the coil model in induction.js (cast iron ≈ 9.7 Ω at 24 kHz, here
// scaled with √f), plus 0.1 Ω for the coil wire. Resonance f0 = 1 ÷ (2π √(LC)) ≈ 32 kHz with iron.
// Power: the half-bridge drives a ±162 V square wave whose fundamental is 146 V rms, so
// P = V² R ÷ (R² + (ωL − 1/ωC)²). Driving above resonance turns the power down (and keeps the IGBTs
// switching gently). Peak with iron ≈ 2.2 kW; the controller caps it at the level chosen.
// Pan detection (one common method): send a short test pulse into the tank and watch it ring. A good pan
// soaks up energy fast, so the ringing dies within about a cycle; with no pan, or aluminium, it rings on
// for dozens of cycles. Cycles to fall to 37% ≈ Q ÷ π, where Q = 2π f0 L ÷ R.
import { THREE, M, box, tube, clamp, approach } from '../kit.js';
import { makePan, spiral, copperMat, PANS, panR, COIL, TANK, f0, tankPower, quality, V1, VDC, fmt0, si, board, panelBg, axes, title, COL, fitNarrow, placeBoards, inReel, TAU } from '../induction.js';

const OPTS = [{ v: 'iron', label: 'Cast iron' }, { v: 'steel', label: 'Magnetic steel' }, { v: 'alu', label: 'Aluminium' }, { v: 'none', label: 'No pan' }];
const Lof = (k) => (k === 'none' ? TANK.L.none : PANS[k].mu > 1 ? TANK.L.pan : TANK.L.nonmag);
const Rof = (k, f) => COIL.Rwire + (k === 'none' ? 0 : panR(PANS[k], f));
const fRes = (k) => f0(Lof(k));
const Pcap = 2000;
const VIEW = { pos: [0.6, 4.6, 14.6], target: [0.6, 3.2, 0] };

export default {
  id: 'electronics',
  short: 'The electronics',
  title: 'From the socket to a fast-flipping field',
  subtitle: 'Turn AC into DC, then chop it back into AC a thousand times faster, tuned to the pan.',
  view: VIEW,
  learn: `<p>The mains swings back and forth <b>50 times a second</b>. That is far too slow for induction, so the hob rebuilds it. First a <b>bridge rectifier</b> of four diodes flips every negative half of the wave upwards, giving bumpy <b>DC</b> that peaks at about <b>325 V</b>.</p>
    <p>Then two <b>IGBT</b> switches take turns connecting the coil to the top and bottom of that supply, tens of thousands of times a second. The coil sits in series with a <b>capacitor</b>, and the pair has a natural <b>resonant frequency</b>, like a swing: f = 1 ÷ (2π√(LC)). With these parts it is about 32 kHz. Push the swing near its own rhythm and big currents build up.</p>
    <p><b>Turning it down:</b> drive the switches faster than resonance and less current flows, so less heat. At the lowest settings many hobs switch on and off every few seconds instead. That pulsing is the <b>clicking</b> you may hear. A <b>buzz</b> or whine can come from the layers of a pan's base vibrating in the field, and from the fan.</p>
    <p><b>Is there a pan?</b> The hob sends a short test pulse and listens to the circuit ring. A good iron pan soaks up the energy within a cycle. No pan, or an aluminium one, lets it ring on and on, so the hob flashes a warning and stays off. Everything here runs at mains voltage: the box is not meant to be opened.</p>
    <p class="tip"><b>Try it:</b> slide the drive frequency and watch the power. Then pick “No pan” and send a test pulse.</p>`,
  terms: [
    { t: 'DC bus', d: 'The rectified supply inside the hob, about 325 V at its peak, that the switches chop up.' },
    { t: 'Half-bridge', d: 'Two switches in a stack that connect the coil to the top or bottom of the supply in turn.' },
    { t: 'Resonance', d: 'The frequency at which a coil and capacitor swing energy back and forth most easily.' },
    { t: 'Pan detection', d: 'The hob checks how a pan changes its circuit and only switches on for a suitable one.' },
    { t: 'Q factor', d: 'How long a circuit keeps ringing after a kick. A good pan makes Q small.' },
  ],
  defaults: { pan: 'iron', fd: 36 },
  controls: [
    { key: 'pan', type: 'seg', label: 'On the coil', options: OPTS },
    { key: 'fd', type: 'range', label: 'Drive frequency', min: 20, max: 60, step: 0.5, ends: ['20 kHz', '60 kHz'], fmt: (v) => v.toFixed(1) + ' kHz', hint: 'Above resonance: higher frequency, less power.' },
    { key: 'go', type: 'buttons', label: 'Pan check', items: [{ label: 'Send a test pulse', act: (s, inst) => inst.pulse() }] },
  ],
  quiz: [
    { q: 'What does the bridge rectifier do?', options: ['Raises the voltage to 2,000 V', 'Turns the 50 Hz AC into DC', 'Detects the pan', 'Cools the hob'], answer: 1, why: 'Four diodes send every half of the mains wave the same way, giving DC that peaks at about 325 V.' },
    { q: 'A coil of 90 µH with a 0.27 µF capacitor. Roughly what is its resonant frequency?', options: ['50 Hz', 'About 3 kHz', 'About 32 kHz', 'About 2.4 GHz'], answer: 2, why: 'f = 1 ÷ (2π√(LC)) = 1 ÷ (2π × √(90 × 10⁻⁶ × 0.27 × 10⁻⁶)) ≈ 32,000 Hz.' },
    { q: 'How can a hob tell there is no pan on it?', options: ['A camera under the glass', 'A test pulse rings on for a long time, because nothing soaks up the energy', 'The pan’s weight presses a switch', 'It can’t'], answer: 1, why: 'A good pan acts like a big resistance in the circuit and damps the ringing fast. With no pan the ringing lasts dozens of cycles.' },
  ],
  reel: [
    { ms: 5200, caption: 'Rectify the 50 Hz mains to DC, then chop it back into AC at about 30,000 times a second.', set: { pan: 'iron' }, anim: { fd: [52, 36] }, view: { pos: [0.4, 5.0, 10.9], target: [0.4, 3.6, 0] }, spin: 0.05 },
    { ms: 5000, caption: 'No pan? A test pulse rings on and on, so the hob stays off.', set: { pan: 'none', fd: 36 }, act: (s, inst) => inst.pulse(), view: { pos: [1.2, 5.4, 8.2], target: [1.2, 4.3, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const top = new THREE.Group(); stage.root.add(top);
    const root = new THREE.Group(); top.add(root); root.scale.setScalar(0.76); root.position.set(-0.4, 0, 0);
    const Y = 1.0;
    const bench = box(15.6, 0.16, 3.4, M.matte(0x2a2e37)); bench.position.set(0.6, Y - 0.6, 0); root.add(bench);
    const block = (x, w, hh, col, text, cls) => { const b = box(w, hh, 1.2, M.plastic(col, { roughness: 0.5 })); b.position.set(x, Y - 0.52 + hh / 2, 0); root.add(b); const l = stage.label(text, [x, Y + hh - 0.1, 0.9], root, cls); return { b, l }; };
    // Socket and plug.
    const socket = block(-6.3, 1.4, 1.6, 0xe9e6dc, '230 V, 50 Hz');
    for (const [dx, dy, r] of [[0, 0.35, 0.12], [-0.3, -0.15, 0.08], [0.3, -0.15, 0.08]]) { const hole = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 12), M.matte(0x111111)); hole.rotation.x = Math.PI / 2; hole.position.set(-6.3 + dx, Y + 0.3 + dy, 0.61); root.add(hole); }
    // Bridge rectifier: four diodes in a diamond.
    const bridge = block(-3.6, 1.6, 0.3, 0x1f6b45, 'Bridge rectifier');
    for (const [dx, dz, a] of [[-0.4, -0.25, 0.6], [0.4, -0.25, -0.6], [-0.4, 0.25, -0.6], [0.4, 0.25, 0.6]]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.45, 12), M.plastic(0x15161a)); d.rotation.z = Math.PI / 2; d.rotation.y = a; d.position.set(-3.6 + dx, Y - 0.15, dz); root.add(d); }
    // DC bus capacitor.
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 24), M.plastic(0xd9b84a)); cap.position.set(-1.4, Y, 0); root.add(cap);
    const lCap = stage.label('DC bus 325 V', [-1.6, Y + 0.75, 0.9], root);
    // Two IGBTs on a heat sink.
    const sink = box(1.8, 0.2, 1.2, M.metal(0xc0c6cf, { roughness: 0.45 })); sink.position.set(0.9, Y - 0.42, 0); root.add(sink);
    for (let i = 0; i < 8; i++) { const fin = box(0.05, 0.7, 1.2, M.metal(0xc0c6cf, { roughness: 0.45 })); fin.position.set(0.15 + i * 0.21, Y - 0.0, 0); root.add(fin); }
    const qMat = [M.plastic(0x15161a, { emissive: new THREE.Color(0, 0, 0) }), M.plastic(0x15161a, { emissive: new THREE.Color(0, 0, 0) })];
    [0.45, 1.35].forEach((x, i) => { const q = box(0.5, 0.6, 0.1, qMat[i]); q.position.set(x, Y + 0.05, 0.66); root.add(q); });
    const lQ = stage.label('Two IGBT switches', [1.0, Y + 1.5, 0.6], root, 'hot');
    // Resonant capacitor.
    const rc = box(0.8, 0.5, 0.45, M.plastic(0xd9b84a)); rc.position.set(3.0, Y - 0.2, 0); root.add(rc);
    const lRc = stage.label('Resonant capacitor', [3.0, Y + 0.4, 0.9], root);
    // Coil and pan (smaller than life).
    const CX = 5.9;
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 40), M.plastic(0xd9d4c7)); holder.position.set(CX, Y - 0.35, 0); root.add(holder);
    const cMat = copperMat(); const coil = spiral(0.35, 1.4, 10, Y - 0.26, 0.04, cMat); coil.position.x = CX; root.add(coil);
    const glass = box(3.4, 0.08, 3.0, M.clear(0x101218, 0.45, { depthWrite: false })); glass.position.set(CX, Y - 0.14, 0); root.add(glass);
    const pan = makePan({ r: 1.4, h: 1.0 }); pan.group.position.set(CX, Y - 0.1, 0); pan.setWater(0.6); root.add(pan.group);
    const lCoil = stage.label('Coil + pan', [CX, Y - 0.1, 1.8], root, 'hot');
    // Wires, with dots flowing along them.
    const wireMat = M.plastic(0x8a8f99);
    const path = [[-5.6, Y + 0.3, 0], [-4.4, Y - 0.15, 0], [-2.8, Y - 0.15, 0], [-1.4, Y + 0.5, 0], [0.2, Y + 0.5, 0.66], [1.6, Y + 0.5, 0.66], [3.0, Y + 0.05, 0], [4.5, Y - 0.26, 0]];
    root.add(tube(path, 0.035, wireMat, false, 120));
    const pts = path.map((p) => new THREE.Vector3(...p)), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const LEN = cum.at(-1), ND = 40;
    const dm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), M.glow(0xffe08a), ND); root.add(dm);
    const o = new THREE.Object3D(), dd = Array.from({ length: ND }, (_, i) => (i / ND) * LEN);
    const at = (d) => { let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const k = (d - cum[i - 1]) / (cum[i] - cum[i - 1]); return o.position.copy(pts[i - 1]).lerp(pts[i], k); };

    // One board: the waveforms along the chain on top; below, power against drive frequency or the test pulse.
    const S = { pan: 'iron', fd: 36, pulseT: -1 };
    const bd = board(top, 4.3, 3.94, 640, 586, (g, w, hh) => {
      panelBg(g, w, hh); title(g, 'Mains → DC → fast AC', 20, 34);
      const lanes = [['Mains 50 Hz', COL.grey, (t) => Math.sin(TAU * t * 2)], ['DC bus', COL.hot, (t) => Math.abs(Math.sin(TAU * t * 2))], ['Coil current', COL.cyan, (t) => Math.abs(Math.sin(TAU * t * 2)) * Math.sin(TAU * t * 2 * (S.fd * 1e3) / 50 / 60)]];
      lanes.forEach(([n, c, fn], i) => {
        const top0 = 50 + i * 46, mid = top0 + 18;
        g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif'; g.fillText(n, 20, mid + 5);
        g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(140, mid); g.lineTo(w - 20, mid); g.stroke();
        g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath();
        for (let x = 0; x <= w - 160; x++) { const t = x / (w - 160), y = mid - fn(t) * 17; x ? g.lineTo(140 + x, y) : g.moveTo(140, y); }
        g.stroke();
      });
      g.fillStyle = 'rgba(255,255,255,.4)'; g.font = '13px sans-serif'; g.fillText('40 ms shown; the fast wave is drawn about 60× slower than real.', 20, 200);
      const Y0 = 214, sub = (x0, x1, y0, y1, o) => axes(g, w, hh, { x0, x1, y0, y1, ...o });
      const k = S.pan, L = Lof(k);
      if (S.pulseT >= 0) {
        title(g, 'Pan check: a test pulse rings', 20, Y0 + 30);
        const R = Rof(k, fRes(k)), fr = fRes(k), a = R / (2 * L), wd = Math.sqrt(Math.max(1, (TAU * fr) ** 2 - a * a));
        const span = 1.5e-3, ax = sub(70, w - 24, hh - 56, Y0 + 70, { xMax: span * 1e3, yMin: -1, yMax: 1, xTicks: [0, 0.5, 1, 1.5], yTicks: [-1, 0, 1], xFmt: (v) => v + ' ms', yFmt: (v) => (v ? (v > 0 ? '+' : '−') : '0'), xLabel: 'time after the pulse' });
        const shown = Math.min(span, S.pulseT);
        g.strokeStyle = COL.cyan; g.lineWidth = 2.2; g.beginPath();
        for (let i = 0; i <= 1400; i++) { const t = (span * i) / 1400; if (t > shown) break; const y = Math.exp(-a * t) * Math.sin(wd * t); i ? g.lineTo(ax.X(t * 1e3), ax.Y(y)) : g.moveTo(ax.X(0), ax.Y(0)); }
        g.stroke();
        const cyc = quality(L, R) / Math.PI;
        g.fillStyle = cyc < 5 ? COL.green : COL.red; g.font = 'bold 21px sans-serif';
        g.fillText(cyc < 5 ? 'Dies within a cycle: pan found' : `Rings ~${Math.round(cyc)} cycles: no suitable pan`, 80, Y0 + 62);
        return;
      }
      title(g, 'Power against drive frequency', 20, Y0 + 30);
      const ax = sub(80, w - 24, hh - 56, Y0 + 60, { xMin: 20, xMax: 60, yMax: 2500, xTicks: [20, 30, 40, 50, 60], yTicks: [0, 1000, 2000], xFmt: (v) => v + ' kHz', yFmt: (v) => v / 1000 + ' kW', xLabel: 'drive frequency' });
      g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(ax.X(20), ax.Y(Pcap)); g.lineTo(ax.X(60), ax.Y(Pcap)); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '16px sans-serif'; g.fillText('2 kW limit', ax.X(51), ax.Y(Pcap) - 8);
      g.strokeStyle = COL.hot; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 200; i++) { const f = 20 + (40 * i) / 200, P = Math.min(2500, tankPower(f * 1e3, L, Rof(k, f * 1e3))); i ? g.lineTo(ax.X(f), ax.Y(P)) : g.moveTo(ax.X(f), ax.Y(P)); }
      g.stroke();
      const fr = fRes(k) / 1e3; g.setLineDash([4, 6]); g.strokeStyle = COL.cyan; g.beginPath(); g.moveTo(ax.X(fr), ax.y1); g.lineTo(ax.X(fr), ax.y0); g.stroke(); g.setLineDash([]);
      g.fillStyle = COL.cyan; g.font = '16px sans-serif'; g.fillText(`resonance ${fr.toFixed(1)} kHz`, Math.min(ax.X(fr) + 6, w - 190), ax.y1 + 18);
      const P = Math.min(2500, tankPower(S.fd * 1e3, L, Rof(k, S.fd * 1e3)));
      dot(g, ax.X(S.fd), ax.Y(P), '#fff');
    }, [4.7, 4.75, -0.8]);
    bd.mesh.rotation.y = -0.15;
    function dot(g, x, y, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }

    let key = '', phase = 0, pulse = -1, warm = 0;
    const api = { pulse: () => { pulse = 0; } };
    return {
      ...api,
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lCap, lRc, socket.l, bridge.l]);
        placeBoards(stage, [[bd, [0.4, 6.4, -0.8], 1.55]]);
        const L = Lof(s.pan), R = Rof(s.pan, s.fd * 1e3), cyc = quality(L, R) / Math.PI, ok = s.pan !== 'none' && cyc < 5;
        // The test pulse plays out over 1.5 ms of circuit time, shown across about 2 s.
        if (pulse >= 0) { pulse += dt * 0.75e-3; if (pulse > 3.5e-3) pulse = -1; }
        S.pulseT = pulse >= 0 ? Math.min(pulse, 1.5e-3) : -1;
        const k = `${s.pan}|${s.fd}|${S.pulseT.toFixed(5)}`;
        if (k !== key) { key = k; S.pan = s.pan; S.fd = s.fd; bd.redraw(); }
        const P = ok ? Math.min(Pcap, tankPower(s.fd * 1e3, L, R)) : 0, kk = P / Pcap;
        phase += dt;
        for (let i = 0; i < ND; i++) { dd[i] = (dd[i] + dt * (0.4 + 2.6 * kk)) % LEN; at(dd[i]); o.scale.setScalar(ok ? 1 : 0.001); o.updateMatrix(); dm.setMatrixAt(i, o.matrix); }
        dm.instanceMatrix.needsUpdate = true;
        const sw = Math.sin(phase * TAU * 1.2) > 0;
        qMat[0].emissive.setRGB(ok && sw ? 0.6 * kk : 0, ok && sw ? 0.3 * kk : 0, 0);
        qMat[1].emissive.setRGB(ok && !sw ? 0.6 * kk : 0, ok && !sw ? 0.3 * kk : 0, 0);
        cMat.emissive.setRGB(0.5 * kk, 0.2 * kk, 0);
        warm = approach(warm, kk, 0.8, dt);
        pan.outerMat.emissive.setRGB(0.5 * warm, 0.1 * warm, 0);
        pan.group.visible = s.pan !== 'none';
        pan.outerMat.color.setHex(s.pan === 'none' ? 0x999999 : PANS[s.pan].col);
        lCoil.element.innerHTML = s.pan === 'none' ? 'Coil, <b>no pan</b>' : `Coil + ${PANS[s.pan].short.toLowerCase()} pan`;
        void narrow; void inReel;
      },
      readout: (s) => {
        const L = Lof(s.pan), R = Rof(s.pan, s.fd * 1e3), fr = fRes(s.pan), cyc = quality(L, R) / Math.PI, ok = s.pan !== 'none' && cyc < 5;
        const Pr = tankPower(s.fd * 1e3, L, R), P = Math.min(Pcap, Pr), I = Math.sqrt(P / R);
        const head = !ok ? `<div class="big no">${s.pan === 'none' ? 'No pan: the hob stays off' : 'Pan rejected: rings too long'}</div>` : Pr > Pcap ? `<div class="big">Capped at 2,000 W: drive faster</div>` : `<div class="big">${fmt0(P)} W into the pan</div>`;
        return `${head}
          <div class="row"><span>Resonance, f = 1 ÷ (2π√(LC))</span><b>${(fr / 1000).toFixed(1)} kHz</b></div>
          <div class="row"><span>Coil L · capacitor C</span><b>${Math.round(L * 1e6)} µH · ${TANK.C * 1e6} µF</b></div>
          <div class="row"><span>Test pulse rings for</span><b>${cyc < 1 ? 'under 1 cycle' : '≈ ' + Math.round(cyc) + ' cycles'}</b></div>
          <div class="row"><span>Coil current</span><b>${ok ? I.toFixed(1) + ' A' : '–'}</b></div>
          <small>DC bus ${Math.round(VDC)} V peak; the half-bridge's fundamental is ${Math.round(V1)} V rms. Illustrative part values.</small>`;
      },
    };
  },
};
