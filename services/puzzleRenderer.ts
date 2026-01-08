/**
 * Puzzle Renderer
 *
 * رندرینگ انیمیشن پازل
 * - تقسیم تصویر به قطعات
 * - انیمیشن جاخوردن قطعات
 * - حرکت‌های دوربین
 */

import { ActPuzzleConfig, CameraSettings } from '../types/longVideo.types';
import { VIDEO_WIDTH, VIDEO_HEIGHT } from './canvasEngine';

// ==================== INTERFACES ====================

/**
 * Puzzle Piece
 */
export interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  x: number;           // موقعیت نهایی
  y: number;
  width: number;
  height: number;
  currentX: number;    // موقعیت فعلی (برای انیمیشن)
  currentY: number;
  rotation: number;    // چرخش فعلی
  opacity: number;
  isPlaced: boolean;   // آیا در جای خود قرار گرفته
  placementTime?: number; // زمان قرار گرفتن
}

/**
 * Puzzle State
 */
export interface PuzzleState {
  pieces: PuzzlePiece[];
  progress: number;      // 0-100
  gridRows: number;
  gridCols: number;
  image: HTMLImageElement;
  camera: {
    x: number;
    y: number;
    zoom: number;
    rotation: number;
  };
}

/**
 * Animation Easing Functions
 */
type EasingFunction = (t: number) => number;

// ==================== EASING FUNCTIONS ====================

const EASING: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  dramatic: (t) => {
    // برای Breakthrough - انیمیشن دراماتیک
    if (t < 0.5) {
      return 4 * t * t * t;
    } else {
      return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  }
};

// ==================== PUZZLE RENDERER ====================

export class PuzzleRenderer {
  private state: PuzzleState | null = null;

  /**
   * Initialize پازل
   */
  initPuzzle(
    image: HTMLImageElement,
    pieceCount: number
  ): PuzzleState {
    // محاسبه Grid
    const aspectRatio = image.width / image.height;
    const gridCols = Math.ceil(Math.sqrt(pieceCount * aspectRatio));
    const gridRows = Math.ceil(pieceCount / gridCols);

    const pieceWidth = VIDEO_WIDTH / gridCols;
    const pieceHeight = VIDEO_HEIGHT / gridRows;

    // ایجاد قطعات
    const pieces: PuzzlePiece[] = [];
    let id = 0;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (id >= pieceCount) break;

        const x = col * pieceWidth;
        const y = row * pieceHeight;

        pieces.push({
          id,
          row,
          col,
          x,
          y,
          width: pieceWidth,
          height: pieceHeight,
          currentX: x + (Math.random() - 0.5) * VIDEO_WIDTH * 0.3, // offset تصادفی
          currentY: y + (Math.random() - 0.5) * VIDEO_HEIGHT * 0.3,
          rotation: (Math.random() - 0.5) * 0.2, // چرخش کم
          opacity: 0,
          isPlaced: false
        });

        id++;
      }
    }

    this.state = {
      pieces,
      progress: 0,
      gridRows,
      gridCols,
      image,
      camera: {
        x: 0,
        y: 0,
        zoom: 1.0,
        rotation: 0
      }
    };

    console.log(`🧩 [PuzzleRenderer] Initialized: ${pieceCount} pieces (${gridCols}x${gridRows})`);
    return this.state;
  }

  /**
   * به‌روزرسانی پازل برای یک زمان مشخص
   */
  updatePuzzle(
    currentTime: number,
    actStartTime: number,
    actDuration: number,
    puzzleConfig: ActPuzzleConfig,
    cameraMovements?: CameraSettings[]
  ): void {
    if (!this.state) return;

    // محاسبه Progress
    const relativeTime = currentTime - actStartTime;
    const timeProgress = relativeTime / actDuration; // 0-1

    // محاسبه Puzzle Progress
    const startPercent = puzzleConfig.startPercentage / 100;
    const endPercent = puzzleConfig.endPercentage / 100;
    const puzzleProgress = startPercent + (endPercent - startPercent) * timeProgress;

    this.state.progress = puzzleProgress * 100;

    // تعیین Easing Function
    const easingName = this.getEasingForSpeed(puzzleConfig.animationSpeed);
    const easing = EASING[easingName];

    // به‌روزرسانی قطعات
    this.updatePieces(puzzleProgress, easing);

    // به‌روزرسانی دوربین
    if (cameraMovements && cameraMovements.length > 0) {
      this.updateCamera(relativeTime, actDuration, cameraMovements);
    }
  }

  /**
   * به‌روزرسانی قطعات
   */
  private updatePieces(progress: number, easing: EasingFunction): void {
    if (!this.state) return;

    const totalPieces = this.state.pieces.length;
    const piecesToPlace = Math.floor(totalPieces * progress);

    for (let i = 0; i < this.state.pieces.length; i++) {
      const piece = this.state.pieces[i];

      if (i < piecesToPlace) {
        // این قطعه باید در جای خود باشد
        if (!piece.isPlaced) {
          piece.isPlaced = true;
          piece.placementTime = Date.now();
        }

        // Interpolate به موقعیت نهایی
        const t = easing(Math.min(1, (piecesToPlace - i) / 10)); // آخرین 10 قطعه

        piece.currentX = this.lerp(piece.currentX, piece.x, t);
        piece.currentY = this.lerp(piece.currentY, piece.y, t);
        piece.rotation = this.lerp(piece.rotation, 0, t);
        piece.opacity = 1.0;

      } else if (i === piecesToPlace) {
        // قطعه در حال حرکت
        const t = (progress * totalPieces) - piecesToPlace; // 0-1

        piece.currentX = this.lerp(piece.currentX, piece.x, easing(t));
        piece.currentY = this.lerp(piece.currentY, piece.y, easing(t));
        piece.rotation = this.lerp(piece.rotation, 0, easing(t));
        piece.opacity = Math.min(1, t + 0.3);

      } else {
        // قطعات هنوز نیامده
        piece.opacity = Math.max(0, Math.min(0.3, (i - piecesToPlace) / 20));
      }
    }
  }

  /**
   * به‌روزرسانی دوربین
   */
  private updateCamera(
    relativeTime: number,
    actDuration: number,
    cameraMovements: CameraSettings[]
  ): void {
    if (!this.state) return;

    // پیدا کردن Camera Setting فعلی
    let currentCamera = cameraMovements[0];
    let nextCamera = cameraMovements.length > 1 ? cameraMovements[1] : null;
    let cameraProgress = 0;

    let accumulatedTime = 0;
    for (let i = 0; i < cameraMovements.length; i++) {
      const cam = cameraMovements[i];
      if (relativeTime >= accumulatedTime && relativeTime < accumulatedTime + cam.duration) {
        currentCamera = cam;
        nextCamera = i < cameraMovements.length - 1 ? cameraMovements[i + 1] : null;
        cameraProgress = (relativeTime - accumulatedTime) / cam.duration;
        break;
      }
      accumulatedTime += cam.duration;
    }

    // Interpolate camera
    const easing = EASING[currentCamera.easing || 'easeInOut'];
    const t = easing(cameraProgress);

    if (nextCamera) {
      this.state.camera.zoom = this.lerp(currentCamera.zoom, nextCamera.zoom, t);
      this.state.camera.x = this.lerp(currentCamera.panX, nextCamera.panX, t);
      this.state.camera.y = this.lerp(currentCamera.panY, nextCamera.panY, t);
      this.state.camera.rotation = this.lerp(currentCamera.rotation, nextCamera.rotation, t);
    } else {
      this.state.camera.zoom = currentCamera.zoom;
      this.state.camera.x = currentCamera.panX;
      this.state.camera.y = currentCamera.panY;
      this.state.camera.rotation = currentCamera.rotation;
    }
  }

  /**
   * رندر پازل روی Canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.state) return;

    ctx.save();

    // اعمال Camera
    const centerX = VIDEO_WIDTH / 2;
    const centerY = VIDEO_HEIGHT / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.state.camera.zoom, this.state.camera.zoom);
    ctx.rotate(this.state.camera.rotation);
    ctx.translate(-centerX + this.state.camera.x, -centerY + this.state.camera.y);

    // رندر قطعات (از آخر به اول برای depth)
    for (let i = this.state.pieces.length - 1; i >= 0; i--) {
      const piece = this.state.pieces[i];
      this.renderPiece(ctx, piece);
    }

    ctx.restore();
  }

  /**
   * رندر یک قطعه
   */
  private renderPiece(ctx: CanvasRenderingContext2D, piece: PuzzlePiece): void {
    if (!this.state || piece.opacity <= 0) return;

    ctx.save();

    // موقعیت و چرخش
    ctx.translate(piece.currentX + piece.width / 2, piece.currentY + piece.height / 2);
    ctx.rotate(piece.rotation);

    // Opacity
    ctx.globalAlpha = piece.opacity;

    // رسم قطعه از تصویر اصلی
    const sourceX = (piece.col / this.state.gridCols) * this.state.image.width;
    const sourceY = (piece.row / this.state.gridRows) * this.state.image.height;
    const sourceWidth = this.state.image.width / this.state.gridCols;
    const sourceHeight = this.state.image.height / this.state.gridRows;

    ctx.drawImage(
      this.state.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      -piece.width / 2,
      -piece.height / 2,
      piece.width,
      piece.height
    );

    // Border (اگر هنوز قرار نگرفته)
    if (!piece.isPlaced) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    }

    ctx.restore();
  }

  /**
   * دریافت Easing بر اساس سرعت
   */
  private getEasingForSpeed(speed: string): string {
    const easingMap: Record<string, string> = {
      'slow': 'easeOut',
      'medium': 'easeInOut',
      'fast': 'easeIn',
      'dramatic': 'dramatic'
    };
    return easingMap[speed] || 'easeInOut';
  }

  /**
   * Linear Interpolation
   */
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * دریافت Progress
   */
  getProgress(): number {
    return this.state?.progress || 0;
  }

  /**
   * دریافت State
   */
  getState(): PuzzleState | null {
    return this.state;
  }

  /**
   * Reset
   */
  reset(): void {
    this.state = null;
  }
}

// ==================== EXPORT ====================

export const puzzleRenderer = new PuzzleRenderer();
