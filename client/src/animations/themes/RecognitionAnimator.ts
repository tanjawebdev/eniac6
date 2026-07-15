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
  private charLayouts: CharLayout[] = [];
  private layoutKey = '';
  private computedFontSize = 40;
  private timePhase = 0;

  public draw(
    ctx: CanvasRenderingContext2D,
    blurCtx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    _timestamp: number,
    config: EngineConfig,
    _startTime: number
  ): void {
    // Read pots
    const targetDensity = config.pot0 / 1023; // DENSITY (ratio of blurred vs sharp)
    const speedVal = 0.05 + (config.pot1 / 1023) * 5; // SPEED of shift transition
    const blurVal = config.pot2 / 1023; // BLUR level (0 to 1)
    const pot3Val = config.pot3 / 1023; // ALPHA (pot3 controls thickness/boldness of blurred layer only)

    // Update the shifting time phase smoothly using dt
    const dt = 0.016; // ~16ms per frame
    this.timePhase += dt * speedVal;

    // Recompute character layout if canvas dimensions changed
    const newLayoutKey = `${width}_${height}`;
    if (this.layoutKey !== newLayoutKey) {
      this.computeLayout(width, height);
      this.layoutKey = newLayoutKey;
    }

    // Clear background of the sharp canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (!blurCtx) return;

    const font = `bold ${this.computedFontSize}px "Space Grotesk", sans-serif`;
    const letterSpacing = '-0.04em';

    // Configure text parameters
    const baseAlpha = 0.85; // Sharp layer stays normal and constant
    const blurStrokeWidth = pot3Val * (this.computedFontSize * 0.25); // Thick stroke on blurred layer only
    const blurRepeats = 1 + Math.round(pot3Val * 3); // 1 to 4 repeats to make the blurred layer super dark

    // Calculate a fade factor for the blurred canvas: as blur goes high, it smoothly vanishes
    let blurFade = 1.0;
    if (blurVal > 0.3) {
      blurFade = Math.max(0, 1 - (blurVal - 0.3) / 2);
    }

    // Configure blur canvas context
    blurCtx.save();
    blurCtx.font = font;
    blurCtx.letterSpacing = letterSpacing;
    blurCtx.textBaseline = 'top';

    // Configure sharp canvas context
    ctx.save();
    ctx.font = font;
    ctx.letterSpacing = letterSpacing;
    ctx.textBaseline = 'top';

    // Calculate transition window width (smooth peak at 0.3, 0 at boundaries)
    const w = 0.3 * Math.sin(targetDensity * Math.PI);

    for (const ch of this.charLayouts) {
      if (ch.char === ' ') continue;

      // Use a sine wave to oscillate the character threshold smoothly with NO modulo jumps
      const currentVal = 0.5 + 0.5 * Math.sin(ch.threshold * Math.PI * 2 + this.timePhase);

      // Calculate blur factor 't' (0 = fully sharp, 1 = fully blurred)
      let t = 0;
      if (w <= 0.001) {
        t = currentVal <= targetDensity ? 1 : 0;
      } else {
        const start = targetDensity - w / 2;
        const end = targetDensity + w / 2;
        if (currentVal <= start) {
          t = 1;
        } else if (currentVal >= end) {
          t = 0;
        } else {
          t = 1 - (currentVal - start) / w;
        }
      }

      // Draw to blurred layer if t > 0 and blur has not completely faded out
      const currentBlurOpacity = t * baseAlpha * blurFade;
      if (currentBlurOpacity > 0.01) {
        blurCtx.fillStyle = `rgba(0, 0, 0, ${currentBlurOpacity})`;
        for (let r = 0; r < blurRepeats; r++) {
          blurCtx.fillText(ch.char, ch.x, ch.y);
        }
        
        if (blurStrokeWidth > 0) {
          blurCtx.strokeStyle = `rgba(0, 0, 0, ${currentBlurOpacity})`;
          blurCtx.lineWidth = blurStrokeWidth;
          blurCtx.lineJoin = 'round';
          for (let r = 0; r < blurRepeats; r++) {
            blurCtx.strokeText(ch.char, ch.x, ch.y);
          }
        }
      }

      // Draw to sharp layer if t < 1 (always normal, constant weight and opacity)
      if (t < 1) {
        ctx.fillStyle = `rgba(0, 0, 0, ${(1 - t) * baseAlpha})`;
        ctx.fillText(ch.char, ch.x, ch.y);
      }
    }

    blurCtx.restore();
    ctx.restore();
  }

  /**
   * Lay out the quote as a word-wrapped paragraph filling the canvas.
   * Each character gets a deterministic threshold for blur assignment.
   */
  private computeLayout(width: number, height: number): void {
    const marginX = 0;
    const marginY = 0;
    const availWidth = width;
    const availHeight = height;
    const letterSpacing = '-0.04em';

    // Temporary canvas for text measurement
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.letterSpacing = letterSpacing;

    // Binary search for the largest font size that fits the quote in the available area
    let lo = 16;
    let hi = 300;
    let bestFontSize = 16;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      tempCtx.font = `bold ${mid}px "Space Grotesk", sans-serif`;
      const lineHeight = Math.round(mid * 1.12); // tight line height
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
    const lineHeight = Math.round(bestFontSize * 1.12);
    const font = `bold ${bestFontSize}px "Space Grotesk", sans-serif`;
    tempCtx.font = font;

    const lines = this.wrapText(tempCtx, QUOTE, availWidth);
    const totalHeight = lines.length * lineHeight;
    const startY = marginY + (availHeight - totalHeight) / 2;

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
}
