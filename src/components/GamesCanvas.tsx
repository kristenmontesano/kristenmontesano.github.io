import { useEffect, useRef } from "react";

const vertexSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentSource = `
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_galaxy;
uniform float u_dpr;
uniform float u_time;
uniform sampler2D u_hidden;
uniform float u_hasImage;
uniform float u_fit;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 paper = vec3(243.0, 242.0, 239.0) / 255.0;
  vec3 ink = vec3(22.0, 19.0, 17.0) / 255.0;
  vec3 color = paper;
  float cycle = 16.0;
  float travel = 4.5;
  float passed = mod(u_time, cycle);
  float progress = clamp(passed / travel, 0.0, 1.0);
  float waveAngle = fract(sin((floor(u_time / cycle) + 2.3) * 17.13) * 43758.5453) * 6.2831853;
  vec2 waveDir = vec2(cos(waveAngle), sin(waveAngle));
  vec2 wavePerp = vec2(-waveDir.y, waveDir.x);
  float crest = mix(-1.15, 1.15, progress);
  float along = dot(uv - 0.5, waveDir);
  float bow = sin(dot(uv - 0.5, wavePerp) * 5.0) * 0.05;
  float delta = (along - crest - bow) / 0.16;
  float wave = exp(-delta * delta) * step(passed, travel);
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 focus = (u_galaxy - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 q = p - focus;
  float r = length(q);
  float glass = 0.32 * u_fit;
  float lens = (1.0 - smoothstep(glass - 0.024, glass - 0.007, r)) * u_hasImage;
  if (u_hasImage > 0.5) {
    vec3 hidden = texture2D(u_hidden, vec2(uv.x, 1.0 - uv.y)).rgb;
    color = mix(color, mix(hidden, ink, 0.42), wave);
    float rim = smoothstep(glass * 0.42, glass * 0.94, r);
    color = mix(color, mix(hidden, color, rim * 0.28), lens);
  }
  float line = 0.0032;
  float outerRim = 1.0 - smoothstep(0.0, line, abs(r - (glass + 0.014)));
  float bezel = 1.0 - smoothstep(0.01, 0.017, abs(r - glass));
  float innerRim = 1.0 - smoothstep(0.0, line * 0.8, abs(r - (glass - 0.016)));
  vec2 grip = normalize(vec2(0.82, -0.58));
  float alongGrip = dot(q, grip);
  float acrossGrip = abs(dot(q, vec2(-grip.y, grip.x)));
  float handle = step(glass * 1.035, alongGrip) * step(alongGrip, glass * 1.41) * (1.0 - smoothstep(glass * 0.052, glass * 0.074, acrossGrip));
  color = mix(color, ink, max(bezel, max(handle, max(outerRim, innerRim))));

  float spacing = 20.0 * u_dpr;
  vec2 cell = floor(gl_FragCoord.xy / spacing);
  vec2 center = (cell + 0.5) * spacing;
  float gap = length(gl_FragCoord.xy - center);
  float dotRadius = max(u_dpr * 1.05, 0.8);
  float mark = 1.0 - smoothstep(dotRadius * 0.15, dotRadius, gap);
  color = mix(color, ink, mark * (1.0 - max(lens, wave)));

  gl_FragColor = vec4(color, 1.0);
}
`;

const covers = [
  { id: "1174180", title: "Red Dead Redemption 2", src: "/steam/1174180.jpg" },
  { id: "2000120", title: "Time Flies", src: "/steam/2000120.jpg" },
  { id: "2366980", title: "Thank Goodness You're Here!", src: "/steam/2366980.jpg" },
  { id: "1456880", title: "ElecHead", src: "/steam/1456880.jpg" },
  { id: "1102130", title: "Florence", src: "/steam/1102130.jpg" },
  { id: "2359120", title: "Consume Me", src: "/steam/2359120.jpg" },
  { id: "1593030", title: "Terra Nil", src: "/steam/1593030.jpg" },
];

function steamUrl(id: string) {
  return `https://store.steampowered.com/app/${id}/`;
}

const COVER_TILT = [-0.09, 0.06, -0.045, 0.08, -0.07, 0.05, -0.035];

type CoverBox = { x: number; y: number; w: number; h: number };

function balancedRows(count: number) {
  const splits: number[][] = [];
  const walk = (left: number, row: number[]) => {
    if (left === 0) {
      const widest = Math.max(...row);
      const narrowest = Math.min(...row);
      if (widest - narrowest <= 1) splits.push(row.slice());
      return;
    }
    if (row.length >= 4) return;
    for (let size = 1; size <= left; size++) {
      row.push(size);
      walk(left - size, row);
      row.pop();
    }
  };
  walk(count, []);
  return splits;
}

function layoutEqual(viewW: number, viewH: number, count: number, aspect: number) {
  let best: { score: number; boxes: CoverBox[] } | null = null;
  const screenRatio = viewW / viewH;
  for (const rows of balancedRows(count)) {
    const columns = Math.max(...rows);
    const rowCount = rows.length;
    const denom = aspect * (columns - 1) - screenRatio * (rowCount - 1);
    const numer = aspect * columns - screenRatio * rowCount;
    const ideal = denom === 0 ? 0.12 : numer / denom;
    const overlap = Math.min(0.2, Math.max(0.08, Number.isFinite(ideal) ? ideal : 0.12));
    let width = viewW / (columns - (columns - 1) * overlap);
    let height = width / aspect;
    let blockW = columns * width - (columns - 1) * overlap * width;
    let blockH = rowCount * height - (rowCount - 1) * overlap * height;
    const scale = Math.min(viewW / blockW, viewH / blockH);
    width *= scale;
    height *= scale;
    blockW *= scale;
    blockH *= scale;
    const overlapX = overlap * width;
    const overlapY = overlap * height;
    const originX = (viewW - blockW) / 2;
    const originY = (viewH - blockH) / 2;
    const boxes: CoverBox[] = [];
    let y = originY;
    for (const row of rows) {
      const rowW = row * width - (row - 1) * overlapX;
      let x = originX + (blockW - rowW) / 2;
      for (let i = 0; i < row; i++) {
        boxes.push({ x, y, w: width, h: height });
        x += width - overlapX;
      }
      y += height - overlapY;
    }
    const coverage = (blockW * blockH) / (viewW * viewH);
    const score = coverage * (1 - Math.max(0, overlap - 0.12) * 0.35);
    if (!best || score > best.score) best = { score, boxes };
  }
  return best?.boxes ?? [];
}

let coverOrder: number[] | null = null;

function shuffledCovers<T>(items: T[]) {
  if (!coverOrder || coverOrder.length !== items.length) {
    coverOrder = items.map((_, index) => index);
    for (let i = coverOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = coverOrder[i];
      coverOrder[i] = coverOrder[j];
      coverOrder[j] = swap;
    }
  }
  return coverOrder.map((index) => items[index]);
}

type LoadedCover = { id: string; image: HTMLImageElement };
type PlacedCover = {
  id: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  tilt: number;
};

function paintCollage(
  target: HTMLCanvasElement,
  images: LoadedCover[],
  pixelRatio: number,
) {
  const context = target.getContext("2d");
  if (!context) return [];
  const aspect =
    images.reduce((sum, item) => sum + item.image.naturalWidth / item.image.naturalHeight, 0) /
    images.length;
  const margin = Math.min(target.width, target.height) * 0.02;
  const boxes = layoutEqual(
    target.width - margin * 2,
    target.height - margin * 2,
    images.length,
    aspect,
  ).map((box, index) => ({
    x: box.x + margin,
    y: box.y + margin,
    w: box.w,
    h: box.h,
    tilt: COVER_TILT[index % COVER_TILT.length],
  }));
  context.fillStyle = "#f3f2ef";
  context.fillRect(0, 0, target.width, target.height);
  const placed = shuffledCovers(images).map((item, index) => {
    const box = boxes[index];
    const centerX = box.x + box.w / 2;
    const centerY = box.y + box.h / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(box.tilt);
    context.shadowColor = "rgba(0, 0, 0, 0.38)";
    context.shadowBlur = Math.max(12, box.w * 0.04);
    context.shadowOffsetY = box.h * 0.02;
    context.drawImage(item.image, -box.w / 2, -box.h / 2, box.w, box.h);
    context.restore();
    return { id: item.id, cx: centerX, cy: centerY, w: box.w, h: box.h, tilt: box.tilt };
  });
  drawTapedTitle(context, target, pixelRatio);
  return placed;
}

function drawTapedTitle(
  context: CanvasRenderingContext2D,
  target: HTMLCanvasElement,
  pixelRatio: number,
) {
  const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const header = document.querySelector(".site-header");
  const headerPx = header?.getBoundingClientRect().height ?? 4.25 * rootSize;
  const top = headerPx * pixelRatio + rootSize * pixelRatio * 0.35;
  const text = "What I've been playing lately";
  let fontSize = Math.min(target.height * 0.07, target.width * 0.055);
  context.font = `600 ${fontSize}px Caveat, Fraunces, serif`;
  while (context.measureText(text).width > target.width * 0.7 && fontSize > 16 * pixelRatio) {
    fontSize *= 0.92;
    context.font = `600 ${fontSize}px Caveat, Fraunces, serif`;
  }
  const textWidth = context.measureText(text).width;
  const paperW = textWidth + fontSize * 1.35;
  const paperH = fontSize * 1.7;
  const tapeH = fontSize * 0.42;
  const centerX = target.width / 2;
  const centerY = top + tapeH + paperH * 0.62;

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-0.045);
  context.shadowColor = "rgba(0, 0, 0, 0.32)";
  context.shadowBlur = fontSize * 0.35;
  context.shadowOffsetY = fontSize * 0.12;
  context.fillStyle = "#f3ecdf";
  context.beginPath();
  context.roundRect(-paperW / 2, -paperH / 2, paperW, paperH, fontSize * 0.08);
  context.fill();
  context.shadowColor = "transparent";

  const tapeW = fontSize * 1.7;
  const stick = (x: number, y: number, angle: number) => {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.fillStyle = "rgba(214, 186, 108, 0.78)";
    context.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH);
    context.fillStyle = "rgba(255, 255, 255, 0.18)";
    context.fillRect(-tapeW / 2, -tapeH / 2, tapeW, tapeH * 0.28);
    context.restore();
  };
  stick(-paperW * 0.32, -paperH / 2, 0.16);
  stick(paperW * 0.32, -paperH / 2, -0.2);

  context.fillStyle = "#2a1c24";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 0, fontSize * 0.06);
  context.restore();
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const GLASS_RADIUS = 0.32;
const HINT_DELAY = 5000;

function glassFit(cssWidth: number, cssHeight: number) {
  const radius = GLASS_RADIUS * cssHeight;
  const maxRadius =
    cssWidth < 720
      ? Math.min(cssWidth * 0.5, cssHeight * 0.36)
      : Math.min(cssWidth * 0.4, cssHeight * 0.36);
  return Math.min(1, maxRadius / Math.max(radius, 1));
}

function overChrome(event: Event) {
  const target = event.target;
  return (
    target instanceof Element &&
    Boolean(target.closest(".site-header"))
  );
}

export function GamesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: coarsePointer ? "low-power" : "default",
    });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const galaxyLoc = gl.getUniformLocation(program, "u_galaxy");
    const dprLoc = gl.getUniformLocation(program, "u_dpr");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const hiddenLoc = gl.getUniformLocation(program, "u_hidden");
    const hasImageLoc = gl.getUniformLocation(program, "u_hasImage");
    const fitLoc = gl.getUniformLocation(program, "u_fit");

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([40, 16, 32, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(hiddenLoc, 0);

    let hasImage = 0;
    let running = true;
    const collage = document.createElement("canvas");
    const loaded: Array<LoadedCover | undefined> = [];
    let placedCovers: PlacedCover[] = [];

    const uploadCollage = () => {
      const ready = loaded.filter((item): item is LoadedCover => Boolean(item));
      if (!running || ready.length !== covers.length) return;
      if (canvas.width < 2 || canvas.height < 2) return;
      if (collage.width !== canvas.width || collage.height !== canvas.height) {
        collage.width = canvas.width;
        collage.height = canvas.height;
      }
      placedCovers = paintCollage(
        collage,
        ready,
        canvas.width / Math.max(canvas.clientWidth, 1),
      );
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, collage);
      hasImage = 1;
    };

    covers.forEach((cover, index) => {
      const image = new Image();
      image.onload = () => {
        loaded[index] = { id: cover.id, image };
        uploadCollage();
      };
      image.src = cover.src;
    });
    document.fonts.load("600 64px Caveat").then(() => uploadCollage());

    const pointer = { x: -1, y: -1 };
    const narrow = window.innerWidth < 720;
    const galaxy = narrow ? { x: 0.5, y: 0.46 } : { x: 0.58, y: 0.5 };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let laidOutWidth = 0;
    let laidOutHeight = 0;

    const pixelRatio = () => {
      const native = window.devicePixelRatio || 1;
      return Math.min(native, coarsePointer || window.innerWidth < 900 ? 1.25 : 1.5);
    };

    const resize = () => {
      const dpr = pixelRatio();
      const width = Math.min(4096, Math.floor(canvas.clientWidth * dpr));
      const height = Math.min(4096, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (width !== laidOutWidth || height !== laidOutHeight) {
        laidOutWidth = width;
        laidOutHeight = height;
        uploadCollage();
      }
    };

    const touchDrag = coarsePointer || window.matchMedia("(hover: none)").matches;
    let dragging = false;
    let tracking = false;
    let gestureMoved = false;
    let downInLens = false;
    let hasDragged = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastClientX = -1;
    let lastClientY = -1;

    const pointInLens = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const aspect = rect.width / Math.max(rect.height, 1);
      const uvx = (clientX - rect.left) / rect.width;
      const uvy = (clientY - rect.top) / rect.height;
      const px = (uvx - 0.5) * aspect;
      const py = 0.5 - uvy;
      const fx = (galaxy.x - 0.5) * aspect;
      const fy = galaxy.y - 0.5;
      const radius = GLASS_RADIUS * glassFit(rect.width, rect.height) * 0.9;
      return Math.hypot(px - fx, py - fy) < radius;
    };

    const coverAt = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || collage.width < 2) return null;
      const x = ((clientX - rect.left) / rect.width) * collage.width;
      const y = ((clientY - rect.top) / rect.height) * collage.height;
      for (let index = placedCovers.length - 1; index >= 0; index -= 1) {
        const cover = placedCovers[index];
        const dx = x - cover.cx;
        const dy = y - cover.cy;
        const cos = Math.cos(cover.tilt);
        const sin = Math.sin(cover.tilt);
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        if (Math.abs(localX) <= cover.w / 2 && Math.abs(localY) <= cover.h / 2) return cover.id;
      }
      return null;
    };

    const place = (event: PointerEvent) => {
      if (overChrome(event)) return;
      const rect = canvas.getBoundingClientRect();
      const nextX = (event.clientX - rect.left) / rect.width;
      const nextY = 1 - (event.clientY - rect.top) / rect.height;
      if (nextX < 0 || nextX > 1 || nextY < 0 || nextY > 1) return;
      pointer.x = nextX;
      pointer.y = nextY;
    };

    const hideHint = () => {
      if (hintRef.current) hintRef.current.hidden = true;
    };

    const onPointer = (event: PointerEvent) => {
      if (tracking) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        if (dx * dx + dy * dy > 36) gestureMoved = true;
      }
      if (touchDrag && !dragging) return;
      if (touchDrag && gestureMoved) {
        hasDragged = true;
        hideHint();
      }
      place(event);
      if (!touchDrag) {
        lastClientX = event.clientX;
        lastClientY = event.clientY;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (overChrome(event)) return;
      tracking = true;
      gestureMoved = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      downInLens = pointInLens(event.clientX, event.clientY);
      if (!touchDrag) return;
      dragging = true;
      place(event);
    };

    const onPointerUp = () => {
      tracking = false;
      dragging = false;
    };

    const onClick = (event: MouseEvent) => {
      if (overChrome(event) || gestureMoved) return;
      if (touchDrag && !downInLens) return;
      if (!pointInLens(event.clientX, event.clientY)) return;
      const id = coverAt(event.clientX, event.clientY);
      if (!id) return;
      window.open(steamUrl(id), "_blank", "noopener,noreferrer");
    };

    const hintTimer = window.setTimeout(() => {
      if (!hasDragged && touchDrag && hintRef.current) hintRef.current.hidden = false;
    }, HINT_DELAY);

    const draw = (now: number) => {
      if (!running) return;
      resize();
      if (pointer.x >= 0) {
        if (touchDrag && dragging) {
          galaxy.x = pointer.x;
          galaxy.y = pointer.y;
        } else if (!touchDrag) {
          galaxy.x += (pointer.x - galaxy.x) * 0.04;
          galaxy.y += (pointer.y - galaxy.y) * 0.04;
        }
      }
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(galaxyLoc, galaxy.x, galaxy.y);
      gl.uniform1f(dprLoc, pixelRatio());
      gl.uniform1f(timeLoc, reduceMotion ? 0 : now * 0.001);
      gl.uniform1f(hasImageLoc, hasImage);
      const fit = glassFit(canvas.clientWidth, canvas.clientHeight);
      gl.uniform1f(fitLoc, fit);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!touchDrag && lastClientX >= 0) {
        const hit =
          pointInLens(lastClientX, lastClientY) && coverAt(lastClientX, lastClientY);
        canvas.style.cursor = hit ? "pointer" : "";
      }
      const hint = hintRef.current;
      if (hint && !hint.hidden) {
        const rect = canvas.getBoundingClientRect();
        const x = rect.left + galaxy.x * rect.width;
        const y = rect.top + (1 - galaxy.y) * rect.height;
        const fit = glassFit(rect.width, rect.height);
        const lift = GLASS_RADIUS * fit * rect.height + 14;
        const headerBottom =
          document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
        const hintTop = Math.max(headerBottom + 6, y - lift);
        hint.style.transform = `translate(${x}px, ${hintTop}px) translate(-50%, -100%)`;
      }
      frame = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && running) frame = requestAnimationFrame(draw);
    };

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      window.clearTimeout(hintTimer);
      cancelAnimationFrame(frame);
      canvas.style.cursor = "";
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="webgl-canvas games-canvas" aria-hidden="true" />
      <ul className="sr-only">
        {covers.map((cover) => (
          <li key={cover.id}>
            <a href={steamUrl(cover.id)} target="_blank" rel="noreferrer">
              {cover.title} on Steam
            </a>
          </li>
        ))}
      </ul>
      <p ref={hintRef} className="glass-hint" hidden>
        drag around!
      </p>
    </>
  );
}
