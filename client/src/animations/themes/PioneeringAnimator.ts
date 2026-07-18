import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

interface Footstep {
  x: number;
  y: number;
  age: number;
  isLeft: boolean;
  angle: number;
}

interface Walker {
  id: number;
  pathX: number;
  pathY: number;
  angle: number;
  left: boolean;
  timer: number;
}

export class PioneeringAnimator implements ThemeAnimator {
  private footsteps: Footstep[] = [];
  private walkers: Walker[] = [];

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

    const rasterSize = Math.max(2, Math.round(2 + (config.pot0 / 1023) * 12));
    const speedVal = 0.5 + (config.pot1 / 1023) * 4;
    const dotSize = Math.max(4, Math.round(1 + (config.pot2 / 1023) * rasterSize * 2));
    const numWalkers = Math.min(6, Math.max(1, Math.floor((config.pot3 / 1023) * 6) + 1));

    // Maintain walker count dynamically based on POT 3
    while (this.walkers.length < numWalkers) {
      const newId = (this.walkers.length > 0 ? Math.max(...this.walkers.map(w => w.id)) : 0) + 1;
      this.walkers.push({
        id: newId,
        pathX: width * 0.15 + Math.random() * width * 0.7,
        pathY: height + 80 + Math.random() * 300,
        angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.6,
        left: Math.random() < 0.5,
        timer: Math.random() * 400,
      });
    }
    while (this.walkers.length > numWalkers) {
      this.walkers.pop();
    }

    const dt = 16; // approximate frame time
    const spawnInterval = 500 / speedVal;

    // Update each walker's path and spawn footprints
    for (const walker of this.walkers) {
      walker.timer += dt * speedVal;
      if (walker.timer >= spawnInterval) {
        walker.timer -= spawnInterval;

        // Step distance
        const stepLen = 80 + Math.random() * 30;
        walker.pathX += Math.cos(walker.angle) * stepLen * 0.5;
        walker.pathY += Math.sin(walker.angle) * stepLen;

        // Slight lateral offset for left/right foot
        const lateralOffset = walker.left ? -25 : 25;
        const fx = walker.pathX + Math.sin(walker.angle) * lateralOffset;
        const fy = walker.pathY - Math.cos(walker.angle) * lateralOffset;

        this.footsteps.push({
          x: fx,
          y: fy,
          age: 0,
          isLeft: walker.left,
          angle: walker.angle + (Math.random() - 0.5) * 0.15,
        });

        walker.left = !walker.left;

        // Gentle drift in direction
        walker.angle += (Math.random() - 0.5) * 0.3;
        // Clamp to mostly upward
        walker.angle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, walker.angle));

        // When path goes off-screen, reset
        if (walker.pathY < -200 || walker.pathX < -100 || walker.pathX > width + 100) {
          walker.pathX = width * 0.15 + Math.random() * width * 0.7;
          walker.pathY = height + 80;
          walker.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
        }
      }
    }

    // Age and cull footsteps dynamically
    for (const f of this.footsteps) {
      f.age += dt * speedVal;
    }
    const maxFootsteps = 30 * numWalkers;
    while (this.footsteps.length > maxFootsteps) {
      this.footsteps.shift();
    }

    // Draw halftone raster background
    const gap = rasterSize * 2;
    const cols = Math.ceil(width / gap) + 1;
    const rows = Math.ceil(height / gap) + 1;

    // Create a temporary canvas to build the footstep mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d')!;
    maskCtx.fillStyle = '#000000';

    // Draw footprint silhouettes on the mask
    for (const step of this.footsteps) {
      const fadeIn = Math.min(1, step.age / 300);
      const fadeOut = Math.max(0, 1 - step.age / 8000);
      const opacity = fadeIn * fadeOut;
      if (opacity <= 0) continue;

      maskCtx.save();
      maskCtx.globalAlpha = opacity;
      maskCtx.translate(step.x, step.y);
      maskCtx.rotate(step.angle + Math.PI / 2);
      this.drawFootprintShape(maskCtx, step.isLeft, 1.0);
      maskCtx.restore();
    }

    // Now render as halftone dots
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * gap;
        const cy = r * gap;

        // Sample mask at this position
        const px = Math.min(width - 1, Math.max(0, Math.round(cx)));
        const py = Math.min(height - 1, Math.max(0, Math.round(cy)));
        const idx = (py * width + px) * 4;
        const maskAlpha = maskData[idx + 3] / 255;

        // Dot size scales with mask darkness
        const radius = dotSize * (0.15 + maskAlpha * 0.85);

        if (radius > 0.3) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  private drawFootprintShape(ctx: CanvasRenderingContext2D, isLeft: boolean, scale: number): void {
    const s = scale * 1.2;
    const mirror = isLeft ? -1 : 1;

    ctx.beginPath();

    // Heel (ellipse)
    ctx.ellipse(0, 20 * s, 14 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball of foot (wider ellipse)
    ctx.beginPath();
    ctx.ellipse(2 * mirror * s, -18 * s, 20 * s, 15 * s, 0.1 * mirror, 0, Math.PI * 2);
    ctx.fill();

    // Toes
    const toePositions = [
      { x: -10 * mirror, y: -38, r: 6 },
      { x: -2 * mirror, y: -42, r: 6.5 },
      { x: 7 * mirror, y: -40, r: 6 },
      { x: 14 * mirror, y: -35, r: 5 },
      { x: 19 * mirror, y: -28, r: 4.5 },
    ];

    for (const toe of toePositions) {
      ctx.beginPath();
      ctx.arc(toe.x * s, toe.y * s, toe.r * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
