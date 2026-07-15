import { Particle } from './Particle';

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

interface FloatingCircle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface BlurryChar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
}

interface Footstep {
  x: number;
  y: number;
  age: number;
  isLeft: boolean;
  angle: number;
}

export class AnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private startTime = performance.now();
  private width = 0;
  private height = 0;

  // Teamwork: floating circles
  private circles: FloatingCircle[] = [];
  private circlesInitCount = 0;

  // Recognition: blurry text characters
  private blurChars: BlurryChar[] = [];
  private blurCharsInitCount = 0;

  // Pioneering: footsteps
  private footsteps: Footstep[] = [];
  private footstepTimer = 0;
  private footstepPathX = 0;
  private footstepPathY = 0;
  private footstepAngle = -Math.PI / 4; // walking diagonally
  private footstepLeft = true;

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

    // Route to theme-specific draw methods
    if (config.activeTheme) {
      switch (config.activeTheme) {
        case 'programming':
          this.drawAsciiWave(ctx, width, height, timestamp || performance.now());
          return;
        case 'pioneering':
          this.drawFootstepsAnimation(ctx, width, height, timestamp || performance.now());
          return;
        case 'recognition':
          this.drawBlurryText(ctx, width, height, timestamp || performance.now());
          return;
        case 'teamwork':
          this.drawConnectedCircles(ctx, width, height, timestamp || performance.now());
          return;
      }
    }

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

  // ─── PROGRAMMING: ASCII Wave ──────────────────────────────────────────
  private drawAsciiWave(ctx: CanvasRenderingContext2D, width: number, height: number, timestamp: number): void {
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const scaleVal = this.config.pot0 / 1023;
    const speedVal = this.config.pot1 / 1023;
    const contrastVal = this.config.pot2 / 1023;
    const amplitudeVal = this.config.pot3 / 1023;

    const fontSize = Math.max(14, Math.round(15 + scaleVal * 20));
    const cellWidth = Math.max(12, Math.round(11 + scaleVal * 15));
    const cellHeight = Math.max(18, Math.round(16 + scaleVal * 22));

    ctx.font = `bold ${fontSize}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const alpha = contrastVal * 0.4 + 0.1;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;

    const timeFactor = (timestamp - this.startTime) * 0.001 * (0.2 + speedVal * 3);

    // Amplitude controls wave displacement (pot3)
    const amplitude = 5 + amplitudeVal * 40;

    const chars = 'QQQQ R S T U W Z e e * STVX ? @ > < [ ] I I I N N N M M M L L L K K K J J J H H H G G G F F F E E E D D D C C C B B B A A A ';

    const cols = Math.ceil(width / cellWidth) + 1;
    const rows = Math.ceil(height / cellHeight) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellWidth;
        const y = r * cellHeight;

        // Wave formula for layout distortion and index selection
        const waveIndexValue = (c * 0.1) + (r * 0.15) + Math.sin(c * 0.04 + r * 0.06 + timeFactor) * 6;
        const charIdx = Math.floor(Math.abs(waveIndexValue));
        const char = chars[charIdx % chars.length];

        const posX = x + Math.sin(r * 0.12 + timeFactor) * amplitude;
        const posY = y + Math.cos(c * 0.08 + timeFactor) * (amplitude * 0.5);

        ctx.fillText(char, posX, posY);
      }
    }
  }

  // ─── PIONEERING: Pixelated Halftone Footsteps ────────────────────────
  private drawFootstepsAnimation(ctx: CanvasRenderingContext2D, width: number, height: number, _timestamp: number): void {
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const rasterSize = Math.max(2, Math.round(2 + (this.config.pot0 / 1023) * 12));
    const speedVal = 0.5 + (this.config.pot1 / 1023) * 4;
    const dotSize = Math.max(1, Math.round(1 + (this.config.pot2 / 1023) * rasterSize * 0.9));
    const contrastVal = 0.3 + (this.config.pot3 / 1023) * 0.7;

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

  // ─── RECOGNITION: Blurry Text ────────────────────────────────────────
  private drawBlurryText(ctx: CanvasRenderingContext2D, width: number, height: number, _timestamp: number): void {
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const blurAmount = Math.max(1, Math.round(1 + (this.config.pot0 / 1023) * 25));
    const speedVal = 0.2 + (this.config.pot1 / 1023) * 2;
    const density = Math.max(10, Math.round(10 + (this.config.pot2 / 1023) * 80));
    const fontSizeVal = Math.max(14, Math.round(14 + (this.config.pot3 / 1023) * 60));

    // Init or resize blurry chars pool
    if (this.blurChars.length !== density || this.blurCharsInitCount !== density) {
      this.initBlurChars(density, width, height);
      this.blurCharsInitCount = density;
    }

    const dt = 0.016 * speedVal;

    // Update positions
    for (const ch of this.blurChars) {
      ch.x += ch.vx * dt;
      ch.y += ch.vy * dt;

      // Wrap around
      if (ch.x < -100) ch.x = width + 50;
      if (ch.x > width + 100) ch.x = -50;
      if (ch.y < -100) ch.y = height + 50;
      if (ch.y > height + 100) ch.y = -50;
    }

    // Draw with blur
    ctx.save();
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.fillStyle = `rgba(0, 0, 0, 0.85)`;
    ctx.font = `bold ${fontSizeVal}px "Space Grotesk", "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ch of this.blurChars) {
      ctx.fillText(ch.char, ch.x, ch.y);
    }

    ctx.restore();
  }

  private initBlurChars(count: number, width: number, height: number): void {
    const words = [
      'the', 'women', 'who', 'programmed', 'ENIAC', 'were', 'not', 'recognized',
      'for', 'their', 'contributions', 'to', 'computing', 'history', 'until',
      'decades', 'later', 'Kay', 'Jean', 'Betty', 'Marlyn', 'Fran', 'Ruth',
      'programmers', 'invisible', 'pioneers', 'code', 'debug', 'memory',
      'accumulator', 'subroutine', 'ballistics', 'trajectory', 'tables',
      'a', 'n', 'o', 't', 'e', 'r', 'm', 'w', 'b', 'h', 'd', 'g', 'y',
      'compute', 'calculate', 'loops', 'function', 'mathematics',
    ];

    this.blurChars = [];
    for (let i = 0; i < count; i++) {
      this.blurChars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 20,
        char: words[Math.floor(Math.random() * words.length)],
        size: 14 + Math.random() * 30,
      });
    }
  }

  // ─── TEAMWORK: Floating Connected Circles ────────────────────────────
  private drawConnectedCircles(ctx: CanvasRenderingContext2D, width: number, height: number, _timestamp: number): void {
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const circleRadius = Math.max(3, Math.round(3 + (this.config.pot0 / 1023) * 25));
    const speedVal = 0.3 + (this.config.pot1 / 1023) * 3;
    const count = Math.max(5, Math.round(5 + (this.config.pot2 / 1023) * 40));
    const lineDistance = Math.max(30, Math.round(30 + (this.config.pot3 / 1023) * 300));

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
      if (c.x < circleRadius) { c.x = circleRadius; c.vx = Math.abs(c.vx); }
      if (c.x > width - circleRadius) { c.x = width - circleRadius; c.vx = -Math.abs(c.vx); }
      if (c.y < circleRadius) { c.y = circleRadius; c.vy = Math.abs(c.vy); }
      if (c.y > height - circleRadius) { c.y = height - circleRadius; c.vy = -Math.abs(c.vy); }
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

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
  }
}
