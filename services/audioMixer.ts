/**
 * Audio Mixer
 *
 * ترکیب و Mix تمام لایه های صدا
 * - موسیقی پس‌زمینه
 * - افکت های صوتی
 * - Crossfade بین موسیقی ها
 * - Normalization و Compression
 */

import { LongVideoProject, VideoAct } from '../types/longVideo.types';
import { audioEngine, AudioTrack, MusicTrack, SoundEffectTrack } from './audioEngine';
import { musicLibrary, MusicEntry } from './musicLibrary';
import { soundEffectsManager, SoundEffectTiming } from './soundEffectsManager';

// ==================== INTERFACES ====================

/**
 * Mix Configuration
 */
export interface MixConfig {
  musicVolume: number;        // 0-1
  effectsVolume: number;      // 0-1
  masterVolume: number;       // 0-1
  crossfadeDuration: number;  // seconds
  normalize: boolean;
  compress: boolean;
}

/**
 * Mix Result
 */
export interface MixResult {
  tracks: AudioTrack[];
  musicTracks: MusicTrack[];
  effectTracks: SoundEffectTrack[];
  totalDuration: number;
  config: MixConfig;
  stats: {
    totalTracks: number;
    musicCount: number;
    effectsCount: number;
    peakVolume: number;
    averageVolume: number;
  };
}

/**
 * Act Audio Info
 */
interface ActAudioInfo {
  actIndex: number;
  startTime: number;
  endTime: number;
  music: MusicEntry | null;
  effects: SoundEffectTiming[];
  transitionEffects?: SoundEffectTiming[];
}

// ==================== DEFAULT CONFIG ====================

const DEFAULT_MIX_CONFIG: MixConfig = {
  musicVolume: 0.6,
  effectsVolume: 0.8,
  masterVolume: 1.0,
  crossfadeDuration: 3.0,
  normalize: true,
  compress: true
};

// ==================== AUDIO MIXER ====================

export class AudioMixer {
  private config: MixConfig;

  constructor(config?: Partial<MixConfig>) {
    this.config = { ...DEFAULT_MIX_CONFIG, ...config };
    console.log(`🎛️ [AudioMixer] Initialized`);
  }

  /**
   * Mix کامل یک پروژه
   */
  mixProject(project: LongVideoProject, config?: Partial<MixConfig>): MixResult {
    const finalConfig = { ...this.config, ...config };

    console.log(`🎛️ [AudioMixer] Mixing project: ${project.title}`);
    console.log(`   Acts: ${project.acts.length}`);
    console.log(`   Duration: ${project.totalDuration}s`);

    // 1. جمع‌آوری اطلاعات Audio هر Act
    const actsAudio = this.collectActsAudio(project);

    // 2. تولید Music Tracks
    const musicTracks = this.generateMusicTracks(actsAudio, finalConfig);

    // 3. تولید Effect Tracks
    const effectTracks = this.generateEffectTracks(actsAudio, finalConfig);

    // 4. ترکیب همه Track ها
    const allTracks: AudioTrack[] = [...musicTracks, ...effectTracks];

    // 5. اعمال Master Volume
    this.applyMasterVolume(allTracks, finalConfig.masterVolume);

    // 6. Normalize (اختیاری)
    if (finalConfig.normalize) {
      this.normalizeVolumes(allTracks);
    }

    // 7. محاسبه آمار
    const stats = this.calculateStats(allTracks);

    const result: MixResult = {
      tracks: allTracks,
      musicTracks,
      effectTracks,
      totalDuration: project.totalDuration,
      config: finalConfig,
      stats: {
        totalTracks: allTracks.length,
        musicCount: musicTracks.length,
        effectsCount: effectTracks.length,
        ...stats
      }
    };

    console.log(`✅ [AudioMixer] Mix complete:`);
    console.log(`   Total tracks: ${result.stats.totalTracks}`);
    console.log(`   Music: ${result.stats.musicCount}`);
    console.log(`   Effects: ${result.stats.effectsCount}`);
    console.log(`   Peak volume: ${result.stats.peakVolume.toFixed(2)}`);

    return result;
  }

  /**
   * جمع‌آوری اطلاعات Audio هر Act
   */
  private collectActsAudio(project: LongVideoProject): ActAudioInfo[] {
    const actsAudio: ActAudioInfo[] = [];
    let currentTime = 0;

    for (let i = 0; i < project.acts.length; i++) {
      const act = project.acts[i];

      const startTime = currentTime;
      const endTime = currentTime + act.duration;

      // پیدا کردن موسیقی مناسب
      const music = musicLibrary.findForAct(
        act.mood,
        act.duration,
        i > 0 ? project.acts[i - 1].mood : undefined
      );

      // تولید افکت های صوتی
      const effects = soundEffectsManager.generateForAct(
        act.duration,
        act.puzzleConfig.startPercentage,
        act.puzzleConfig.endPercentage,
        act.puzzleConfig.animationSpeed
      );

      // افکت های Transition
      let transitionEffects: SoundEffectTiming[] | undefined;
      if (act.transition) {
        transitionEffects = soundEffectsManager.generateTransitionEffects(
          act.transition.type,
          act.transition.duration
        );
      }

      actsAudio.push({
        actIndex: i,
        startTime,
        endTime,
        music,
        effects,
        transitionEffects
      });

      currentTime = endTime;
      if (act.transition) {
        currentTime += act.transition.duration;
      }
    }

    return actsAudio;
  }

  /**
   * تولید Music Tracks
   */
  private generateMusicTracks(
    actsAudio: ActAudioInfo[],
    config: MixConfig
  ): MusicTrack[] {
    const musicTracks: MusicTrack[] = [];

    for (let i = 0; i < actsAudio.length; i++) {
      const actAudio = actsAudio[i];

      if (!actAudio.music) {
        console.warn(`⚠️ [AudioMixer] No music for Act ${i + 1}`);
        continue;
      }

      // محاسبه Crossfade
      const isLastAct = i === actsAudio.length - 1;
      const nextAct = !isLastAct ? actsAudio[i + 1] : null;

      let fadeOut = config.crossfadeDuration;
      let fadeIn = config.crossfadeDuration;

      if (nextAct && nextAct.music) {
        const crossfade = audioEngine.calculateCrossfade(
          actAudio.endTime - actAudio.startTime,
          nextAct.startTime,
          config.crossfadeDuration
        );
        fadeOut = crossfade.track1FadeOut;
        fadeIn = crossfade.track2FadeIn;
      }

      // ایجاد Music Track
      const musicTrack = audioEngine.createMusicTrack(
        actAudio.music.url,
        actAudio.startTime,
        actAudio.endTime - actAudio.startTime,
        actAudio.music.mood.join(', '),
        {
          volume: config.musicVolume * (actAudio.music.energy / 10),
          fadeIn: i === 0 ? fadeIn : fadeIn,
          fadeOut: isLastAct ? fadeOut : fadeOut,
          loop: false
        }
      );

      musicTrack.bpm = actAudio.music.bpm;
      musicTrack.genre = actAudio.music.genre;

      musicTracks.push(musicTrack);
    }

    return musicTracks;
  }

  /**
   * تولید Effect Tracks
   */
  private generateEffectTracks(
    actsAudio: ActAudioInfo[],
    config: MixConfig
  ): SoundEffectTrack[] {
    const effectTracks: SoundEffectTrack[] = [];

    for (const actAudio of actsAudio) {
      // Act Effects
      for (const effectTiming of actAudio.effects) {
        const effectEntry = soundEffectsManager.getByType(effectTiming.type);
        if (!effectEntry) continue;

        const url = soundEffectsManager.getVariationUrl(effectEntry);

        const effectTrack = audioEngine.createSoundEffectTrack(
          url,
          actAudio.startTime + effectTiming.time,
          effectTiming.type,
          {
            volume: config.effectsVolume * (effectTiming.volume || 1.0),
            duration: effectEntry.duration
          }
        );

        effectTracks.push(effectTrack);
      }

      // Transition Effects
      if (actAudio.transitionEffects) {
        for (const effectTiming of actAudio.transitionEffects) {
          const effectEntry = soundEffectsManager.getByType(effectTiming.type);
          if (!effectEntry) continue;

          const url = soundEffectsManager.getVariationUrl(effectEntry);

          const effectTrack = audioEngine.createSoundEffectTrack(
            url,
            actAudio.endTime + effectTiming.time,
            effectTiming.type,
            {
              volume: config.effectsVolume * (effectTiming.volume || 1.0),
              duration: effectEntry.duration
            }
          );

          effectTracks.push(effectTrack);
        }
      }
    }

    return effectTracks;
  }

  /**
   * اعمال Master Volume
   */
  private applyMasterVolume(tracks: AudioTrack[], masterVolume: number): void {
    for (const track of tracks) {
      track.volume *= masterVolume;
    }
  }

  /**
   * Normalize کردن Volume ها
   */
  private normalizeVolumes(tracks: AudioTrack[]): void {
    const maxVolume = Math.max(...tracks.map(t => t.volume), 0);

    if (maxVolume > 1.0) {
      const normalizeFactor = 1.0 / maxVolume;
      for (const track of tracks) {
        track.volume *= normalizeFactor;
      }
      console.log(`🎚️ [AudioMixer] Normalized volumes (factor: ${normalizeFactor.toFixed(2)})`);
    }
  }

  /**
   * محاسبه آمار
   */
  private calculateStats(tracks: AudioTrack[]): {
    peakVolume: number;
    averageVolume: number;
  } {
    const volumes = tracks.map(t => t.volume);
    const peakVolume = Math.max(...volumes, 0);
    const averageVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length || 0;

    return { peakVolume, averageVolume };
  }

  /**
   * پیش‌نمایش Mix
   */
  previewMix(project: LongVideoProject): {
    actsAudio: ActAudioInfo[];
    estimatedTracks: number;
    estimatedDuration: number;
  } {
    const actsAudio = this.collectActsAudio(project);

    const estimatedEffects = actsAudio.reduce(
      (sum, act) => sum + act.effects.length + (act.transitionEffects?.length || 0),
      0
    );

    const estimatedMusic = actsAudio.filter(act => act.music !== null).length;

    return {
      actsAudio,
      estimatedTracks: estimatedMusic + estimatedEffects,
      estimatedDuration: project.totalDuration
    };
  }

  /**
   * Export Timeline for visualization
   */
  exportTimeline(mixResult: MixResult): Array<{
    time: number;
    tracks: Array<{
      id: string;
      type: 'music' | 'effect';
      volume: number;
    }>;
  }> {
    const timeline: Array<any> = [];
    const timePoints = new Set<number>();

    // جمع‌آوری تمام نقاط زمانی
    for (const track of mixResult.tracks) {
      timePoints.add(track.startTime);
      timePoints.add(track.startTime + track.duration);
    }

    // ساخت Timeline
    const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);

    for (const time of sortedTimes) {
      const activeTracks = mixResult.tracks
        .filter(t => time >= t.startTime && time < t.startTime + t.duration)
        .map(t => ({
          id: t.id,
          type: t.type,
          volume: t.volume
        }));

      timeline.push({ time, tracks: activeTracks });
    }

    return timeline;
  }

  /**
   * به‌روزرسانی Config
   */
  updateConfig(config: Partial<MixConfig>): void {
    this.config = { ...this.config, ...config };
    console.log(`🎛️ [AudioMixer] Config updated`);
  }

  /**
   * دریافت Config
   */
  getConfig(): MixConfig {
    return { ...this.config };
  }
}

// ==================== EXPORT ====================

export const audioMixer = new AudioMixer();
