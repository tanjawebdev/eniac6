import { EngineConfig } from '../AnimationEngine';
import { ThemeAnimator } from './ThemeAnimator';

export class ProgrammingAnimator implements ThemeAnimator {
  private video: HTMLVideoElement | null = null;
  private videoCanvas: HTMLCanvasElement | null = null;
  private videoCtx: CanvasRenderingContext2D | null = null;

  public draw(
    ctx: CanvasRenderingContext2D,
    _blurCtx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    _timestamp: number,
    config: EngineConfig,
    _startTime: number
  ): void {
    // Clear background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Read potentiometer configurations
    const scaleVal = config.pot0 / 1023; // SCALE (font/grid size)
    const speedVal = config.pot1 / 1023; // SPEED (video playback rate)
    const contrastVal = config.pot2 / 1023; // CONTRAST (of video footage)
    const gammaVal = config.pot3 / 1023; // GAMMA (mid-tone brightness of video footage)

    // Calculate grid and font size based on SCALE
    const fontSize = Math.max(12, Math.round(14 + scaleVal * 24));
    const cellWidth = Math.max(10, Math.round(10 + scaleVal * 18));
    const cellHeight = Math.max(14, Math.round(14 + scaleVal * 26));

    ctx.font = `bold ${fontSize}px "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cols = Math.ceil(width / cellWidth) + 1;
    const rows = Math.ceil(height / cellHeight) + 1;

    // Lazy load the video element on the first frame
    if (!this.video) {
      this.video = document.createElement('video');
      this.video.src = '/programming.mp4';
      this.video.muted = true;
      this.video.loop = true;
      this.video.playsInline = true;
      this.video.play().catch((err) => {
        console.error('Error starting ASCII background video:', err);
      });

      this.videoCanvas = document.createElement('canvas');
      this.videoCtx = this.videoCanvas.getContext('2d', { willReadFrequently: true });
    }

    // Dynamic playback speed control
    const targetSpeed = 0.2 + speedVal * 2.8; // 0.2x to 3.0x speed
    if (Math.abs(this.video.playbackRate - targetSpeed) > 0.05) {
      this.video.playbackRate = targetSpeed;
    }

    // If video is ready, read frames and process pixels
    if (this.video.readyState >= 2 && this.videoCanvas && this.videoCtx) {
      // Ensure the offscreen canvas dimensions match our ASCII grid size
      if (this.videoCanvas.width !== cols || this.videoCanvas.height !== rows) {
        this.videoCanvas.width = cols;
        this.videoCanvas.height = rows;
      }

      // Draw current video frame scaled down to the grid size
      this.videoCtx.drawImage(this.video, 0, 0, cols, rows);
      const imgData = this.videoCtx.getImageData(0, 0, cols, rows);
      const pixels = imgData.data;

      // Character density ramp (lightest to darkest)
      const chars = '   .,-~:;=!*#$@NM';
      const maxCharIdx = chars.length - 1;

      // Calculate Gamma correction exponent (from 0.2 to 4.0)
      const gamma = 0.2 + gammaVal * 3.8;

      // Calculate Contrast factor (from 0.0 to 3.0)
      const contrastFactor = Math.max(0, 1 + (contrastVal - 0.5) * 4);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // Constant prominent dark alpha for text readability

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pixelIdx = (r * cols + c) * 4;
          const red = pixels[pixelIdx];
          const green = pixels[pixelIdx + 1];
          const blue = pixels[pixelIdx + 2];

          // Normalized luminance (0 to 1)
          let luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

          // Apply Gamma correction
          luminance = Math.pow(luminance, 1 / gamma);

          // Apply Contrast adjustment
          luminance = 0.5 + (luminance - 0.5) * contrastFactor;
          luminance = Math.max(0, Math.min(1, luminance)); // Clamp to [0, 1]

          // Invert: dark video pixels become dense ASCII chars, light pixels become empty space
          const charIdx = Math.floor((1 - luminance) * maxCharIdx);
          const char = chars[charIdx];

          if (char !== ' ') {
            const x = c * cellWidth;
            const y = r * cellHeight;
            ctx.fillText(char, x, y);
          }
        }
      }
    } else {
      // Fallback display if video is loading/buffering
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText('CONNECTING SOURCE FOOTAGE...', width / 2, height / 2);
    }
  }
}
