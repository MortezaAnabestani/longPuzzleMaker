/**
 * Long Video Type Definitions
 *
 * تعاریف Type برای سیستم ویدیوهای طولانی پازل
 */

// ==================== ENUMS ====================

/**
 * Template های موجود برای ویدیوهای طولانی
 */
export type VideoTemplate =
  | 'SCIENTIFIC_DISCOVERY'    // کشف علمی (DNA, Penicillin, etc.)
  | 'HISTORICAL_MYSTERY'      // معمای تاریخی (Dyatlov Pass, etc.)
  | 'NATURES_MARVEL'          // عجایب طبیعت (Mariana Trench, etc.)
  | 'TIME_EVOLUTION'          // تکامل در زمان (Cities, Species, etc.)
  | 'ZOOM_JOURNEY'            // سفر زوم (Macro to Micro)
  | 'COMPARISON_STORY';       // مقایسه (Past vs Future, etc.)

/**
 * وضعیت هر Act در Timeline
 */
export type ActMood =
  | 'mystery'
  | 'curiosity'
  | 'tension'
  | 'excitement'
  | 'breakthrough'
  | 'triumph'
  | 'satisfaction';

/**
 * نوع انیمیشن متن
 */
export type TextAnimation =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'typewriter'
  | 'reveal'
  | 'glow';

/**
 * موقعیت متن روی صفحه
 */
export type TextPosition =
  | 'top'
  | 'top-left'
  | 'top-right'
  | 'center'
  | 'bottom'
  | 'bottom-left'
  | 'bottom-right'
  | 'left'
  | 'right';

/**
 * نوع متن
 */
export type TextType =
  | 'title'        // عنوان اصلی
  | 'fact'         // فکت علمی
  | 'narration'    // روایت
  | 'question'     // سوال
  | 'stat'         // آمار
  | 'quote';       // نقل قول

/**
 * نوع Transition بین Act ها
 */
export type TransitionType =
  | 'fade'
  | 'crossfade'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide'
  | 'puzzle-merge'
  | 'dissolve';

// ==================== INTERFACES ====================

/**
 * متن روی ویدیو
 */
export interface TextOverlay {
  id: string;
  content: string;
  startTime: number;        // relative to Act (seconds)
  duration: number;         // seconds
  type: TextType;
  position: TextPosition;
  animation: TextAnimation;
  style: {
    fontSize: number;       // px
    fontWeight: 'normal' | 'bold' | 'light';
    fontFamily: 'elegant' | 'bold' | 'typewriter' | 'sans';
    color: string;          // hex
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
  };
}

/**
 * تنظیمات دوربین
 */
export interface CameraSettings {
  zoom: number;             // 1.0 = normal, >1 = zoomed in
  panX: number;             // -1 to 1 (left to right)
  panY: number;             // -1 to 1 (top to bottom)
  rotation: number;         // degrees
  duration: number;         // seconds for animation
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * تنظیمات پازل برای هر Act
 */
export interface ActPuzzleConfig {
  startPercentage: number;  // 0-100: درصد کامل شدن در شروع Act
  endPercentage: number;    // 0-100: درصد کامل شدن در پایان Act
  pieceCount: number;       // تعداد کل قطعات پازل
  animationSpeed: 'slow' | 'medium' | 'fast' | 'dramatic';
  highlightPieces?: number[]; // شماره قطعاتی که باید highlight شوند
  cameraMovements?: CameraSettings[]; // حرکات دوربین در این Act
}

/**
 * Transition بین Act ها
 */
export interface ActTransition {
  type: TransitionType;
  duration: number;         // seconds
  options?: {
    color?: string;         // برای fade
    direction?: 'left' | 'right' | 'up' | 'down'; // برای slide
    scale?: number;         // برای zoom
  };
}

/**
 * یک Act از ویدیو
 */
export interface VideoAct {
  id: string;
  title: string;            // عنوان داخلی (نمایش داده نمی‌شود)
  duration: number;         // seconds (60-240)

  // محتوای آموزشی
  keyMessage: string;       // پیام کلیدی این Act
  facts: string[];          // فکت‌های علمی (3-5 تا)

  // بصری
  imagePrompt: string;      // Prompt برای تولید تصویر
  artStyle: string;         // سبک هنری
  colorGrading?: string;    // رنگ‌بندی خاص

  // پازل
  puzzleConfig: ActPuzzleConfig;

  // متن‌ها
  texts: TextOverlay[];

  // موسیقی و صدا
  mood: ActMood;
  musicMood: string;        // برای انتخاب موسیقی
  soundEffects?: string[];  // جلوه‌های صوتی خاص

  // Transition به Act بعدی
  transition?: ActTransition;
}

/**
 * پروژه ویدیوی طولانی
 */
export interface LongVideoProject {
  id: string;
  title: string;
  description: string;

  // Template و ساختار
  template: VideoTemplate;
  totalDuration: number;    // seconds (300-1200)
  aspectRatio: '16:9';
  resolution: '1920x1080';

  // Act ها (فصل‌ها)
  acts: VideoAct[];

  // تنظیمات کلی بصری
  artStyle: string;         // سبک هنری کلی
  colorPalette: string[];   // پالت رنگی کلی

  // موسیقی
  backgroundMusic: {
    type: 'single' | 'per-act';
    mood: string;
    fadeTransitions: boolean;
  };

  // Metadata
  metadata: {
    category: string;
    tags: string[];
    educationalLevel: 'basic' | 'intermediate' | 'advanced';
    targetAudience: 'general' | 'kids' | 'teens' | 'adults';
    language: 'en' | 'fa' | 'ar';
  };

  // وضعیت پروژه
  status: 'draft' | 'generating' | 'rendering' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Timeline state برای نمایش و ویرایش
 */
export interface TimelineState {
  currentTime: number;      // seconds
  currentActIndex: number;
  isPlaying: boolean;
  zoom: number;             // zoom level در timeline
  selectedActId: string | null;
  selectedTextId: string | null;
}

/**
 * نتیجه رندر هر Act
 */
export interface ActRenderResult {
  actId: string;
  success: boolean;
  outputPath?: string;
  duration: number;
  error?: string;
}

/**
 * نتیجه نهایی Export
 */
export interface VideoExportResult {
  success: boolean;
  outputPath?: string;
  duration: number;
  fileSize: number;         // MB
  acts: ActRenderResult[];
  error?: string;
}

// ==================== HELPER TYPES ====================

/**
 * Partial Act برای Update
 */
export type ActUpdate = Partial<Omit<VideoAct, 'id'>>;

/**
 * Partial Project برای Update
 */
export type ProjectUpdate = Partial<Omit<LongVideoProject, 'id' | 'createdAt'>>;

/**
 * Template Configuration
 */
export interface TemplateConfig {
  name: VideoTemplate;
  displayName: string;
  description: string;
  defaultDuration: number;
  defaultActCount: number;
  icon: string;
  preview: string;          // URL to preview video/image
  suitableFor: string[];    // موضوعاتی که مناسب این Template است
}