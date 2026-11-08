import { useEffect, useRef, useState } from "react";
import p5 from "p5";
import {
  HeadphoneSim,
  POCKET,
  WORLD_H,
  WORLD_W,
  scoreTangles,
  starsFor,
  type CordPoint,
} from "./headphoneTangleSim";

const ROUND_SECONDS = 20;
const STEP_MS = 1000 / 60;

const C = {
  bg: "#ffd84d",
  pocket: "#ff8fbf",
  pocketShade: "#f777b0",
  shadow: "#e8619f",
  hem: "#fff8f0",
  stitch: "#ff7a2e",
  cord: "#fffaf3",
  cordEdge: "#e24f8e",
  orange: "#ff7a2e",
  yellow: "#ffd84d",
  pinkDeep: "#ff3f8e",
  ink: "#2b1d22",
};

type Mode = "ready" | "playing" | "done";

type Hud = { mode: Mode; secs: number; tangles: number; stars: number };

type Api = { start: () => void; resize: () => void };

type Pop = { x: number; y: number; born: number };

type Speech = {
  text: string;
  /** 0 = left bud, 1 = right bud */
  bud: 0 | 1;
  born: number;
};

const SPEECH_MS = 2200;
const SPEECH_COOLDOWN_MS = 3000;

const SPEECH_LINES = [
  "cozy!",
  "snuggly!",
  "I've never felt closer to you!",
  "more please!",
  "knots galore!",
  "we're like a pretzel!",
  "don't stop!",
  "perfect mess!",
  "so tangled!",
  "hug tighter!",
  "best friends forever!",
  "mmm, chaos!",
  "inextricable!",
];

const STAR_LINES = [
  "",
  "Suspiciously neat. Did you even try?",
  "A mild snarl. Annoying, at best.",
  "A respectable knot.",
  "Beautifully cursed.",
  "Legendary pocket chaos.",
];

function polyline(
  p: p5,
  pts: CordPoint[],
  chain: number[],
  from: number,
  to: number,
) {
  const lo = Math.max(0, from);
  const hi = Math.min(chain.length - 1, to);
  if (hi <= lo) return;
  p.beginShape();
  for (let k = lo; k <= hi; k += 1) p.vertex(pts[chain[k]].x, pts[chain[k]].y);
  p.endShape();
}

function strand(
  p: p5,
  pts: CordPoint[],
  chain: number[],
  from: number,
  to: number,
) {
  p.stroke(C.cordEdge);
  p.strokeWeight(10);
  polyline(p, pts, chain, from, to);
  p.stroke(C.cord);
  p.strokeWeight(6);
  polyline(p, pts, chain, from, to);
}

function drawPocket(p: p5) {
  const { x, y, w, h, hem, rTop, rBottom } = POCKET;
  p.noStroke();
  p.fill(C.pocket);
  p.rect(x, y, w, h, rTop, rTop, rBottom, rBottom);
  p.fill(C.pocketShade);
  p.rect(x, y + hem, w, 12);
  p.fill(C.hem);
  p.rect(x, y, w, hem, rTop, rTop, 0, 0);

  const ctx = p.drawingContext as CanvasRenderingContext2D;
  ctx.setLineDash([9, 7]);
  p.noFill();
  p.stroke(C.stitch);
  p.strokeWeight(3);
  p.line(x + 40, y + hem - 11, x + w - 40, y + hem - 11);
  p.rect(
    x + 12,
    y + hem + 22,
    w - 24,
    h - hem - 34,
    6,
    6,
    rBottom - 12,
    rBottom - 12,
  );
  ctx.setLineDash([]);

  p.noStroke();
  for (const rx of [x + 20, x + w - 20]) {
    p.fill(C.orange);
    p.circle(rx, y + 19, 13);
    p.fill(C.yellow);
    p.circle(rx, y + 19, 5);
  }
}

function drawCord(p: p5, sim: HeadphoneSim) {
  const pts = sim.points;
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.ROUND);
  p.noFill();

  // Shadows drift further out the higher a bit is lifted.
  p.stroke(C.shadow);
  p.strokeWeight(9);
  for (const s of sim.segments) {
    const a = pts[s.a];
    const b = pts[s.b];
    const h = (a.h + b.h) * 0.5;
    const ox = 1.5 + h * 2.2;
    const oy = 2.5 + h * 3;
    p.line(a.x + ox, a.y + oy, b.x + ox, b.y + oy);
  }

  for (const chain of sim.chains) strand(p, pts, chain, 0, chain.length - 1);

  // Knot-diagram crossings: cut a gap in the lower strand, redraw the upper one.
  const order = [...sim.crossings].sort((a, b) => a.born - b.born);
  for (const c of order) {
    const seg = sim.segments[c.over];
    const chain = sim.chains[seg.chain];
    p.stroke(C.pocket);
    p.strokeWeight(17);
    polyline(p, pts, chain, seg.k - 1, seg.k + 2);
    strand(p, pts, chain, seg.k - 2, seg.k + 3);
  }
}

function drawSplitter(p: p5, sim: HeadphoneSim) {
  const stem = sim.chains[2];
  const a = sim.points[stem[0]];
  const b = sim.points[stem[1]];
  p.push();
  p.translate(a.x, a.y);
  p.rotate(Math.atan2(b.y - a.y, b.x - a.x));
  p.stroke(C.hem);
  p.strokeWeight(2.5);
  p.fill(C.yellow);
  p.rect(-9, -6, 18, 12, 6);
  p.pop();
}

function endAngle(sim: HeadphoneSim, chain: number[]) {
  const end = sim.points[chain[chain.length - 1]];
  const prev = sim.points[chain[chain.length - 3]];
  return { end, angle: Math.atan2(end.y - prev.y, end.x - prev.x) };
}

function drawJack(p: p5, sim: HeadphoneSim, held: boolean) {
  const { end, angle } = endAngle(sim, sim.chains[2]);
  const ox = 2 + end.h * 2.2;
  const oy = 3 + end.h * 3;
  p.noStroke();
  p.fill(C.shadow);
  p.push();
  p.translate(end.x + ox, end.y + oy);
  p.rotate(angle);
  p.rect(-8, -8, 37, 16, 6);
  p.pop();

  p.push();
  p.translate(end.x, end.y);
  p.rotate(angle);
  if (held) p.scale(1.1);
  p.stroke(C.hem);
  p.strokeWeight(3);
  p.fill(C.orange);
  p.rect(-8, -8, 22, 16, 6);
  p.noStroke();
  p.fill(C.hem);
  p.rect(14, -4, 15, 8, 0, 4, 4, 0);
  p.fill(C.ink);
  p.rect(18.5, -4, 2, 8);
  p.rect(23, -4, 2, 8);
  p.pop();
}

function drawBud(
  p: p5,
  sim: HeadphoneSim,
  chainIndex: number,
  body: string,
  held: boolean,
  mood: number,
) {
  const { end, angle } = endAngle(sim, sim.chains[chainIndex]);
  const size = held ? 34 : 30;
  p.noStroke();
  p.fill(C.shadow);
  p.circle(end.x + 2 + end.h * 2.2, end.y + 3 + end.h * 3, size + 2);

  p.push();
  p.translate(end.x, end.y);
  p.push();
  p.rotate(angle);
  p.fill(C.hem);
  p.rect(-21, -5, 16, 10, 5);
  p.pop();

  p.stroke(C.hem);
  p.strokeWeight(3);
  p.fill(body);
  p.circle(0, 0, size);

  p.noStroke();
  p.fill(C.pinkDeep);
  p.circle(-8, 3.5, 4.5);
  p.circle(8, 3.5, 4.5);

  p.stroke(C.ink);
  p.strokeWeight(2);
  p.noFill();
  if (mood >= 2) {
    p.line(-7, -1, -4.5, -4);
    p.line(-4.5, -4, -2, -1);
    p.line(2, -1, 4.5, -4);
    p.line(4.5, -4, 7, -1);
  } else {
    p.noStroke();
    p.fill(C.ink);
    p.circle(-4.5, -2.5, 3.8);
    p.circle(4.5, -2.5, 3.8);
    p.noFill();
    p.stroke(C.ink);
  }
  const mouth = 5 + mood * 2;
  p.arc(0, 2.5, mouth, mouth * 0.85, 0, Math.PI);
  p.pop();
}

function drawPops(p: p5, pops: Pop[], now: number) {
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont("Syne");
  p.textStyle(p.BOLD);
  for (const pop of pops) {
    const t = Math.min(1, (now - pop.born) / 650);
    const alpha = (1 - t) * 255;
    p.noFill();
    p.stroke(255, 63, 142, alpha);
    p.strokeWeight(3);
    p.circle(pop.x, pop.y, 10 + t * 34);
    p.stroke(255, 248, 240, alpha);
    p.strokeWeight(5);
    p.fill(255, 122, 46, alpha);
    p.textSize(19);
    p.text("+1", pop.x, pop.y - 16 - t * 22);
  }
}

function drawSpeechBubbles(
  p: p5,
  sim: HeadphoneSim,
  speeches: Speech[],
  now: number,
) {
  p.textFont("Outfit");
  p.textStyle(p.NORMAL);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(13);

  for (const speech of speeches) {
    const age = now - speech.born;
    const fadeIn = Math.min(1, age / 140);
    const fadeOut = Math.min(1, (SPEECH_MS - age) / 280);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * 255;
    if (alpha <= 0) continue;

    const end =
      sim.points[sim.chains[speech.bud][sim.chains[speech.bud].length - 1]];
    const tw = Math.min(168, Math.max(54, p.textWidth(speech.text) + 22));
    const th = 28;
    let bx = end.x;
    let by = end.y - 42;
    // Keep the bubble inside the pocket, and nudge left/right so both buds can talk.
    bx = Math.min(
      POCKET.x + POCKET.w - tw / 2 - 10,
      Math.max(POCKET.x + tw / 2 + 10, bx),
    );
    by = Math.max(POCKET.y + POCKET.hem + th / 2 + 8, by);
    if (speech.bud === 0) bx = Math.min(bx, end.x + 8);
    else bx = Math.max(bx, end.x - 8);

    const pop = 1 + (1 - fadeIn) * 0.12;
    p.push();
    p.translate(bx, by);
    p.scale(pop);

    p.noStroke();
    p.fill(255, 248, 240, alpha);
    p.rect(-tw / 2, -th / 2, tw, th, 14);
    // Little pointer toward the bud.
    p.triangle(-6, th / 2 - 1, 6, th / 2 - 1, 0, th / 2 + 9);
    p.fill(43, 29, 34, alpha);
    p.text(speech.text, 0, -1);
    p.pop();
  }
}

function makeSketch(
  host: HTMLDivElement,
  barRef: { current: HTMLDivElement | null },
  onHud: (hud: Hud) => void,
  apiRef: { current: Api | null },
  isAlive: () => boolean,
) {
  return (p: p5) => {
    const sim = new HeadphoneSim();
    let mode: Mode = "ready";
    let elapsed = 0;
    let acc = 0;
    let finalTangles = 0;
    let scored = 0;
    let pops: Pop[] = [];
    let speeches: Speech[] = [];
    let lastPop = 0;
    let lastSpeech = -SPEECH_COOLDOWN_MS;
    let lastSpeechLine = -1;
    let nextSpeechBud: 0 | 1 = 0;
    let ready = false;
    let still = false;
    let canvasEl: HTMLCanvasElement | null = null;
    let lastKey = "";

    const publish = () => {
      const secs = Math.max(0, Math.ceil(ROUND_SECONDS - elapsed));
      const tangles = mode === "done" ? finalTangles : scored;
      const stars = mode === "done" ? starsFor(finalTangles) : 0;
      const key = `${mode}|${secs}|${tangles}`;
      if (key === lastKey) return;
      lastKey = key;
      onHud({ mode, secs, tangles, stars });
    };

    const setTouchAction = () => {
      if (canvasEl)
        canvasEl.style.touchAction = mode === "playing" ? "none" : "pan-y";
    };

    const saySomething = (now: number) => {
      if (now - lastSpeech < SPEECH_COOLDOWN_MS) return;
      let pick = Math.floor(Math.random() * SPEECH_LINES.length);
      if (SPEECH_LINES.length > 1 && pick === lastSpeechLine) {
        pick =
          (pick + 1 + Math.floor(Math.random() * (SPEECH_LINES.length - 1))) %
          SPEECH_LINES.length;
      }
      lastSpeechLine = pick;
      lastSpeech = now;
      speeches = [
        {
          text: SPEECH_LINES[pick],
          bud: nextSpeechBud,
          born: now,
        },
      ];
      nextSpeechBud = nextSpeechBud === 0 ? 1 : 0;
    };

    const start = () => {
      sim.reset();
      pops = [];
      speeches = [];
      scored = 0;
      lastSpeech = -SPEECH_COOLDOWN_MS;
      lastSpeechLine = -1;
      nextSpeechBud = Math.random() < 0.5 ? 0 : 1;
      elapsed = 0;
      acc = 0;
      mode = "playing";
      setTouchAction();
      publish();
    };

    const finish = () => {
      sim.releaseAll();
      scored = scoreTangles(sim);
      finalTangles = scored;
      mode = "done";
      if (canvasEl) canvasEl.style.cursor = "";
      setTouchAction();
      publish();
    };

    const sizeForHost = () => {
      const width = Math.max(260, Math.floor(host.clientWidth || 260));
      return { width, height: Math.round((width * WORLD_H) / WORLD_W) };
    };

    const api: Api = {
      start,
      resize: () => {
        if (!ready) return;
        const { width, height } = sizeForHost();
        if (width !== p.width || height !== p.height)
          p.resizeCanvas(width, height);
      },
    };
    apiRef.current = api;

    const toWorld = (event: PointerEvent) => {
      const rect = canvasEl!.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WORLD_W,
        y: ((event.clientY - rect.top) / rect.height) * WORLD_H,
        perCss: WORLD_W / rect.width,
      };
    };

    const onDown = (event: PointerEvent) => {
      if (mode !== "playing" || !canvasEl) return;
      const { x, y, perCss } = toWorld(event);
      const reach = (event.pointerType === "touch" ? 16 : 4) * perCss;
      if (!sim.grab(event.pointerId, x, y, reach)) return;
      event.preventDefault();
      canvasEl.setPointerCapture(event.pointerId);
      canvasEl.style.cursor = "grabbing";
    };

    const onMove = (event: PointerEvent) => {
      if (mode !== "playing" || !canvasEl) return;
      const { x, y, perCss } = toWorld(event);
      if (sim.isGrabbing(event.pointerId)) {
        sim.drag(event.pointerId, x, y);
      } else if (event.pointerType === "mouse") {
        canvasEl.style.cursor = sim.pick(x, y, 4 * perCss) >= 0 ? "grab" : "";
      }
    };

    const onUp = (event: PointerEvent) => {
      sim.release(event.pointerId);
      if (canvasEl && mode === "playing") canvasEl.style.cursor = "grab";
    };

    p.setup = () => {
      // p5 runs setup asynchronously, so an instance React already unmounted can still get here.
      if (!isAlive()) {
        p.remove();
        return;
      }
      still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const { width, height } = sizeForHost();
      const canvas = p.createCanvas(width, height);
      canvas.parent(host);
      canvasEl = canvas.elt as HTMLCanvasElement;
      canvasEl.setAttribute(
        "aria-label",
        "A pocket with a pair of earbuds. Drag the earbuds, the jack, or the cord to tangle it.",
      );
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      setTouchAction();
      canvasEl.addEventListener("pointerdown", onDown);
      canvasEl.addEventListener("pointermove", onMove);
      canvasEl.addEventListener("pointerup", onUp);
      canvasEl.addEventListener("pointercancel", onUp);
      ready = true;
      publish();
    };

    p.draw = () => {
      const dt = Math.min(p.deltaTime || STEP_MS, 100);
      const now = p.millis();

      if (mode === "playing") {
        elapsed += dt / 1000;
        if (elapsed >= ROUND_SECONDS) finish();
      }

      acc += dt;
      let steps = 0;
      while (acc >= STEP_MS && steps < 4) {
        sim.step(mode === "playing");
        if (mode === "playing") {
          const next = scoreTangles(sim);
          if (next > scored && sim.fresh.length && now - lastPop > 90) {
            const f = sim.fresh[0];
            pops.push({ x: f.x, y: f.y, born: now });
            lastPop = now;
            saySomething(now);
          }
          scored = next;
        }
        acc -= STEP_MS;
        steps += 1;
      }
      if (steps === 4) acc = 0;
      pops = pops.filter((pop) => now - pop.born < 650);
      speeches = speeches.filter((s) => now - s.born < SPEECH_MS);

      if (mode === "playing") publish();
      const bar = barRef.current;
      if (bar) {
        const left =
          mode === "playing"
            ? 1 - elapsed / ROUND_SECONDS
            : mode === "ready"
              ? 1
              : 0;
        bar.style.transform = `scaleX(${Math.max(0, left)})`;
      }

      const tangles = mode === "done" ? finalTangles : scored;
      const mood = tangles >= 14 ? 2 : tangles >= 5 ? 1 : 0;
      const held = sim.grabbed();
      const isHeld = (kind: CordPoint["kind"]) =>
        [...held].some((i) => sim.points[i].kind === kind);

      p.background(C.bg);
      p.push();
      p.scale(p.width / WORLD_W);
      drawPocket(p);
      drawCord(p, sim);
      drawSplitter(p, sim);
      drawJack(p, sim, isHeld("jack"));
      drawBud(p, sim, 0, C.orange, isHeld("budL"), mood);
      drawBud(p, sim, 1, C.yellow, isHeld("budR"), mood);
      if (!still) {
        drawPops(p, pops, now);
        drawSpeechBubbles(p, sim, speeches, now);
      }
      p.pop();
    };

    const remove = p.remove.bind(p);
    p.remove = () => {
      if (apiRef.current === api) apiRef.current = null;
      canvasEl?.removeEventListener("pointerdown", onDown);
      canvasEl?.removeEventListener("pointermove", onMove);
      canvasEl?.removeEventListener("pointerup", onUp);
      canvasEl?.removeEventListener("pointercancel", onUp);
      remove();
    };
  };
}

export function HeadphoneTangleGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [hud, setHud] = useState<Hud>({
    mode: "ready",
    secs: ROUND_SECONDS,
    tangles: 0,
    stars: 0,
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let alive = true;
    const sketch = new p5(
      makeSketch(host, barRef, setHud, apiRef, () => alive),
      host,
    );
    const observer = new ResizeObserver(() => apiRef.current?.resize());
    observer.observe(host);
    return () => {
      alive = false;
      observer.disconnect();
      sketch.remove();
    };
  }, []);

  const hurry = hud.mode === "playing" && hud.secs <= 5;

  return (
    <section className="tangle" aria-label="Headphone Tangling Simulator">
      <div className="tangle-frame">
        <div className="tangle-hud">
          <span className="tangle-pill tangle-count">
            {hud.tangles} {hud.tangles === 1 ? "tangle" : "tangles"}
          </span>
          <span
            className={`tangle-pill tangle-time${hurry ? " is-hurry" : ""}`}
          >
            {hud.secs}s
          </span>
        </div>
        <div className="tangle-bar" aria-hidden="true">
          <div ref={barRef} className="tangle-bar-fill" />
        </div>
        <div className="tangle-play">
          <div ref={hostRef} className="tangle-stage" />
          {hud.mode === "ready" ? (
            <div className="tangle-overlay">
              <div className="tangle-card">
                <p className="tangle-card-title">Tangle your headphones</p>
                <p className="tangle-card-copy">
                  Drag the earbuds, the jack, or any bit of cord. Whatever
                  you’re holding goes over. Make as many crossings as you can in
                  20 seconds.
                </p>
                <button
                  type="button"
                  className="tangle-button"
                  onClick={() => apiRef.current?.start()}
                >
                  Start
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {hud.mode === "done" ? (
          <div className="tangle-result" role="status">
            <p
              className="tangle-stars"
              aria-label={`${hud.stars} out of 5 stars`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={n <= hud.stars ? "is-on" : undefined}
                  aria-hidden="true"
                >
                  ★
                </span>
              ))}
            </p>
            <p className="tangle-verdict">
              <strong>
                {hud.tangles} {hud.tangles === 1 ? "tangle" : "tangles"}.
              </strong>{" "}
              {STAR_LINES[hud.stars]}
            </p>
            <button
              type="button"
              className="tangle-button"
              onClick={() => apiRef.current?.start()}
            >
              Play again
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
