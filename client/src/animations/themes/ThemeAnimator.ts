import { EngineConfig } from '../AnimationEngine';

export interface ThemeAnimator {
  draw(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timestamp: number,
    config: EngineConfig,
    startTime: number
  ): void;
}
