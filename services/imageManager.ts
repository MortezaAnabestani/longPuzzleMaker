/**
 * Image Manager
 *
 * مدیریت بارگذاری و Cache تصاویر
 * - بارگذاری غیر همزمان
 * - Cache با TTL
 * - پیش‌بارگذاری (Preloading)
 * - Resize و Crop
 * - Error Handling
 */

import { VIDEO_WIDTH, VIDEO_HEIGHT } from './canvasEngine';

// ==================== INTERFACES ====================

/**
 * Image Entry
 */
export interface ImageEntry {
  url: string;
  image: HTMLImageElement;
  loadedAt: number;
  size: {
    width: number;
    height: number;
  };
}

/**
 * Image Load Options
 */
export interface ImageLoadOptions {
  cache?: boolean;
  timeout?: number;  // milliseconds
  crossOrigin?: 'anonymous' | 'use-credentials' | null;
}

/**
 * Image Resize Options
 */
export interface ImageResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Image Load Result
 */
export interface ImageLoadResult {
  success: boolean;
  image?: HTMLImageElement;
  error?: string;
  cachedAt?: number;
}

// ==================== IMAGE MANAGER ====================

export class ImageManager {
  private cache: Map<string, ImageEntry> = new Map();
  private loading: Map<string, Promise<HTMLImageElement>> = new Map();
  private cacheMaxAge: number = 1000 * 60 * 60; // 1 hour
  private cacheMaxSize: number = 100; // max images

  constructor(options?: {
    cacheMaxAge?: number;
    cacheMaxSize?: number;
  }) {
    if (options?.cacheMaxAge) this.cacheMaxAge = options.cacheMaxAge;
    if (options?.cacheMaxSize) this.cacheMaxSize = options.cacheMaxSize;

    console.log(`🖼️ [ImageManager] Initialized (max size: ${this.cacheMaxSize}, max age: ${this.cacheMaxAge / 1000}s)`);
  }

  /**
   * بارگذاری یک تصویر
   */
  async loadImage(
    url: string,
    options: ImageLoadOptions = {}
  ): Promise<ImageLoadResult> {
    const {
      cache = true,
      timeout = 30000,
      crossOrigin = 'anonymous'
    } = options;

    // بررسی Cache
    if (cache) {
      const cached = this.getFromCache(url);
      if (cached) {
        console.log(`✅ [ImageManager] Cache hit: ${url}`);
        return {
          success: true,
          image: cached.image,
          cachedAt: cached.loadedAt
        };
      }
    }

    // بررسی اگر در حال بارگذاری است
    if (this.loading.has(url)) {
      console.log(`⏳ [ImageManager] Already loading: ${url}`);
      try {
        const image = await this.loading.get(url)!;
        return { success: true, image };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // شروع بارگذاری
    const loadPromise = this.loadImageInternal(url, crossOrigin, timeout);
    this.loading.set(url, loadPromise);

    try {
      const image = await loadPromise;

      // ذخیره در Cache
      if (cache) {
        this.addToCache(url, image);
      }

      this.loading.delete(url);

      console.log(`✅ [ImageManager] Loaded: ${url} (${image.width}x${image.height})`);
      return { success: true, image };

    } catch (error) {
      this.loading.delete(url);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [ImageManager] Failed to load: ${url} - ${errorMessage}`);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * بارگذاری داخلی با timeout
   */
  private loadImageInternal(
    url: string,
    crossOrigin: string | null,
    timeout: number
  ): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      // Timeout
      const timeoutId = setTimeout(() => {
        image.src = ''; // Cancel loading
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      image.onload = () => {
        clearTimeout(timeoutId);
        resolve(image);
      };

      image.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load image: ${url}`));
      };

      if (crossOrigin) {
        image.crossOrigin = crossOrigin;
      }

      image.src = url;
    });
  }

  /**
   * بارگذاری چند تصویر به صورت موازی
   */
  async loadImages(
    urls: string[],
    options: ImageLoadOptions = {}
  ): Promise<ImageLoadResult[]> {
    console.log(`📥 [ImageManager] Loading ${urls.length} images...`);

    const promises = urls.map(url => this.loadImage(url, options));
    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ [ImageManager] Loaded ${successCount}/${urls.length} images`);

    return results;
  }

  /**
   * پیش‌بارگذاری (بدون انتظار)
   */
  preloadImages(urls: string[], options: ImageLoadOptions = {}): void {
    console.log(`🔄 [ImageManager] Preloading ${urls.length} images...`);

    for (const url of urls) {
      this.loadImage(url, options).catch(err => {
        console.warn(`⚠️ [ImageManager] Preload failed: ${url}`);
      });
    }
  }

  /**
   * دریافت از Cache
   */
  private getFromCache(url: string): ImageEntry | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    // بررسی TTL
    const age = Date.now() - entry.loadedAt;
    if (age > this.cacheMaxAge) {
      this.cache.delete(url);
      return null;
    }

    return entry;
  }

  /**
   * اضافه کردن به Cache
   */
  private addToCache(url: string, image: HTMLImageElement): void {
    // پاک کردن قدیمی‌ترین ورودی اگر Cache پر است
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].loadedAt - b[1].loadedAt)[0]?.[0];

      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log(`🗑️ [ImageManager] Evicted from cache: ${oldestKey}`);
      }
    }

    const entry: ImageEntry = {
      url,
      image,
      loadedAt: Date.now(),
      size: {
        width: image.width,
        height: image.height
      }
    };

    this.cache.set(url, entry);
  }

  /**
   * Resize تصویر
   */
  async resizeImage(
    image: HTMLImageElement,
    options: ImageResizeOptions
  ): Promise<HTMLCanvasElement> {
    const {
      width = VIDEO_WIDTH,
      height = VIDEO_HEIGHT,
      fit = 'cover',
      position = 'center'
    } = options;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;

    // محاسبه ابعاد و موقعیت بر اساس fit mode
    const result = this.calculateFitDimensions(
      image.width,
      image.height,
      width,
      height,
      fit,
      position
    );

    // پاک کردن Canvas
    ctx.clearRect(0, 0, width, height);

    // رسم تصویر
    if (fit === 'fill') {
      ctx.drawImage(image, 0, 0, width, height);
    } else {
      ctx.drawImage(
        image,
        result.sx,
        result.sy,
        result.sWidth,
        result.sHeight,
        result.dx,
        result.dy,
        result.dWidth,
        result.dHeight
      );
    }

    return canvas;
  }

  /**
   * محاسبه ابعاد برای fit modes
   */
  private calculateFitDimensions(
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    fit: string,
    position: string
  ): {
    sx: number;
    sy: number;
    sWidth: number;
    sHeight: number;
    dx: number;
    dy: number;
    dWidth: number;
    dHeight: number;
  } {
    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = targetWidth / targetHeight;

    let sx = 0, sy = 0, sWidth = sourceWidth, sHeight = sourceHeight;
    let dx = 0, dy = 0, dWidth = targetWidth, dHeight = targetHeight;

    switch (fit) {
      case 'cover':
        // تصویر کل فضا را پر می‌کند (ممکن است برش بخورد)
        if (sourceAspect > targetAspect) {
          // Source عریض‌تر است
          const newWidth = sourceHeight * targetAspect;
          sx = (sourceWidth - newWidth) / 2;
          sWidth = newWidth;
        } else {
          // Source بلندتر است
          const newHeight = sourceWidth / targetAspect;
          sy = (sourceHeight - newHeight) / 2;
          sHeight = newHeight;
        }
        break;

      case 'contain':
        // تصویر کامل نمایش داده می‌شود (ممکن است فضای خالی باشد)
        if (sourceAspect > targetAspect) {
          // Source عریض‌تر است
          dHeight = targetWidth / sourceAspect;
          dy = (targetHeight - dHeight) / 2;
        } else {
          // Source بلندتر است
          dWidth = targetHeight * sourceAspect;
          dx = (targetWidth - dWidth) / 2;
        }
        break;

      case 'none':
        // تصویر در سایز اصلی (مرکز)
        dWidth = sourceWidth;
        dHeight = sourceHeight;
        dx = (targetWidth - sourceWidth) / 2;
        dy = (targetHeight - sourceHeight) / 2;
        break;

      case 'fill':
      default:
        // پر کردن کامل (کشیدگی)
        // از مقادیر پیش‌فرض استفاده می‌شود
        break;
    }

    // اعمال position برای cover mode
    if (fit === 'cover' && position !== 'center') {
      switch (position) {
        case 'top':
          sy = 0;
          break;
        case 'bottom':
          sy = sourceHeight - sHeight;
          break;
        case 'left':
          sx = 0;
          break;
        case 'right':
          sx = sourceWidth - sWidth;
          break;
      }
    }

    return { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight };
  }

  /**
   * Crop تصویر
   */
  async cropImage(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      image,
      x, y, width, height,
      0, 0, width, height
    );

    return canvas;
  }

  /**
   * تبدیل Canvas به Image
   */
  async canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const image = new Image();

        image.onload = () => {
          URL.revokeObjectURL(url);
          resolve(image);
        };

        image.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image from blob'));
        };

        image.src = url;
      });
    });
  }

  /**
   * بررسی وجود تصویر در Cache
   */
  hasInCache(url: string): boolean {
    return this.getFromCache(url) !== null;
  }

  /**
   * دریافت تصویر از Cache
   */
  getImageFromCache(url: string): HTMLImageElement | null {
    const entry = this.getFromCache(url);
    return entry ? entry.image : null;
  }

  /**
   * پاک کردن یک تصویر از Cache
   */
  removeFromCache(url: string): boolean {
    return this.cache.delete(url);
  }

  /**
   * پاک کردن کل Cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ [ImageManager] Cleared cache (${size} images)`);
  }

  /**
   * پاک کردن تصاویر منقضی شده
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    let removed = 0;

    for (const [url, entry] of this.cache.entries()) {
      const age = now - entry.loadedAt;
      if (age > this.cacheMaxAge) {
        this.cache.delete(url);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🗑️ [ImageManager] Cleaned ${removed} expired images`);
    }
  }

  /**
   * دریافت آمار Cache
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    urls: string[];
    totalMemory: number;
  } {
    const urls = Array.from(this.cache.keys());
    const totalMemory = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + (entry.size.width * entry.size.height * 4), // 4 bytes per pixel
      0
    );

    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      urls,
      totalMemory
    };
  }

  /**
   * دریافت لیست تصاویر در حال بارگذاری
   */
  getLoadingImages(): string[] {
    return Array.from(this.loading.keys());
  }

  /**
   * انتظار برای بارگذاری تمام تصاویر
   */
  async waitForAll(): Promise<void> {
    const loadingPromises = Array.from(this.loading.values());
    if (loadingPromises.length === 0) return;

    console.log(`⏳ [ImageManager] Waiting for ${loadingPromises.length} images...`);

    await Promise.allSettled(loadingPromises);

    console.log(`✅ [ImageManager] All pending images processed`);
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.clearCache();
    this.loading.clear();
    console.log(`🗑️ [ImageManager] Disposed`);
  }
}

// ==================== EXPORT ====================

export const imageManager = new ImageManager();
