/**
 * Text Renderer
 *
 * رندرینگ متن‌های روی ویدیو
 * - موقعیت‌های مختلف متن
 * - انیمیشن‌های متن
 * - پس‌زمینه و استایل
 * - Word Wrapping
 */

import { VIDEO_WIDTH, VIDEO_HEIGHT } from './canvasEngine';

// ==================== INTERFACES ====================

/**
 * Text Position
 */
export type TextPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Text Animation Type
 */
export type TextAnimationType =
  | 'none'
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'typewriter'
  | 'reveal'
  | 'glow'
  | 'bounce';

/**
 * Text Style
 */
export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  lineHeight?: number;
  textAlign?: CanvasTextAlign;
  maxWidth?: number;
  padding?: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderRadius?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

/**
 * Text Animation Config
 */
export interface TextAnimationConfig {
  type: TextAnimationType;
  duration: number;        // seconds
  delay?: number;          // seconds
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/**
 * Text Overlay
 */
export interface TextOverlay {
  id: string;
  text: string;
  position: TextPosition;
  startTime: number;
  endTime: number;
  style: TextStyle;
  animation?: TextAnimationConfig;
}

/**
 * Text Render State
 */
interface TextRenderState {
  overlay: TextOverlay;
  currentOpacity: number;
  currentOffset: { x: number; y: number };
  currentProgress: number;  // 0-1 for animations
  visibleChars?: number;     // for typewriter
}

// ==================== DEFAULT STYLES ====================

const DEFAULT_TEXT_STYLE: Required<TextStyle> = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 48,
  fontWeight: 'bold',
  color: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 2,
  lineHeight: 1.4,
  textAlign: 'center',
  maxWidth: VIDEO_WIDTH * 0.8,
  padding: 20,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backgroundOpacity: 0.7,
  borderRadius: 10,
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  shadowBlur: 10,
  shadowOffsetX: 2,
  shadowOffsetY: 2
};

// ==================== POSITION CALCULATOR ====================

/**
 * محاسبه موقعیت متن بر اساس Position
 */
function calculateTextPosition(
  position: TextPosition,
  textWidth: number,
  textHeight: number,
  padding: number
): { x: number; y: number } {
  const margin = 60; // فاصله از لبه

  const positions: Record<TextPosition, { x: number; y: number }> = {
    'top-left': { x: margin + padding, y: margin + padding },
    'top-center': { x: VIDEO_WIDTH / 2, y: margin + padding },
    'top-right': { x: VIDEO_WIDTH - margin - padding, y: margin + padding },

    'center-left': { x: margin + padding, y: VIDEO_HEIGHT / 2 },
    'center': { x: VIDEO_WIDTH / 2, y: VIDEO_HEIGHT / 2 },
    'center-right': { x: VIDEO_WIDTH - margin - padding, y: VIDEO_HEIGHT / 2 },

    'bottom-left': { x: margin + padding, y: VIDEO_HEIGHT - margin - padding },
    'bottom-center': { x: VIDEO_WIDTH / 2, y: VIDEO_HEIGHT - margin - padding },
    'bottom-right': { x: VIDEO_WIDTH - margin - padding, y: VIDEO_HEIGHT - margin - padding }
  };

  return positions[position];
}

// ==================== EASING FUNCTIONS ====================

type EasingFunction = (t: number) => number;

const EASING_FUNCTIONS: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

// ==================== TEXT RENDERER ====================

export class TextRenderer {
  private overlays: Map<string, TextOverlay> = new Map();
  private states: Map<string, TextRenderState> = new Map();

  constructor() {
    console.log(`📝 [TextRenderer] Initialized`);
  }

  /**
   * اضافه کردن Text Overlay
   */
  addOverlay(overlay: TextOverlay): void {
    this.overlays.set(overlay.id, overlay);
    console.log(`➕ [TextRenderer] Added overlay: ${overlay.id} (${overlay.startTime}s - ${overlay.endTime}s)`);
  }

  /**
   * حذف Text Overlay
   */
  removeOverlay(id: string): boolean {
    const removed = this.overlays.delete(id);
    if (removed) {
      this.states.delete(id);
      console.log(`➖ [TextRenderer] Removed overlay: ${id}`);
    }
    return removed;
  }

  /**
   * پاک کردن همه Overlays
   */
  clearOverlays(): void {
    this.overlays.clear();
    this.states.clear();
    console.log(`🗑️ [TextRenderer] Cleared all overlays`);
  }

  /**
   * رندر تمام متن‌های فعال در یک زمان مشخص
   */
  render(ctx: CanvasRenderingContext2D, currentTime: number): void {
    // پیدا کردن Overlays فعال
    const activeOverlays = Array.from(this.overlays.values()).filter(
      overlay => currentTime >= overlay.startTime && currentTime <= overlay.endTime
    );

    // رندر هر Overlay
    for (const overlay of activeOverlays) {
      this.renderOverlay(ctx, overlay, currentTime);
    }
  }

  /**
   * رندر یک Text Overlay
   */
  private renderOverlay(
    ctx: CanvasRenderingContext2D,
    overlay: TextOverlay,
    currentTime: number
  ): void {
    // به‌روزرسانی یا ایجاد State
    if (!this.states.has(overlay.id)) {
      this.states.set(overlay.id, {
        overlay,
        currentOpacity: 0,
        currentOffset: { x: 0, y: 0 },
        currentProgress: 0,
        visibleChars: 0
      });
    }

    const state = this.states.get(overlay.id)!;

    // محاسبه Progress انیمیشن
    this.updateAnimationState(state, currentTime);

    // اگر opacity صفر است، رندر نکن
    if (state.currentOpacity <= 0) return;

    ctx.save();

    // ترکیب Style
    const style: Required<TextStyle> = { ...DEFAULT_TEXT_STYLE, ...overlay.style };

    // تنظیم Font
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    ctx.textAlign = style.textAlign;
    ctx.textBaseline = 'middle';

    // Word Wrapping
    const lines = this.wrapText(ctx, overlay.text, style.maxWidth);

    // محاسبه ابعاد کل
    const lineHeight = style.fontSize * style.lineHeight;
    const textWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
    const textHeight = lines.length * lineHeight;

    // محاسبه موقعیت
    const basePosition = calculateTextPosition(
      overlay.position,
      textWidth,
      textHeight,
      style.padding
    );

    // اعمال Offset انیمیشن
    const x = basePosition.x + state.currentOffset.x;
    const y = basePosition.y + state.currentOffset.y;

    // رندر Background
    if (style.backgroundColor && style.backgroundOpacity > 0) {
      this.renderBackground(
        ctx,
        x,
        y,
        textWidth,
        textHeight,
        style,
        state.currentOpacity
      );
    }

    // اعمال Opacity
    ctx.globalAlpha = state.currentOpacity;

    // رندر Lines
    this.renderLines(ctx, lines, x, y, lineHeight, style, state);

    ctx.restore();
  }

  /**
   * به‌روزرسانی Animation State
   */
  private updateAnimationState(state: TextRenderState, currentTime: number): void {
    const { overlay } = state;
    const relativeTime = currentTime - overlay.startTime;
    const duration = overlay.endTime - overlay.startTime;

    if (!overlay.animation || overlay.animation.type === 'none') {
      // بدون انیمیشن
      state.currentOpacity = 1.0;
      state.currentOffset = { x: 0, y: 0 };
      state.currentProgress = 1.0;
      return;
    }

    const anim = overlay.animation;
    const delay = anim.delay || 0;
    const animDuration = anim.duration;
    const easing = EASING_FUNCTIONS[anim.easing || 'easeInOut'];

    // محاسبه Progress
    let progress = 0;
    if (relativeTime < delay) {
      progress = 0;
    } else if (relativeTime < delay + animDuration) {
      progress = (relativeTime - delay) / animDuration;
      progress = easing(progress);
    } else {
      progress = 1;
    }

    state.currentProgress = progress;

    // اعمال انیمیشن
    switch (anim.type) {
      case 'fade':
        state.currentOpacity = progress;
        state.currentOffset = { x: 0, y: 0 };
        break;

      case 'slide-up':
        state.currentOpacity = progress;
        state.currentOffset = { x: 0, y: (1 - progress) * 100 };
        break;

      case 'slide-down':
        state.currentOpacity = progress;
        state.currentOffset = { x: 0, y: -(1 - progress) * 100 };
        break;

      case 'slide-left':
        state.currentOpacity = progress;
        state.currentOffset = { x: (1 - progress) * 200, y: 0 };
        break;

      case 'slide-right':
        state.currentOpacity = progress;
        state.currentOffset = { x: -(1 - progress) * 200, y: 0 };
        break;

      case 'typewriter':
        state.currentOpacity = 1.0;
        state.currentOffset = { x: 0, y: 0 };
        state.visibleChars = Math.floor(overlay.text.length * progress);
        break;

      case 'reveal':
        state.currentOpacity = 1.0;
        state.currentOffset = { x: 0, y: 0 };
        // Reveal از چپ به راست
        state.currentProgress = progress;
        break;

      case 'glow':
        state.currentOpacity = 1.0;
        state.currentOffset = { x: 0, y: 0 };
        // Glow با تغییر shadowBlur
        break;

      case 'bounce':
        state.currentOpacity = progress;
        const bounce = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        state.currentOffset = { x: 0, y: -(1 - bounce) * 50 };
        break;
    }

    // Fade out در آخر
    const fadeOutDuration = 0.5;
    const timeUntilEnd = overlay.endTime - currentTime;
    if (timeUntilEnd < fadeOutDuration) {
      const fadeOutProgress = timeUntilEnd / fadeOutDuration;
      state.currentOpacity *= fadeOutProgress;
    }
  }

  /**
   * رندر Background
   */
  private renderBackground(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    textWidth: number,
    textHeight: number,
    style: Required<TextStyle>,
    opacity: number
  ): void {
    const padding = style.padding;
    const width = textWidth + padding * 2;
    const height = textHeight + padding * 2;

    let bgX: number;
    if (style.textAlign === 'center') {
      bgX = x - width / 2;
    } else if (style.textAlign === 'right') {
      bgX = x - width;
    } else {
      bgX = x;
    }

    const bgY = y - height / 2;

    ctx.save();
    ctx.globalAlpha = style.backgroundOpacity * opacity;

    // رندر Rounded Rectangle
    this.drawRoundedRect(
      ctx,
      bgX,
      bgY,
      width,
      height,
      style.borderRadius,
      style.backgroundColor
    );

    ctx.restore();
  }

  /**
   * رندر خطوط متن
   */
  private renderLines(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    y: number,
    lineHeight: number,
    style: Required<TextStyle>,
    state: TextRenderState
  ): void {
    const totalHeight = lines.length * lineHeight;
    let currentY = y - totalHeight / 2 + lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Typewriter effect
      if (state.overlay.animation?.type === 'typewriter' && state.visibleChars !== undefined) {
        const allText = lines.join('');
        const charsSoFar = lines.slice(0, i).join('').length;
        const charsInLine = Math.max(0, state.visibleChars - charsSoFar);
        line = line.substring(0, charsInLine);
      }

      // Shadow
      if (style.shadowBlur > 0) {
        ctx.shadowColor = style.shadowColor;
        ctx.shadowBlur = style.shadowBlur;
        ctx.shadowOffsetX = style.shadowOffsetX;
        ctx.shadowOffsetY = style.shadowOffsetY;
      }

      // Stroke
      if (style.strokeWidth > 0) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeText(line, x, currentY);
      }

      // Fill
      ctx.fillStyle = style.color;
      ctx.fillText(line, x, currentY);

      // Reset shadow
      ctx.shadowBlur = 0;

      currentY += lineHeight;
    }
  }

  /**
   * Word Wrapping
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
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

    return lines.length > 0 ? lines : [text];
  }

  /**
   * رسم Rounded Rectangle
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillStyle: string
  ): void {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * دریافت Overlays فعال در یک زمان
   */
  getActiveOverlays(currentTime: number): TextOverlay[] {
    return Array.from(this.overlays.values()).filter(
      overlay => currentTime >= overlay.startTime && currentTime <= overlay.endTime
    );
  }

  /**
   * دریافت تمام Overlays
   */
  getAllOverlays(): TextOverlay[] {
    return Array.from(this.overlays.values());
  }

  /**
   * دریافت یک Overlay
   */
  getOverlay(id: string): TextOverlay | null {
    return this.overlays.get(id) || null;
  }

  /**
   * Reset
   */
  reset(): void {
    this.overlays.clear();
    this.states.clear();
    console.log(`🔄 [TextRenderer] Reset`);
  }
}

// ==================== EXPORT ====================

export const textRenderer = new TextRenderer();
