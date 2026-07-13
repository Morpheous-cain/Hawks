import { useEffect, useRef } from 'react';

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const isAuthLikeRoute = ["/auth", "/reset-password"].includes(window.location.pathname);
    if (isAuthLikeRoute) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawStaticBackground();
    };
    
    const drawStaticBackground = () => {
      // Clear canvas with lighter background
      ctx.fillStyle = 'rgba(8, 18, 24, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid - reduced opacity
      const gridSize = 50;
      ctx.strokeStyle = 'rgba(0, 180, 180, 0.01)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw subtle accent lines - reduced opacity
      ctx.strokeStyle = 'rgba(0, 180, 180, 0.015)';
      ctx.lineWidth = 1;
      
      // Diagonal accent lines
      for (let i = 0; i < 5; i++) {
        const offset = (i * canvas.width) / 5;
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset + canvas.height * 0.5, canvas.height);
        ctx.stroke();
      }
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.2 }}
    />
  );
};
