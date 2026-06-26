"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight canvas falling-petals effect (homepage only).
 * - Pauses when the tab is hidden and when the host element scrolls off-screen.
 * - Respects prefers-reduced-motion (renders nothing).
 * - Particle count scales down on small screens.
 * Fills its nearest positioned ancestor (absolute inset-0).
 *
 * Visual model: each petal has a "depth" (0 far .. 1 near) driving its size,
 * speed, opacity and blur for a parallax field. Petals flutter by oscillating
 * their horizontal scale (simulating a 3-D flip), drift on a swaying sine path,
 * and react to slow global wind gusts. A handful catch a soft highlight.
 */
export default function FallingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Petal = {
      x: number;
      y: number;
      depth: number; // 0 far .. 1 near
      size: number;
      speedY: number;
      swayAmp: number;
      swayFreq: number;
      phase: number;
      rot: number;
      rotSpeed: number;
      flutterFreq: number; // horizontal-scale oscillation speed (3-D flip)
      flutterPhase: number;
      hue: number;
      alpha: number;
      shimmer: boolean; // catches a soft highlight
    };

    let petals: Petal[] = [];

    // Two-stop gradients per petal: [base tip, lighter base] for soft shading.
    const palette = [
      ["rgba(244, 194, 209, A)", "rgba(252, 226, 233, A)"], // soft pink
      ["rgba(236, 170, 190, A)", "rgba(248, 214, 224, A)"], // rose
      ["rgba(250, 218, 224, A)", "rgba(255, 240, 244, A)"], // pale blush
      ["rgba(229, 150, 178, A)", "rgba(243, 196, 213, A)"], // deeper pink
    ];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    function makePetal(initial: boolean): Petal {
      const depth = Math.random(); // 0 far .. 1 near
      return {
        x: rand(0, width),
        y: initial ? rand(0, height) : rand(-40, -8),
        depth,
        size: rand(5, 9) + depth * 7, // near petals are larger
        speedY: (rand(16, 30) + depth * 26), // near petals fall faster
        swayAmp: rand(10, 26) + depth * 14,
        swayFreq: rand(0.4, 1.0),
        phase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.9, 0.9),
        flutterFreq: rand(1.4, 3.0),
        flutterPhase: rand(0, Math.PI * 2),
        hue: Math.floor(rand(0, palette.length)),
        alpha: (rand(0.5, 0.85)) * (0.55 + depth * 0.45),
        shimmer: Math.random() < 0.25,
      };
    }

    function resize() {
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      canvas!.style.width = width + "px";
      canvas!.style.height = height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = width < 640 ? 32 : width < 1024 ? 52 : 78;
      petals = Array.from({ length: density }, () => makePetal(true));
      // Draw far petals first so near ones layer on top.
      petals.sort((a, b) => a.depth - b.depth);
    }

    function drawPetal(p: Petal, flip: number) {
      const s = p.size;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      // Horizontal squash simulates the petal flipping in 3-D as it tumbles.
      ctx!.scale(Math.max(0.12, Math.abs(flip)), 1);
      ctx!.globalAlpha = p.alpha;

      // Soft drop shadow gives near petals a touch of depth.
      if (p.depth > 0.55) {
        ctx!.shadowColor = "rgba(180, 110, 140, 0.28)";
        ctx!.shadowBlur = 6 * p.depth;
        ctx!.shadowOffsetY = 1.5;
      }

      // Vertical gradient: deeper tone at the tip, lighter toward the base.
      const grad = ctx!.createLinearGradient(0, -s / 2, 0, s / 2);
      grad.addColorStop(0, palette[p.hue][0].replace("A", "1"));
      grad.addColorStop(1, palette[p.hue][1].replace("A", "1"));
      ctx!.fillStyle = grad;

      // Sakura petal: rounded body tapering to a notched tip.
      const w = s * 0.62;
      ctx!.beginPath();
      ctx!.moveTo(0, s / 2); // base
      ctx!.bezierCurveTo(w, s * 0.28, w * 0.92, -s * 0.34, w * 0.22, -s * 0.5);
      // little notch at the tip
      ctx!.quadraticCurveTo(0, -s * 0.34, -w * 0.22, -s * 0.5);
      ctx!.bezierCurveTo(-w * 0.92, -s * 0.34, -w, s * 0.28, 0, s / 2);
      ctx!.fill();

      // Optional highlight streak for petals catching the light.
      if (p.shimmer) {
        ctx!.shadowColor = "transparent";
        ctx!.globalAlpha = p.alpha * 0.5;
        ctx!.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx!.beginPath();
        ctx!.ellipse(-w * 0.12, -s * 0.08, s * 0.12, s * 0.3, 0.3, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    let last = performance.now();
    let elapsed = 0;
    let rafId = 0;
    let running = false;

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      // Slow, layered wind gusts pushing petals sideways.
      const wind =
        Math.sin(elapsed * 0.18) * 10 + Math.sin(elapsed * 0.47 + 1.3) * 5;

      ctx!.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.y += p.speedY * dt;
        p.phase += p.swayFreq * dt;
        p.flutterPhase += p.flutterFreq * dt;
        p.x += Math.sin(p.phase) * p.swayAmp * dt + wind * p.depth * dt;
        p.rot += p.rotSpeed * dt;

        if (p.y - p.size > height) {
          Object.assign(p, makePetal(false));
        }
        // Wrap horizontally so wind-blown petals re-enter from the side.
        if (p.x < -20) p.x = width + 20;
        else if (p.x > width + 20) p.x = -20;

        drawPetal(p, Math.cos(p.flutterPhase));
      }
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    // Pause when the hero scrolls out of view.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0 }
    );

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    document.addEventListener("visibilitychange", onVisibility);
    io.observe(parent);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
