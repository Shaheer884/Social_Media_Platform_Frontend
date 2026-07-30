import React, { useEffect, useRef } from 'react';

const BirthdayConfetti = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];
    const confettiCount = 150;
    const confettis = [];

    class Confetti {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height - height;
        this.r = Math.random() * 6 + 4;
        this.d = Math.random() * confettiCount;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.tilt = Math.random() * 10 - 5;
        this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
        this.tiltAngle = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.lineWidth = this.r / 2;
        ctx.strokeStyle = this.color;
        ctx.moveTo(this.x + this.tilt + this.r / 2, this.y);
        ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 2);
        ctx.stroke();
      }

      update() {
        this.tiltAngle += this.tiltAngleIncremental;
        this.y += (Math.cos(this.d) + 3 + this.r / 2) / 2;
        this.x += Math.sin(this.tiltAngle);
        this.tilt = Math.sin(this.tiltAngle - this.r / 2) * 5;
      }
    }

    for (let i = 0; i < confettiCount; i++) {
      confettis.push(new Confetti());
    }

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    let active = true;
    // Stop after 7 seconds
    const timer = setTimeout(() => {
      active = false;
    }, 7000);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      let stillRunning = false;

      confettis.forEach((c) => {
        c.update();
        c.draw();
        if (c.y < height) {
          stillRunning = true;
        } else if (active) {
          // Recycle confetti
          c.y = -20;
          c.x = Math.random() * width;
          stillRunning = true;
        }
      });

      if (stillRunning) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  );
};

export default BirthdayConfetti;
