import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

interface FloatingCircle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export class TeamworkAnimator implements ThemeAnimator {
  private circles: FloatingCircle[] = [];
  private circlesInitCount = 0;

  public draw(
    ctx: CanvasRenderingContext2D,
    _blurCtx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    _timestamp: number,
    config: EngineConfig,
    _startTime: number
  ): void {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const circleRadius = Math.max(3, Math.round(3 + (config.pot0 / 1023) * 25));
    const speedVal = 0.3 + (config.pot1 / 1023) * 3;
    const count = Math.max(5, Math.round(5 + (config.pot2 / 1023) * 40));
    const lineDistance = Math.max(30, Math.round(30 + (config.pot3 / 1023) * 300));

    // Init or resize circles pool
    if (this.circles.length !== count || this.circlesInitCount !== count) {
      this.initCircles(count, width, height);
      this.circlesInitCount = count;
    }

    const dt = 0.016 * speedVal;

    // Update positions
    for (const c of this.circles) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;

      // Bounce off edges
      if (c.x < circleRadius) {
        c.x = circleRadius;
        c.vx = Math.abs(c.vx);
      }
      if (c.x > width - circleRadius) {
        c.x = width - circleRadius;
        c.vx = -Math.abs(c.vx);
      }
      if (c.y < circleRadius) {
        c.y = circleRadius;
        c.vy = Math.abs(c.vy);
      }
      if (c.y > height - circleRadius) {
        c.y = height - circleRadius;
        c.vy = -Math.abs(c.vy);
      }
    }

    // Draw connecting lines for circles within lineDistance
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.circles.length; i++) {
      for (let j = i + 1; j < this.circles.length; j++) {
        const dx = this.circles[i].x - this.circles[j].x;
        const dy = this.circles[i].y - this.circles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < lineDistance) {
          const opacity = 0.4 * (1 - dist / lineDistance);
          ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(this.circles[i].x, this.circles[i].y);
          ctx.lineTo(this.circles[j].x, this.circles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw circles
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    for (const c of this.circles) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, circleRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private initCircles(count: number, width: number, height: number): void {
    this.circles = [];
    for (let i = 0; i < count; i++) {
      this.circles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        radius: 5 + Math.random() * 10,
      });
    }
  }
}
