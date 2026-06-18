"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight canvas falling-petals effect (homepage only).
 * - Pauses when the tab is hidden and when the host element scrolls off-screen.
 * - Respects prefers-reduced-motion (renders nothing).
 * - Particle count scales down on small screens.
 * Fills its nearest positioned ancestor (absolute inset-0).
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
      size: number;
      speedY: number;
      swayAmp: number;
      swayFreq: number;
      phase: number;
      rot: number;
      rotSpeed: number;
      hue: number;
      alpha: number;
    };

    let petals: Petal[] = [];

    const palette = [
      "rgba(244, 194, 209, A)", // soft pink
      "rgba(236, 170, 190, A)", // rose
      "rgba(250, 218, 224, A)", // pale blush
      "rgba(229, 150, 178, A)", // deeper pink
    ];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    function makePetal(initial: boolean): Petal {
      return {
        x: rand(0, width),
        y: initial ? rand(0, height) : rand(-40, -8),
        size: rand(6, 13),
        speedY: rand(18, 42), // px per second
        swayAmp: rand(12, 34),
        swayFreq: rand(0.4, 1.1),
        phase: rand(0, Math.PI * 2),
        rot: rand(0, Math.PI * 2),
        rotSpeed: rand(-0.8, 0.8),
        hue: Math.floor(rand(0, palette.length)),
        alpha: rand(0.55, 0.9),
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

      const density = width < 640 ? 28 : width < 1024 ? 46 : 70;
      petals = Array.from({ length: density }, () => makePetal(true));
    }

    function drawPetal(p: Petal) {
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = palette[p.hue].replace("A", p.alpha.toFixed(2));
      // simple petal: two arcs forming a leaf/teardrop shape
      ctx!.beginPath();
      ctx!.moveTo(0, -p.size / 2);
      ctx!.quadraticCurveTo(p.size / 2, 0, 0, p.size / 2);
      ctx!.quadraticCurveTo(-p.size / 2, 0, 0, -p.size / 2);
      ctx!.fill();
      ctx!.restore();
    }

    let last = performance.now();
    let rafId = 0;
    let running = false;

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx!.clearRect(0, 0, width, height);
      for (const p of petals) {
        p.y += p.speedY * dt;
        p.phase += p.swayFreq * dt;
        p.x += Math.sin(p.phase) * p.swayAmp * dt;
        p.rot += p.rotSpeed * dt;

        if (p.y - p.size > height) {
          Object.assign(p, makePetal(false));
        }
        drawPetal(p);
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
