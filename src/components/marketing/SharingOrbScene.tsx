"use client";

import { useEffect, useRef } from "react";

/** Deep blue accent — the only energetic color in an otherwise graphite scene. */
const ACCENT = { r: 61, g: 90, b: 128 }; // #3d5a80

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function drawSoftSphere(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  tone: "dark" | "light",
) {
  // Soft contact shadow
  const shadow = ctx.createRadialGradient(x, y + radius * 0.85, 0, x, y + radius * 0.95, radius * 1.35);
  shadow.addColorStop(0, "rgba(11, 12, 14, 0.18)");
  shadow.addColorStop(0.45, "rgba(11, 12, 14, 0.06)");
  shadow.addColorStop(1, "rgba(11, 12, 14, 0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(x, y + radius * 0.95, radius * 0.85, radius * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sphere body — matte studio lighting (no harsh specular)
  const base: [number, string][] =
    tone === "dark"
      ? [
          [0, "rgb(52, 54, 58)"],
          [0.45, "rgb(38, 39, 43)"],
          [1, "rgb(22, 23, 26)"],
        ]
      : [
          [0, "rgb(248, 248, 250)"],
          [0.5, "rgb(228, 229, 233)"],
          [1, "rgb(196, 198, 204)"],
        ];

  const body = ctx.createRadialGradient(
    x - radius * 0.28,
    y - radius * 0.32,
    radius * 0.08,
    x,
    y,
    radius,
  );
  for (const [stop, color] of base) {
    body.addColorStop(stop, color);
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Soft rim light
  const rim = ctx.createRadialGradient(
    x + radius * 0.2,
    y + radius * 0.15,
    radius * 0.2,
    x,
    y,
    radius,
  );
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.72, "rgba(255,255,255,0)");
  rim.addColorStop(
    1,
    tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.35)",
  );
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Ambient “sharing” scene: two soft spheres linked by a traveling accent particle.
 * Canvas 2D — no Three.js, tiny footprint, loops forever.
 */
export function SharingOrbScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let running = true;
    const start = performance.now();

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas!.width = Math.max(1, Math.floor(w * dpr));
      canvas!.height = Math.max(1, Math.floor(h * dpr));
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now: number) {
      if (!running || !ctx || !canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const t = (now - start) / 1000;

      ctx.clearRect(0, 0, w, h);

      // Extremely slow ambient drift (camera feel)
      const driftX = reduceMotion ? 0 : Math.sin(t * 0.07) * 6;
      const driftY = reduceMotion ? 0 : Math.cos(t * 0.055) * 4;

      const midY = h * 0.52 + driftY;
      const leftX = w * 0.22 + driftX;
      const rightX = w * 0.78 + driftX;
      const radius = Math.min(w, h) * 0.11;
      const clampedR = Math.max(36, Math.min(72, radius));

      // Idle float — weightless, heartbeat-slow
      const floatL = reduceMotion ? 0 : Math.sin(t * 0.55) * 5;
      const floatR = reduceMotion ? 0 : Math.sin(t * 0.55 + 1.2) * 5;

      const lx = leftX;
      const ly = midY + floatL;
      const rx = rightX;
      const ry = midY + floatR;

      // Connection beam
      const grad = ctx.createLinearGradient(lx, ly, rx, ry);
      grad.addColorStop(0, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.05)`);
      grad.addColorStop(0.5, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.35)`);
      grad.addColorStop(1, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.05)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      // Soft glow along the path
      ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.08)`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      drawSoftSphere(ctx, lx, ly, clampedR, "dark");
      drawSoftSphere(ctx, rx, ry, clampedR, "light");

      // Particle travels back and forth with ease-in-out (never linear)
      if (!reduceMotion) {
        const cycle = 5.2; // seconds for one way — calm pace
        const phase = (t % (cycle * 2)) / cycle;
        const goingRight = phase < 1;
        const local = goingRight ? phase : 2 - phase;
        const p = easeInOutSine(local);
        const px = lx + (rx - lx) * p;
        const py = ly + (ry - ly) * p;

        const glow = ctx.createRadialGradient(px, py, 0, px, py, 14);
        glow.addColorStop(0, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.55)`);
        glow.addColorStop(0.35, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.2)`);
        glow.addColorStop(1, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(px - 1, py - 1, 0, px, py, 4.5);
        core.addColorStop(0, "rgb(210, 222, 240)");
        core.addColorStop(0.55, `rgb(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b})`);
        core.addColorStop(1, `rgb(${Math.max(0, ACCENT.r - 20)}, ${Math.max(0, ACCENT.g - 15)}, ${Math.max(0, ACCENT.b - 10)})`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(px, py, 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Static midpoint particle for reduced motion
        const px = (lx + rx) / 2;
        const py = (ly + ry) / 2;
        ctx.fillStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0.7)`;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) frame(performance.now());
    });
    ro.observe(canvas.parentElement ?? canvas);

    if (reduceMotion) {
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
