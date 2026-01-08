/**
 * Timeline Manager
 *
 * مدیریت Timeline کلی ویدیوهای طولانی
 * - هماهنگی زمان‌بندی بین Act ها
 * - مدیریت Playback
 * - محاسبه زمان‌های مطلق
 * - Seeking و Navigation
 */

import {
  VideoAct,
  TimelineState,
  LongVideoProject
} from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * Marker در Timeline (برای نمایش نقاط مهم)
 */
export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  type: 'act-start' | 'act-end' | 'transition' | 'text' | 'fact' | 'custom';
  metadata?: any;
}

/**
 * بازه زمانی Timeline
 */
export interface TimelineRange {
  start: number;
  end: number;
  actId?: string;
  type: 'act' | 'transition' | 'text';
}

/**
 * Event های Timeline
 */
export type TimelineEvent =
  | { type: 'ACT_START'; actId: string; actIndex: number; time: number }
  | { type: 'ACT_END'; actId: string; actIndex: number; time: number }
  | { type: 'TRANSITION_START'; fromActId: string; toActId: string; time: number }
  | { type: 'TRANSITION_END'; fromActId: string; toActId: string; time: number }
  | { type: 'TEXT_START'; textId: string; actId: string; time: number }
  | { type: 'TEXT_END'; textId: string; actId: string; time: number }
  | { type: 'PLAYBACK_START'; time: number }
  | { type: 'PLAYBACK_PAUSE'; time: number }
  | { type: 'SEEK'; fromTime: number; toTime: number };

/**
 * Callback برای Event های Timeline
 */
export type TimelineEventCallback = (event: TimelineEvent) => void;

// ==================== TIMELINE MANAGER ====================

export class TimelineManager {
  private state: TimelineState;
  private acts: VideoAct[];
  private totalDuration: number;
  private eventCallbacks: TimelineEventCallback[] = [];

  // Cache برای بهینه‌سازی
  private cachedMarkers: TimelineMarker[] | null = null;
  private cachedRanges: TimelineRange[] | null = null;

  constructor(acts: VideoAct[] = []) {
    this.acts = acts;
    this.totalDuration = this.calculateTotalDuration();

    this.state = {
      currentTime: 0,
      currentActIndex: 0,
      isPlaying: false,
      zoom: 1.0,
      selectedActId: null,
      selectedTextId: null
    };
  }

  // ==================== GETTERS ====================

  /**
   * دریافت State فعلی
   */
  getState(): TimelineState {
    return { ...this.state };
  }

  /**
   * دریافت Act ها
   */
  getActs(): VideoAct[] {
    return this.acts;
  }

  /**
   * دریافت مدت زمان کل
   */
  getTotalDuration(): number {
    return this.totalDuration;
  }

  /**
   * دریافت Act فعلی
   */
  getCurrentAct(): VideoAct | null {
    if (this.state.currentActIndex < 0 || this.state.currentActIndex >= this.acts.length) {
      return null;
    }
    return this.acts[this.state.currentActIndex];
  }

  /**
   * دریافت Act بر اساس زمان
   */
  getActAtTime(time: number): { act: VideoAct; actIndex: number; relativeTime: number } | null {
    let currentTime = 0;

    for (let i = 0; i < this.acts.length; i++) {
      const act = this.acts[i];
      const actEndTime = currentTime + act.duration;

      if (time >= currentTime && time < actEndTime) {
        return {
          act,
          actIndex: i,
          relativeTime: time - currentTime
        };
      }

      currentTime = actEndTime;
      if (act.transition) {
        currentTime += act.transition.duration;
      }
    }

    return null;
  }

  // ==================== TIME CALCULATIONS ====================

  /**
   * محاسبه مدت زمان کل
   */
  private calculateTotalDuration(): number {
    let total = 0;
    for (const act of this.acts) {
      total += act.duration;
      if (act.transition) {
        total += act.transition.duration;
      }
    }
    return total;
  }

  /**
   * محاسبه زمان شروع یک Act
   */
  getActStartTime(actIndex: number): number {
    let time = 0;
    for (let i = 0; i < actIndex && i < this.acts.length; i++) {
      time += this.acts[i].duration;
      if (this.acts[i].transition) {
        time += this.acts[i].transition!.duration;
      }
    }
    return time;
  }

  /**
   * محاسبه زمان پایان یک Act
   */
  getActEndTime(actIndex: number): number {
    if (actIndex < 0 || actIndex >= this.acts.length) return 0;
    return this.getActStartTime(actIndex) + this.acts[actIndex].duration;
  }

  /**
   * تبدیل زمان نسبی Act به زمان مطلق Timeline
   */
  actTimeToAbsolute(actIndex: number, relativeTime: number): number {
    return this.getActStartTime(actIndex) + relativeTime;
  }

  /**
   * تبدیل زمان مطلق Timeline به زمان نسبی Act
   */
  absoluteTimeToAct(absoluteTime: number): { actIndex: number; relativeTime: number } | null {
    const result = this.getActAtTime(absoluteTime);
    if (!result) return null;

    return {
      actIndex: result.actIndex,
      relativeTime: result.relativeTime
    };
  }

  // ==================== PLAYBACK CONTROL ====================

  /**
   * شروع Playback
   */
  play(): void {
    if (!this.state.isPlaying) {
      this.state.isPlaying = true;
      this.emitEvent({ type: 'PLAYBACK_START', time: this.state.currentTime });
      console.log(`▶️ [Timeline] Playing from ${this.state.currentTime.toFixed(2)}s`);
    }
  }

  /**
   * توقف Playback
   */
  pause(): void {
    if (this.state.isPlaying) {
      this.state.isPlaying = false;
      this.emitEvent({ type: 'PLAYBACK_PAUSE', time: this.state.currentTime });
      console.log(`⏸️ [Timeline] Paused at ${this.state.currentTime.toFixed(2)}s`);
    }
  }

  /**
   * Toggle Play/Pause
   */
  togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek به زمان خاص
   */
  seek(time: number): void {
    const oldTime = this.state.currentTime;
    const clampedTime = Math.max(0, Math.min(time, this.totalDuration));

    this.state.currentTime = clampedTime;

    // به‌روزرسانی Act Index
    const actInfo = this.getActAtTime(clampedTime);
    if (actInfo) {
      this.state.currentActIndex = actInfo.actIndex;
    }

    this.emitEvent({ type: 'SEEK', fromTime: oldTime, toTime: clampedTime });
    console.log(`⏩ [Timeline] Seeked from ${oldTime.toFixed(2)}s to ${clampedTime.toFixed(2)}s`);
  }

  /**
   * Seek به Act خاص
   */
  seekToAct(actIndex: number): void {
    if (actIndex < 0 || actIndex >= this.acts.length) {
      console.warn(`⚠️ [Timeline] Invalid act index: ${actIndex}`);
      return;
    }

    const actStartTime = this.getActStartTime(actIndex);
    this.seek(actStartTime);
    this.state.currentActIndex = actIndex;
  }

  /**
   * Next Act
   */
  nextAct(): void {
    if (this.state.currentActIndex < this.acts.length - 1) {
      this.seekToAct(this.state.currentActIndex + 1);
    }
  }

  /**
   * Previous Act
   */
  previousAct(): void {
    if (this.state.currentActIndex > 0) {
      this.seekToAct(this.state.currentActIndex - 1);
    }
  }

  /**
   * به‌روزرسانی زمان (برای playback loop)
   */
  updateTime(deltaTime: number): void {
    if (!this.state.isPlaying) return;

    const oldTime = this.state.currentTime;
    const newTime = Math.min(this.state.currentTime + deltaTime, this.totalDuration);

    this.state.currentTime = newTime;

    // بررسی تغییر Act
    const oldActInfo = this.getActAtTime(oldTime);
    const newActInfo = this.getActAtTime(newTime);

    if (oldActInfo && newActInfo && oldActInfo.actIndex !== newActInfo.actIndex) {
      // Act تغییر کرده است
      this.state.currentActIndex = newActInfo.actIndex;

      // Emit events
      this.emitEvent({
        type: 'ACT_END',
        actId: oldActInfo.act.id,
        actIndex: oldActInfo.actIndex,
        time: oldTime
      });

      this.emitEvent({
        type: 'ACT_START',
        actId: newActInfo.act.id,
        actIndex: newActInfo.actIndex,
        time: newTime
      });
    }

    // پایان Timeline
    if (newTime >= this.totalDuration) {
      this.pause();
      console.log(`🏁 [Timeline] Reached end`);
    }
  }

  // ==================== MARKERS & RANGES ====================

  /**
   * تولید Marker های Timeline
   */
  generateMarkers(): TimelineMarker[] {
    if (this.cachedMarkers) {
      return this.cachedMarkers;
    }

    const markers: TimelineMarker[] = [];
    let currentTime = 0;

    for (let i = 0; i < this.acts.length; i++) {
      const act = this.acts[i];

      // Act Start Marker
      markers.push({
        id: `act-start-${act.id}`,
        time: currentTime,
        label: act.title,
        type: 'act-start',
        metadata: { actIndex: i, actId: act.id }
      });

      // Text Markers
      for (const text of act.texts) {
        markers.push({
          id: `text-${text.id}`,
          time: currentTime + text.startTime,
          label: text.content.substring(0, 30) + '...',
          type: 'text',
          metadata: { textId: text.id, actId: act.id, textType: text.type }
        });
      }

      currentTime += act.duration;

      // Act End Marker
      markers.push({
        id: `act-end-${act.id}`,
        time: currentTime,
        label: `${act.title} (End)`,
        type: 'act-end',
        metadata: { actIndex: i, actId: act.id }
      });

      // Transition Marker
      if (act.transition) {
        markers.push({
          id: `transition-${act.id}`,
          time: currentTime,
          label: `Transition: ${act.transition.type}`,
          type: 'transition',
          metadata: { actId: act.id, transitionType: act.transition.type }
        });

        currentTime += act.transition.duration;
      }
    }

    this.cachedMarkers = markers;
    return markers;
  }

  /**
   * تولید بازه‌های زمانی Timeline
   */
  generateRanges(): TimelineRange[] {
    if (this.cachedRanges) {
      return this.cachedRanges;
    }

    const ranges: TimelineRange[] = [];
    let currentTime = 0;

    for (const act of this.acts) {
      // Act Range
      ranges.push({
        start: currentTime,
        end: currentTime + act.duration,
        actId: act.id,
        type: 'act'
      });

      currentTime += act.duration;

      // Transition Range
      if (act.transition) {
        ranges.push({
          start: currentTime,
          end: currentTime + act.transition.duration,
          actId: act.id,
          type: 'transition'
        });

        currentTime += act.transition.duration;
      }
    }

    this.cachedRanges = ranges;
    return ranges;
  }

  // ==================== SELECTION ====================

  /**
   * انتخاب Act
   */
  selectAct(actId: string | null): void {
    this.state.selectedActId = actId;
    console.log(`🎯 [Timeline] Selected act: ${actId}`);
  }

  /**
   * انتخاب Text
   */
  selectText(textId: string | null): void {
    this.state.selectedTextId = textId;
    console.log(`🎯 [Timeline] Selected text: ${textId}`);
  }

  // ==================== ZOOM ====================

  /**
   * تنظیم Zoom
   */
  setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(zoom, 10));
    console.log(`🔍 [Timeline] Zoom: ${this.state.zoom.toFixed(2)}x`);
  }

  /**
   * Zoom In
   */
  zoomIn(factor: number = 1.2): void {
    this.setZoom(this.state.zoom * factor);
  }

  /**
   * Zoom Out
   */
  zoomOut(factor: number = 1.2): void {
    this.setZoom(this.state.zoom / factor);
  }

  /**
   * Reset Zoom
   */
  resetZoom(): void {
    this.setZoom(1.0);
  }

  // ==================== EVENTS ====================

  /**
   * ثبت Callback برای Event ها
   */
  on(callback: TimelineEventCallback): () => void {
    this.eventCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.eventCallbacks.indexOf(callback);
      if (index > -1) {
        this.eventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit یک Event
   */
  private emitEvent(event: TimelineEvent): void {
    for (const callback of this.eventCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error(`❌ [Timeline] Error in event callback:`, error);
      }
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Format کردن زمان به MM:SS
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * محاسبه درصد پیشرفت
   */
  getProgress(): number {
    if (this.totalDuration === 0) return 0;
    return (this.state.currentTime / this.totalDuration) * 100;
  }

  /**
   * Clear Cache (بعد از تغییر Acts)
   */
  clearCache(): void {
    this.cachedMarkers = null;
    this.cachedRanges = null;
  }

  /**
   * به‌روزرسانی Acts
   */
  updateActs(acts: VideoAct[]): void {
    this.acts = acts;
    this.totalDuration = this.calculateTotalDuration();
    this.clearCache();

    // Reset state اگر invalid شده
    if (this.state.currentActIndex >= acts.length) {
      this.state.currentActIndex = Math.max(0, acts.length - 1);
    }

    if (this.state.currentTime > this.totalDuration) {
      this.state.currentTime = this.totalDuration;
    }

    console.log(`🔄 [Timeline] Updated acts: ${acts.length} acts, ${this.totalDuration.toFixed(2)}s total`);
  }

  /**
   * Reset Timeline
   */
  reset(): void {
    this.state.currentTime = 0;
    this.state.currentActIndex = 0;
    this.state.isPlaying = false;
    this.state.selectedActId = null;
    this.state.selectedTextId = null;
    console.log(`🔄 [Timeline] Reset`);
  }

  /**
   * Export Timeline به JSON
   */
  export(): any {
    return {
      totalDuration: this.totalDuration,
      actCount: this.acts.length,
      markers: this.generateMarkers(),
      ranges: this.generateRanges(),
      state: this.state
    };
  }
}

// ==================== FACTORY ====================

/**
 * ایجاد Timeline Manager از Project
 */
export function createTimelineFromProject(project: LongVideoProject): TimelineManager {
  return new TimelineManager(project.acts);
}
