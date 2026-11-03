/**
 * The sign-in panel's WebGL background, in the sidebar's blue.
 *
 * Adapted from "Background Gradient Shader" (ChromaTide) by nikolas-sapa on
 * 21st.dev (https://21st.dev/@nikolas-sapa/components/background-gradient-shader):
 * its domain-warped noise field and three-stop ramp, drawn once a frame at
 * about 30 fps. Changes for FYT:
 *  - the ramp comes from the sidebar tokens (--nav-bg-2, --nav-bg, --nav-glow)
 *    and follows the theme through `data-theme`;
 *  - a calm zone holds the field at or below --nav-bg behind the panel's text,
 *    so white copy keeps its contrast;
 *  - a little per-pixel dither, to stop banding in the slow gradients;
 *  - the React wrapper is gone, and a lost context falls back to Canvas 2D
 *    through `onFail`, see ./grain-field.tsx.
 *
 * Source: https://design.helpmarq.com/r/background-gradient-shader.json
 * (ns-ui, https://github.com/nikolas-sapa/ns-ui), licensed under MIT:
 *
 * MIT License
 *
 * Copyright (c) 2026 Nikolas Sapalidis
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export type Rgb = [number, number, number];

const VERTEX = `attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAGMENT = `precision highp float;
uniform vec2 uRes;       // drawing buffer, device pixels
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uBase;
uniform vec3 uGlow;
uniform vec2 uCalm;      // right and bottom of the calm box, device pixels
uniform float uCalmSoft; // its soft edge, device pixels

float hash21(vec2 p) {
  p = fract(p * vec2(419.2, 371.9));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * vnoise(p);
    p = p * 2.15 + 5.7;
    amp *= 0.52;
  }
  return sum;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.4;
  p += vec2(uTime * 0.045, uTime * -0.028);

  vec2 warp = vec2(fbm(p + uTime * 0.06), fbm(p - uTime * 0.05 + 8.3));
  float t = clamp(0.5 + (fbm(p * 1.3 + warp * 1.5) - 0.5) * 2.1, 0.0, 1.0);

  // Behind the text the field still moves, but never brighter than --nav-bg.
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float calm = 1.0 - smoothstep(0.0, uCalmSoft, length(max(px - uCalm, vec2(0.0))));
  t = mix(t, min(t, 0.5), calm);

  vec3 color = t < 0.5
    ? mix(uDeep, uBase, smoothstep(0.0, 0.5, t))
    : mix(uBase, uGlow, smoothstep(0.5, 1.0, t));

  // Interleaved gradient noise. hash21 is for the noise lattice: fed whole pixel
  // coordinates it draws a visible grid.
  float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  color += (dither - 0.5) * 0.012;
  gl_FragColor = vec4(color, 1.0);
}`;

/** Frames apart: the drift is slow enough that 30 fps looks the same as 60. */
const FRAME_MS = 1000 / 30;
/** The field has no fine detail, so a lower DPR is invisible and much cheaper. */
const MAX_DPR = 1.5;
/** Start well into the drift, which also gives reduced motion a settled frame. */
const START_TIME = 36;
/** Grace for the browser to give a lost context back. */
const RESTORE_WAIT_MS = 2500;
/** Padding around the text, and the calm zone's falloff as part of the short side. */
const CALM_MARGIN = 16;
export const CALM_SOFT = 0.24;

function toRgb(hex: string): Rgb {
  const n = parseInt(hex.trim().replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The sidebar tokens for the current theme, as 0-255 channels. */
export function readPanelColors() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => toRgb(css.getPropertyValue(name));
  return { deep: token("--nav-bg-2"), base: token("--nav-bg"), glow: token("--nav-glow"), pale: token("--nav-ink") };
}

/** Calls back whenever the theme flips. Returns the unsubscribe. */
export function onThemeChange(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The right and bottom edge, in CSS pixels from the canvas corner, of what must stay calm. */
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

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

type Options = { still: boolean; onFail: () => void };

export function startTide(canvas: HTMLCanvasElement, { still, onFail }: Options) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  }) as WebGLRenderingContext | null;

  let failTimer = 0;
  const failSoon = (delay = 0) => {
    window.clearTimeout(failTimer);
    failTimer = window.setTimeout(onFail, delay);
  };
  if (!gl) {
    failSoon();
    return () => window.clearTimeout(failTimer);
  }

  let uniforms: Record<string, WebGLUniformLocation | null> | null = null;
  let raf = 0;
  let last = 0;
  const calmElements = findCalmElements(canvas);

  const build = () => {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return false;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(
      ["uRes", "uTime", "uDeep", "uBase", "uGlow", "uCalm", "uCalmSoft"].map((name) => [name, gl.getUniformLocation(program, name)]),
    );
    return true;
  };

  const draw = (now: number) => {
    if (!uniforms || canvas.width < 1 || canvas.height < 1) return;
    gl.uniform1f(uniforms.uTime, still ? START_TIME : START_TIME + now / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const applyColors = () => {
    if (!uniforms) return;
    const { deep, base, glow } = readPanelColors();
    const send = (location: WebGLUniformLocation | null, [r, g, b]: Rgb) => gl.uniform3f(location, r / 255, g / 255, b / 255);
    send(uniforms.uDeep, deep);
    send(uniforms.uBase, base);
    send(uniforms.uGlow, glow);
    draw(performance.now());
  };

  const resize = () => {
    if (!uniforms) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
    const calm = measureCalm(canvas, calmElements);
    gl.uniform2f(uniforms.uCalm, calm.right * dpr, calm.bottom * dpr);
    gl.uniform1f(uniforms.uCalmSoft, Math.min(canvas.width, canvas.height) * CALM_SOFT);
    draw(performance.now());
  };

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    if (now - last < FRAME_MS) return;
    last = now;
    draw(now);
  };
  const run = () => {
    if (!build()) {
      failSoon();
      return;
    }
    applyColors();
    resize();
    if (!still) raf = requestAnimationFrame(tick);
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(raf);
    uniforms = null;
    failSoon(RESTORE_WAIT_MS);
  };
  const onRestored = () => {
    window.clearTimeout(failTimer);
    run();
  };

  const stopTheme = onThemeChange(applyColors);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  for (const element of calmElements) observer.observe(element);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  run();

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(failTimer);
    stopTheme();
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
  };
}
