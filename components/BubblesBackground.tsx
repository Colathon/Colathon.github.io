"use client";

import React, { useEffect, useRef } from "react";

interface Bubble {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

export default function BubblesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let bubbles: Bubble[] = [];
    const mouse = { x: 0, y: 0 };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initBubbles();
    };

    const initBubbles = () => {
      bubbles = [];
      const bubbleCount = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < bubbleCount; i++) {
        bubbles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    };

    const drawBubbles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      bubbles.forEach((bubble) => {
        // Update position
        bubble.x += bubble.speedX;
        bubble.y += bubble.speedY;

        // Mouse interaction (gentle push)
        const dx = mouse.x - bubble.x;
        const dy = mouse.y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) {
          bubble.x -= dx / 100;
          bubble.y -= dy / 100;
        }

        // Boundary check
        if (bubble.x < 0) bubble.x = canvas.width;
        if (bubble.x > canvas.width) bubble.x = 0;
        if (bubble.y < 0) bubble.y = canvas.height;
        if (bubble.y > canvas.height) bubble.y = 0;

        // Draw
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(drawBubbles);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    
    resizeCanvas();
    drawBubbles();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-40"
      style={{ filter: "blur(1px)" }}
    />
  );
}
