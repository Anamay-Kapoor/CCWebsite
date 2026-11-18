/*
 * The six "nodes" on the board. `pos` is [x, z] in board units;
 * the CPU sits at the origin, -z is the far edge of the board.
 */
export const PLACES = [
  {
    id: 'bulletin', key: '1', index: '01', name: 'Bulletin', title: 'The Broadcast Tower', sub: 'Updates & announcements',
    blurb: 'Latest updates, straight off the antenna.', kind: 'antenna', pos: [-7, -3.6], ref: 'ANT1',
  },
  {
    id: 'events', key: '2', index: '02', name: 'Events', title: 'The Clock', sub: 'Workshops · talks · contests',
    blurb: "What's running right now, what's queued next, and what we run every semester.", kind: 'clock', pos: [0, -6.4], ref: 'Y1',
  },
  {
    id: 'projects', key: '3', index: '03', name: 'Projects', title: 'The Foundry', sub: 'Things we shipped',
    blurb: 'Things members designed, built and shipped.', kind: 'ram', pos: [7, -3.6], ref: 'U2-U4',
  },
  {
    id: 'stack', key: '4', index: '04', name: 'Verticals', title: 'The Capacitor Bank', sub: 'WebDev · AI/ML · GameDev',
    blurb: 'Where the energy is stored: our verticals and the stack we build with.', kind: 'caps', pos: [-7, 3.6], ref: 'C1-C6',
  },
  {
    id: 'join', key: '5', index: '05', name: 'Join', title: 'The Socket', sub: 'Recruitment 2026–27',
    blurb: 'There is a slot on this board with your name on it.', kind: 'socket', pos: [7, 3.6], ref: 'J1',
  },
  {
    id: 'contact', key: '6', index: '06', name: 'Contact', title: 'The Port', sub: 'Say hello',
    blurb: 'Plug in. Say hello. Pitch a project.', kind: 'port', pos: [0, 6.6], ref: 'J2',
  },
];

export const placeById = (id) => PLACES.find((p) => p.id === id);

export const BOARD = { w: 23, d: 17.5 };

const CPU_HALF = 1.55;
const CHIP_HALF = 1.15;

/*
 * PCB-style route from the CPU edge to a node: straight, a 45° jog, straight.
 * Returns [x, z] points.
 */
export function tracePath([x, z], lane = 0) {
  if (Math.abs(x) >= Math.abs(z)) {
    const sx = Math.sign(x);
    const z0 = z * 0.15 + lane * 0.32;
    const zEnd = z + lane * 0.32;
    const d = Math.abs(zEnd - z0);
    const endX = x - sx * CHIP_HALF;
    const jogX = endX - sx * (0.6 + d);
    return [[sx * CPU_HALF, z0], [jogX, z0], [jogX + sx * d, zEnd], [endX, zEnd]];
  }
  const sz = Math.sign(z);
  const x0 = lane * 0.32 - 0.16;
  return [[x0, sz * CPU_HALF], [x0, z - sz * CHIP_HALF]];
}

/* Deterministic pseudo-random so decorative detail doesn't reshuffle. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const nearPart = (x, z, pad = 1.9) =>
  Math.hypot(x, z) < 2.4 || PLACES.some((p) => Math.abs(p.pos[0] - x) < pad && Math.abs(p.pos[1] - z) < pad);

/* Decorative traces (drawn into the board texture), routed at 0/45/90 degrees. */
export function decorTraces(count = 70, seed = 7) {
  const rnd = seeded(seed);
  const out = [];
  const hw = BOARD.w / 2 - 0.6;
  const hd = BOARD.d / 2 - 1.2;
  let guard = 0;
  while (out.length < count && guard++ < 2000) {
    let x = Math.round((rnd() * 2 - 1) * hw * 4) / 4;
    let z = Math.round((rnd() * 2 - 1) * hd * 4) / 4;
    if (nearPart(x, z)) continue;
    const pts = [[x, z]];
    const steps = 2 + Math.floor(rnd() * 3);
    for (let s = 0; s < steps; s++) {
      const len = 0.5 + Math.round(rnd() * 8) / 4;
      const dir = Math.floor(rnd() * 6);
      const dx = [1, -1, 0, 0, 0.7071, -0.7071][dir];
      const dz = [0, 0, 1, -1, 0.7071, 0.7071][dir] * (dir > 3 && rnd() > 0.5 ? -1 : 1);
      x = Math.max(-hw, Math.min(hw, x + dx * len));
      z = Math.max(-hd, Math.min(hd, z + dz * len));
      pts.push([x, z]);
    }
    out.push(pts);
  }
  return out;
}

/* Arc-length sampler for moving pulses along a polyline. */
export function makeSampler(pts) {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    lens.push(lens[i - 1] + Math.hypot(bx - ax, bz - az));
  }
  const total = lens[lens.length - 1];
  return (t) => {
    const d = (((t % 1) + 1) % 1) * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i++;
    const seg = lens[i] - lens[i - 1] || 1;
    const k = (d - lens[i - 1]) / seg;
    const [ax, az] = pts[i - 1];
    const [bx, bz] = pts[i];
    return [ax + (bx - ax) * k, az + (bz - az) * k];
  };
}
