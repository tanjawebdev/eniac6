import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

interface Footstep {
  x: number;
  y: number;
  age: number;
  isLeft: boolean;
  angle: number;
}

export class PioneeringAnimator implements ThemeAnimator {
  private footsteps: Footstep[] = [];
  private footstepTimer = 0;
  private footstepPathX = 0;
  private footstepPathY = 0;
  private footstepAngle = -Math.PI / 4; // walking diagonally
  private footstepLeft = true;

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
    const contrastVal = 0.3 + (config.pot3 / 1023) * 0.7;

    const dt = 16; // approximate frame time
    this.footstepTimer += dt * speedVal;

    // Spawn a new footstep every ~500ms (adjusted by speed)
    const spawnInterval = 500 / speedVal;
    if (this.footstepTimer >= spawnInterval) {
      this.footstepTimer -= spawnInterval;

      // Initialize position if starting fresh
      if (this.footsteps.length === 0) {
        this.footstepPathX = width * 0.2 + Math.random() * width * 0.3;
        this.footstepPathY = height + 80;
        this.footstepAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      }

      // Step distance
      const stepLen = 80 + Math.random() * 30;
      this.footstepPathX += Math.cos(this.footstepAngle) * stepLen * 0.5;
      this.footstepPathY += Math.sin(this.footstepAngle) * stepLen;

      // Slight lateral offset for left/right foot
      const lateralOffset = this.footstepLeft ? -25 : 25;
      const fx = this.footstepPathX + Math.sin(this.footstepAngle) * lateralOffset;
      const fy = this.footstepPathY - Math.cos(this.footstepAngle) * lateralOffset;

      this.footsteps.push({
        x: fx,
        y: fy,
        age: 0,
        isLeft: this.footstepLeft,
        angle: this.footstepAngle + (Math.random() - 0.5) * 0.15,
      });

      this.footstepLeft = !this.footstepLeft;

      // Gentle drift in direction
      this.footstepAngle += (Math.random() - 0.5) * 0.3;
      // Clamp to mostly upward
      this.footstepAngle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, this.footstepAngle));

      // When path goes off-screen, reset
      if (this.footstepPathY < -200 || this.footstepPathX < -100 || this.footstepPathX > width + 100) {
        this.footstepPathX = width * 0.2 + Math.random() * width * 0.6;
        this.footstepPathY = height + 80;
        this.footstepAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      }
    }

    // Age and cull footsteps
    for (const f of this.footsteps) {
      f.age += dt * speedVal;
    }
    // Keep max ~40 footsteps
    while (this.footsteps.length > 40) {
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
    ctx.fillStyle = `rgba(0, 0, 0, ${contrastVal})`;
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
