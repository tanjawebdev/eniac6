import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

export class RecognitionAnimator implements ThemeAnimator {
  private blurTexture: HTMLCanvasElement | null = null;
  private blurTextureKey = '';
  private blurScrollX = 0;
  private blurScrollY = 0;
  private staticBlurWords: Array<{ rx: number; ry: number; word: string; threshold: number }> = [];

  constructor() {
    this.initStaticBlurWords();
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _timestamp: number,
    config: EngineConfig,
    _startTime: number
  ): void {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const blurRatio = config.pot0 / 1023; // DENSITY controls what fraction of text is blurred
    const speedVal = 0.2 + (config.pot1 / 1023) * 2; // SPEED controls drift speed
    const blurAmount = Math.max(1, Math.round(1 + (config.pot2 / 1023) * 25)); // BLUR controls blur radius
    const fontSizeVal = Math.max(14, Math.round(14 + (config.pot3 / 1023) * 60)); // FONT SIZE controls font size

    // Build a cache key from the parameters that affect the texture
    const texKey = `${blurRatio.toFixed(2)}_${blurAmount}_${fontSizeVal}_${width}_${height}`;

    // Only re-render the offscreen texture when parameters change
    if (this.blurTextureKey !== texKey) {
      this.blurTexture = this.renderBlurTexture(width, height, blurRatio, blurAmount, fontSizeVal);
      this.blurTextureKey = texKey;
    }

    if (!this.blurTexture) return;

    // Animate by scrolling the texture
    this.blurScrollX += speedVal * 0.3;
    this.blurScrollY += speedVal * 0.15;

    const texW = this.blurTexture.width;
    const texH = this.blurTexture.height;

    // Tile the texture with wrap-around for seamless scrolling
    const offsetX = ((this.blurScrollX % texW) + texW) % texW;
    const offsetY = ((this.blurScrollY % texH) + texH) % texH;

    // Draw 4 copies to cover the viewport with seamless wrapping
    ctx.drawImage(this.blurTexture, -offsetX, -offsetY);
    ctx.drawImage(this.blurTexture, texW - offsetX, -offsetY);
    ctx.drawImage(this.blurTexture, -offsetX, texH - offsetY);
    ctx.drawImage(this.blurTexture, texW - offsetX, texH - offsetY);
  }

  private renderBlurTexture(
    width: number,
    height: number,
    blurRatio: number,
    blurAmount: number,
    fontSize: number
  ): HTMLCanvasElement {
    // Make the texture slightly larger than viewport for seamless tiling
    const texW = Math.ceil(width * 1.5);
    const texH = Math.ceil(height * 1.5);

    // Step 1: Draw the crisp text to be blurred
    const crispCanvas = document.createElement('canvas');
    crispCanvas.width = texW;
    crispCanvas.height = texH;
    const crispCtx = crispCanvas.getContext('2d')!;

    crispCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    crispCtx.font = `bold ${fontSize}px "Space Grotesk", "IBM Plex Mono", monospace`;
    crispCtx.textAlign = 'center';
    crispCtx.textBaseline = 'middle';

    // Step 2: Draw the crisp text that stays sharp
    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = texW;
    sharpCanvas.height = texH;
    const sharpCtx = sharpCanvas.getContext('2d')!;

    sharpCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    sharpCtx.font = `bold ${fontSize}px "Space Grotesk", "IBM Plex Mono", monospace`;
    sharpCtx.textAlign = 'center';
    sharpCtx.textBaseline = 'middle';

    // Split words from the static list based on threshold vs blurRatio
    for (const w of this.staticBlurWords) {
      const x = w.rx * texW;
      const y = w.ry * texH;
      if (w.threshold <= blurRatio) {
        crispCtx.fillText(w.word, x, y);
      } else {
        sharpCtx.fillText(w.word, x, y);
      }
    }

    // Step 3: Combine them: blur the crispCanvas and draw it, then draw sharpCanvas
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = texW;
    combinedCanvas.height = texH;
    const combinedCtx = combinedCanvas.getContext('2d')!;

    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = texW;
    blurCanvas.height = texH;
    const blurCtx = blurCanvas.getContext('2d')!;
    blurCtx.filter = `blur(${blurAmount}px)`;
    blurCtx.drawImage(crispCanvas, 0, 0);

    // Draw blurred layer
    combinedCtx.drawImage(blurCanvas, 0, 0);
    // Draw sharp layer on top
    combinedCtx.drawImage(sharpCanvas, 0, 0);

    return combinedCanvas;
  }

  private initStaticBlurWords(): void {
    const words = [
      'the', 'women', 'who', 'programmed', 'ENIAC', 'were', 'not', 'recognized',
      'for', 'their', 'contributions', 'to', 'computing', 'history', 'until',
      'decades', 'later', 'Kay', 'Jean', 'Betty', 'Marlyn', 'Fran', 'Ruth',
      'programmers', 'invisible', 'pioneers', 'code', 'debug', 'memory',
      'accumulator', 'subroutine', 'ballistics', 'trajectory', 'tables',
      'a', 'n', 'o', 't', 'e', 'r', 'm', 'w', 'b', 'h', 'd', 'g', 'y',
      'compute', 'calculate', 'loops', 'function', 'mathematics',
    ];

    this.staticBlurWords = [];
    // Initialize seed-based pseudo random generator
    let seed = 12345;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 100; i++) {
      this.staticBlurWords.push({
        rx: random(),
        ry: random(),
        word: words[Math.floor(random() * words.length)],
        threshold: random(),
      });
    }
  }
}
