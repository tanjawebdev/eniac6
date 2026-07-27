import { Particle } from './Particle';
import { ThemeAnimator } from './themes/ThemeAnimator';
import { ProgrammingAnimator } from './themes/ProgrammingAnimator';
import { PioneeringAnimator } from './themes/PioneeringAnimator';
import { RecognitionAnimator } from './themes/RecognitionAnimator';
import { TeamworkAnimator } from './themes/TeamworkAnimator';

export interface EngineConfig {
  color: string | null;
  shape: string | null;
  speed: number;
  size: number;
  amount: number;
  rotate: number;
  allInserted: boolean;
  backgroundColor: string;
  activeTheme: string | null;
  pot0: number;
  pot1: number;
  pot2: number;
  pot3: number;
}

export class AnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private startTime = performance.now();
  private width = 0;
  private height = 0;

  // Secondary DOM canvas layer for GPU-accelerated CSS blurring
  private blurCanvas: HTMLCanvasElement | null = null;
  private blurCtx: CanvasRenderingContext2D | null = null;

  // Theme-specific delegate animators
  private animators: Record<string, ThemeAnimator> = {
    programming: new ProgrammingAnimator(),
    pioneering: new PioneeringAnimator(),
    recognition: new RecognitionAnimator(),
    teamwork: new TeamworkAnimator(),
  };

  private noisePattern: CanvasPattern | null = null;

  public config: EngineConfig = {
    color: null,
    shape: null,
    speed: 5,
    size: 5,
    amount: 12,
    rotate: 0,
    allInserted: false,
    backgroundColor: '#0a0a0a',
    activeTheme: null,
    pot0: 307,
    pot1: 102,
    pot2: 716,
    pot3: 921,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D rendering context');
    }
    this.ctx = context;

    // Create secondary DOM canvas for GPU-accelerated CSS blurring (Recognition theme)
    this.blurCanvas = document.createElement('canvas');
    this.blurCanvas.className = 'canvas-background-blur-layer';
    this.blurCanvas.style.position = 'absolute';
    this.blurCanvas.style.inset = '0';
    this.blurCanvas.style.width = '100%';
    this.blurCanvas.style.height = '100%';
    this.blurCanvas.style.pointerEvents = 'none';
    this.blurCanvas.style.zIndex = '1';
    this.blurCanvas.style.display = 'none';
    this.canvas.parentNode?.insertBefore(this.blurCanvas, this.canvas.nextSibling);
    this.blurCtx = this.blurCanvas.getContext('2d');

    // Handle resizing
    this.resize();
    window.addEventListener('resize', this.handleResize);

    // Sync initial particle count
    this.syncParticleCount(this.config.amount);

    // Create film grain noise pattern
    this.createNoisePattern();

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

    if (this.blurCanvas) {
      this.blurCanvas.width = rect.width * dpr;
      this.blurCanvas.height = rect.height * dpr;
      if (this.blurCtx) {
        this.blurCtx.scale(dpr, dpr);
      }
    }
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

  private createNoisePattern(): void {
    const nCanvas = document.createElement('canvas');
    nCanvas.width = 256;
    nCanvas.height = 256;
    const nCtx = nCanvas.getContext('2d');
    if (!nCtx) return;

    const imgData = nCtx.createImageData(256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = Math.floor(Math.random() * 255);
      data[i] = grain;
      data[i + 1] = grain;
      data[i + 2] = grain;
      data[i + 3] = 22; // subtle film grain
    }
    nCtx.putImageData(imgData, 0, 0);
    this.noisePattern = this.ctx.createPattern(nCanvas, 'repeat');
  }

  private drawLiquidWaves(ctx: CanvasRenderingContext2D, width: number, height: number, timeVal: number): void {
    const t = timeVal * 0.0009;

    // Dark background base
    ctx.fillStyle = '#06020a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = 'blur(500px)';
    ctx.globalCompositeOperation = 'screen';

    // Rotate center pivot slightly for diagonal wave flow matching reference image
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(-0.35); // ~20 degree tilt
    ctx.translate(-centerX, -centerY);

    const layers = [
      {
        // Deep Purple / Indigo base ribbon
        pos: 0.15,
        w: width * 0.55,
        colors: ['rgba(55, 20, 90, 0.85)', 'rgba(20, 8, 45, 0.3)'],
        amp1: width * 0.2, freq1: 0.003, speed1: 0.5,
        amp2: width * 0.12, freq2: 0.007, speed2: -0.8,
        amp3: width * 0.07, freq3: 0.012, speed3: 1.1,
        phase: 0
      },
      {
        // Main Fiery Orange liquid fold (Focal wave matching reference image)
        pos: 0.42,
        w: width * 0.5,
        colors: ['rgba(245, 65, 5, 0.95)', 'rgba(175, 20, 30, 0.4)'],
        amp1: width * 0.24, freq1: 0.0024, speed1: 0.7,
        amp2: width * 0.16, freq2: 0.0055, speed2: -0.6,
        amp3: width * 0.09, freq3: 0.01, speed3: 0.9,
        phase: 1.2
      },
      {
        // Warm Amber / Gold liquid wave accent
        pos: 0.32,
        w: width * 0.35,
        colors: ['rgba(238, 135, 38, 1)', 'rgba(202, 100, 16, 0.92)'],
        amp1: width * 0.18, freq1: 0.0032, speed1: 0.9,
        amp2: width * 0.11, freq2: 0.0075, speed2: -1.1,
        amp3: width * 0.06, freq3: 0.014, speed3: 0.7,
        phase: 2.8
      },
      {
        // Deep Crimson / Violet fold
        pos: 0.68,
        w: width * 0.52,
        colors: ['rgba(165, 15, 15, 0.85)', 'rgba(50, 10, 50, 0.35)'],
        amp1: width * 0.22, freq1: 0.0026, speed1: -0.5,
        amp2: width * 0.14, freq2: 0.006, speed2: 0.8,
        amp3: width * 0.08, freq3: 0.011, speed3: -1.0,
        phase: 4.1
      },
      {
        // Secondary Orange stream (Lower wave in reference image)
        pos: 0.58,
        w: width * 0.42,
        colors: ['rgba(50, 30, 134, 0.9)', 'rgba(76, 22, 112, 0.3)'],
        amp1: width * 0.19, freq1: 0.0028, speed1: 0.8,
        amp2: width * 0.13, freq2: 0.0065, speed2: -0.7,
        amp3: width * 0.07, freq3: 0.012, speed3: 1.2,
        phase: 5.3
      },
      {
        // Soft Plum / Blue accent edge wave
        pos: 0.85,
        w: width * 0.45,
        colors: ['rgba(75, 30, 125, 0.75)', 'rgba(15, 10, 40, 0.2)'],
        amp1: width * 0.16, freq1: 0.0035, speed1: 0.6,
        amp2: width * 0.1, freq2: 0.008, speed2: -0.9,
        amp3: width * 0.05, freq3: 0.015, speed3: 0.8,
        phase: 3.5
      }
    ];

    const stepY = 12;
    const startY = -height * 0.4;
    const endY = height * 1.4;

    for (const layer of layers) {
      const baseCenterX = width * layer.pos;

      ctx.beginPath();

      // Left edge contour
      for (let y = startY; y <= endY; y += stepY) {
        const shift =
          Math.sin(y * layer.freq1 + t * layer.speed1 + layer.phase) * layer.amp1 +
          Math.cos(y * layer.freq2 + t * layer.speed2 + layer.phase * 1.4) * layer.amp2 +
          Math.sin(y * layer.freq3 + t * layer.speed3) * layer.amp3;

        const x = baseCenterX + shift - layer.w / 2;
        if (y === startY) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Right edge contour (returning back up)
      for (let y = endY; y >= startY; y -= stepY) {
        const shift =
          Math.sin(y * layer.freq1 + t * layer.speed1 + layer.phase + 0.35) * (layer.amp1 * 1.08) +
          Math.cos(y * layer.freq2 + t * layer.speed2 + layer.phase * 1.4 + 0.45) * (layer.amp2 * 0.92) +
          Math.sin(y * layer.freq3 + t * layer.speed3 + 0.7) * layer.amp3;

        const x = baseCenterX + shift + layer.w / 2;
        ctx.lineTo(x, y);
      }

      ctx.closePath();

      const grad = ctx.createLinearGradient(baseCenterX - layer.w / 2, startY, baseCenterX + layer.w / 2, endY);
      grad.addColorStop(0, layer.colors[0]);
      grad.addColorStop(1, layer.colors[1]);

      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();

    // Film grain texture
    if (this.noisePattern) {
      ctx.save();
      ctx.fillStyle = this.noisePattern;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  private animate = (timestamp?: number): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const time = (timestamp || performance.now()) - this.startTime;
    const { ctx, width, height, config, particles } = this;

    ctx.clearRect(0, 0, width, height);

    // Route to theme-specific delegate animators if one is active
    if (config.activeTheme && this.animators[config.activeTheme]) {
      if (config.activeTheme === 'recognition') {
        if (this.blurCanvas) {
          this.blurCanvas.style.display = 'block';
          const blurAmount = Math.max(1, Math.round(1 + (config.pot2 / 1023) * 25));
          this.blurCanvas.style.filter = `blur(${blurAmount}px)`;
          if (this.blurCtx) {
            this.blurCtx.clearRect(0, 0, this.width, this.height);
          }
        }
      } else {
        if (this.blurCanvas) {
          this.blurCanvas.style.display = 'none';
        }
      }

      this.animators[config.activeTheme].draw(
        ctx,
        this.blurCtx,
        width,
        height,
        timestamp || performance.now(),
        config,
        this.startTime
      );
      return;
    } else {
      if (this.blurCanvas) {
        this.blurCanvas.style.display = 'none';
      }
    }

    if (config.allInserted) {
      const timeVal = timestamp || performance.now();
      this.drawLiquidWaves(ctx, width, height, timeVal);
      return;
    }

    // Default: Fill background color & draw particles
    ctx.fillStyle = config.backgroundColor;
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
    if (this.blurCanvas && this.blurCanvas.parentNode) {
      this.blurCanvas.parentNode.removeChild(this.blurCanvas);
    }
  }
}
