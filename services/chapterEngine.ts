/**
 * Chapter Engine
 *
 * مدیریت Act ها و Chapter های ویدیوهای طولانی
 * - ایجاد و مدیریت VideoAct ها
 * - هماهنگی پیشرفت پازل در Acts
 * - مدیریت Transition ها
 * - محاسبه Timing و Duration ها
 */

import {
  VideoAct,
  ActPuzzleConfig,
  TextOverlay,
  ActTransition,
  ActMood,
  TransitionType,
  TextType,
  TextPosition,
  TextAnimation,
  CameraSettings
} from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * تنظیمات ایجاد یک Act
 */
interface CreateActOptions {
  title: string;
  duration: number;
  keyMessage: string;
  facts: string[];
  imagePrompt: string;
  artStyle: string;
  colorGrading?: string;
  puzzleConfig: Partial<ActPuzzleConfig>;
  mood: ActMood;
  musicMood: string;
  soundEffects?: string[];
  transition?: ActTransition;
}

/**
 * نتیجه Validation یک Act
 */
interface ActValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * آمار یک Act
 */
interface ActStats {
  totalTexts: number;
  textDuration: number;
  emptyDuration: number;
  puzzleProgress: number;
  factCount: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * تولید ID یکتا
 */
function generateId(prefix: string = 'act'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * محاسبه تعداد قطعات پازل بر اساس مدت زمان
 */
function calculatePieceCount(duration: number): number {
  // 60-90 ثانیه: 20 قطعه
  // 91-120 ثانیه: 30 قطعه
  // 121-180 ثانیه: 40 قطعه
  // 181-240 ثانیه: 50 قطعه
  if (duration <= 90) return 20;
  if (duration <= 120) return 30;
  if (duration <= 180) return 40;
  return 50;
}

/**
 * انتخاب سرعت انیمیشن بر اساس Mood
 */
function getAnimationSpeedByMood(mood: ActMood): 'slow' | 'medium' | 'fast' | 'dramatic' {
  const moodSpeedMap: Record<ActMood, 'slow' | 'medium' | 'fast' | 'dramatic'> = {
    'mystery': 'slow',
    'curiosity': 'medium',
    'tension': 'medium',
    'excitement': 'fast',
    'breakthrough': 'dramatic',
    'triumph': 'fast',
    'satisfaction': 'slow'
  };
  return moodSpeedMap[mood] || 'medium';
}

/**
 * ایجاد Transition پیش‌فرض بر اساس Mood
 */
function createDefaultTransition(currentMood: ActMood, nextMood?: ActMood): ActTransition {
  // انتقال از Mystery به Curiosity: Fade
  // انتقال از Curiosity به Tension: Zoom-in
  // انتقال از Tension به Breakthrough: Puzzle-merge (dramatic)
  // انتقال از Breakthrough به Triumph: Crossfade

  if (currentMood === 'mystery' || currentMood === 'satisfaction') {
    return { type: 'fade', duration: 1.5 };
  }

  if (currentMood === 'curiosity') {
    return { type: 'zoom-in', duration: 1.2, options: { scale: 1.2 } };
  }

  if (currentMood === 'tension') {
    return { type: 'puzzle-merge', duration: 2.0 };
  }

  if (currentMood === 'breakthrough') {
    return { type: 'crossfade', duration: 1.8 };
  }

  return { type: 'crossfade', duration: 1.5 };
}

// ==================== CHAPTER ENGINE ====================

export class ChapterEngine {

  /**
   * ایجاد یک Act جدید
   */
  createAct(options: CreateActOptions): VideoAct {
    const {
      title,
      duration,
      keyMessage,
      facts,
      imagePrompt,
      artStyle,
      colorGrading,
      puzzleConfig,
      mood,
      musicMood,
      soundEffects,
      transition
    } = options;

    // محاسبه تعداد قطعات پازل
    const pieceCount = puzzleConfig.pieceCount || calculatePieceCount(duration);

    // تنظیم سرعت انیمیشن
    const animationSpeed = puzzleConfig.animationSpeed || getAnimationSpeedByMood(mood);

    // ایجاد PuzzleConfig کامل
    const completePuzzleConfig: ActPuzzleConfig = {
      startPercentage: puzzleConfig.startPercentage ?? 0,
      endPercentage: puzzleConfig.endPercentage ?? 100,
      pieceCount,
      animationSpeed,
      highlightPieces: puzzleConfig.highlightPieces,
      cameraMovements: puzzleConfig.cameraMovements
    };

    // ایجاد Act
    const act: VideoAct = {
      id: generateId('act'),
      title,
      duration,
      keyMessage,
      facts,
      imagePrompt,
      artStyle,
      colorGrading,
      puzzleConfig: completePuzzleConfig,
      texts: [], // خالی - باید با addText اضافه شوند
      mood,
      musicMood,
      soundEffects,
      transition: transition || createDefaultTransition(mood)
    };

    console.log(`✅ [ChapterEngine] Created Act: "${title}" (${duration}s, ${pieceCount} pieces)`);
    return act;
  }

  /**
   * اضافه کردن Text به یک Act
   */
  addText(
    act: VideoAct,
    content: string,
    startTime: number,
    duration: number,
    type: TextType,
    position: TextPosition = 'center',
    animation: TextAnimation = 'fade'
  ): TextOverlay {
    // اعتبارسنجی زمان
    if (startTime < 0 || startTime + duration > act.duration) {
      throw new Error(`Invalid text timing: startTime=${startTime}, duration=${duration}, actDuration=${act.duration}`);
    }

    // انتخاب Style بر اساس Type
    const textStyle = this.getTextStyleByType(type);

    const textOverlay: TextOverlay = {
      id: generateId('text'),
      content,
      startTime,
      duration,
      type,
      position,
      animation,
      style: textStyle
    };

    act.texts.push(textOverlay);
    console.log(`📝 [ChapterEngine] Added ${type} text to "${act.title}" at ${startTime}s`);

    return textOverlay;
  }

  /**
   * تعیین Style متن بر اساس Type
   */
  private getTextStyleByType(type: TextType) {
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

  /**
   * حذف Text از Act
   */
  removeText(act: VideoAct, textId: string): boolean {
    const index = act.texts.findIndex(t => t.id === textId);
    if (index === -1) return false;

    act.texts.splice(index, 1);
    console.log(`🗑️ [ChapterEngine] Removed text ${textId} from "${act.title}"`);
    return true;
  }

  /**
   * به‌روزرسانی Text
   */
  updateText(act: VideoAct, textId: string, updates: Partial<TextOverlay>): boolean {
    const text = act.texts.find(t => t.id === textId);
    if (!text) return false;

    Object.assign(text, updates);
    console.log(`✏️ [ChapterEngine] Updated text ${textId} in "${act.title}"`);
    return true;
  }

  /**
   * اضافه کردن حرکت دوربین
   */
  addCameraMovement(act: VideoAct, movement: CameraSettings): void {
    if (!act.puzzleConfig.cameraMovements) {
      act.puzzleConfig.cameraMovements = [];
    }

    act.puzzleConfig.cameraMovements.push(movement);
    console.log(`🎥 [ChapterEngine] Added camera movement to "${act.title}"`);
  }

  /**
   * Validation یک Act
   */
  validateAct(act: VideoAct): ActValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // بررسی Duration
    if (act.duration < 60) {
      errors.push('Duration must be at least 60 seconds');
    }
    if (act.duration > 240) {
      errors.push('Duration must not exceed 240 seconds');
    }

    // بررسی Puzzle Config
    if (act.puzzleConfig.startPercentage < 0 || act.puzzleConfig.startPercentage > 100) {
      errors.push('startPercentage must be between 0-100');
    }
    if (act.puzzleConfig.endPercentage < 0 || act.puzzleConfig.endPercentage > 100) {
      errors.push('endPercentage must be between 0-100');
    }
    if (act.puzzleConfig.endPercentage < act.puzzleConfig.startPercentage) {
      errors.push('endPercentage must be >= startPercentage');
    }

    // بررسی Facts
    if (act.facts.length < 3) {
      warnings.push('Act should have at least 3 facts');
    }
    if (act.facts.length > 7) {
      warnings.push('Too many facts (>7) might overwhelm the viewer');
    }

    // بررسی Texts timing
    for (const text of act.texts) {
      if (text.startTime < 0 || text.startTime + text.duration > act.duration) {
        errors.push(`Text "${text.id}" has invalid timing`);
      }
    }

    // بررسی Text overlap
    const sortedTexts = [...act.texts].sort((a, b) => a.startTime - b.startTime);
    for (let i = 0; i < sortedTexts.length - 1; i++) {
      const current = sortedTexts[i];
      const next = sortedTexts[i + 1];
      const currentEnd = current.startTime + current.duration;

      if (currentEnd > next.startTime) {
        warnings.push(`Texts "${current.id}" and "${next.id}" overlap`);
      }
    }

    // بررسی Camera movements
    if (act.puzzleConfig.cameraMovements) {
      let totalCameraTime = 0;
      for (const cam of act.puzzleConfig.cameraMovements) {
        totalCameraTime += cam.duration;
      }
      if (totalCameraTime > act.duration) {
        errors.push('Total camera movement duration exceeds act duration');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * محاسبه آمار یک Act
   */
  getActStats(act: VideoAct): ActStats {
    let totalTexts = act.texts.length;
    let textDuration = 0;

    for (const text of act.texts) {
      textDuration += text.duration;
    }

    const emptyDuration = act.duration - textDuration;
    const puzzleProgress = act.puzzleConfig.endPercentage - act.puzzleConfig.startPercentage;

    return {
      totalTexts,
      textDuration,
      emptyDuration,
      puzzleProgress,
      factCount: act.facts.length
    };
  }

  /**
   * هماهنگی پیشرفت پازل بین Act ها
   * برای اطمینان از روان بودن انتقال پازل بین Act ها
   */
  coordinatePuzzleProgress(acts: VideoAct[]): void {
    if (acts.length === 0) return;

    // تنظیم درصدهای پازل به صورت تدریجی
    const progressPerAct = 100 / acts.length;

    for (let i = 0; i < acts.length; i++) {
      acts[i].puzzleConfig.startPercentage = Math.round(i * progressPerAct);
      acts[i].puzzleConfig.endPercentage = Math.round((i + 1) * progressPerAct);
    }

    console.log(`🧩 [ChapterEngine] Coordinated puzzle progress across ${acts.length} acts`);
  }

  /**
   * ایجاد Timeline کامل از Act ها
   * محاسبه زمان‌های مطلق بر اساس زمان‌های نسبی
   */
  createTimeline(acts: VideoAct[]): Array<{
    actId: string;
    actTitle: string;
    startTime: number;
    endTime: number;
    texts: Array<{
      textId: string;
      content: string;
      absoluteStartTime: number;
      absoluteEndTime: number;
    }>;
  }> {
    const timeline: Array<any> = [];
    let currentTime = 0;

    for (const act of acts) {
      const actStartTime = currentTime;
      const actEndTime = currentTime + act.duration;

      const actTimeline = {
        actId: act.id,
        actTitle: act.title,
        startTime: actStartTime,
        endTime: actEndTime,
        texts: act.texts.map(text => ({
          textId: text.id,
          content: text.content,
          absoluteStartTime: actStartTime + text.startTime,
          absoluteEndTime: actStartTime + text.startTime + text.duration
        }))
      };

      timeline.push(actTimeline);

      // اضافه کردن زمان Transition
      if (act.transition) {
        currentTime += act.duration + act.transition.duration;
      } else {
        currentTime += act.duration;
      }
    }

    console.log(`⏱️ [ChapterEngine] Created timeline: ${timeline.length} acts, total ${currentTime}s`);
    return timeline;
  }

  /**
   * کپی یک Act
   */
  cloneAct(act: VideoAct, newTitle?: string): VideoAct {
    const cloned = JSON.parse(JSON.stringify(act));
    cloned.id = generateId('act');
    cloned.title = newTitle || `${act.title} (Copy)`;

    // تولید ID های جدید برای Text ها
    cloned.texts = cloned.texts.map((text: TextOverlay) => ({
      ...text,
      id: generateId('text')
    }));

    console.log(`📋 [ChapterEngine] Cloned act: "${act.title}" -> "${cloned.title}"`);
    return cloned;
  }

  /**
   * محاسبه مدت زمان کل شامل Transition ها
   */
  calculateTotalDuration(acts: VideoAct[]): number {
    let totalDuration = 0;

    for (const act of acts) {
      totalDuration += act.duration;
      if (act.transition) {
        totalDuration += act.transition.duration;
      }
    }

    return totalDuration;
  }

  /**
   * تنظیم خودکار Transition ها بین Act ها
   */
  autoSetTransitions(acts: VideoAct[]): void {
    for (let i = 0; i < acts.length - 1; i++) {
      const currentAct = acts[i];
      const nextAct = acts[i + 1];

      if (!currentAct.transition) {
        currentAct.transition = createDefaultTransition(currentAct.mood, nextAct.mood);
      }
    }

    // آخرین Act نباید Transition داشته باشد
    if (acts.length > 0) {
      acts[acts.length - 1].transition = undefined;
    }

    console.log(`🔄 [ChapterEngine] Auto-set transitions for ${acts.length - 1} acts`);
  }
}

// ==================== EXPORT ====================

export const chapterEngine = new ChapterEngine();
