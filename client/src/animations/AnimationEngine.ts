import { Particle } from './Particle';

export interface EngineConfig {
  color: string | null;
  shape: string | null;
  speed: number;
  size: number;
  amount: number;
  rotate: number;
}

export class AnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private startTime = performance.now();
  private width = 0;
  private height = 0;

  public config: EngineConfig = {
    color: null,
    shape: null,
    speed: 5,
    size: 5,
    amount: 12,
    rotate: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = context;

    // Handle resizing
    this.resize();
    window.addEventListener('resize', this.handleResize);

    // Sync initial particle count
    this.syncParticleCount(this.config.amount);

    // Start render loop
    this.animate();
  }

  private handleResize = (): void => {
    this.resize();
  };

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  public setConfig(key: keyof EngineConfig, value: any): void {
    (this.config as any)[key] = value;

    if (key === 'amount') {
      this.syncParticleCount(Math.round(value));
    }
  }

  private syncParticleCount(target: number): void {
    // Add particles if needed
    while (this.particles.length < target) {
      this.particles.push(new Particle(this.width, this.height));
    }
    // Remove particles if too many
    while (this.particles.length > target) {
      this.particles.pop();
    }
  }

  private animate = (timestamp?: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = (timestamp || performance.now()) - this.startTime;
    const { ctx, width, height, config, particles } = this;

    // USER FEEDBACK: "no ghosting effect please" -> clear canvas fully
    ctx.clearRect(0, 0, width, height);

    // Fill background color
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Don't render shapes if no color or shape is selected
    if (!config.color || !config.shape) return;

    const mappedSize = 4 + (config.size / 10) * 60;
    const mappedSpeed = config.speed;
    const mappedRotate = config.rotate;

    // Update & draw particles
    for (const p of particles) {
      p.update(mappedSpeed, width, height, time);
      p.draw(ctx, config.shape, config.color, mappedSize, mappedRotate, time);
    }
  };

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
  }
}
