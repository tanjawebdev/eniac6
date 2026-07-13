// ============================================
// AnimationEngine — Canvas-based generative animation
// Renders parametric visual effects driven by hardware inputs.
// Placeholder implementation — will be replaced with full
// per-theme generative animations later.
// ============================================

export interface AnimationConfig {
  /** Active color in hex format. */
  color: string;
  /** 16 pot values (0–1023), used to drive visual parameters. */
  pots: number[];
}

/**
 * AnimationEngine manages a persistent canvas animation loop.
 * It renders generative visual effects that respond to hardware input.
 */
export class AnimationEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private config: AnimationConfig = {
    color: '#FF4500',
    pots: Array(16).fill(0),
  };
  private time = 0;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D canvas context');
    this.ctx = ctx;
    this.resize();
    this.start();
    window.addEventListener('resize', this.resize);
  }

  /** Update animation parameters. */
  updateConfig(config: Partial<AnimationConfig>): void {
    if (config.color !== undefined) this.config.color = config.color;
    if (config.pots !== undefined) this.config.pots = config.pots;
  }

  /** Start the render loop. */
  private start(): void {
    const loop = () => {
      if (this.destroyed) return;
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  /** Resize canvas to fill viewport. */
  private resize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
  };

  /** Main render frame. */
  private render(): void {
    const { ctx, canvas } = this;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.time += 0.016; // ~60fps assumed timestep

    // Clear with dark fade for trail effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
    ctx.fillRect(0, 0, w, h);

    // Parse the active color
    const color = this.config.color;

    // Use pot values to drive visual parameters
    const p0 = this.config.pots[0] / 1023; // particle count factor
    const p1 = this.config.pots[1] / 1023; // radius factor
    const p2 = this.config.pots[2] / 1023; // speed factor
    const p3 = this.config.pots[3] / 1023; // complexity factor

    const particleCount = Math.floor(3 + p0 * 30);
    const baseRadius = 20 + p1 * Math.min(w, h) * 0.3;
    const speed = 0.2 + p2 * 2;
    const complexity = 2 + Math.floor(p3 * 8);

    // Draw parametric spiral pattern
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;

    for (let i = 0; i < particleCount; i++) {
      const offset = (i / particleCount) * Math.PI * 2;
      ctx.beginPath();

      for (let j = 0; j < 100; j++) {
        const t = j / 100;
        const angle = t * Math.PI * 2 * complexity + this.time * speed + offset;
        const r = baseRadius * t;
        const x = w / 2 + Math.cos(angle) * r;
        const y = h / 2 + Math.sin(angle) * r;

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    // Central glow
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, baseRadius * 0.5);
    gradient.addColorStop(0, color + '33');
    gradient.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.3 + p1 * 0.4;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 1;
  }

  /** Stop animation and clean up. */
  destroy(): void {
    this.destroyed = true;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resize);
  }
}
