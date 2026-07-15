import { EngineConfig } from '../AnimationEngine';

export interface ThemeAnimator {
  draw(
    ctx: CanvasRenderingContext2D,
    blurCtx: CanvasRenderingContext2D | null,
    width: number,
    height: number,
    timestamp: number,
    config: EngineConfig,
    startTime: number
  ): void;
}
