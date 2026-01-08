/**
 * Audio Engine
 *
 * مدیریت صدای ویدیوهای طولانی
 * - پخش موسیقی پس‌زمینه
 * - مدیریت Sound Effects
 * - Audio Mixing
 * - Fade Transitions
 */

import { VideoAct, ActMood } from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * Audio Track
 */
export interface AudioTrack {
  id: string;
  type: 'music' | 'effect';
  url: string;
  startTime: number;      // در Timeline کلی (seconds)
  duration: number;
  volume: number;         // 0-1
  loop: boolean;
  fadeIn?: number;        // seconds
  fadeOut?: number;       // seconds
}

/**
 * Music Track با Mood
 */
export interface MusicTrack extends AudioTrack {
  type: 'music';
  mood: string;
  bpm?: number;
  genre?: string;
}

/**
 * Sound Effect Track
 */
export interface SoundEffectTrack extends AudioTrack {
  type: 'effect';
  effectType: 'snap' | 'slide' | 'wave' | 'whoosh' | 'impact';
}

/**
 * Audio Mix Result
 */
export interface AudioMixResult {
  tracks: AudioTrack[];
  totalDuration: number;
  peakVolume: number;
  averageVolume: number;
}

// ==================== AUDIO ENGINE ====================

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private loadedBuffers: Map<string, AudioBuffer> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();

  /**
   * Initialize Audio Engine
   */
  init(): void {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log(`✅ [AudioEngine] Initialized (Sample Rate: ${this.audioContext.sampleRate}Hz)`);
  }

  /**
   * دریافت Audio Context
   */
  getContext(): AudioContext {
    if (!this.audioContext) {
      this.init();
    }
    return this.audioContext!;
  }

  /**
   * Load یک فایل صوتی
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    // Check cache
    if (this.loadedBuffers.has(url)) {
      return this.loadedBuffers.get(url)!;
    }

    console.log(`🔊 [AudioEngine] Loading: ${url}`);

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.getContext().decodeAudioData(arrayBuffer);

      this.loadedBuffers.set(url, audioBuffer);
      console.log(`✅ [AudioEngine] Loaded: ${url} (${audioBuffer.duration.toFixed(2)}s)`);

      return audioBuffer;
    } catch (error) {
      console.error(`❌ [AudioEngine] Failed to load: ${url}`, error);
      throw error;
    }
  }

  /**
   * پخش یک Track
   */
  async playTrack(track: AudioTrack): Promise<void> {
    const ctx = this.getContext();
    const buffer = await this.loadAudio(track.url);

    // ایجاد Source
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = track.loop;

    // ایجاد Gain Node برای Volume و Fade
    const gainNode = ctx.createGain();
    gainNode.gain.value = track.volume;

    // اتصال: Source → Gain → Destination
    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Fade In
    if (track.fadeIn && track.fadeIn > 0) {
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        track.volume,
        ctx.currentTime + track.fadeIn
      );
    }

    // Fade Out
    if (track.fadeOut && track.fadeOut > 0) {
      const fadeOutStart = ctx.currentTime + track.duration - track.fadeOut;
      gainNode.gain.setValueAtTime(track.volume, fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + track.fadeOut);
    }

    // شروع پخش
    source.start(ctx.currentTime);

    // ذخیره برای کنترل بعدی
    this.activeSources.set(track.id, source);
    this.gainNodes.set(track.id, gainNode);

    // توقف خودکار در پایان
    if (!track.loop) {
      source.stop(ctx.currentTime + track.duration);
      setTimeout(() => {
        this.activeSources.delete(track.id);
        this.gainNodes.delete(track.id);
      }, track.duration * 1000);
    }

    console.log(`▶️ [AudioEngine] Playing: ${track.id}`);
  }

  /**
   * توقف یک Track
   */
  stopTrack(trackId: string, fadeOutDuration: number = 0): void {
    const source = this.activeSources.get(trackId);
    const gainNode = this.gainNodes.get(trackId);

    if (!source || !gainNode) return;

    const ctx = this.getContext();

    if (fadeOutDuration > 0) {
      // Fade out
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutDuration);

      setTimeout(() => {
        source.stop();
        this.activeSources.delete(trackId);
        this.gainNodes.delete(trackId);
      }, fadeOutDuration * 1000);
    } else {
      // توقف فوری
      source.stop();
      this.activeSources.delete(trackId);
      this.gainNodes.delete(trackId);
    }

    console.log(`⏹️ [AudioEngine] Stopped: ${trackId}`);
  }

  /**
   * توقف تمام Track ها
   */
  stopAll(fadeOutDuration: number = 0): void {
    const trackIds = Array.from(this.activeSources.keys());
    trackIds.forEach(id => this.stopTrack(id, fadeOutDuration));
  }

  /**
   * تنظیم Volume یک Track
   */
  setVolume(trackId: string, volume: number, rampDuration: number = 0): void {
    const gainNode = this.gainNodes.get(trackId);
    if (!gainNode) return;

    const ctx = this.getContext();
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (rampDuration > 0) {
      gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        clampedVolume,
        ctx.currentTime + rampDuration
      );
    } else {
      gainNode.gain.value = clampedVolume;
    }
  }

  /**
   * تولید Audio Track برای موسیقی پس‌زمینه
   */
  createMusicTrack(
    url: string,
    startTime: number,
    duration: number,
    mood: string,
    options?: {
      volume?: number;
      fadeIn?: number;
      fadeOut?: number;
      loop?: boolean;
    }
  ): MusicTrack {
    return {
      id: `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'music',
      url,
      startTime,
      duration,
      volume: options?.volume ?? 0.6,
      loop: options?.loop ?? false,
      fadeIn: options?.fadeIn ?? 2,
      fadeOut: options?.fadeOut ?? 2,
      mood
    };
  }

  /**
   * تولید Audio Track برای Sound Effect
   */
  createSoundEffectTrack(
    url: string,
    startTime: number,
    effectType: SoundEffectTrack['effectType'],
    options?: {
      volume?: number;
      duration?: number;
    }
  ): SoundEffectTrack {
    return {
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'effect',
      url,
      startTime,
      duration: options?.duration ?? 0.5,
      volume: options?.volume ?? 0.8,
      loop: false,
      effectType
    };
  }

  /**
   * محاسبه Crossfade بین دو موسیقی
   */
  calculateCrossfade(
    track1Duration: number,
    track2StartTime: number,
    crossfadeDuration: number = 3
  ): { track1FadeOut: number; track2FadeIn: number } {
    const overlap = track1Duration - track2StartTime;

    if (overlap <= 0) {
      // بدون overlap - فقط fade معمولی
      return {
        track1FadeOut: crossfadeDuration,
        track2FadeIn: crossfadeDuration
      };
    }

    // با overlap - crossfade واقعی
    const actualCrossfade = Math.min(overlap, crossfadeDuration);

    return {
      track1FadeOut: actualCrossfade,
      track2FadeIn: actualCrossfade
    };
  }

  /**
   * Mix کردن تمام Track های یک پروژه
   */
  mixTracks(tracks: AudioTrack[]): AudioMixResult {
    // محاسبه مدت زمان کل
    const totalDuration = Math.max(
      ...tracks.map(t => t.startTime + t.duration),
      0
    );

    // محاسبه حجم‌های Volume
    const volumes = tracks.map(t => t.volume);
    const peakVolume = Math.max(...volumes, 0);
    const averageVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length || 0;

    // بررسی تداخل‌ها و هشدار
    this.detectOverlaps(tracks);

    return {
      tracks,
      totalDuration,
      peakVolume,
      averageVolume
    };
  }

  /**
   * بررسی تداخل Track ها
   */
  private detectOverlaps(tracks: AudioTrack[]): void {
    const musicTracks = tracks.filter(t => t.type === 'music');

    for (let i = 0; i < musicTracks.length; i++) {
      for (let j = i + 1; j < musicTracks.length; j++) {
        const t1 = musicTracks[i];
        const t2 = musicTracks[j];

        const t1End = t1.startTime + t1.duration;
        const t2End = t2.startTime + t2.duration;

        const hasOverlap =
          (t1.startTime >= t2.startTime && t1.startTime < t2End) ||
          (t2.startTime >= t1.startTime && t2.startTime < t1End);

        if (hasOverlap && (!t1.fadeOut || !t2.fadeIn)) {
          console.warn(
            `⚠️ [AudioEngine] Music overlap detected without crossfade: ${t1.id} & ${t2.id}`
          );
        }
      }
    }
  }

  /**
   * Export Audio Mix به Blob
   */
  async exportMix(tracks: AudioTrack[], sampleRate: number = 48000): Promise<Blob> {
    console.log(`🎵 [AudioEngine] Exporting mix: ${tracks.length} tracks`);

    // این یک implementation ساده است
    // در واقعیت، باید از OfflineAudioContext استفاده شود

    const ctx = this.getContext();
    const mixResult = this.mixTracks(tracks);

    // TODO: Implement actual mixing with OfflineAudioContext
    // For now, just return a placeholder

    throw new Error('Export not yet implemented - use OfflineAudioContext');
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.loadedBuffers.clear();
    console.log(`🗑️ [AudioEngine] Cache cleared`);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAll();
    this.clearCache();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log(`🗑️ [AudioEngine] Disposed`);
  }
}

// ==================== EXPORT ====================

export const audioEngine = new AudioEngine();
