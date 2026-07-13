import { SHAPE_DRAWERS } from './ShapeDrawers';

export class Particle {
  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public baseRotation = 0;
  public rotationOffset = 0;
  public alpha = 1;
  public sizeVariation = 1;
  public driftPhase = 0;
  public fadeIn = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.reset(canvasWidth, canvasHeight, true);
  }

  public reset(canvasWidth: number, canvasHeight: number, randomize = false): void {
    this.x = randomize ? Math.random() * canvasWidth : -100;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.baseRotation = Math.random() * Math.PI * 2;
    this.rotationOffset = Math.random() * Math.PI * 2;
    this.alpha = 0.3 + Math.random() * 0.7;
    this.sizeVariation = 0.5 + Math.random() * 1;
    this.driftPhase = Math.random() * Math.PI * 2;
    this.fadeIn = randomize ? 1 : 0;
  }

  public update(speed: number, canvasWidth: number, canvasHeight: number, time: number): void {
    const speedFactor = speed * 0.5;

    // Organic drift
    this.x += this.vx * speedFactor + Math.sin(time * 0.001 + this.driftPhase) * 0.3 * speedFactor;
    this.y += this.vy * speedFactor + Math.cos(time * 0.0008 + this.driftPhase) * 0.2 * speedFactor;

    // Fade in
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + 0.02);
    }

    // Wrap around edges with padding
    const pad = 80;
    if (this.x > canvasWidth + pad) this.x = -pad;
    if (this.x < -pad) this.x = canvasWidth + pad;
    if (this.y > canvasHeight + pad) this.y = -pad;
    if (this.y < -pad) this.y = canvasHeight + pad;
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    shape: string,
    color: string,
    size: number,
    rotateSpeed: number,
    time: number
  ): void {
    const drawFn = SHAPE_DRAWERS[shape];
    if (!drawFn) return;

    const actualSize = size * this.sizeVariation;
    const rotation = this.baseRotation + time * 0.001 * rotateSpeed + this.rotationOffset;
    const alpha = this.alpha * this.fadeIn;

    ctx.globalAlpha = alpha;
    drawFn(ctx, this.x, this.y, actualSize, color, rotation);
    ctx.globalAlpha = 1;
  }
}
