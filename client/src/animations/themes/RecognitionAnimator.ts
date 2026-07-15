import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

interface CharLayout {
  char: string;
  x: number;
  y: number;
  threshold: number; // 0–1, determines when this character becomes blurred
}

const QUOTE =
  'Our test program for the trajectory was the one used for the formal scientific ' +
  'demonstration on February 15, 1946. After that exciting ENIAC demonstration, ' +
  'the men all went out to eat and celebrate together. However, the ENIAC women ' +
  'were left behind with barely a word of congratulations for our many contributions ' +
  'to the success of the project. The ENIAC female programmers had always felt ' +
  'respected and valued by our male coworkers. Yet that night we were forgotten, ' +
  'even by them. Why? I don\'t have an adequate answer other than to say that it was ' +
  'a different time and society at large expected us to stand behind our men and ' +
  'silently support them. Like every other American woman, the ENIAC women ' +
  'played the role society had assigned to us and we played it well and generally without ' +
  'rancor, although not without some hurt feelings. ' +
  'While it would have been nice to be included in the festivities and receive ' +
  'our own accolades for a job well done, at least all of us knew the truth about our ' +
  'contributions. Each of us women could also feel a quiet satisfaction in being able ' +
  'to say, "I was there." We had tamed a mechanical beast and made it purr.';

export class RecognitionAnimator implements ThemeAnimator {
  private texture: HTMLCanvasElement | null = null;
  private textureKey = '';
  private charLayouts: CharLayout[] = [];
  private layoutKey = '';
  private computedFontSize = 40;
  private animatedDensity = 0;

  public draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _timestamp: number,
    config: EngineConfig,
    _startTime: number
  ): void {
    // Read pots
    const targetDensity = config.pot0 / 1023;
    const speed = 0.005 + (config.pot1 / 1023) * 0.15;
    const blurAmount = Math.max(1, Math.round(1 + (config.pot2 / 1023) * 25));
    const alpha = 0.08 + (config.pot3 / 1023) * 0.92;

    // Animate density toward target (speed controls transition rate)
    const diff = targetDensity - this.animatedDensity;
    if (Math.abs(diff) > 0.001) {
      this.animatedDensity += diff * speed;
    } else {
      this.animatedDensity = targetDensity;
    }

    // Recompute character layout if canvas dimensions changed
    const newLayoutKey = `${width}_${height}`;
    if (this.layoutKey !== newLayoutKey) {
      this.computeLayout(width, height);
      this.layoutKey = newLayoutKey;
    }

    // Quantize animated density to avoid rebuilding texture every single frame
    const quantizedDensity = Math.round(this.animatedDensity * 200) / 200;
    const texKey = `${quantizedDensity}_${blurAmount}_${width}_${height}`;

    if (this.textureKey !== texKey) {
      this.texture = this.renderTexture(width, height, quantizedDensity, blurAmount);
      this.textureKey = texKey;
    }

    // Draw background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw the composited text texture with alpha
    if (this.texture) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.texture, 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Lay out the quote as a word-wrapped paragraph filling the canvas.
   * Each character gets a deterministic threshold for blur assignment.
   */
  private computeLayout(width: number, height: number): void {
    const marginX = Math.round(width * 0.08);
    const marginY = Math.round(height * 0.06);
    const availWidth = width - marginX * 2;
    const availHeight = height - marginY * 2;

    // Temporary canvas for text measurement
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d')!;

    // Binary search for the largest font size that fits the quote in the available area
    let lo = 16;
    let hi = 200;
    let bestFontSize = 16;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      tempCtx.font = `bold ${mid}px "Space Grotesk", sans-serif`;
      const lineHeight = Math.round(mid * 1.35);
      const lines = this.wrapText(tempCtx, QUOTE, availWidth);
      const totalHeight = lines.length * lineHeight;

      if (totalHeight <= availHeight) {
        bestFontSize = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    this.computedFontSize = bestFontSize;
    const lineHeight = Math.round(bestFontSize * 1.35);
    const font = `bold ${bestFontSize}px "Space Grotesk", sans-serif`;
    tempCtx.font = font;

    const lines = this.wrapText(tempCtx, QUOTE, availWidth);
    const totalHeight = lines.length * lineHeight;
    const startY = marginY + (availHeight - totalHeight) / 2 + bestFontSize;

    // Deterministic pseudo-random threshold per character
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    this.charLayouts = [];

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      let x = marginX;
      const y = startY + lineIdx * lineHeight;

      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        const charWidth = tempCtx.measureText(char).width;

        this.charLayouts.push({
          char,
          x,
          y,
          threshold: random(),
        });

        x += charWidth;
      }
    }
  }

  /**
   * Word-wrap text to fit within maxWidth.
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Render the combined sharp + blurred text texture.
   * Characters with threshold <= density are blurred; the rest stay sharp.
   */
  private renderTexture(
    width: number,
    height: number,
    density: number,
    blurAmount: number
  ): HTMLCanvasElement {
    const font = `bold ${this.computedFontSize}px "Space Grotesk", sans-serif`;

    // Canvas for characters that will be blurred
    const blurSrcCanvas = document.createElement('canvas');
    blurSrcCanvas.width = width;
    blurSrcCanvas.height = height;
    const blurSrcCtx = blurSrcCanvas.getContext('2d')!;
    blurSrcCtx.fillStyle = '#000000';
    blurSrcCtx.font = font;
    blurSrcCtx.textBaseline = 'alphabetic';

    // Canvas for characters that stay sharp
    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = width;
    sharpCanvas.height = height;
    const sharpCtx = sharpCanvas.getContext('2d')!;
    sharpCtx.fillStyle = '#000000';
    sharpCtx.font = font;
    sharpCtx.textBaseline = 'alphabetic';

    // Split characters into blurred vs sharp based on threshold
    for (const ch of this.charLayouts) {
      if (ch.char === ' ') continue;
      if (ch.threshold <= density) {
        blurSrcCtx.fillText(ch.char, ch.x, ch.y);
      } else {
        sharpCtx.fillText(ch.char, ch.x, ch.y);
      }
    }

    // Apply blur to the blur source canvas
    const blurredCanvas = document.createElement('canvas');
    blurredCanvas.width = width;
    blurredCanvas.height = height;
    const blurredCtx = blurredCanvas.getContext('2d')!;
    blurredCtx.filter = `blur(${blurAmount}px)`;
    blurredCtx.drawImage(blurSrcCanvas, 0, 0);

    // Combine: blurred layer first, then sharp on top
    const combined = document.createElement('canvas');
    combined.width = width;
    combined.height = height;
    const combinedCtx = combined.getContext('2d')!;
    combinedCtx.drawImage(blurredCanvas, 0, 0);
    combinedCtx.drawImage(sharpCanvas, 0, 0);

    return combined;
  }
}
