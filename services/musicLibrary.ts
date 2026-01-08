/**
 * Music Library
 *
 * کتابخانه موسیقی برای ویدیوهای طولانی
 * - دسته‌بندی بر اساس Mood
 * - انتخاب موسیقی مناسب
 * - مدیریت Transitions
 */

import { ActMood, VideoTemplate } from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * Music Entry
 */
export interface MusicEntry {
  id: string;
  title: string;
  artist?: string;
  url: string;
  duration: number;       // seconds
  mood: ActMood[];        // می‌تواند چند mood داشته باشد
  bpm: number;
  genre: string;
  energy: number;         // 1-10
  tags: string[];
}

/**
 * Music Search Criteria
 */
export interface MusicSearchCriteria {
  mood?: ActMood;
  minDuration?: number;
  maxDuration?: number;
  minBpm?: number;
  maxBpm?: number;
  minEnergy?: number;
  maxEnergy?: number;
  genre?: string;
  tags?: string[];
}

// ==================== MUSIC DATABASE ====================

/**
 * پایگاه داده موسیقی
 * در پروژه واقعی، این از API یا دیتابیس می‌آید
 */
const MUSIC_DATABASE: MusicEntry[] = [
  // ==================== MYSTERY ====================
  {
    id: 'mystery_01',
    title: 'Dark Ambient Mystery',
    url: '/music/mystery/dark-ambient-mystery.mp3',
    duration: 180,
    mood: ['mystery', 'tension'],
    bpm: 70,
    genre: 'Ambient',
    energy: 3,
    tags: ['dark', 'mysterious', 'atmospheric']
  },
  {
    id: 'mystery_02',
    title: 'Enigmatic Whispers',
    url: '/music/mystery/enigmatic-whispers.mp3',
    duration: 200,
    mood: ['mystery'],
    bpm: 60,
    genre: 'Cinematic',
    energy: 2,
    tags: ['subtle', 'whispers', 'enigmatic']
  },

  // ==================== CURIOSITY ====================
  {
    id: 'curiosity_01',
    title: 'Wonder and Discovery',
    url: '/music/curiosity/wonder-discovery.mp3',
    duration: 190,
    mood: ['curiosity'],
    bpm: 85,
    genre: 'Orchestral',
    energy: 5,
    tags: ['wonder', 'exploration', 'light']
  },
  {
    id: 'curiosity_02',
    title: 'Gentle Exploration',
    url: '/music/curiosity/gentle-exploration.mp3',
    duration: 175,
    mood: ['curiosity', 'satisfaction'],
    bpm: 75,
    genre: 'Acoustic',
    energy: 4,
    tags: ['gentle', 'exploring', 'peaceful']
  },

  // ==================== TENSION ====================
  {
    id: 'tension_01',
    title: 'Rising Tension',
    url: '/music/tension/rising-tension.mp3',
    duration: 160,
    mood: ['tension', 'excitement'],
    bpm: 110,
    genre: 'Electronic',
    energy: 7,
    tags: ['intense', 'building', 'suspense']
  },
  {
    id: 'tension_02',
    title: 'Dramatic Pulse',
    url: '/music/tension/dramatic-pulse.mp3',
    duration: 150,
    mood: ['tension'],
    bpm: 120,
    genre: 'Hybrid',
    energy: 8,
    tags: ['dramatic', 'pulse', 'urgent']
  },

  // ==================== EXCITEMENT ====================
  {
    id: 'excitement_01',
    title: 'Energetic Drive',
    url: '/music/excitement/energetic-drive.mp3',
    duration: 165,
    mood: ['excitement'],
    bpm: 130,
    genre: 'Electronic',
    energy: 9,
    tags: ['energetic', 'upbeat', 'dynamic']
  },

  // ==================== BREAKTHROUGH ====================
  {
    id: 'breakthrough_01',
    title: 'Epic Revelation',
    url: '/music/breakthrough/epic-revelation.mp3',
    duration: 180,
    mood: ['breakthrough', 'triumph'],
    bpm: 95,
    genre: 'Orchestral',
    energy: 9,
    tags: ['epic', 'triumphant', 'powerful']
  },
  {
    id: 'breakthrough_02',
    title: 'Moment of Truth',
    url: '/music/breakthrough/moment-of-truth.mp3',
    duration: 170,
    mood: ['breakthrough'],
    bpm: 100,
    genre: 'Cinematic',
    energy: 8,
    tags: ['climactic', 'revelation', 'soaring']
  },

  // ==================== TRIUMPH ====================
  {
    id: 'triumph_01',
    title: 'Victory March',
    url: '/music/triumph/victory-march.mp3',
    duration: 190,
    mood: ['triumph'],
    bpm: 105,
    genre: 'Orchestral',
    energy: 10,
    tags: ['victorious', 'celebration', 'heroic']
  },

  // ==================== SATISFACTION ====================
  {
    id: 'satisfaction_01',
    title: 'Peaceful Resolution',
    url: '/music/satisfaction/peaceful-resolution.mp3',
    duration: 200,
    mood: ['satisfaction'],
    bpm: 65,
    genre: 'Ambient',
    energy: 3,
    tags: ['peaceful', 'resolved', 'calm']
  },
  {
    id: 'satisfaction_02',
    title: 'Gentle Closure',
    url: '/music/satisfaction/gentle-closure.mp3',
    duration: 185,
    mood: ['satisfaction', 'curiosity'],
    bpm: 70,
    genre: 'Acoustic',
    energy: 4,
    tags: ['gentle', 'closing', 'reflective']
  }
];

// ==================== MUSIC LIBRARY ====================

export class MusicLibrary {
  private database: MusicEntry[];

  constructor(customDatabase?: MusicEntry[]) {
    this.database = customDatabase || MUSIC_DATABASE;
    console.log(`🎵 [MusicLibrary] Initialized with ${this.database.length} tracks`);
  }

  /**
   * جستجو در کتابخانه موسیقی
   */
  search(criteria: MusicSearchCriteria): MusicEntry[] {
    let results = [...this.database];

    // فیلتر بر اساس Mood
    if (criteria.mood) {
      results = results.filter(entry => entry.mood.includes(criteria.mood!));
    }

    // فیلتر بر اساس Duration
    if (criteria.minDuration !== undefined) {
      results = results.filter(entry => entry.duration >= criteria.minDuration!);
    }
    if (criteria.maxDuration !== undefined) {
      results = results.filter(entry => entry.duration <= criteria.maxDuration!);
    }

    // فیلتر بر اساس BPM
    if (criteria.minBpm !== undefined) {
      results = results.filter(entry => entry.bpm >= criteria.minBpm!);
    }
    if (criteria.maxBpm !== undefined) {
      results = results.filter(entry => entry.bpm <= criteria.maxBpm!);
    }

    // فیلتر بر اساس Energy
    if (criteria.minEnergy !== undefined) {
      results = results.filter(entry => entry.energy >= criteria.minEnergy!);
    }
    if (criteria.maxEnergy !== undefined) {
      results = results.filter(entry => entry.energy <= criteria.maxEnergy!);
    }

    // فیلتر بر اساس Genre
    if (criteria.genre) {
      results = results.filter(entry => entry.genre === criteria.genre);
    }

    // فیلتر بر اساس Tags
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(entry =>
        criteria.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    return results;
  }

  /**
   * پیدا کردن موسیقی مناسب برای یک Act
   */
  findForAct(
    mood: ActMood,
    actDuration: number,
    previousMood?: ActMood
  ): MusicEntry | null {
    // جستجوی موسیقی با Mood مناسب
    let candidates = this.search({
      mood,
      minDuration: actDuration * 0.8,  // حداقل 80% مدت زمان Act
      maxDuration: actDuration * 1.5   // حداکثر 150%
    });

    if (candidates.length === 0) {
      // اگر چیزی پیدا نشد، محدودیت Duration را کم کنیم
      candidates = this.search({ mood });
    }

    if (candidates.length === 0) {
      console.warn(`⚠️ [MusicLibrary] No music found for mood: ${mood}`);
      return null;
    }

    // اگر Act قبلی داشتیم، سعی کنیم موسیقی با Transition خوب انتخاب کنیم
    if (previousMood) {
      const smoothTransitions = candidates.filter(entry =>
        this.hasGoodTransition(previousMood, mood, entry)
      );

      if (smoothTransitions.length > 0) {
        candidates = smoothTransitions;
      }
    }

    // انتخاب بهترین گزینه (نزدیک‌ترین به Duration)
    candidates.sort((a, b) => {
      const diffA = Math.abs(a.duration - actDuration);
      const diffB = Math.abs(b.duration - actDuration);
      return diffA - diffB;
    });

    return candidates[0];
  }

  /**
   * بررسی اینکه آیا Transition بین دو Mood خوب است
   */
  private hasGoodTransition(fromMood: ActMood, toMood: ActMood, entry: MusicEntry): boolean {
    // Transition های خوب بر اساس Energy
    const energyMap: Record<ActMood, number> = {
      'mystery': 3,
      'curiosity': 5,
      'tension': 7,
      'excitement': 9,
      'breakthrough': 9,
      'triumph': 10,
      'satisfaction': 3
    };

    const fromEnergy = energyMap[fromMood];
    const toEnergy = energyMap[toMood];
    const entryEnergy = entry.energy;

    // موسیقی باید Energy مناسب برای Transition داشته باشد
    const energyDiff = Math.abs(toEnergy - fromEnergy);

    if (energyDiff <= 2) {
      // Transition نرم - هر موسیقی با Energy نزدیک OK است
      return Math.abs(entryEnergy - toEnergy) <= 2;
    } else {
      // Transition تند - موسیقی باید دقیقاً همان Energy را داشته باشد
      return Math.abs(entryEnergy - toEnergy) <= 1;
    }
  }

  /**
   * پیشنهاد موسیقی برای یک Template کامل
   */
  suggestForTemplate(
    template: VideoTemplate,
    acts: Array<{ mood: ActMood; duration: number }>
  ): MusicEntry[] {
    const suggestions: MusicEntry[] = [];

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];
      const previousMood = i > 0 ? acts[i - 1].mood : undefined;

      const music = this.findForAct(act.mood, act.duration, previousMood);

      if (music) {
        suggestions.push(music);
      } else {
        // اگر موسیقی پیدا نشد، یک Placeholder
        console.warn(`⚠️ [MusicLibrary] No music for Act ${i + 1} (${act.mood})`);
      }
    }

    console.log(`🎵 [MusicLibrary] Suggested ${suggestions.length} tracks for ${template}`);
    return suggestions;
  }

  /**
   * دریافت موسیقی بر اساس ID
   */
  getById(id: string): MusicEntry | null {
    return this.database.find(entry => entry.id === id) || null;
  }

  /**
   * دریافت تمام موسیقی های یک Mood
   */
  getAllByMood(mood: ActMood): MusicEntry[] {
    return this.search({ mood });
  }

  /**
   * دریافت آمار کتابخانه
   */
  getStats(): {
    totalTracks: number;
    byMood: Record<string, number>;
    byGenre: Record<string, number>;
    averageDuration: number;
    averageEnergy: number;
  } {
    const byMood: Record<string, number> = {};
    const byGenre: Record<string, number> = {};
    let totalDuration = 0;
    let totalEnergy = 0;

    for (const entry of this.database) {
      // Mood count
      for (const mood of entry.mood) {
        byMood[mood] = (byMood[mood] || 0) + 1;
      }

      // Genre count
      byGenre[entry.genre] = (byGenre[entry.genre] || 0) + 1;

      // Totals
      totalDuration += entry.duration;
      totalEnergy += entry.energy;
    }

    return {
      totalTracks: this.database.length,
      byMood,
      byGenre,
      averageDuration: totalDuration / this.database.length,
      averageEnergy: totalEnergy / this.database.length
    };
  }

  /**
   * اضافه کردن موسیقی جدید
   */
  addMusic(entry: MusicEntry): void {
    this.database.push(entry);
    console.log(`➕ [MusicLibrary] Added: ${entry.title}`);
  }

  /**
   * حذف موسیقی
   */
  removeMusic(id: string): boolean {
    const index = this.database.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.database.splice(index, 1);
    console.log(`➖ [MusicLibrary] Removed: ${id}`);
    return true;
  }
}

// ==================== EXPORT ====================

export const musicLibrary = new MusicLibrary();

// Export database برای استفاده در جاهای دیگر
export { MUSIC_DATABASE };
