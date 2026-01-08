/**
 * Sound Effects Manager
 *
 * مدیریت افکت های صوتی پازل
 * - صداهای Snap (جاخوردن قطعات)
 * - صداهای Slide (حرکت قطعات)
 * - صداهای Wave (موج نهایی)
 * - صداهای Whoosh و Impact
 */

import { SoundEffectTrack } from './audioEngine';

// ==================== INTERFACES ====================

/**
 * Sound Effect Entry
 */
export interface SoundEffectEntry {
  id: string;
  type: 'snap' | 'slide' | 'wave' | 'whoosh' | 'impact' | 'ambient';
  url: string;
  duration: number;
  volume: number;
  variations?: string[];  // URLهای variant های مختلف
}

/**
 * Sound Effect Timing
 */
export interface SoundEffectTiming {
  time: number;
  type: SoundEffectEntry['type'];
  volume?: number;
}

// ==================== SOUND DATABASE ====================

/**
 * پایگاه داده افکت های صوتی
 */
const SOUND_EFFECTS_DATABASE: SoundEffectEntry[] = [
  // ==================== SNAP (جاخوردن پازل) ====================
  {
    id: 'snap_01',
    type: 'snap',
    url: '/sounds/click/جاخوردن پازل.mp3',
    duration: 0.3,
    volume: 0.7,
    variations: [
      '/sounds/click/click-1.mp3',
      '/sounds/click/click-2.mp3',
      '/sounds/click/click-3.mp3'
    ]
  },
  {
    id: 'snap_02',
    type: 'snap',
    url: '/sounds/click/soft-click.mp3',
    duration: 0.25,
    volume: 0.6
  },
  {
    id: 'snap_03',
    type: 'snap',
    url: '/sounds/click/sharp-snap.mp3',
    duration: 0.2,
    volume: 0.8
  },

  // ==================== SLIDE (حرکت قطعات) ====================
  {
    id: 'slide_01',
    type: 'slide',
    url: '/sounds/slide/کشیدن ملایم پازل.mp3',
    duration: 0.4,
    volume: 0.5,
    variations: [
      '/sounds/slide/slide-1.mp3',
      '/sounds/slide/slide-2.mp3'
    ]
  },
  {
    id: 'slide_02',
    type: 'slide',
    url: '/sounds/slide/smooth-glide.mp3',
    duration: 0.5,
    volume: 0.4
  },
  {
    id: 'slide_03',
    type: 'slide',
    url: '/sounds/slide/quick-swipe.mp3',
    duration: 0.3,
    volume: 0.6
  },

  // ==================== WAVE (موج نهایی) ====================
  {
    id: 'wave_01',
    type: 'wave',
    url: '/sounds/wave/موج نهایی تکمیل پازل.mp3',
    duration: 2.0,
    volume: 0.8,
    variations: [
      '/sounds/wave/wave-1.mp3',
      '/sounds/wave/wave-2.mp3',
      '/sounds/wave/wave-3.mp3'
    ]
  },
  {
    id: 'wave_02',
    type: 'wave',
    url: '/sounds/wave/completion-chime.mp3',
    duration: 1.5,
    volume: 0.7
  },
  {
    id: 'wave_03',
    type: 'wave',
    url: '/sounds/wave/success-cascade.mp3',
    duration: 2.5,
    volume: 0.9
  },

  // ==================== WHOOSH (سوت هوا) ====================
  {
    id: 'whoosh_01',
    type: 'whoosh',
    url: '/sounds/whoosh/fast-whoosh.mp3',
    duration: 0.6,
    volume: 0.5
  },
  {
    id: 'whoosh_02',
    type: 'whoosh',
    url: '/sounds/whoosh/air-swipe.mp3',
    duration: 0.4,
    volume: 0.6
  },

  // ==================== IMPACT (ضربه) ====================
  {
    id: 'impact_01',
    type: 'impact',
    url: '/sounds/fall/انفجار.mp3',
    duration: 0.8,
    volume: 0.7,
    variations: [
      '/sounds/fall/انفجار2.mp3',
      '/sounds/fall/انفجار3.mp3'
    ]
  },
  {
    id: 'impact_02',
    type: 'impact',
    url: '/sounds/impact/soft-thud.mp3',
    duration: 0.5,
    volume: 0.6
  },

  // ==================== AMBIENT (محیطی) ====================
  {
    id: 'ambient_01',
    type: 'ambient',
    url: '/sounds/ambient/puzzle-atmosphere.mp3',
    duration: 10.0,
    volume: 0.3
  },
  {
    id: 'ambient_02',
    type: 'ambient',
    url: '/sounds/ambient/subtle-shimmer.mp3',
    duration: 8.0,
    volume: 0.25
  }
];

// ==================== SOUND EFFECTS MANAGER ====================

export class SoundEffectsManager {
  private database: SoundEffectEntry[];
  private lastUsedVariation: Map<string, number> = new Map();

  constructor(customDatabase?: SoundEffectEntry[]) {
    this.database = customDatabase || SOUND_EFFECTS_DATABASE;
    console.log(`🔊 [SoundEffects] Initialized with ${this.database.length} effects`);
  }

  /**
   * دریافت یک افکت صوتی بر اساس Type
   */
  getByType(type: SoundEffectEntry['type']): SoundEffectEntry | null {
    const candidates = this.database.filter(entry => entry.type === type);
    if (candidates.length === 0) return null;

    // انتخاب تصادفی
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  /**
   * دریافت URL افکت با Variation (برای تنوع)
   */
  getVariationUrl(entry: SoundEffectEntry): string {
    if (!entry.variations || entry.variations.length === 0) {
      return entry.url;
    }

    // گرفتن آخرین variant استفاده شده
    const lastIndex = this.lastUsedVariation.get(entry.id) || -1;

    // انتخاب variant جدید (متفاوت از قبلی)
    const availableIndices = Array.from(
      { length: entry.variations.length },
      (_, i) => i
    ).filter(i => i !== lastIndex);

    const randomIndex = availableIndices[
      Math.floor(Math.random() * availableIndices.length)
    ];

    // ذخیره برای دفعه بعد
    this.lastUsedVariation.set(entry.id, randomIndex);

    return entry.variations[randomIndex];
  }

  /**
   * تولید افکت های صوتی برای یک Act
   */
  generateForAct(
    actDuration: number,
    puzzleStartPercent: number,
    puzzleEndPercent: number,
    animationSpeed: 'slow' | 'medium' | 'fast' | 'dramatic'
  ): SoundEffectTiming[] {
    const effects: SoundEffectTiming[] = [];

    // محاسبه تعداد قطعات که قرار می‌شوند
    const totalProgress = puzzleEndPercent - puzzleStartPercent;
    const pieceCount = this.calculatePieceCount(totalProgress, animationSpeed);

    // محاسبه فاصله زمانی بین قطعات
    const interval = actDuration / pieceCount;

    // تولید Snap های تصادفی
    for (let i = 0; i < pieceCount; i++) {
      const time = (i * interval) + (Math.random() * interval * 0.3);

      effects.push({
        time: Math.min(time, actDuration - 0.5),
        type: 'snap',
        volume: 0.6 + (Math.random() * 0.2) // 0.6-0.8
      });

      // هر چند قطعه یک Slide اضافه کن
      if (i % 3 === 0 && i > 0) {
        effects.push({
          time: time - 0.2,
          type: 'slide',
          volume: 0.4
        });
      }
    }

    // اگر پازل کامل شد (100%)، Wave اضافه کن
    if (puzzleEndPercent >= 99) {
      effects.push({
        time: actDuration - 2.5,
        type: 'wave',
        volume: 0.9
      });

      // یک Whoosh قبل از Wave
      effects.push({
        time: actDuration - 3,
        type: 'whoosh',
        volume: 0.6
      });
    }

    // Sort by time
    effects.sort((a, b) => a.time - b.time);

    console.log(`🔊 [SoundEffects] Generated ${effects.length} effects for act (${actDuration}s)`);
    return effects;
  }

  /**
   * محاسبه تعداد قطعات بر اساس سرعت
   */
  private calculatePieceCount(
    progress: number,
    speed: 'slow' | 'medium' | 'fast' | 'dramatic'
  ): number {
    const baseCount = Math.floor(progress / 4); // هر 4% یک قطعه

    const speedMultiplier = {
      'slow': 0.7,
      'medium': 1.0,
      'fast': 1.3,
      'dramatic': 1.5
    };

    return Math.max(
      5,
      Math.floor(baseCount * speedMultiplier[speed])
    );
  }

  /**
   * تولید افکت های Transition
   */
  generateTransitionEffects(
    transitionType: string,
    duration: number
  ): SoundEffectTiming[] {
    const effects: SoundEffectTiming[] = [];

    switch (transitionType) {
      case 'fade':
      case 'crossfade':
        // بدون افکت خاص
        break;

      case 'zoom-in':
      case 'zoom-out':
        effects.push({
          time: 0,
          type: 'whoosh',
          volume: 0.5
        });
        break;

      case 'slide':
        effects.push({
          time: 0,
          type: 'slide',
          volume: 0.6
        });
        break;

      case 'puzzle-merge':
        effects.push({
          time: 0,
          type: 'whoosh',
          volume: 0.6
        });
        effects.push({
          time: duration * 0.5,
          type: 'impact',
          volume: 0.7
        });
        effects.push({
          time: duration * 0.8,
          type: 'wave',
          volume: 0.5
        });
        break;

      case 'dissolve':
        effects.push({
          time: 0,
          type: 'ambient',
          volume: 0.3
        });
        break;
    }

    return effects;
  }

  /**
   * دریافت افکت بر اساس ID
   */
  getById(id: string): SoundEffectEntry | null {
    return this.database.find(entry => entry.id === id) || null;
  }

  /**
   * دریافت تمام افکت های یک Type
   */
  getAllByType(type: SoundEffectEntry['type']): SoundEffectEntry[] {
    return this.database.filter(entry => entry.type === type);
  }

  /**
   * اضافه کردن افکت جدید
   */
  addEffect(entry: SoundEffectEntry): void {
    this.database.push(entry);
    console.log(`➕ [SoundEffects] Added: ${entry.id}`);
  }

  /**
   * حذف افکت
   */
  removeEffect(id: string): boolean {
    const index = this.database.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.database.splice(index, 1);
    console.log(`➖ [SoundEffects] Removed: ${id}`);
    return true;
  }

  /**
   * دریافت آمار
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    totalVariations: number;
  } {
    const byType: Record<string, number> = {};
    let totalVariations = 0;

    for (const entry of this.database) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      if (entry.variations) {
        totalVariations += entry.variations.length;
      }
    }

    return {
      total: this.database.length,
      byType,
      totalVariations
    };
  }

  /**
   * پیش‌نمایش افکت ها برای یک پروژه کامل
   */
  previewForProject(acts: Array<{
    duration: number;
    puzzleStartPercent: number;
    puzzleEndPercent: number;
    animationSpeed: 'slow' | 'medium' | 'fast' | 'dramatic';
    transition?: { type: string; duration: number };
  }>): Array<{
    actIndex: number;
    effects: SoundEffectTiming[];
    transitionEffects?: SoundEffectTiming[];
  }> {
    const preview: Array<any> = [];

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];

      const actEffects = this.generateForAct(
        act.duration,
        act.puzzleStartPercent,
        act.puzzleEndPercent,
        act.animationSpeed
      );

      let transitionEffects: SoundEffectTiming[] | undefined;
      if (act.transition) {
        transitionEffects = this.generateTransitionEffects(
          act.transition.type,
          act.transition.duration
        );
      }

      preview.push({
        actIndex: i,
        effects: actEffects,
        transitionEffects
      });
    }

    const totalEffects = preview.reduce(
      (sum, p) => sum + p.effects.length + (p.transitionEffects?.length || 0),
      0
    );

    console.log(`🔊 [SoundEffects] Preview: ${totalEffects} total effects across ${acts.length} acts`);
    return preview;
  }
}

// ==================== EXPORT ====================

export const soundEffectsManager = new SoundEffectsManager();

// Export database
export { SOUND_EFFECTS_DATABASE };
