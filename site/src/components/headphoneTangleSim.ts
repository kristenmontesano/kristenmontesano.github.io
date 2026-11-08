export const WORLD_W = 600;
export const WORLD_H = 460;

export const POCKET = {
  x: 30,
  y: 24,
  w: 540,
  h: 422,
  hem: 38,
  rTop: 18,
  rBottom: 84,
};

const AREA = { left: 50, right: 550, top: 76, bottom: 428, r: 66 };

const SEG = 8;
const DAMP = 0.82;
const ITERATIONS = 12;
const BEND_MIN = SEG * 1.78;
const LIFT = 4;
const SLOPE = 0.15;
const FALL = 0.05;
const MAX_DRAG_STEP = 22;
const MAX_STRETCH = 1.25;
const GHOST_STEPS = 12;

/** Tangles needed for 2★, 3★, 4★, and 5★. */
export const STAR_STEPS = [8, 15, 30, 50];

export function starsFor(tangles: number) {
  let stars = 1;
  for (const need of STAR_STEPS) if (tangles >= need) stars += 1;
  return stars;
}

export type PointKind = "cord" | "split" | "budL" | "budR" | "jack";

export type CordPoint = {
  x: number;
  y: number;
  px: number;
  py: number;
  /** How lifted this bit is by a nearby grab; lifted cord wins new crossings. */
  h: number;
  kind: PointKind;
  radius: number;
  pinned: boolean;
};

export type Segment = { a: number; b: number; chain: number; k: number };

export type Crossing = {
  x: number;
  y: number;
  over: number;
  under: number;
  /** Creation order; newer crossings are drawn later. */
  born: number;
};

type Ghost = Crossing & { age: number };

type Hit = { i: number; j: number; t: number; u: number; x: number; y: number };

type Grab = { index: number; tx: number; ty: number; ox: number; oy: number };

const RADIUS: Record<PointKind, number> = {
  cord: 4,
  split: 6,
  budL: 15,
  budR: 15,
  jack: 11,
};

export function isHandle(kind: PointKind) {
  return kind === "budL" || kind === "budR" || kind === "jack";
}

function segmentHit(
  a: CordPoint,
  b: CordPoint,
  c: CordPoint,
  d: CordPoint,
) {
  const rx = b.x - a.x;
  const ry = b.y - a.y;
  const sx = d.x - c.x;
  const sy = d.y - c.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const qx = c.x - a.x;
  const qy = c.y - a.y;
  const t = (qx * sy - qy * sx) / den;
  const u = (qx * ry - qy * rx) / den;
  if (t < 0 || t >= 1 || u < 0 || u >= 1) return null;
  return { t, u, x: a.x + rx * t, y: a.y + ry * t };
}

export class HeadphoneSim {
  points: CordPoint[] = [];
  segments: Segment[] = [];
  /** Left bud, right bud, stem; each starts at the splitter. */
  chains: number[][] = [];
  crossings: Crossing[] = [];
  /** New crossings from the last step that raised the tangle count. */
  fresh: { x: number; y: number }[] = [];
  private grabs = new Map<number, Grab>();
  private births = 0;
  /** Recently vanished crossings, so a one-step flicker keeps its over/under and doesn't pop. */
  private ghosts: Ghost[] = [];

  constructor() {
    this.reset();
  }

  get tangles() {
    return this.crossings.length;
  }

  reset() {
    this.points = [];
    this.segments = [];
    this.chains = [];
    this.crossings = [];
    this.fresh = [];
    this.ghosts = [];
    this.grabs.clear();
    this.births = 0;

    const add = (x: number, y: number, kind: PointKind) => {
      this.points.push({
        x,
        y,
        px: x,
        py: y,
        h: 0,
        kind,
        radius: RADIUS[kind],
        pinned: false,
      });
      return this.points.length - 1;
    };

    const sx = 300;
    const sy = 236;
    const split = add(sx, sy, "split");
    const rad = (deg: number) => (deg * Math.PI) / 180;

    const branch = (
      chain: number,
      count: number,
      end: PointKind,
      angleAt: (k: number) => number,
    ) => {
      const indices = [split];
      let x = sx;
      let y = sy;
      for (let k = 1; k <= count; k += 1) {
        const angle = angleAt(k);
        x += Math.cos(angle) * SEG;
        y += Math.sin(angle) * SEG;
        indices.push(add(x, y, k === count ? end : "cord"));
      }
      this.chains.push(indices);
      for (let k = 0; k < indices.length - 1; k += 1) {
        this.segments.push({ a: indices[k], b: indices[k + 1], chain, k });
      }
    };

    branch(0, 22, "budL", (k) => rad(-160 + k * 1.5));
    branch(1, 22, "budR", (k) => rad(-20 - k * 1.5));
    branch(2, 22, "jack", (k) =>
      rad(90 + 34 * Math.sin((k / 22) * Math.PI * 2)),
    );

    for (const p of this.points) {
      this.clamp(p);
      p.px = p.x;
      p.py = p.y;
    }
  }

  pick(x: number, y: number, reach = 0) {
    let best = -1;
    let bestScore = Infinity;
    for (let i = 0; i < this.points.length; i += 1) {
      const p = this.points[i];
      if (p.pinned) continue;
      const handle = isHandle(p.kind);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d > (handle ? p.radius + 10 : 12) + reach) continue;
      const score = handle ? d - 14 : d;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  grab(id: number, x: number, y: number, reach = 0) {
    const index = this.pick(x, y, reach);
    if (index < 0) return false;
    const p = this.points[index];
    p.pinned = true;
    this.grabs.set(id, { index, tx: x, ty: y, ox: p.x - x, oy: p.y - y });
    return true;
  }

  drag(id: number, x: number, y: number) {
    const g = this.grabs.get(id);
    if (!g) return;
    g.tx = x;
    g.ty = y;
  }

  release(id: number) {
    const g = this.grabs.get(id);
    if (!g) return;
    this.points[g.index].pinned = false;
    this.grabs.delete(id);
  }

  releaseAll() {
    for (const id of [...this.grabs.keys()]) this.release(id);
  }

  isGrabbing(id: number) {
    return this.grabs.has(id);
  }

  grabbed() {
    return new Set([...this.grabs.values()].map((g) => g.index));
  }

  step(moving: boolean) {
    if (moving) {
      for (const p of this.points) {
        if (p.pinned) continue;
        const vx = (p.x - p.px) * DAMP;
        const vy = (p.y - p.py) * DAMP;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
      }

      for (const g of this.grabs.values()) {
        const p = this.points[g.index];
        const dx = g.tx + g.ox - p.x;
        const dy = g.ty + g.oy - p.y;
        const d = Math.hypot(dx, dy);
        const s = d > MAX_DRAG_STEP ? MAX_DRAG_STEP / d : 1;
        p.x += dx * s;
        p.y += dy * s;
        this.clamp(p);
        p.px = p.x;
        p.py = p.y;
      }

      for (let iter = 0; iter < ITERATIONS; iter += 1) {
        this.solveLengths(iter % 2 === 1);
        if (iter % 2 === 0) this.solveBending();
        for (const p of this.points) if (!p.pinned) this.clamp(p);
      }
      for (let iter = 0; iter < 4; iter += 1) this.solveLengths(iter % 2 === 1);
      this.limitStretch();
    }

    this.updateCrossings();
    this.solveHeights();
  }

  private clamp(p: CordPoint) {
    const r = p.radius;
    p.x = Math.min(AREA.right - r, Math.max(AREA.left + r, p.x));
    p.y = Math.min(AREA.bottom - r, Math.max(AREA.top + r, p.y));
    const cr = AREA.r;
    const cy = AREA.bottom - cr;
    if (p.y <= cy) return;
    let cx: number | null = null;
    if (p.x < AREA.left + cr) cx = AREA.left + cr;
    else if (p.x > AREA.right - cr) cx = AREA.right - cr;
    if (cx === null) return;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    const max = cr - r;
    if (d > max) {
      p.x = cx + (dx / d) * max;
      p.y = cy + (dy / d) * max;
    }
  }

  private separate(a: CordPoint, b: CordPoint, min: number) {
    const wa = a.pinned ? 0 : 1;
    const wb = b.pinned ? 0 : 1;
    const w = wa + wb;
    if (!w) return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= min * min || d2 < 1e-10) return;
    const d = Math.sqrt(d2);
    const k = (min - d) / d / w;
    a.x -= dx * k * wa;
    a.y -= dy * k * wa;
    b.x += dx * k * wb;
    b.y += dy * k * wb;
  }

  private solveLengths(reverse: boolean) {
    const segs = this.segments;
    for (let n = 0; n < segs.length; n += 1) {
      const s = segs[reverse ? segs.length - 1 - n : n];
      const a = this.points[s.a];
      const b = this.points[s.b];
      const wa = a.pinned ? 0 : 1;
      const wb = b.pinned ? 0 : 1;
      const w = wa + wb;
      if (!w) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1e-6;
      const k = (d - SEG) / d / w;
      a.x += dx * k * wa;
      a.y += dy * k * wa;
      b.x -= dx * k * wb;
      b.y -= dy * k * wb;
    }
  }

  /** Keeps every bend gentle so the cord curves instead of kinking. */
  private solveBending() {
    const pts = this.points;
    for (const chain of this.chains) {
      for (let k = 0; k < chain.length - 2; k += 1) {
        this.separate(pts[chain[k]], pts[chain[k + 2]], BEND_MIN);
      }
    }
    const [left, right, stem] = this.chains;
    this.separate(pts[left[1]], pts[right[1]], SEG * 1.2);
    this.separate(pts[left[1]], pts[stem[1]], SEG * 1.6);
    this.separate(pts[right[1]], pts[stem[1]], SEG * 1.6);
  }

  /** If a held end is yanked past the cord's slack, hold it back instead of stretching the cord. */
  private limitStretch() {
    for (const g of this.grabs.values()) {
      const p = this.points[g.index];
      for (const s of this.segments) {
        if (s.a !== g.index && s.b !== g.index) continue;
        const o = this.points[s.a === g.index ? s.b : s.a];
        const dx = p.x - o.x;
        const dy = p.y - o.y;
        const d = Math.hypot(dx, dy);
        const max = SEG * MAX_STRETCH;
        if (d > max) {
          p.x = o.x + (dx / d) * max;
          p.y = o.y + (dy / d) * max;
          p.px = p.x;
          p.py = p.y;
        }
      }
    }
  }

  private speed(seg: Segment) {
    const a = this.points[seg.a];
    const b = this.points[seg.b];
    return (
      Math.hypot(a.x - a.px, a.y - a.py) + Math.hypot(b.x - b.px, b.y - b.py)
    );
  }

  private heightAt(seg: Segment, t: number) {
    const a = this.points[seg.a];
    const b = this.points[seg.b];
    return a.h + (b.h - a.h) * t;
  }

  /** Finds crossings, keeping each one's over/under as it slides along the cord. */
  private updateCrossings() {
    const segs = this.segments;
    const live = this.crossings.length;
    const previous: (Crossing | Ghost)[] = [...this.crossings, ...this.ghosts];
    const claimed = new Set<number>();
    const next: Crossing[] = [];
    const fresh: { x: number; y: number }[] = [];

    const near = (a: Segment, b: Segment) =>
      a.chain === b.chain && Math.abs(a.k - b.k) <= 2;

    for (const hit of this.findHits()) {
      const si = segs[hit.i];
      const sj = segs[hit.j];
      let match = -1;
      let matchOverIsI = true;
      let bestD = 20 * 20;
      for (let n = 0; n < previous.length; n += 1) {
        if (claimed.has(n)) continue;
        const prev = previous[n];
        const d = (prev.x - hit.x) ** 2 + (prev.y - hit.y) ** 2;
        if (d >= bestD) continue;
        const po = segs[prev.over];
        const pu = segs[prev.under];
        const iOver = near(si, po) && near(sj, pu);
        const jOver = near(sj, po) && near(si, pu);
        if (!iOver && !jOver) continue;
        bestD = d;
        match = n;
        matchOverIsI =
          iOver && jOver
            ? Math.abs(si.k - po.k) + Math.abs(sj.k - pu.k) <=
              Math.abs(sj.k - po.k) + Math.abs(si.k - pu.k)
            : iOver;
      }

      let overIsI: boolean;
      let born: number;
      if (match >= 0) {
        claimed.add(match);
        overIsI = matchOverIsI;
        born = previous[match].born;
      } else {
        // Whatever you're holding goes over; otherwise the strand that moved.
        const hi = this.heightAt(si, hit.t);
        const hj = this.heightAt(sj, hit.u);
        overIsI =
          Math.abs(hi - hj) > 0.05 ? hi > hj : this.speed(si) >= this.speed(sj);
        this.births += 1;
        born = this.births;
        fresh.push({ x: hit.x, y: hit.y });
      }
      next.push({
        x: hit.x,
        y: hit.y,
        over: overIsI ? hit.i : hit.j,
        under: overIsI ? hit.j : hit.i,
        born,
      });
    }

    const ghosts: Ghost[] = [];
    previous.forEach((c, n) => {
      if (claimed.has(n)) return;
      const age = n < live ? 0 : (c as Ghost).age + 1;
      if (age < GHOST_STEPS) ghosts.push({ ...c, age });
    });

    this.fresh = fresh.slice(0, Math.max(0, next.length - live));
    this.ghosts = ghosts;
    this.crossings = next;
  }

  private findHits() {
    const pts = this.points;
    const segs = this.segments;
    const out: Hit[] = [];
    for (let i = 0; i < segs.length; i += 1) {
      const s = segs[i];
      const a = pts[s.a];
      const b = pts[s.b];
      for (let j = i + 1; j < segs.length; j += 1) {
        const t = segs[j];
        if (s.a === t.a || s.a === t.b || s.b === t.a || s.b === t.b) continue;
        const c = pts[t.a];
        const d = pts[t.b];
        if (
          Math.max(a.x, b.x) < Math.min(c.x, d.x) ||
          Math.max(c.x, d.x) < Math.min(a.x, b.x) ||
          Math.max(a.y, b.y) < Math.min(c.y, d.y) ||
          Math.max(c.y, d.y) < Math.min(a.y, b.y)
        ) {
          continue;
        }
        const hit = segmentHit(a, b, c, d);
        if (hit) out.push({ i, j, ...hit });
      }
    }
    return out;
  }

  private solveHeights() {
    const pts = this.points;
    const held = this.grabbed();
    for (let i = 0; i < pts.length; i += 1) {
      pts[i].h = held.has(i) ? LIFT : Math.max(0, pts[i].h - FALL);
    }
    for (let pass = 0; pass < 2; pass += 1) {
      for (const chain of this.chains) {
        for (let k = 1; k < chain.length; k += 1) {
          const a = pts[chain[k - 1]];
          const b = pts[chain[k]];
          if (a.h - SLOPE > b.h) b.h = a.h - SLOPE;
        }
        for (let k = chain.length - 1; k > 0; k -= 1) {
          const a = pts[chain[k - 1]];
          const b = pts[chain[k]];
          if (b.h - SLOPE > a.h) a.h = b.h - SLOPE;
        }
      }
    }
  }
}
