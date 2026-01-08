/**
 * Text Overlay Engine
 *
 * سیستم نمایش و انیمیشن متن‌های روی ویدیو
 * - رندر متن با Style های مختلف
 * - انیمیشن ورود و خروج
 * - مدیریت موقعیت‌یابی
 * - Multi-line text handling
 */

import {
  TextOverlay,
  TextType,
  TextPosition,
  TextAnimation
} from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * Canvas Context برای رندر متن
 */
interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  currentTime: number;
}

/**
 * نتیجه محاسبه موقعیت
 */
interface PositionResult {
  x: number;
  y: number;
  align: CanvasTextAlign;
  baseline: CanvasTextBaseline;
}

/**
 * نتیجه محاسبه انیمیشن
 */
interface AnimationResult {
  opacity: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

/**
 * اندازه‌گیری متن
 */
interface TextMetrics {
  width: number;
  height: number;
  lines: string[];
  lineHeight: number;
}

// ==================== TEXT OVERLAY ENGINE ====================

export class TextOverlayEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  /**
   * Initialize با Canvas
   */
  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    console.log(`✅ [TextOverlay] Initialized (${canvas.width}x${canvas.height})`);
  }

  /**
   * رندر یک TextOverlay
   */
  render(text: TextOverlay, currentTime: number, canvasWidth: number, canvasHeight: number): void {
    if (!this.ctx) {
      console.warn('⚠️ [TextOverlay] Context not initialized');
      return;
    }

    // محاسبه زمان نسبی در بازه این متن
    const relativeTime = currentTime - text.startTime;

    // بررسی اینکه آیا متن باید نمایش داده شود
    if (relativeTime < 0 || relativeTime > text.duration) {
      return; // خارج از بازه زمانی
    }

    // محاسبه انیمیشن
    const animation = this.calculateAnimation(text, relativeTime);

    // اعمال opacity
    this.ctx.globalAlpha = animation.opacity;

    // محاسبه موقعیت
    const position = this.calculatePosition(text.position, canvasWidth, canvasHeight);

    // اعمال offset از انیمیشن
    const finalX = position.x + animation.offsetX;
    const finalY = position.y + animation.offsetY;

    // رندر Background (اگر وجود دارد)
    if (text.style.backgroundColor) {
      this.renderBackground(text, finalX, finalY, canvasWidth, canvasHeight);
    }

    // تنظیم Font
    this.applyTextStyle(text);

    // Split متن به خطوط (اگر طولانی باشد)
    const metrics = this.measureText(text, canvasWidth);

    // رندر هر خط
    this.ctx.textAlign = position.align;
    this.ctx.textBaseline = position.baseline;

    let currentY = finalY;

    for (const line of metrics.lines) {
      this.ctx.fillText(line, finalX, currentY);

      // Shadow/Outline برای خوانایی بهتر
      this.ctx.strokeText(line, finalX, currentY);

      currentY += metrics.lineHeight;
    }

    // Reset alpha
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * رندر Background متن
   */
  private renderBackground(
    text: TextOverlay,
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.ctx || !text.style.backgroundColor) return;

    const metrics = this.measureText(text, canvasWidth);
    const padding = text.style.padding || 0;
    const borderRadius = text.style.borderRadius || 0;

    // محاسبه مختصات مستطیل
    let rectX: number, rectY: number;

    if (text.position.includes('center')) {
      rectX = x - metrics.width / 2 - padding;
      rectY = y - metrics.height / 2 - padding;
    } else if (text.position.includes('right')) {
      rectX = x - metrics.width - padding;
      rectY = y - padding;
    } else {
      rectX = x - padding;
      rectY = y - padding;
    }

    const rectWidth = metrics.width + padding * 2;
    const rectHeight = metrics.height + padding * 2;

    this.ctx.fillStyle = text.style.backgroundColor;

    if (borderRadius > 0) {
      // رندر مستطیل با گوشه‌های گرد
      this.roundRect(rectX, rectY, rectWidth, rectHeight, borderRadius);
    } else {
      // رندر مستطیل ساده
      this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    }
  }

  /**
   * رسم مستطیل با گوشه‌های گرد
   */
  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * اعمال Style متن
   */
  private applyTextStyle(text: TextOverlay): void {
    if (!this.ctx) return;

    // Font
    const fontWeight = text.style.fontWeight;
    const fontSize = text.style.fontSize;
    const fontFamily = this.getFontFamily(text.style.fontFamily);

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    // Color
    this.ctx.fillStyle = text.style.color;

    // Stroke (برای خوانایی بهتر)
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.lineWidth = Math.max(2, fontSize / 20);
  }

  /**
   * تبدیل نام Font به Font واقعی
   */
  private getFontFamily(family: 'elegant' | 'bold' | 'typewriter' | 'sans'): string {
    const fontMap = {
      'elegant': 'Georgia, serif',
      'bold': 'Impact, sans-serif',
      'typewriter': 'Courier New, monospace',
      'sans': 'Arial, sans-serif'
    };

    return fontMap[family] || fontMap.sans;
  }

  /**
   * محاسبه موقعیت متن
   */
  private calculatePosition(
    position: TextPosition,
    canvasWidth: number,
    canvasHeight: number
  ): PositionResult {
    const margin = 60; // فاصله از لبه‌ها

    const positionMap: Record<TextPosition, PositionResult> = {
      'top': {
        x: canvasWidth / 2,
        y: margin,
        align: 'center',
        baseline: 'top'
      },
      'top-left': {
        x: margin,
        y: margin,
        align: 'left',
        baseline: 'top'
      },
      'top-right': {
        x: canvasWidth - margin,
        y: margin,
        align: 'right',
        baseline: 'top'
      },
      'center': {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        align: 'center',
        baseline: 'middle'
      },
      'bottom': {
        x: canvasWidth / 2,
        y: canvasHeight - margin,
        align: 'center',
        baseline: 'bottom'
      },
      'bottom-left': {
        x: margin,
        y: canvasHeight - margin,
        align: 'left',
        baseline: 'bottom'
      },
      'bottom-right': {
        x: canvasWidth - margin,
        y: canvasHeight - margin,
        align: 'right',
        baseline: 'bottom'
      },
      'left': {
        x: margin,
        y: canvasHeight / 2,
        align: 'left',
        baseline: 'middle'
      },
      'right': {
        x: canvasWidth - margin,
        y: canvasHeight / 2,
        align: 'right',
        baseline: 'middle'
      }
    };

    return positionMap[position];
  }

  /**
   * محاسبه انیمیشن
   */
  private calculateAnimation(text: TextOverlay, relativeTime: number): AnimationResult {
    const fadeDuration = 0.3; // 300ms برای fade in/out
    const progress = relativeTime / text.duration;

    let opacity = 1.0;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1.0;

    switch (text.animation) {
      case 'fade':
        // Fade in اول، fade out آخر
        if (relativeTime < fadeDuration) {
          opacity = relativeTime / fadeDuration;
        } else if (relativeTime > text.duration - fadeDuration) {
          opacity = (text.duration - relativeTime) / fadeDuration;
        }
        break;

      case 'slide-up':
        if (relativeTime < fadeDuration) {
          const slideProgress = relativeTime / fadeDuration;
          offsetY = 50 * (1 - slideProgress);
          opacity = slideProgress;
        } else if (relativeTime > text.duration - fadeDuration) {
          const fadeProgress = (text.duration - relativeTime) / fadeDuration;
          opacity = fadeProgress;
        }
        break;

      case 'slide-down':
        if (relativeTime < fadeDuration) {
          const slideProgress = relativeTime / fadeDuration;
          offsetY = -50 * (1 - slideProgress);
          opacity = slideProgress;
        } else if (relativeTime > text.duration - fadeDuration) {
          const fadeProgress = (text.duration - relativeTime) / fadeDuration;
          opacity = fadeProgress;
        }
        break;

      case 'typewriter':
        // نمایش تدریجی کاراکترها (شبیه‌سازی با opacity)
        const typeSpeed = 0.05; // سرعت تایپ
        const charsToShow = Math.floor(relativeTime / typeSpeed);
        const totalChars = text.content.length;

        if (charsToShow < totalChars) {
          opacity = 1.0; // در حال تایپ
          // برای شبیه‌سازی typewriter، باید از clip استفاده کنیم (پیچیده‌تر)
          // فعلاً فقط fade
        }
        break;

      case 'reveal':
        // Scale از 0 به 1
        if (relativeTime < fadeDuration) {
          const revealProgress = relativeTime / fadeDuration;
          scale = revealProgress;
          opacity = revealProgress;
        } else if (relativeTime > text.duration - fadeDuration) {
          opacity = (text.duration - relativeTime) / fadeDuration;
        }
        break;

      case 'glow':
        // Pulsing effect
        const pulseSpeed = 2; // Hz
        const pulse = Math.sin(relativeTime * pulseSpeed * Math.PI * 2);
        opacity = 0.8 + pulse * 0.2; // 0.6 to 1.0

        // Fade in/out در شروع و پایان
        if (relativeTime < fadeDuration) {
          opacity *= relativeTime / fadeDuration;
        } else if (relativeTime > text.duration - fadeDuration) {
          opacity *= (text.duration - relativeTime) / fadeDuration;
        }
        break;
    }

    return {
      opacity: Math.max(0, Math.min(1, opacity)),
      offsetX,
      offsetY,
      scale
    };
  }

  /**
   * اندازه‌گیری متن و تقسیم به خطوط
   */
  private measureText(text: TextOverlay, maxWidth: number): TextMetrics {
    if (!this.ctx) {
      return { width: 0, height: 0, lines: [], lineHeight: 0 };
    }

    // تنظیم Font برای اندازه‌گیری صحیح
    this.applyTextStyle(text);

    const words = text.content.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Word wrapping
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);

      if (metrics.width > maxWidth * 0.8) {
        // خط جدید
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // کلمه خیلی طولانی - مجبوریم همون رو بگذاریم
          lines.push(word);
          currentLine = '';
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // محاسبه ابعاد
    const lineHeight = text.style.fontSize * 1.2;
    let maxLineWidth = 0;

    for (const line of lines) {
      const metrics = this.ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    }

    return {
      width: maxLineWidth,
      height: lineHeight * lines.length,
      lines,
      lineHeight
    };
  }

  /**
   * پیش‌نمایش یک متن (برای ویرایشگر)
   */
  preview(
    text: TextOverlay,
    canvas: HTMLCanvasElement,
    backgroundColor: string = '#1a1a1a'
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // پاک کردن Canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رندر متن در وسط duration
    const currentTime = text.startTime + text.duration / 2;

    // استفاده از engine برای رندر
    const tempCanvas = this.canvas;
    const tempCtx = this.ctx;

    this.canvas = canvas;
    this.ctx = ctx;

    this.render(text, currentTime, canvas.width, canvas.height);

    this.canvas = tempCanvas;
    this.ctx = tempCtx;
  }

  /**
   * دریافت متن‌های فعال در یک زمان
   */
  getActiveTexts(texts: TextOverlay[], currentTime: number): TextOverlay[] {
    return texts.filter(text => {
      const startTime = text.startTime;
      const endTime = text.startTime + text.duration;
      return currentTime >= startTime && currentTime <= endTime;
    });
  }

  /**
   * بررسی Overlap بین متن‌ها
   */
  detectOverlaps(texts: TextOverlay[]): Array<{ text1: TextOverlay; text2: TextOverlay }> {
    const overlaps: Array<{ text1: TextOverlay; text2: TextOverlay }> = [];

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const text1 = texts[i];
        const text2 = texts[j];

        const end1 = text1.startTime + text1.duration;
        const end2 = text2.startTime + text2.duration;

        // بررسی Overlap زمانی
        const hasTimeOverlap =
          (text1.startTime >= text2.startTime && text1.startTime < end2) ||
          (text2.startTime >= text1.startTime && text2.startTime < end1);

        // بررسی Overlap موقعیتی (ساده‌شده)
        const hasPositionOverlap = text1.position === text2.position;

        if (hasTimeOverlap && hasPositionOverlap) {
          overlaps.push({ text1, text2 });
        }
      }
    }

    return overlaps;
  }

  /**
   * تولید Template متن
   */
  createTemplate(
    type: TextType,
    content: string,
    startTime: number,
    duration: number = 3.0
  ): TextOverlay {
    const templates: Record<TextType, Partial<TextOverlay>> = {
      'title': {
        position: 'center',
        animation: 'reveal'
      },
      'fact': {
        position: 'bottom',
        animation: 'slide-up'
      },
      'narration': {
        position: 'center',
        animation: 'fade'
      },
      'question': {
        position: 'center',
        animation: 'glow'
      },
      'stat': {
        position: 'top',
        animation: 'reveal'
      },
      'quote': {
        position: 'center',
        animation: 'fade'
      }
    };

    const template = templates[type];

    return {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      startTime,
      duration,
      type,
      position: template.position as TextPosition,
      animation: template.animation as TextAnimation,
      style: this.getDefaultStyleForType(type)
    };
  }

  /**
   * دریافت Style پیش‌فرض بر اساس Type
   */
  private getDefaultStyleForType(type: TextType): TextOverlay['style'] {
    const styleMap: Record<TextType, TextOverlay['style']> = {
      'title': {
        fontSize: 72,
        fontWeight: 'bold',
        fontFamily: 'elegant',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 24,
        borderRadius: 12
      },
      'fact': {
        fontSize: 48,
        fontWeight: 'normal',
        fontFamily: 'sans',
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 20,
        borderRadius: 8
      },
      'narration': {
        fontSize: 42,
        fontWeight: 'light',
        fontFamily: 'elegant',
        color: '#F0F0F0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 16,
        borderRadius: 6
      },
      'question': {
        fontSize: 56,
        fontWeight: 'bold',
        fontFamily: 'bold',
        color: '#FFD700',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
        borderRadius: 10
      },
      'stat': {
        fontSize: 64,
        fontWeight: 'bold',
        fontFamily: 'bold',
        color: '#00FF00',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 24,
        borderRadius: 12
      },
      'quote': {
        fontSize: 44,
        fontWeight: 'light',
        fontFamily: 'elegant',
        color: '#E0E0E0',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 20,
        borderRadius: 8
      }
    };

    return styleMap[type];
  }
}

// ==================== EXPORT ====================

export const textOverlayEngine = new TextOverlayEngine();
