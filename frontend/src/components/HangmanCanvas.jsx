import React, { useEffect, useRef } from 'react';

function HangmanCanvas({ strikes, maxStrikes }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Draw gallows
    ctx.beginPath();
    ctx.moveTo(50, 250);
    ctx.lineTo(150, 250);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(100, 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(200, 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(200, 50);
    ctx.lineTo(200, 80);
    ctx.stroke();

    // Draw hangman based on strikes
    if (strikes >= 1) {
      // Head
      ctx.beginPath();
      ctx.arc(200, 100, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (strikes >= 2) {
      // Body
      ctx.beginPath();
      ctx.moveTo(200, 120);
      ctx.lineTo(200, 180);
      ctx.stroke();
    }

    if (strikes >= 3) {
      // Left arm
      ctx.beginPath();
      ctx.moveTo(200, 140);
      ctx.lineTo(170, 160);
      ctx.stroke();
    }

    if (strikes >= 4) {
      // Right arm
      ctx.beginPath();
      ctx.moveTo(200, 140);
      ctx.lineTo(230, 160);
      ctx.stroke();
    }

    if (strikes >= 5) {
      // Left leg
      ctx.beginPath();
      ctx.moveTo(200, 180);
      ctx.lineTo(180, 220);
      ctx.stroke();
    }

    if (strikes >= 6) {
      // Right leg
      ctx.beginPath();
      ctx.moveTo(200, 180);
      ctx.lineTo(220, 220);
      ctx.stroke();
    }
  }, [strikes]);

  return (
    <div className="hangman-canvas">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300}
      />
    </div>
  );
}

export default HangmanCanvas;