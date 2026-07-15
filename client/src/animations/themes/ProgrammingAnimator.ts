import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

export class ProgrammingAnimator implements ThemeAnimator {
  public draw(
    ctx: CanvasRenderingContext2D,
    _blurCtx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    timestamp: number,
    config: EngineConfig,
    startTime: number
  ): void {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const scaleVal = config.pot0 / 1023;
    const speedVal = config.pot1 / 1023;
    const contrastVal = config.pot2 / 1023;
    const amplitudeVal = config.pot3 / 1023;

    const fontSize = Math.max(14, Math.round(15 + scaleVal * 20));
    const cellWidth = Math.max(12, Math.round(11 + scaleVal * 15));
    const cellHeight = Math.max(18, Math.round(16 + scaleVal * 22));

    ctx.font = `bold ${fontSize}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const alpha = contrastVal * 0.4 + 0.1;
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;

    const timeFactor = (timestamp - startTime) * 0.001 * (0.2 + speedVal * 3);

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
}
