/**
 * WebGL renderer for the sign-in panel: slow liquid light in azure on navy.
 *
 * Two passes, so the expensive part stays cheap and the grain stays fine:
 *  1. Fluid, at about half the panel's CSS size. Noise warped by noise
 *     (Inigo Quilez, "domain warping") so shapes stretch and fold. The noise
 *     gradients rotate over time ("flow noise", Perlin and Neyret), which
 *     evolves the field without sliding it and without a loop point.
 *  2. Finish, at device resolution. Colour ramp, the calm zone behind the text,
 *     and film grain that doubles as dither, so the gradient cannot band.
 *
 * The shaders are GLSL ES 1.00, so the same code runs on WebGL2 and WebGL1.
 * Any failure (no WebGL, a shader that will not compile, a lost context that
 * never comes back) ends in `onFail`, and GrainField swaps to Canvas 2D.
 *
 * Elements marked `data-grain-calm` keep the panel dark behind them: their
 * measured box is passed to the finish pass, which dims the fluid there, so
 * white text holds its contrast whatever the flow is doing.
 */

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const FLUID = `${PRECISION}
varying vec2 vUv;
uniform vec2 uField;    // panel size in noise units
uniform float uTime;
uniform vec3 uPointer;  // xy in panel uv (y down), z strength

const float TAU = 6.2831853;
const mat2 TURN = mat2(0.8, 0.6, -0.6, 0.8);

// "Hash without Sine" by Dave Hoskins (MIT).
float hash(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * 0.1031);
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}

// Gradient noise whose gradients spin: flow noise.
float noise(vec2 p, float spin) {
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i) * TAU + spin;
  float b = hash(i + vec2(1.0, 0.0)) * TAU + spin;
  float c = hash(i + vec2(0.0, 1.0)) * TAU + spin;
  float d = hash(i + vec2(1.0, 1.0)) * TAU + spin;
  float n00 = dot(vec2(cos(a), sin(a)), f);
  float n10 = dot(vec2(cos(b), sin(b)), f - vec2(1.0, 0.0));
  float n01 = dot(vec2(cos(c), sin(c)), f - vec2(0.0, 1.0));
  float n11 = dot(vec2(cos(d), sin(d)), f - vec2(1.0, 1.0));
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
}

float fbm(vec2 p, float spin) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amp * noise(p, spin);
    p = TURN * p * 1.9 + 11.7;
    spin *= 1.3;
    amp *= 0.47;
  }
  return sum;
}

// 1 at a corner, falling smoothly to 0 past the ellipse with these radii.
float corner(vec2 d, vec2 radii) {
  float r = length(d / radii);
  return 1.0 - smoothstep(0.15, 1.25, r);
}

void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 p = uv * uField;

  // The cursor bends the flow into a soft eddy around it.
  vec2 toPointer = (uv - uPointer.xy) * uField;
  float pull = uPointer.z * exp(-dot(toPointer, toPointer) * 3.2);
  p += pull * 0.42 * vec2(-toPointer.y, toPointer.x);

  float t = uTime * 0.68;
  vec2 q = vec2(fbm(p + vec2(0.0, 0.3), t * 0.34), fbm(p + vec2(5.2, 1.3), t * 0.29 + 1.7));
  vec2 warped = p + 2.8 * q;
  vec2 r = vec2(
    fbm(warped + vec2(1.7, 9.2), t * 0.41 + 4.1),
    fbm(warped + vec2(8.3, 2.8), t * 0.37 + 2.6)
  );
  vec2 folded = p + 2.6 * r;
  float f = fbm(folded, t * 0.26);

  // Slope across the fold, lit from the upper right: the silk highlight.
  float e = 0.09;
  float sheen = (fbm(folded + vec2(-e, e * 0.7), t * 0.26) - f) / e;

  // Two masses in opposite corners, their edges carried along by the flow.
  vec2 at = uv + r * 0.34;
  float mass = max(
    corner(at - vec2(1.04, -0.04), vec2(0.78, 0.74)),
    corner(at - vec2(-0.04, 1.04), vec2(0.92, 0.66))
  );

  float body = smoothstep(-0.34, 0.5, f + 0.32 * length(q));
  float density = mass * (0.3 + 0.84 * body) * (0.72 + 0.5 * mass);

  gl_FragColor = vec4(
    clamp(density, 0.0, 1.0),
    clamp(sheen * 0.38 + 0.5, 0.0, 1.0),
    clamp(length(r) * 1.7, 0.0, 1.0),
    1.0
  );
}`;

const FINISH = `${PRECISION}
varying vec2 vUv;
uniform sampler2D uFluid;
uniform vec2 uSize;      // drawing buffer, device pixels
uniform vec2 uCalm;      // right and bottom of the calm box, device pixels
uniform float uCalmSoft; // its soft edge, device pixels
uniform vec2 uSeed;

const vec3 NAVY_0 = vec3(5.0, 10.0, 26.0) / 255.0;
const vec3 NAVY_1 = vec3(11.0, 21.0, 48.0) / 255.0;
const vec3 AZURE_0 = vec3(30.0, 79.0, 184.0) / 255.0;
const vec3 AZURE_1 = vec3(59.0, 111.0, 224.0) / 255.0;
const vec3 LIGHT = vec3(157.0, 187.0, 255.0) / 255.0;

float hash(vec2 p) {
  vec3 h = fract(vec3(p.xyx) * 0.1031);
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}

vec3 ramp(float d) {
  vec3 c = mix(NAVY_0, NAVY_1, smoothstep(0.0, 0.2, d));
  c = mix(c, AZURE_0, smoothstep(0.14, 0.56, d));
  c = mix(c, AZURE_1, smoothstep(0.5, 0.8, d));
  return mix(c, LIGHT, smoothstep(0.76, 1.08, d));
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec3 fluid = texture2D(uFluid, vUv).rgb;

  float toCalm = length(max(px - uCalm, vec2(0.0)));
  float calm = 1.0 - smoothstep(0.0, uCalmSoft, toCalm);

  float sheen = fluid.g - 0.5;
  float density = fluid.r + 0.2 * fluid.r * fluid.b * fluid.b;
  density += sheen * 0.34 * smoothstep(0.1, 0.55, fluid.r);

  // The calm zone dims the flow rather than erasing it: it still moves, but it
  // can never climb past the darker azure.
  density *= 1.0 - 0.7 * calm;
  vec3 color = ramp(density);

  // Thin light along the steepest folds.
  float ridge = smoothstep(0.1, 0.46, sheen) * smoothstep(0.3, 0.8, fluid.r);
  color += (1.0 - calm) * ridge * 0.17 * (LIGHT - color);

  // Triangular noise, one sample per device pixel. Heavier on the midtones,
  // where film grain sits and where banding would show.
  vec2 cell = gl_FragCoord.xy + uSeed;
  float grain = hash(cell) + hash(cell + vec2(17.3, 41.9)) - 1.0;
  float weight = 0.014 + 0.04 * smoothstep(0.02, 0.4, density) * (1.0 - 0.5 * density);
  color += grain * weight * (1.0 - 0.6 * calm);

  gl_FragColor = vec4(color, 1.0);
}`;

/** Fluid pass size limit. It has no fine detail, so upscaling it is invisible. */
const FLUID_SCALE = 0.5;
const FLUID_MAX_PIXELS = 180_000;
/** Finish pass limit: the DPR cap, and a pixel budget for very large panels. */
const MAX_DPR = 2;
const FINISH_MAX_PIXELS = 6_000_000;
/** Noise units across a panel of average proportions. */
const FIELD_SCALE = 1.45;

const STILL_TIME = 36;
const START_TIME = 36;
/** Longest step a single frame may take, so a stall never jumps the flow. */
const MAX_STEP = 0.05;
const GRAIN_FPS = 24;
/** Seconds for the pointer eddy to catch up: heavy, like moving through water. */
const POINTER_EASE = 0.9;
/** Grace for the browser to give a lost context back. */
const RESTORE_WAIT_MS = 2500;
/** Padding around the text, and the calm zone's falloff as part of the short side. */
const CALM_MARGIN = 16;
export const CALM_SOFT = 0.24;

/** The right and bottom edge, in CSS pixels from the canvas corner, of what must stay dark. */
export function measureCalm(canvas: HTMLCanvasElement, elements: Element[]) {
  const box = canvas.getBoundingClientRect();
  let right = 0;
  let bottom = 0;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    right = Math.max(right, rect.right - box.left);
    bottom = Math.max(bottom, rect.bottom - box.top);
  }
  return { right: right + CALM_MARGIN, bottom: bottom + CALM_MARGIN };
}

export function findCalmElements(canvas: HTMLCanvasElement) {
  return Array.from(canvas.parentElement?.querySelectorAll("[data-grain-calm]") ?? []);
}

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

type Scene = {
  fluid: Program;
  finish: Program;
  texture: WebGLTexture;
  target: WebGLFramebuffer;
  buffer: WebGLBuffer;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function link(gl: WebGLRenderingContext, fragment: string, names: string[]): Program | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  const uniforms: Program["uniforms"] = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
}

function createScene(gl: WebGLRenderingContext): Scene | null {
  const fluid = link(gl, FLUID, ["uField", "uTime", "uPointer"]);
  const finish = link(gl, FINISH, ["uFluid", "uSize", "uCalm", "uCalmSoft", "uSeed"]);
  const texture = gl.createTexture();
  const target = gl.createFramebuffer();
  const buffer = gl.createBuffer();
  if (!fluid || !finish || !texture || !target || !buffer) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  return { fluid, finish, texture, target, buffer };
}

function destroyScene(gl: WebGLRenderingContext, scene: Scene) {
  gl.deleteProgram(scene.fluid.program);
  gl.deleteProgram(scene.finish.program);
  gl.deleteTexture(scene.texture);
  gl.deleteFramebuffer(scene.target);
  gl.deleteBuffer(scene.buffer);
}

type Options = {
  /** Draw one frame and stop: prefers-reduced-motion. */
  still: boolean;
  /** WebGL is unavailable, or stopped working and did not recover. */
  onFail: () => void;
};

/** Starts the panel on `canvas` and returns its cleanup. */
export function startFluid(canvas: HTMLCanvasElement, { still, onFail }: Options) {
  const attributes: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  };
  const gl = (canvas.getContext("webgl2", attributes) ??
    canvas.getContext("webgl", attributes)) as WebGLRenderingContext | null;

  let failTimer = 0;
  const failSoon = (delay = 0) => {
    window.clearTimeout(failTimer);
    failTimer = window.setTimeout(onFail, delay);
  };
  if (!gl) {
    failSoon();
    return () => window.clearTimeout(failTimer);
  }

  const panel = canvas.parentElement;
  const calmElements = findCalmElements(canvas);

  let scene: Scene | null = null;
  let raf = 0;
  let last = 0;
  let time = still ? STILL_TIME : START_TIME;
  let onScreen = true;
  let fluidW = 0;
  let fluidH = 0;
  let fieldX = 1;
  let fieldY = 1;
  let calmX = 0;
  let calmY = 0;
  let calmSoft = 1;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let pointerAmount = 0;
  let aimX = 0.5;
  let aimY = 0.5;
  let aimAmount = 0;

  const draw = () => {
    if (!scene || !fluidW) return;
    const { fluid, finish } = scene;

    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.target);
    gl.viewport(0, 0, fluidW, fluidH);
    gl.useProgram(fluid.program);
    gl.uniform2f(fluid.uniforms.uField, fieldX, fieldY);
    gl.uniform1f(fluid.uniforms.uTime, time);
    gl.uniform3f(fluid.uniforms.uPointer, pointerX, pointerY, pointerAmount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const tick = still ? 0 : Math.floor(time * GRAIN_FPS);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(finish.program);
    gl.uniform1i(finish.uniforms.uFluid, 0);
    gl.uniform2f(finish.uniforms.uSize, canvas.width, canvas.height);
    gl.uniform2f(finish.uniforms.uCalm, calmX, calmY);
    gl.uniform1f(finish.uniforms.uCalmSoft, calmSoft);
    gl.uniform2f(finish.uniforms.uSeed, (tick * 37) % 509, (tick * 61) % 487);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const resize = () => {
    if (!scene) return;
    const box = canvas.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) {
      fluidW = 0;
      return;
    }
    const area = box.width * box.height;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(FINISH_MAX_PIXELS / area));
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);

    const fluidScale = Math.min(FLUID_SCALE, Math.sqrt(FLUID_MAX_PIXELS / area));
    const nextW = Math.max(2, Math.round(box.width * fluidScale));
    const nextH = Math.max(2, Math.round(box.height * fluidScale));
    if (nextW !== fluidW || nextH !== fluidH) {
      fluidW = nextW;
      fluidH = nextH;
      gl.bindTexture(gl.TEXTURE_2D, scene.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fluidW, fluidH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene.texture, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        fluidW = 0;
        failSoon();
        return;
      }
    }

    const unit = Math.sqrt(area);
    fieldX = (box.width / unit) * FIELD_SCALE;
    fieldY = (box.height / unit) * FIELD_SCALE;

    const calm = measureCalm(canvas, calmElements);
    calmX = calm.right * dpr;
    calmY = calm.bottom * dpr;
    calmSoft = Math.min(box.width, box.height) * CALM_SOFT * dpr;

    draw();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const step = Math.min((now - last) / 1000, MAX_STEP);
    last = now;
    time += step;
    const ease = 1 - Math.exp(-step / POINTER_EASE);
    pointerX += (aimX - pointerX) * ease;
    pointerY += (aimY - pointerY) * ease;
    pointerAmount += (aimAmount - pointerAmount) * ease;
    draw();
  };

  const syncLoop = () => {
    const run = !still && Boolean(scene) && onScreen && !document.hidden;
    if (run && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const onLost = (event: Event) => {
    // Without preventDefault the browser never restores the context.
    event.preventDefault();
    scene = null;
    syncLoop();
    failSoon(RESTORE_WAIT_MS);
  };

  const onRestored = () => {
    window.clearTimeout(failTimer);
    fluidW = 0;
    scene = createScene(gl);
    if (!scene) {
      failSoon();
      return;
    }
    resize();
    syncLoop();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const box = canvas.getBoundingClientRect();
    aimX = (event.clientX - box.left) / box.width;
    aimY = (event.clientY - box.top) / box.height;
    if (aimAmount === 0) {
      pointerX = aimX;
      pointerY = aimY;
    }
    aimAmount = 1;
  };
  const onPointerLeave = () => {
    aimAmount = 0;
  };

  scene = createScene(gl);
  if (!scene) {
    failSoon();
    return () => window.clearTimeout(failTimer);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  for (const element of calmElements) resizeObserver.observe(element);

  const screenObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    syncLoop();
  });
  screenObserver.observe(canvas);

  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", syncLoop);
  const followPointer = !still && Boolean(panel) && matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (followPointer) {
    panel?.addEventListener("pointermove", onPointerMove);
    panel?.addEventListener("pointerleave", onPointerLeave);
  }

  resize();
  syncLoop();

  return () => {
    window.clearTimeout(failTimer);
    cancelAnimationFrame(raf);
    raf = 0;
    resizeObserver.disconnect();
    screenObserver.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    document.removeEventListener("visibilitychange", syncLoop);
    if (followPointer) {
      panel?.removeEventListener("pointermove", onPointerMove);
      panel?.removeEventListener("pointerleave", onPointerLeave);
    }
    // The context is kept: this canvas may be reused when `still` changes.
    if (scene) destroyScene(gl, scene);
    scene = null;
  };
}
