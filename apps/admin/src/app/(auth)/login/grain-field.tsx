"use client";

/**
 * Animated grain gradient for the sign-in panel: two soft colour fields in
 * opposite corners whose edges dissolve into stipple.
 *
 * The look comes from the `GrainGradient` shader (shape "corners") used by
 * "Auth Section 1" by solaceui on 21st.dev
 * (https://21st.dev/@solaceui/components/auth-section-1). That shader needs
 * WebGL and a new dependency, so this is a small Canvas 2D rebuild instead,
 * and none of the shader's code is used:
 *  - each pixel is a corner-distance value plus a fixed noise offset, looked
 *    up in a 256-step ramp of cool colours (deep navy, pale azure fringe,
 *    brand azure); the source's orange and white are not used;
 *  - about 20 frames a second at a reduced resolution. requestAnimationFrame
 *    stops by itself in a hidden tab, and a canvas with no size draws nothing;
 *  - prefers-reduced-motion: one still frame.
 * Until the first frame the panel shows its own navy background.
 */
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const FRAME_MS = 50;
const MAX_PIXELS = 300_000;
const STILL_T = 12;

/** value (0-1) -> colour. The hard step at 0.5 is what makes the stipple. */
const STOPS: [number, number, number, number][] = [
  [0, 6, 14, 36],
  [0.47, 9, 22, 56],
  [0.5, 190, 212, 255],
  [0.56, 111, 160, 255],
  [0.66, 44, 99, 214],
  [1, 30, 79, 184],
];

function buildRamp() {
  const ramp = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let s = 0;
    while (s < STOPS.length - 2 && v > STOPS[s + 1][0]) s++;
    const [a, b] = [STOPS[s], STOPS[s + 1]];
    const k = Math.min(1, Math.max(0, (v - a[0]) / (b[0] - a[0])));
    const mix = (c: number) => Math.round(a[c] + (b[c] - a[c]) * k);
    // ImageData is RGBA in memory: little-endian ABGR as a Uint32.
    ramp[i] = (255 << 24) | (mix(3) << 16) | (mix(2) << 8) | mix(1);
  }
  return ramp;
}

/** Seeded so the grain is the same on every load. */
function buildNoise(size: number) {
  const noise = new Int8Array(size);
  let s = 0x2f6e2b1;
  for (let i = 0; i < size; i++) {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    noise[i] = ((t ^ (t >>> 14)) & 0xff) - 128;
  }
  return noise;
}

function paint(buf: Uint32Array, noise: Int8Array, ramp: Uint32Array, w: number, h: number, t: number) {
  const waveX = new Float32Array(w);
  const waveY = new Float32Array(h);
  for (let x = 0; x < w; x++) waveX[x] = 0.1 * Math.sin((x / w) * 6.1 - t * 0.27);
  for (let y = 0; y < h; y++) waveY[y] = 0.13 * Math.sin((y / h) * 4.7 + t * 0.34);

  // Ellipse radii, as fractions of the panel, breathing out of step.
  const trX = 0.33 + 0.03 * Math.sin(t * 0.31);
  const trY = 0.5 + 0.06 * Math.sin(t * 0.23 + 1.1);
  const blX = 0.42 + 0.05 * Math.sin(t * 0.27 + 2.3);
  const blY = 0.36 + 0.05 * Math.sin(t * 0.19 + 0.4);

  let i = 0;
  for (let y = 0; y < h; y++) {
    const v = y / h;
    const wy = waveY[y];
    for (let x = 0; x < w; x++, i++) {
      const u = x / w;
      const wave = waveX[x] + wy;
      const ax = (1 - u) / trX;
      const ay = v / trY;
      const bx = u / blX;
      const by = (1 - v) / blY;
      // 1 at a corner, 0 on the ellipse edge, negative outside.
      const a = 1 - Math.sqrt(ax * ax + ay * ay) + wave;
      const b = 1 - Math.sqrt(bx * bx + by * by) - wave;
      const value = 0.5 + 0.95 * (a > b ? a : b) + noise[i] * 0.0019;
      const index = value <= 0 ? 0 : value >= 1 ? 255 : (value * 255) | 0;
      buf[i] = ramp[index];
    }
  }
}

export function GrainField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    const ramp = buildRamp();
    let raf = 0;
    let last = 0;
    let image: ImageData | null = null;
    let buf: Uint32Array | null = null;
    let noise: Int8Array | null = null;

    const draw = (t: number) => {
      if (!image || !buf || !noise) return;
      paint(buf, noise, ramp, image.width, image.height, t);
      ctx.putImageData(image, 0, 0);
    };

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (width < 1 || height < 1) {
        image = null;
        return;
      }
      const scale = Math.max(1.5, Math.sqrt((width * height) / MAX_PIXELS));
      const w = Math.ceil(width / scale);
      const h = Math.ceil(height / scale);
      canvas.width = w;
      canvas.height = h;
      image = ctx.createImageData(w, h);
      buf = new Uint32Array(image.data.buffer);
      noise = buildNoise(w * h);
      draw(reduce ? STILL_T : STILL_T + performance.now() / 1000);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(STILL_T + now / 1000);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
