/**
 * Canvas Engine
 *
 * موتور رندرینگ Canvas برای ویدیوهای 1920x1080
 * - مدیریت Canvas و Context
 * - رندرینگ لایه‌های مختلف
 * - Capture فریم‌ها
 */

// ==================== CONSTANTS ====================

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_ASPECT_RATIO = VIDEO_WIDTH / VIDEO_HEIGHT; // 16:9
export const VIDEO_FPS = 30;

// ==================== INTERFACES ====================

/**
 * Canvas Layer
 */
export interface CanvasLayer {
  name: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  opacity: number;
  zIndex: number;
}

/**
 * Render Options
 */
export interface RenderOptions {
  clearBeforeRender?: boolean;
  backgroundColor?: string;
  quality?: number; // 0-1 for image quality
}

/**
 * Frame Data
 */
export interface FrameData {
  frameNumber: number;
  timestamp: number;
  imageData: ImageData;
  blob?: Blob;
}

// ==================== CANVAS ENGINE ====================

export class CanvasEngine {
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private layers: Map<string, CanvasLayer> = new Map();
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(container?: HTMLElement) {
    // ایجاد Main Canvas
    this.mainCanvas = document.createElement('canvas');
    this.mainCanvas.width = VIDEO_WIDTH;
    this.mainCanvas.height = VIDEO_HEIGHT;
    this.mainCtx = this.mainCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    })!;

    // ایجاد Offscreen Canvas برای عملیات پیچیده
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = VIDEO_WIDTH;
    this.offscreenCanvas.height = VIDEO_HEIGHT;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      alpha: true
    })!;

    if (container) {
      container.appendChild(this.mainCanvas);
    }

    console.log(`✅ [CanvasEngine] Initialized (${VIDEO_WIDTH}x${VIDEO_HEIGHT})`);
  }

  /**
   * دریافت Main Canvas
   */
  getCanvas(): HTMLCanvasElement {
    return this.mainCanvas;
  }

  /**
   * دریافت Main Context
   */
  getContext(): CanvasRenderingContext2D {
    return this.mainCtx;
  }

  /**
   * ایجاد یک Layer جدید
   */
  createLayer(name: string, zIndex: number = 0): CanvasLayer {
    if (this.layers.has(name)) {
      console.warn(`⚠️ [CanvasEngine] Layer "${name}" already exists`);
      return this.layers.get(name)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = VIDEO_WIDTH;
    canvas.height = VIDEO_HEIGHT;

    const ctx = canvas.getContext('2d', { alpha: true })!;

    const layer: CanvasLayer = {
      name,
      canvas,
      ctx,
      visible: true,
      opacity: 1.0,
      zIndex
    };

    this.layers.set(name, layer);
    console.log(`📄 [CanvasEngine] Created layer: ${name} (z-index: ${zIndex})`);

    return layer;
  }

  /**
   * دریافت یک Layer
   */
  getLayer(name: string): CanvasLayer | null {
    return this.layers.get(name) || null;
  }

  /**
   * حذف یک Layer
   */
  removeLayer(name: string): boolean {
    const removed = this.layers.delete(name);
    if (removed) {
      console.log(`🗑️ [CanvasEngine] Removed layer: ${name}`);
    }
    return removed;
  }

  /**
   * پاک کردن Main Canvas
   */
  clear(color: string = '#000000'): void {
    this.mainCtx.fillStyle = color;
    this.mainCtx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }

  /**
   * پاک کردن یک Layer
   */
  clearLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }
  }

  /**
   * رندر تمام Layer ها روی Main Canvas
   */
  composeLayers(options: RenderOptions = {}): void {
    const {
      clearBeforeRender = true,
      backgroundColor = '#000000'
    } = options;

    // پاک کردن Main Canvas
    if (clearBeforeRender) {
      this.clear(backgroundColor);
    }

    // Sort layers by z-index
    const sortedLayers = Array.from(this.layers.values())
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    // رندر هر Layer
    for (const layer of sortedLayers) {
      if (layer.opacity > 0) {
        this.mainCtx.globalAlpha = layer.opacity;
        this.mainCtx.drawImage(layer.canvas, 0, 0);
        this.mainCtx.globalAlpha = 1.0;
      }
    }
  }

  /**
   * تنظیم opacity یک Layer
   */
  setLayerOpacity(name: string, opacity: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  /**
   * تنظیم visibility یک Layer
   */
  setLayerVisible(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Capture فریم فعلی به عنوان ImageData
   */
  captureFrame(frameNumber: number, timestamp: number): FrameData {
    const imageData = this.mainCtx.getImageData(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    return {
      frameNumber,
      timestamp,
      imageData
    };
  }

  /**
   * Capture فریم به عنوان Blob
   */
  async captureFrameAsBlob(
    frameNumber: number,
    timestamp: number,
    quality: number = 0.95
  ): Promise<FrameData> {
    return new Promise((resolve) => {
      this.mainCanvas.toBlob((blob) => {
        const imageData = this.mainCtx.getImageData(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

        resolve({
          frameNumber,
          timestamp,
          imageData,
          blob: blob || undefined
        });
      }, 'image/jpeg', quality);
    });
  }

  /**
   * رسم یک تصویر
   */
  drawImage(
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width?: number,
    height?: number,
    layerName?: string
  ): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    if (width !== undefined && height !== undefined) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y);
    }
  }

  /**
   * رسم مستطیل
   */
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    layerName?: string
  ): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  /**
   * رسم متن
   */
  drawText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: string;
      color?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
      maxWidth?: number;
      layerName?: string;
    } = {}
  ): void {
    const {
      font = '48px Arial',
      color = '#FFFFFF',
      align = 'left',
      baseline = 'top',
      maxWidth,
      layerName
    } = options;

    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (maxWidth !== undefined) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
  }

  /**
   * اعمال فیلتر blur
   */
  applyBlur(amount: number, layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.filter = `blur(${amount}px)`;
  }

  /**
   * ریست فیلترها
   */
  resetFilters(layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.filter = 'none';
  }

  /**
   * Save State
   */
  save(layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.save();
  }

  /**
   * Restore State
   */
  restore(layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.restore();
  }

  /**
   * Translate
   */
  translate(x: number, y: number, layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.translate(x, y);
  }

  /**
   * Rotate
   */
  rotate(angle: number, layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.rotate(angle);
  }

  /**
   * Scale
   */
  scale(x: number, y: number, layerName?: string): void {
    const ctx = layerName ? this.getLayer(layerName)?.ctx : this.mainCtx;
    if (!ctx) return;

    ctx.scale(x, y);
  }

  /**
   * دریافت Offscreen Canvas برای عملیات موقت
   */
  getOffscreenCanvas(): HTMLCanvasElement {
    return this.offscreenCanvas;
  }

  /**
   * دریافت Offscreen Context
   */
  getOffscreenContext(): CanvasRenderingContext2D {
    return this.offscreenCtx;
  }

  /**
   * پاک کردن Offscreen Canvas
   */
  clearOffscreen(): void {
    this.offscreenCtx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }

  /**
   * کپی از Main Canvas به Offscreen
   */
  copyToOffscreen(): void {
    this.offscreenCtx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    this.offscreenCtx.drawImage(this.mainCanvas, 0, 0);
  }

  /**
   * کپی از Offscreen به Main Canvas
   */
  copyFromOffscreen(): void {
    this.mainCtx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    this.mainCtx.drawImage(this.offscreenCanvas, 0, 0);
  }

  /**
   * Resize (اگر نیاز باشد)
   */
  resize(width: number, height: number): void {
    this.mainCanvas.width = width;
    this.mainCanvas.height = height;

    // Recreate context
    this.mainCtx = this.mainCanvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    })!;

    console.log(`🔄 [CanvasEngine] Resized to ${width}x${height}`);
  }

  /**
   * Export به Data URL
   */
  toDataURL(type: string = 'image/png', quality: number = 1.0): string {
    return this.mainCanvas.toDataURL(type, quality);
  }

  /**
   * دریافت آمار
   */
  getStats(): {
    width: number;
    height: number;
    aspectRatio: number;
    layerCount: number;
    layers: Array<{ name: string; visible: boolean; opacity: number; zIndex: number }>;
  } {
    return {
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      aspectRatio: VIDEO_ASPECT_RATIO,
      layerCount: this.layers.size,
      layers: Array.from(this.layers.values()).map(layer => ({
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        zIndex: layer.zIndex
      }))
    };
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.layers.clear();
    console.log(`🗑️ [CanvasEngine] Disposed`);
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * محاسبه تعداد فریم برای یک مدت زمان
 */
export function calculateFrameCount(durationSeconds: number, fps: number = VIDEO_FPS): number {
  return Math.ceil(durationSeconds * fps);
}

/**
 * محاسبه Timestamp برای یک فریم
 */
export function frameToTimestamp(frameNumber: number, fps: number = VIDEO_FPS): number {
  return frameNumber / fps;
}

/**
 * محاسبه Frame Number برای یک Timestamp
 */
export function timestampToFrame(timestamp: number, fps: number = VIDEO_FPS): number {
  return Math.floor(timestamp * fps);
}

// ==================== EXPORT ====================

export const canvasEngine = new CanvasEngine();
