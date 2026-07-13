import { Particle } from './Particle';

export interface EngineConfig {
  color: string | null;
  shape: string | null;
  speed: number;
  size: number;
  amount: number;
  rotate: number;
  allInserted: boolean;
}

export class AnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private startTime = performance.now();
  private width = 0;
  private height = 0;

  private blobs: Array<{
    rx: number;
    ry: number;
    color: string;
    speedX: number;
    speedY: number;
    angle: number;
  }> = [];

  public config: EngineConfig = {
    color: null,
    shape: null,
    speed: 5,
    size: 5,
    amount: 12,
    rotate: 0,
    allInserted: false,
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

  private initBlobs(): void {
    this.blobs = [
      {
        rx: 0.5,
        ry: 0.6,
        color: 'rgba(230, 92, 0, 0.65)', // Fiery Orange
        speedX: 0.00015,
        speedY: 0.0001,
        angle: Math.random() * Math.PI * 2,
      },
      {
        rx: 0.6,
        ry: 0.7,
        color: 'rgba(100, 30, 180, 0.75)', // Deep Purple
        speedX: -0.0001,
        speedY: 0.00012,
        angle: Math.random() * Math.PI * 2,
      },
      {
        rx: 0.55,
        ry: 0.5,
        color: 'rgba(180, 15, 60, 0.55)', // Crimson Red
        speedX: 0.00012,
        speedY: -0.00013,
        angle: Math.random() * Math.PI * 2,
      },
      {
        rx: 0.45,
        ry: 0.55,
        color: 'rgba(30, 10, 60, 0.85)', // Dark Blue/Violet
        speedX: -0.00013,
        speedY: -0.00011,
        angle: Math.random() * Math.PI * 2,
      },
    ];
  }

  private animate = (timestamp?: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = (timestamp || performance.now()) - this.startTime;
    const { ctx, width, height, config, particles } = this;

    ctx.clearRect(0, 0, width, height);

    if (config.allInserted) {
      if (this.blobs.length === 0) {
        this.initBlobs();
      }

      // Draw background base color
      ctx.fillStyle = '#06010a';
      ctx.fillRect(0, 0, width, height);

      // Save context to apply heavy blur
      ctx.save();
      ctx.filter = 'blur(120px)';
      ctx.globalCompositeOperation = 'screen';

      const timeVal = timestamp || performance.now();

      for (const blob of this.blobs) {
        // Update positions using smooth sine waves to drift around
        const dx = Math.sin(timeVal * blob.speedX + blob.angle) * (width * 0.3);
        const dy = Math.cos(timeVal * blob.speedY + blob.angle) * (height * 0.3);
        const blobX = (width / 2) + dx;
        const blobY = (height / 2) + dy;
        const radX = width * blob.rx;
        const radY = height * blob.ry;
        const maxRad = Math.max(radX, radY);

        // Draw blob as a radial gradient
        const grad = ctx.createRadialGradient(
          blobX, blobY, 0,
          blobX, blobY, maxRad
        );
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(blobX, blobY, maxRad, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return;
    }

    // Default: Fill background color & draw particles
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
