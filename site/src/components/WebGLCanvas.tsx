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
uniform float u_glass;
uniform sampler2D u_noise;
uniform sampler2D u_message;
uniform float u_hasImage;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 sampleUv = vec2(uv.x, 1.0 - uv.y);
  vec3 paper = vec3(0.953, 0.949, 0.937);
  vec3 color = paper;
  if (u_hasImage > 0.5) color = texture2D(u_noise, sampleUv).rgb;

  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 focus = (u_galaxy - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  vec2 q = p - focus;
  float r = length(q);

  float outerR = 0.42 * u_glass;
  float innerR = 0.392 * u_glass;
  float aa = 0.0032;

  if (u_hasImage > 0.5) {
    float inside = 1.0 - smoothstep(innerR - aa, innerR + aa * 0.2, r);
    vec3 message = texture2D(u_message, sampleUv).rgb;
    color = mix(color, message, inside);
  }

  float ring = smoothstep(innerR - aa, innerR + aa, r)
    * (1.0 - smoothstep(outerR - aa, outerR + aa, r));

  vec2 grip = normalize(vec2(-0.68, -0.73));
  vec2 side = vec2(-grip.y, grip.x);
  float along = dot(q, grip);
  float across = abs(dot(q, side));
  float handle = smoothstep(outerR - 0.026 * u_glass, outerR - 0.006 * u_glass, along)
    * (1.0 - smoothstep(outerR + 0.78 * u_glass, outerR + 0.84 * u_glass, along))
    * (1.0 - smoothstep(0.03 * u_glass, 0.042 * u_glass, across));
  float collar = smoothstep(outerR - 0.024 * u_glass, outerR - 0.006 * u_glass, along)
    * (1.0 - smoothstep(outerR + 0.04 * u_glass, outerR + 0.06 * u_glass, along))
    * (1.0 - smoothstep(0.048 * u_glass, 0.06 * u_glass, across));

  float silhouette = clamp(max(ring, max(handle, collar)), 0.0, 1.0);
  color = mix(color, vec3(0.012), silhouette);
  gl_FragColor = vec4(color, 1.0);
}
`;

const COPY =
  "HI, I'M KRISTEN. WELCOME TO MY MUSINGS ON GAMES, BOOKS, AND OTHER THINGS.";

const FOCUS_WORD = "KRISTEN";

const PAPER = "#f3f2ef";
const LENS = "#ff1208";
const INK = "#2a1012";

const NOISE_LAYERS = [
  { color: "#00e8ff", dx: -0.42, dy: -0.08, shift: 0 },
  { color: "#ffe500", dx: 0.36, dy: 0.16, shift: 0 },
  { color: "#ff00d0", dx: 0.06, dy: -0.28, shift: 0 },
  { color: "#00e8ff", dx: 0.22, dy: 0.62, shift: 4 },
  { color: "#ffe500", dx: -0.34, dy: 0.48, shift: 3 },
  { color: "#ff00d0", dx: 0.18, dy: 0.78, shift: 2 },
];

type BlockLayout = {
  fontSize: number;
  lineHeight: number;
  centerX: number;
  firstCenterY: number;
  lines: string[];
  focusIndex: number;
};

function glassScale(cssWidth: number, cssHeight: number) {
  const outerRadius = 0.42 * cssHeight;
  const maxRadius =
    cssWidth < 720
      ? Math.min(cssWidth * 0.48, cssHeight * 0.4)
      : Math.min(cssWidth * 0.5, cssHeight * 0.46);
  return Math.min(1, maxRadius / Math.max(outerRadius, 1));
}

function wrapLines(ctx: CanvasRenderingContext2D, maxWidth: number) {
  const words = COPY.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function layoutBlock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scale: number,
  topInset: number,
): BlockLayout {
  const lensDiameter = height * 0.784 * scale;
  const maxWidth = width < 720 ? width * 0.82 : width * 0.65;
  let fontSize = Math.min(height * 0.088, width * 0.105, lensDiameter * 0.42);

  const applyFont = (size: number) => {
    ctx.font = `800 ${size}px Syne, sans-serif`;
    ctx.letterSpacing = "0.045em";
  };

  applyFont(fontSize);
  let lines = wrapLines(ctx, maxWidth);
  let lineHeight = fontSize * 1.16;
  const available = Math.max(height - topInset - height * 0.06, fontSize * 2);

  for (let attempt = 0; attempt < 18; attempt++) {
    applyFont(fontSize);
    lines = wrapLines(ctx, maxWidth);
    lineHeight = fontSize * 1.16;
    const widest = lines.reduce(
      (max, line) => Math.max(max, ctx.measureText(line).width),
      0,
    );
    const tooWide = widest > maxWidth;
    const tooTall = lines.length * lineHeight > available;
    if (!tooWide && !tooTall) break;
    fontSize *= 0.92;
  }

  applyFont(fontSize);
  lines = wrapLines(ctx, maxWidth);
  lineHeight = fontSize * 1.16;
  const blockH = lines.length * lineHeight;
  const firstCenterY =
    topInset + (height - topInset - blockH) / 2 + lineHeight / 2;
  const focusIndex = Math.max(
    0,
    lines.findIndex((line) => line.includes(FOCUS_WORD)),
  );

  return {
    fontSize,
    lineHeight,
    centerX: width / 2,
    firstCenterY,
    lines,
    focusIndex,
  };
}

function shifted(line: string, amount: number) {
  if (!amount) return line;
  const shift = ((amount % line.length) + line.length) % line.length;
  return line.slice(shift) + line.slice(0, shift);
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  layout: BlockLayout,
  dx: number,
  dy: number,
  shift: number,
) {
  layout.lines.forEach((line, index) => {
    const amount = index === layout.lines.length - 1 ? 0 : shift;
    ctx.fillText(
      shifted(line, amount),
      layout.centerX + dx,
      layout.firstCenterY + index * layout.lineHeight + dy,
    );
  });
}

function paintTextures(
  noise: HTMLCanvasElement,
  message: HTMLCanvasElement,
  width: number,
  height: number,
  scale: number,
  topInset: number,
) {
  noise.width = width;
  noise.height = height;
  message.width = width;
  message.height = height;

  const noiseContext = noise.getContext("2d");
  const messageContext = message.getContext("2d");
  if (!noiseContext || !messageContext) return null;

  const layout = layoutBlock(noiseContext, width, height, scale, topInset);
  const font = `800 ${layout.fontSize}px Syne, sans-serif`;

  noiseContext.clearRect(0, 0, width, height);
  noiseContext.fillStyle = PAPER;
  noiseContext.fillRect(0, 0, width, height);
  noiseContext.font = font;
  noiseContext.letterSpacing = "0.045em";
  noiseContext.textAlign = "center";
  noiseContext.textBaseline = "middle";
  noiseContext.globalCompositeOperation = "multiply";
  for (const layer of NOISE_LAYERS) {
    noiseContext.fillStyle = layer.color;
    drawLines(
      noiseContext,
      layout,
      layer.dx * layout.fontSize,
      layer.dy * layout.fontSize,
      layer.shift,
    );
  }
  noiseContext.globalCompositeOperation = "source-over";

  messageContext.clearRect(0, 0, width, height);
  messageContext.fillStyle = LENS;
  messageContext.fillRect(0, 0, width, height);
  messageContext.font = font;
  messageContext.letterSpacing = "0.045em";
  messageContext.textAlign = "center";
  messageContext.textBaseline = "middle";
  messageContext.filter = `blur(${Math.max(0.6, layout.fontSize * 0.012)}px)`;
  messageContext.fillStyle = INK;
  drawLines(messageContext, layout, 0, 0, 0);
  messageContext.filter = "none";

  return layout;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
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

function makeTexture(gl: WebGLRenderingContext) {
  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([243, 242, 239, 255]),
  );
  return texture;
}

const GLASS_OUTER = 0.42;
const HINT_DELAY = 5000;

export function WebGLCanvas() {
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
    const fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentSource,
    );
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
    const glassLoc = gl.getUniformLocation(program, "u_glass");
    const noiseLoc = gl.getUniformLocation(program, "u_noise");
    const messageLoc = gl.getUniformLocation(program, "u_message");
    const hasImageLoc = gl.getUniformLocation(program, "u_hasImage");

    const noiseTexture = makeTexture(gl);
    const messageTexture = makeTexture(gl);
    if (!noiseTexture || !messageTexture) return;
    gl.uniform1i(noiseLoc, 0);
    gl.uniform1i(messageLoc, 1);

    let hasImage = 0;
    let running = true;
    let laidOutWidth = 0;
    let laidOutHeight = 0;
    const noiseCanvas = document.createElement("canvas");
    const messageCanvas = document.createElement("canvas");
    const pointer = { x: -1, y: -1 };
    const galaxy = { x: 0.5, y: 0.44 };
    let frame = 0;

    const pixelRatio = () => {
      const native = window.devicePixelRatio || 1;
      return Math.min(
        native,
        coarsePointer || window.innerWidth < 900 ? 1.25 : 1.5,
      );
    };

    const uploadTextures = () => {
      if (!running || canvas.width < 2 || canvas.height < 2) return;
      const scale = glassScale(canvas.clientWidth, canvas.clientHeight);
      const header = document.querySelector(".site-header");
      const insetCss = header?.getBoundingClientRect().height ?? 0;
      const topInset =
        insetCss * (canvas.height / Math.max(canvas.clientHeight, 1));
      const layout = paintTextures(
        noiseCanvas,
        messageCanvas,
        canvas.width,
        canvas.height,
        scale,
        topInset,
      );
      if (!layout) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        noiseCanvas,
      );
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, messageTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        messageCanvas,
      );
      hasImage = 1;
      if (pointer.x < 0) {
        const y = layout.firstCenterY + layout.focusIndex * layout.lineHeight;
        galaxy.x = 0.5;
        galaxy.y = 1 - y / canvas.height;
      }
    };

    document.fonts.load("800 64px Syne").then(() => {
      if (running) uploadTextures();
    });

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
        uploadTextures();
      }
    };

    const touchDrag =
      coarsePointer || window.matchMedia("(hover: none)").matches;
    let dragging = false;
    let hasDragged = false;
    let dragStartX = 0;
    let dragStartY = 0;
    const overChrome = (event: Event) => {
      const target = event.target;
      return (
        target instanceof Element && Boolean(target.closest(".site-header"))
      );
    };

    const place = (event: PointerEvent) => {
      if (overChrome(event)) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      pointer.x = x;
      pointer.y = 1 - y;
    };

    const hideHint = () => {
      if (hintRef.current) hintRef.current.hidden = true;
    };

    const onPointer = (event: PointerEvent) => {
      if (touchDrag && !dragging) return;
      if (touchDrag) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        if (dx * dx + dy * dy > 36) {
          hasDragged = true;
          hideHint();
        }
      }
      place(event);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!touchDrag || overChrome(event)) return;
      dragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      place(event);
    };

    const onPointerUp = () => {
      dragging = false;
    };

    const hintTimer = window.setTimeout(() => {
      if (!hasDragged && touchDrag && hintRef.current)
        hintRef.current.hidden = false;
    }, HINT_DELAY);

    const draw = () => {
      if (!running) return;
      resize();
      const scale = glassScale(canvas.clientWidth, canvas.clientHeight);
      if (pointer.x >= 0) {
        if (touchDrag && dragging) {
          galaxy.x = pointer.x;
          galaxy.y = pointer.y;
        } else if (!touchDrag) {
          galaxy.x += (pointer.x - galaxy.x) * 0.08;
          galaxy.y += (pointer.y - galaxy.y) * 0.08;
        }
      }
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(galaxyLoc, galaxy.x, galaxy.y);
      gl.uniform1f(glassLoc, scale);
      gl.uniform1f(hasImageLoc, hasImage);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      const hint = hintRef.current;
      if (hint && !hint.hidden) {
        const rect = canvas.getBoundingClientRect();
        const x = rect.left + galaxy.x * rect.width;
        const y = rect.top + (1 - galaxy.y) * rect.height;
        const lift = GLASS_OUTER * scale * rect.height + 12;
        const headerBottom =
          document.querySelector(".site-header")?.getBoundingClientRect()
            .bottom ?? 0;
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
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      window.clearTimeout(hintTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteTexture(noiseTexture);
      gl.deleteTexture(messageTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="webgl-canvas" aria-hidden="true" />
      <p ref={hintRef} className="glass-hint" hidden>
        drag around!
      </p>
    </>
  );
}
