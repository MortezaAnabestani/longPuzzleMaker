/**
 * Frame Renderer
 *
 * رندر کامل هر فریم ویدیو
 * - ترکیب تمام لایه‌ها
 * - مدیریت Timeline
 * - رندر پازل، متن، و تصاویر
 * - اعمال Transition ها
 * - Export فریم‌ها
 */

import { CanvasEngine, VIDEO_FPS, FrameData } from './canvasEngine';
import { PuzzleRenderer, PuzzleState } from './puzzleRenderer';
import { TextRenderer, TextOverlay } from './textRenderer';
import { ImageManager } from './imageManager';
import { LongVideoProject, VideoAct, ActTransition } from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * Render Context
 */
export interface RenderContext {
  project: LongVideoProject;
  currentTime: number;
  frameNumber: number;
  currentAct: VideoAct | null;
  currentActIndex: number;
  actStartTime: number;
  actProgress: number;       // 0-1 within current act
  isInTransition: boolean;
  transition?: ActTransition;
  transitionProgress?: number; // 0-1
}

/**
 * Render Options
 */
export interface RenderOptions {
  startTime?: number;
  endTime?: number;
  fps?: number;
  quality?: number;          // 0-1 for image quality
  onProgress?: (progress: number, frameNumber: number, totalFrames: number) => void;
  onFrameRendered?: (frameData: FrameData) => void;
}

/**
 * Render Result
 */
export interface RenderResult {
  success: boolean;
  frames: FrameData[];
  totalFrames: number;
  duration: number;
  error?: string;
}

/**
 * Transition State
 */
interface TransitionState {
  type: string;
  progress: number;
  fromActIndex: number;
  toActIndex: number;
  fromImage: HTMLCanvasElement | null;
  toImage: HTMLCanvasElement | null;
}

// ==================== FRAME RENDERER ====================

export class FrameRenderer {
  private canvasEngine: CanvasEngine;
  private puzzleRenderer: PuzzleRenderer;
  private textRenderer: TextRenderer;
  private imageManager: ImageManager;

  private currentProject: LongVideoProject | null = null;
  private actTimeline: Array<{ act: VideoAct; startTime: number; endTime: number }> = [];

  constructor(
    canvasEngine: CanvasEngine,
    puzzleRenderer: PuzzleRenderer,
    textRenderer: TextRenderer,
    imageManager: ImageManager
  ) {
    this.canvasEngine = canvasEngine;
    this.puzzleRenderer = puzzleRenderer;
    this.textRenderer = textRenderer;
    this.imageManager = imageManager;

    console.log(`🎬 [FrameRenderer] Initialized`);
  }

  /**
   * تنظیم پروژه برای رندر
   */
  async setupProject(project: LongVideoProject): Promise<void> {
    this.currentProject = project;

    console.log(`🎬 [FrameRenderer] Setting up project: ${project.title}`);

    // ساخت Timeline
    this.buildTimeline(project);

    // پیش‌بارگذاری تصاویر
    await this.preloadImages(project);

    // تنظیم Text Overlays
    this.setupTextOverlays(project);

    console.log(`✅ [FrameRenderer] Project setup complete`);
  }

  /**
   * ساخت Timeline
   */
  private buildTimeline(project: LongVideoProject): void {
    this.actTimeline = [];
    let currentTime = 0;

    for (const act of project.acts) {
      const startTime = currentTime;
      const endTime = currentTime + act.duration;

      this.actTimeline.push({ act, startTime, endTime });

      currentTime = endTime;
      if (act.transition) {
        currentTime += act.transition.duration;
      }
    }

    console.log(`📅 [FrameRenderer] Timeline built: ${this.actTimeline.length} acts`);
  }

  /**
   * پیش‌بارگذاری تصاویر
   */
  private async preloadImages(project: LongVideoProject): Promise<void> {
    const imageUrls = project.acts.map(act => act.imageUrl);
    console.log(`📥 [FrameRenderer] Preloading ${imageUrls.length} images...`);

    const results = await this.imageManager.loadImages(imageUrls);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ [FrameRenderer] Preloaded ${successCount}/${imageUrls.length} images`);
  }

  /**
   * تنظیم Text Overlays
   */
  private setupTextOverlays(project: LongVideoProject): void {
    this.textRenderer.clearOverlays();

    for (const actInfo of this.actTimeline) {
      const { act, startTime, endTime } = actInfo;

      // اضافه کردن Texts
      for (const text of act.texts) {
        const overlay: TextOverlay = {
          id: `${act.id}_text_${text.id}`,
          text: text.content,
          position: text.position as any,
          startTime: startTime + text.startTime,
          endTime: startTime + text.startTime + text.duration,
          style: {
            fontSize: text.fontSize,
            color: text.color,
            backgroundColor: text.backgroundColor,
            ...text.style
          },
          animation: text.animation
        };

        this.textRenderer.addOverlay(overlay);
      }

      // اضافه کردن Facts به عنوان Text
      for (const fact of act.facts) {
        const overlay: TextOverlay = {
          id: `${act.id}_fact_${fact.id}`,
          text: fact.content,
          position: 'bottom-center',
          startTime: startTime + fact.timing.appearAt,
          endTime: startTime + fact.timing.appearAt + fact.timing.duration,
          style: {
            fontSize: 36,
            color: '#FFFFFF',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 25
          },
          animation: {
            type: 'slide-up',
            duration: 0.5,
            easing: 'easeOut'
          }
        };

        this.textRenderer.addOverlay(overlay);
      }
    }

    console.log(`📝 [FrameRenderer] Setup ${this.textRenderer.getAllOverlays().length} text overlays`);
  }

  /**
   * رندر یک فریم در زمان مشخص
   */
  async renderFrame(time: number): Promise<FrameData> {
    if (!this.currentProject) {
      throw new Error('No project setup. Call setupProject() first.');
    }

    // ساخت Render Context
    const context = this.createRenderContext(time);

    // پاک کردن Canvas
    this.canvasEngine.clear('#000000');

    // رندر بر اساس وضعیت
    if (context.isInTransition && context.transition) {
      await this.renderTransition(context);
    } else if (context.currentAct) {
      await this.renderAct(context);
    }

    // Capture فریم
    const frameNumber = Math.floor(time * VIDEO_FPS);
    return this.canvasEngine.captureFrame(frameNumber, time);
  }

  /**
   * ساخت Render Context
   */
  private createRenderContext(time: number): RenderContext {
    const project = this.currentProject!;

    // پیدا کردن Act فعلی
    let currentActIndex = -1;
    let currentAct: VideoAct | null = null;
    let actStartTime = 0;
    let actProgress = 0;
    let isInTransition = false;
    let transition: ActTransition | undefined;
    let transitionProgress: number | undefined;

    for (let i = 0; i < this.actTimeline.length; i++) {
      const actInfo = this.actTimeline[i];

      if (time >= actInfo.startTime && time < actInfo.endTime) {
        // درون Act
        currentActIndex = i;
        currentAct = actInfo.act;
        actStartTime = actInfo.startTime;
        actProgress = (time - actInfo.startTime) / actInfo.act.duration;
        break;
      } else if (actInfo.act.transition && i < this.actTimeline.length - 1) {
        // بررسی Transition
        const transitionStart = actInfo.endTime;
        const transitionEnd = transitionStart + actInfo.act.transition.duration;

        if (time >= transitionStart && time < transitionEnd) {
          isInTransition = true;
          transition = actInfo.act.transition;
          transitionProgress = (time - transitionStart) / actInfo.act.transition.duration;
          currentActIndex = i;
          break;
        }
      }
    }

    return {
      project,
      currentTime: time,
      frameNumber: Math.floor(time * VIDEO_FPS),
      currentAct,
      currentActIndex,
      actStartTime,
      actProgress,
      isInTransition,
      transition,
      transitionProgress
    };
  }

  /**
   * رندر یک Act
   */
  private async renderAct(context: RenderContext): Promise<void> {
    const { currentAct, actStartTime, actProgress } = context;
    if (!currentAct) return;

    // بارگذاری تصویر
    const imageResult = await this.imageManager.loadImage(currentAct.imageUrl);
    if (!imageResult.success || !imageResult.image) {
      console.error(`❌ [FrameRenderer] Failed to load image: ${currentAct.imageUrl}`);
      return;
    }

    const image = imageResult.image;

    // Initialize یا Update پازل
    if (!this.puzzleRenderer.getState() || this.puzzleRenderer.getState()?.image !== image) {
      this.puzzleRenderer.initPuzzle(image, currentAct.puzzleConfig.pieceCount);
    }

    // به‌روزرسانی پازل
    this.puzzleRenderer.updatePuzzle(
      context.currentTime,
      actStartTime,
      currentAct.duration,
      currentAct.puzzleConfig,
      currentAct.cameraMovements
    );

    // رندر پازل
    const mainCtx = this.canvasEngine.getContext();
    this.puzzleRenderer.render(mainCtx);

    // رندر متن‌ها
    this.textRenderer.render(mainCtx, context.currentTime);
  }

  /**
   * رندر Transition
   */
  private async renderTransition(context: RenderContext): Promise<void> {
    if (!context.transition || context.transitionProgress === undefined) return;

    const fromActInfo = this.actTimeline[context.currentActIndex];
    const toActInfo = this.actTimeline[context.currentActIndex + 1];

    if (!fromActInfo || !toActInfo) return;

    // رندر فریم‌های From و To
    const fromCanvas = await this.renderActToCanvas(
      fromActInfo.act,
      fromActInfo.startTime,
      fromActInfo.endTime - fromActInfo.startTime
    );

    const toCanvas = await this.renderActToCanvas(
      toActInfo.act,
      toActInfo.startTime,
      0
    );

    // اعمال Transition
    const mainCtx = this.canvasEngine.getContext();
    this.applyTransitionEffect(
      mainCtx,
      fromCanvas,
      toCanvas,
      context.transition,
      context.transitionProgress
    );

    // رندر متن‌ها
    this.textRenderer.render(mainCtx, context.currentTime);
  }

  /**
   * رندر یک Act روی Canvas جداگانه
   */
  private async renderActToCanvas(
    act: VideoAct,
    actStartTime: number,
    relativeTime: number
  ): Promise<HTMLCanvasElement> {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = this.canvasEngine.getCanvas().width;
    offscreenCanvas.height = this.canvasEngine.getCanvas().height;
    const ctx = offscreenCanvas.getContext('2d')!;

    // بارگذاری تصویر
    const imageResult = await this.imageManager.loadImage(act.imageUrl);
    if (!imageResult.success || !imageResult.image) {
      return offscreenCanvas;
    }

    // رندر پازل
    const tempRenderer = new PuzzleRenderer();
    tempRenderer.initPuzzle(imageResult.image, act.puzzleConfig.pieceCount);
    tempRenderer.updatePuzzle(
      actStartTime + relativeTime,
      actStartTime,
      act.duration,
      act.puzzleConfig,
      act.cameraMovements
    );
    tempRenderer.render(ctx);

    return offscreenCanvas;
  }

  /**
   * اعمال Transition Effect
   */
  private applyTransitionEffect(
    ctx: CanvasRenderingContext2D,
    fromCanvas: HTMLCanvasElement,
    toCanvas: HTMLCanvasElement,
    transition: ActTransition,
    progress: number
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    switch (transition.type) {
      case 'fade':
      case 'crossfade':
        // Crossfade
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(fromCanvas, 0, 0);
        ctx.globalAlpha = progress;
        ctx.drawImage(toCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        break;

      case 'slide-left':
        ctx.drawImage(fromCanvas, -width * progress, 0);
        ctx.drawImage(toCanvas, width * (1 - progress), 0);
        break;

      case 'slide-right':
        ctx.drawImage(fromCanvas, width * progress, 0);
        ctx.drawImage(toCanvas, -width * (1 - progress), 0);
        break;

      case 'slide-up':
        ctx.drawImage(fromCanvas, 0, -height * progress);
        ctx.drawImage(toCanvas, 0, height * (1 - progress));
        break;

      case 'slide-down':
        ctx.drawImage(fromCanvas, 0, height * progress);
        ctx.drawImage(toCanvas, 0, -height * (1 - progress));
        break;

      case 'zoom-in':
        // From zooms in and fades
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        const scale = 1 + progress;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(fromCanvas, 0, 0);
        ctx.restore();

        // To fades in
        ctx.globalAlpha = progress;
        ctx.drawImage(toCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        break;

      case 'zoom-out':
        // From zooms out and fades
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        const zoomScale = 1 - progress * 0.5;
        ctx.translate(width / 2, height / 2);
        ctx.scale(zoomScale, zoomScale);
        ctx.translate(-width / 2, -height / 2);
        ctx.drawImage(fromCanvas, 0, 0);
        ctx.restore();

        // To fades in
        ctx.globalAlpha = progress;
        ctx.drawImage(toCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        break;

      case 'dissolve':
        // Simple crossfade
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(fromCanvas, 0, 0);
        ctx.globalAlpha = progress;
        ctx.drawImage(toCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        break;

      default:
        // Fallback: crossfade
        ctx.globalAlpha = 1 - progress;
        ctx.drawImage(fromCanvas, 0, 0);
        ctx.globalAlpha = progress;
        ctx.drawImage(toCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        break;
    }
  }

  /**
   * رندر تمام فریم‌ها
   */
  async renderAllFrames(options: RenderOptions = {}): Promise<RenderResult> {
    if (!this.currentProject) {
      return {
        success: false,
        frames: [],
        totalFrames: 0,
        duration: 0,
        error: 'No project setup'
      };
    }

    const {
      startTime = 0,
      endTime = this.currentProject.totalDuration,
      fps = VIDEO_FPS,
      onProgress,
      onFrameRendered
    } = options;

    const duration = endTime - startTime;
    const totalFrames = Math.ceil(duration * fps);
    const frames: FrameData[] = [];

    console.log(`🎬 [FrameRenderer] Rendering ${totalFrames} frames (${duration.toFixed(2)}s)...`);

    try {
      for (let i = 0; i < totalFrames; i++) {
        const time = startTime + (i / fps);
        const frameData = await this.renderFrame(time);

        frames.push(frameData);

        if (onFrameRendered) {
          onFrameRendered(frameData);
        }

        if (onProgress && i % 10 === 0) {
          const progress = (i + 1) / totalFrames;
          onProgress(progress, i + 1, totalFrames);
        }
      }

      console.log(`✅ [FrameRenderer] Rendered ${totalFrames} frames`);

      return {
        success: true,
        frames,
        totalFrames,
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [FrameRenderer] Render failed: ${errorMessage}`);

      return {
        success: false,
        frames,
        totalFrames,
        duration,
        error: errorMessage
      };
    }
  }

  /**
   * رندر یک بازه زمانی خاص
   */
  async renderTimeRange(
    startTime: number,
    endTime: number,
    fps: number = VIDEO_FPS
  ): Promise<FrameData[]> {
    const result = await this.renderAllFrames({
      startTime,
      endTime,
      fps
    });

    return result.frames;
  }

  /**
   * پیش‌نمایش فریم
   */
  async previewFrame(time: number): Promise<void> {
    await this.renderFrame(time);
  }

  /**
   * دریافت Context فعلی
   */
  getCurrentContext(time: number): RenderContext {
    return this.createRenderContext(time);
  }

  /**
   * Reset
   */
  reset(): void {
    this.currentProject = null;
    this.actTimeline = [];
    this.puzzleRenderer.reset();
    this.textRenderer.reset();
    console.log(`🔄 [FrameRenderer] Reset`);
  }
}

// ==================== EXPORT ====================

export function createFrameRenderer(
  canvasEngine: CanvasEngine,
  puzzleRenderer: PuzzleRenderer,
  textRenderer: TextRenderer,
  imageManager: ImageManager
): FrameRenderer {
  return new FrameRenderer(canvasEngine, puzzleRenderer, textRenderer, imageManager);
}
