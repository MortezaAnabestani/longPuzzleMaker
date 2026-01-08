/**
 * Template Engine
 *
 * مدیریت و تولید Template های ویدیوهای طولانی
 * - تعریف Template ها
 * - تولید خودکار Act ها بر اساس Template
 * - توزیع Fact ها در Timeline
 * - ساخت Story Arc
 */

import {
  VideoTemplate,
  VideoAct,
  LongVideoProject,
  ActMood,
  TextType,
  TextPosition,
  TextAnimation,
  TemplateConfig
} from '../types/longVideo.types';

import { chapterEngine } from './chapterEngine';

// ==================== INTERFACES ====================

/**
 * ورودی برای تولید پروژه از Template
 */
export interface TemplateInput {
  template: VideoTemplate;
  topic: string;              // موضوع اصلی (e.g., "DNA Structure Discovery")
  targetDuration: number;     // مدت زمان هدف (300-1200 seconds)
  educationalLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'en' | 'fa' | 'ar';
  additionalContext?: string; // اطلاعات اضافی از کاربر
}

/**
 * ساختار یک Act در Template
 */
interface ActTemplate {
  title: string;
  duration: number;
  mood: ActMood;
  keyMessageTemplate: string;  // Template برای پیام کلیدی
  factCount: number;            // تعداد فکت‌های مورد نیاز
  imagePromptTemplate: string;  // Template برای Image Prompt
  textSequence: Array<{
    type: TextType;
    timing: 'start' | 'middle' | 'end' | number; // timing نسبی
    durationPercent: number; // درصد از duration کل Act
    position: TextPosition;
    animation: TextAnimation;
  }>;
}

/**
 * Definition کامل یک Template
 */
interface TemplateDefinition {
  name: VideoTemplate;
  displayName: string;
  description: string;
  actCount: number;
  totalDuration: number;
  artStyle: string;
  colorPalette: string[];
  musicMood: string;
  acts: ActTemplate[];
  storyArc: {
    opening: string;
    rising: string;
    climax: string;
    resolution: string;
  };
}

// ==================== TEMPLATE DEFINITIONS ====================

/**
 * Template: Scientific Discovery Journey
 *
 * قالب برای روایت کشفیات علمی
 * 4 Act: Mystery → Investigation → Breakthrough → Impact
 */
const SCIENTIFIC_DISCOVERY_TEMPLATE: TemplateDefinition = {
  name: 'SCIENTIFIC_DISCOVERY',
  displayName: 'کشف علمی (Scientific Discovery)',
  description: 'روایت داستان کشفیات علمی از معما تا تأثیر',
  actCount: 4,
  totalDuration: 360, // 6 minutes
  artStyle: 'Stained Glass',
  colorPalette: ['#1a237e', '#0d47a1', '#01579b', '#006064', '#004d40'],
  musicMood: 'mysterious ambient with gradual triumph',

  acts: [
    // Act 1: The Mystery
    {
      title: 'The Mystery',
      duration: 90,
      mood: 'mystery',
      keyMessageTemplate: 'What is {topic}? Why was it unknown?',
      factCount: 3,
      imagePromptTemplate: '{topic} shrouded in mystery, dark blues and purples, stained glass art style, abstract and enigmatic',
      textSequence: [
        {
          type: 'question',
          timing: 'start',
          durationPercent: 5,
          position: 'center',
          animation: 'glow'
        },
        {
          type: 'narration',
          timing: 15,
          durationPercent: 10,
          position: 'bottom',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 35,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'fact',
          timing: 60,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        }
      ]
    },

    // Act 2: The Investigation
    {
      title: 'The Investigation',
      duration: 90,
      mood: 'curiosity',
      keyMessageTemplate: 'How did scientists approach understanding {topic}?',
      factCount: 4,
      imagePromptTemplate: '{topic} being studied with scientific instruments, bright blues and teals, stained glass art style, organized and systematic',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 8,
          position: 'top',
          animation: 'reveal'
        },
        {
          type: 'fact',
          timing: 20,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'fact',
          timing: 40,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'stat',
          timing: 60,
          durationPercent: 10,
          position: 'center',
          animation: 'reveal'
        }
      ]
    },

    // Act 3: The Breakthrough
    {
      title: 'The Breakthrough',
      duration: 90,
      mood: 'breakthrough',
      keyMessageTemplate: 'The moment {topic} was discovered!',
      factCount: 4,
      imagePromptTemplate: '{topic} revealed in its glory, bright golds and whites, stained glass art style, radiant and triumphant',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 10,
          position: 'center',
          animation: 'reveal'
        },
        {
          type: 'narration',
          timing: 25,
          durationPercent: 15,
          position: 'center',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 50,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'quote',
          timing: 70,
          durationPercent: 15,
          position: 'center',
          animation: 'fade'
        }
      ]
    },

    // Act 4: The Impact
    {
      title: 'The Impact',
      duration: 90,
      mood: 'satisfaction',
      keyMessageTemplate: 'How {topic} changed the world',
      factCount: 5,
      imagePromptTemplate: '{topic} transforming the world, vibrant greens and golds, stained glass art style, expansive and hopeful',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 8,
          position: 'top',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 20,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'fact',
          timing: 40,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'stat',
          timing: 60,
          durationPercent: 10,
          position: 'center',
          animation: 'reveal'
        },
        {
          type: 'narration',
          timing: 75,
          durationPercent: 12,
          position: 'center',
          animation: 'fade'
        }
      ]
    }
  ],

  storyArc: {
    opening: 'Introduce the mystery and unknown aspect',
    rising: 'Show the scientific investigation process',
    climax: 'Reveal the breakthrough moment',
    resolution: 'Demonstrate the lasting impact'
  }
};

/**
 * Template: Historical Mystery
 *
 * قالب برای معماهای تاریخی
 * 4 Act: Event → Clues → Theories → Truth
 */
const HISTORICAL_MYSTERY_TEMPLATE: TemplateDefinition = {
  name: 'HISTORICAL_MYSTERY',
  displayName: 'معمای تاریخی (Historical Mystery)',
  description: 'روایت معماهای حل نشده تاریخ',
  actCount: 4,
  totalDuration: 360,
  artStyle: 'Film Noir',
  colorPalette: ['#212121', '#424242', '#616161', '#757575', '#9e9e9e'],
  musicMood: 'mysterious noir with tension',

  acts: [
    {
      title: 'The Event',
      duration: 90,
      mood: 'mystery',
      keyMessageTemplate: 'What happened at {topic}?',
      factCount: 3,
      imagePromptTemplate: '{topic} depicted in film noir style, high contrast black and white, mysterious shadows',
      textSequence: [
        {
          type: 'question',
          timing: 'start',
          durationPercent: 6,
          position: 'center',
          animation: 'glow'
        },
        {
          type: 'narration',
          timing: 20,
          durationPercent: 12,
          position: 'bottom',
          animation: 'typewriter'
        },
        {
          type: 'fact',
          timing: 50,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        }
      ]
    },

    {
      title: 'The Clues',
      duration: 90,
      mood: 'curiosity',
      keyMessageTemplate: 'What evidence exists about {topic}?',
      factCount: 4,
      imagePromptTemplate: 'Clues and evidence about {topic}, film noir detective style, dramatic lighting',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 7,
          position: 'top',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 25,
          durationPercent: 11,
          position: 'bottom-left',
          animation: 'slide-up'
        },
        {
          type: 'fact',
          timing: 50,
          durationPercent: 11,
          position: 'bottom-right',
          animation: 'slide-up'
        }
      ]
    },

    {
      title: 'The Theories',
      duration: 90,
      mood: 'tension',
      keyMessageTemplate: 'What are the theories about {topic}?',
      factCount: 5,
      imagePromptTemplate: 'Multiple theories visualized for {topic}, film noir style, fragmented perspectives',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 8,
          position: 'center',
          animation: 'reveal'
        },
        {
          type: 'narration',
          timing: 20,
          durationPercent: 14,
          position: 'center',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 45,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        }
      ]
    },

    {
      title: 'The Truth',
      duration: 90,
      mood: 'satisfaction',
      keyMessageTemplate: 'What do we know today about {topic}?',
      factCount: 4,
      imagePromptTemplate: '{topic} revealed in clarity, film noir style, emerging from shadows into light',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 9,
          position: 'top',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 30,
          durationPercent: 13,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'narration',
          timing: 65,
          durationPercent: 18,
          position: 'center',
          animation: 'fade'
        }
      ]
    }
  ],

  storyArc: {
    opening: 'Present the mysterious event',
    rising: 'Examine the evidence and clues',
    climax: 'Explore competing theories',
    resolution: 'Reveal what we know today'
  }
};

/**
 * Template: Nature's Marvel
 *
 * قالب برای عجایب طبیعت
 * 4 Act: Wonder → Mechanism → Extremes → Protection
 */
const NATURES_MARVEL_TEMPLATE: TemplateDefinition = {
  name: 'NATURES_MARVEL',
  displayName: 'عجایب طبیعت (Nature\'s Marvel)',
  description: 'کاوش در شگفتی‌های دنیای طبیعت',
  actCount: 4,
  totalDuration: 360,
  artStyle: 'Watercolor Dreams',
  colorPalette: ['#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#66bb6a'],
  musicMood: 'ambient nature with wonder',

  acts: [
    {
      title: 'The Wonder',
      duration: 90,
      mood: 'curiosity',
      keyMessageTemplate: 'Discover the beauty of {topic}',
      factCount: 3,
      imagePromptTemplate: '{topic} in stunning natural beauty, watercolor art style, vibrant and flowing',
      textSequence: [
        {
          type: 'question',
          timing: 'start',
          durationPercent: 6,
          position: 'center',
          animation: 'fade'
        },
        {
          type: 'narration',
          timing: 20,
          durationPercent: 13,
          position: 'bottom',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 55,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        }
      ]
    },

    {
      title: 'The Mechanism',
      duration: 90,
      mood: 'curiosity',
      keyMessageTemplate: 'How does {topic} work?',
      factCount: 5,
      imagePromptTemplate: 'Inner workings of {topic}, watercolor cross-section style, educational and beautiful',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 7,
          position: 'top',
          animation: 'slide-down'
        },
        {
          type: 'fact',
          timing: 20,
          durationPercent: 11,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'fact',
          timing: 45,
          durationPercent: 11,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'fact',
          timing: 70,
          durationPercent: 11,
          position: 'bottom',
          animation: 'slide-up'
        }
      ]
    },

    {
      title: 'The Extremes',
      duration: 90,
      mood: 'excitement',
      keyMessageTemplate: 'The extraordinary aspects of {topic}',
      factCount: 5,
      imagePromptTemplate: 'Extreme conditions of {topic}, watercolor art with dramatic contrasts',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 8,
          position: 'center',
          animation: 'reveal'
        },
        {
          type: 'stat',
          timing: 25,
          durationPercent: 10,
          position: 'center',
          animation: 'reveal'
        },
        {
          type: 'fact',
          timing: 50,
          durationPercent: 12,
          position: 'bottom',
          animation: 'slide-up'
        }
      ]
    },

    {
      title: 'The Protection',
      duration: 90,
      mood: 'satisfaction',
      keyMessageTemplate: 'Why we must protect {topic}',
      factCount: 4,
      imagePromptTemplate: '{topic} in harmony with environment, watercolor art, peaceful and balanced',
      textSequence: [
        {
          type: 'title',
          timing: 'start',
          durationPercent: 9,
          position: 'top',
          animation: 'fade'
        },
        {
          type: 'fact',
          timing: 30,
          durationPercent: 13,
          position: 'bottom',
          animation: 'slide-up'
        },
        {
          type: 'narration',
          timing: 65,
          durationPercent: 20,
          position: 'center',
          animation: 'fade'
        }
      ]
    }
  ],

  storyArc: {
    opening: 'Introduce the natural wonder',
    rising: 'Explain how it works',
    climax: 'Showcase extreme aspects',
    resolution: 'Call for protection and preservation'
  }
};

// ==================== TEMPLATE REGISTRY ====================

const TEMPLATE_REGISTRY: Map<VideoTemplate, TemplateDefinition> = new Map([
  ['SCIENTIFIC_DISCOVERY', SCIENTIFIC_DISCOVERY_TEMPLATE],
  ['HISTORICAL_MYSTERY', HISTORICAL_MYSTERY_TEMPLATE],
  ['NATURES_MARVEL', NATURES_MARVEL_TEMPLATE]
]);

// ==================== TEMPLATE ENGINE ====================

export class TemplateEngine {

  /**
   * دریافت لیست تمام Template ها
   */
  getAvailableTemplates(): TemplateConfig[] {
    const configs: TemplateConfig[] = [];

    for (const [key, template] of TEMPLATE_REGISTRY) {
      configs.push({
        name: key,
        displayName: template.displayName,
        description: template.description,
        defaultDuration: template.totalDuration,
        defaultActCount: template.actCount,
        icon: this.getTemplateIcon(key),
        preview: '', // URL به preview video (بعداً)
        suitableFor: this.getSuitableTopics(key)
      });
    }

    return configs;
  }

  /**
   * دریافت یک Template خاص
   */
  getTemplate(templateName: VideoTemplate): TemplateDefinition | null {
    return TEMPLATE_REGISTRY.get(templateName) || null;
  }

  /**
   * تولید پروژه از Template
   * این متد ساختار اولیه را می‌سازد، محتوای واقعی توسط AI تولید می‌شود
   */
  generateProjectStructure(input: TemplateInput): Partial<LongVideoProject> {
    const template = this.getTemplate(input.template);
    if (!template) {
      throw new Error(`Template not found: ${input.template}`);
    }

    console.log(`📋 [Template] Generating project structure for: ${input.topic}`);
    console.log(`   Template: ${template.displayName}`);
    console.log(`   Duration: ${input.targetDuration}s`);

    // محاسبه Duration هر Act بر اساس مدت زمان کل
    const actDurations = this.calculateActDurations(
      template.acts.length,
      input.targetDuration
    );

    // ایجاد Act های خالی (محتوا توسط AI پر می‌شود)
    const acts: Partial<VideoAct>[] = template.acts.map((actTemplate, index) => {
      const duration = actDurations[index];

      return {
        title: actTemplate.title,
        duration,
        keyMessage: actTemplate.keyMessageTemplate.replace('{topic}', input.topic),
        facts: [], // توسط AI پر می‌شود
        imagePrompt: actTemplate.imagePromptTemplate.replace('{topic}', input.topic),
        artStyle: template.artStyle,
        colorGrading: template.colorPalette.join(', '),
        puzzleConfig: {
          startPercentage: (index / template.acts.length) * 100,
          endPercentage: ((index + 1) / template.acts.length) * 100,
          pieceCount: this.calculatePieceCountForDuration(duration),
          animationSpeed: this.getAnimationSpeedByMood(actTemplate.mood),
          cameraMovements: []
        },
        texts: [], // توسط generateTexts پر می‌شود
        mood: actTemplate.mood,
        musicMood: template.musicMood
      };
    });

    // ساخت پروژه
    const project: Partial<LongVideoProject> = {
      title: input.topic,
      description: `${template.displayName}: ${input.topic}`,
      template: input.template,
      totalDuration: input.targetDuration,
      aspectRatio: '16:9',
      resolution: '1920x1080',
      acts: acts as VideoAct[],
      artStyle: template.artStyle,
      colorPalette: template.colorPalette,
      backgroundMusic: {
        type: 'per-act',
        mood: template.musicMood,
        fadeTransitions: true
      },
      metadata: {
        category: this.getCategoryByTemplate(input.template),
        tags: this.generateTags(input.topic, input.template),
        educationalLevel: input.educationalLevel,
        targetAudience: 'general',
        language: input.language
      },
      status: 'draft'
    };

    console.log(`✅ [Template] Generated structure with ${acts.length} acts`);
    return project;
  }

  /**
   * تولید Text Sequence برای یک Act بر اساس Template
   */
  generateTextsForAct(
    actTemplate: ActTemplate,
    actDuration: number,
    facts: string[]
  ): Partial<TextOverlay>[] {
    const texts: Partial<TextOverlay>[] = [];

    for (const textSeq of actTemplate.textSequence) {
      let startTime: number;

      // محاسبه زمان شروع
      if (textSeq.timing === 'start') {
        startTime = 2; // 2 ثانیه بعد از شروع
      } else if (textSeq.timing === 'middle') {
        startTime = actDuration / 2;
      } else if (textSeq.timing === 'end') {
        startTime = actDuration - (actDuration * textSeq.durationPercent / 100) - 3;
      } else {
        startTime = textSeq.timing as number;
      }

      // محاسبه Duration
      const duration = (actDuration * textSeq.durationPercent) / 100;

      // انتخاب محتوا بر اساس Type
      let content = '';
      if (textSeq.type === 'fact' && facts.length > 0) {
        // استفاده از یکی از facts
        const factIndex = texts.filter(t => t.type === 'fact').length;
        content = facts[factIndex] || facts[0];
      } else if (textSeq.type === 'title') {
        content = actTemplate.title;
      } else {
        content = `[${textSeq.type}]`; // Placeholder - توسط AI پر می‌شود
      }

      texts.push({
        content,
        startTime,
        duration,
        type: textSeq.type,
        position: textSeq.position,
        animation: textSeq.animation
      });
    }

    return texts;
  }

  /**
   * محاسبه Duration هر Act
   */
  private calculateActDurations(actCount: number, totalDuration: number): number[] {
    // توزیع مساوی با کمی تنوع
    const baseDuration = totalDuration / actCount;
    const durations: number[] = [];

    // Act اول و آخر کمی کوتاه‌تر، Act های وسط کمی طولانی‌تر
    for (let i = 0; i < actCount; i++) {
      if (i === 0) {
        durations.push(baseDuration * 0.9);
      } else if (i === actCount - 1) {
        durations.push(baseDuration * 0.9);
      } else {
        durations.push(baseDuration * 1.05);
      }
    }

    // Normalize برای اطمینان از مجموع درست
    const sum = durations.reduce((a, b) => a + b, 0);
    const normalized = durations.map(d => (d / sum) * totalDuration);

    return normalized.map(d => Math.round(d));
  }

  /**
   * محاسبه تعداد قطعات پازل بر اساس Duration
   */
  private calculatePieceCountForDuration(duration: number): number {
    if (duration <= 60) return 20;
    if (duration <= 90) return 30;
    if (duration <= 120) return 40;
    return 50;
  }

  /**
   * انتخاب سرعت انیمیشن بر اساس Mood
   */
  private getAnimationSpeedByMood(mood: ActMood): 'slow' | 'medium' | 'fast' | 'dramatic' {
    const speedMap: Record<ActMood, 'slow' | 'medium' | 'fast' | 'dramatic'> = {
      'mystery': 'slow',
      'curiosity': 'medium',
      'tension': 'medium',
      'excitement': 'fast',
      'breakthrough': 'dramatic',
      'triumph': 'fast',
      'satisfaction': 'slow'
    };
    return speedMap[mood];
  }

  /**
   * دریافت Category بر اساس Template
   */
  private getCategoryByTemplate(template: VideoTemplate): string {
    const categoryMap: Record<VideoTemplate, string> = {
      'SCIENTIFIC_DISCOVERY': 'Science & Discovery',
      'HISTORICAL_MYSTERY': 'History & Mystery',
      'NATURES_MARVEL': 'Nature & Wildlife',
      'TIME_EVOLUTION': 'History & Evolution',
      'ZOOM_JOURNEY': 'Science & Exploration',
      'COMPARISON_STORY': 'Comparison & Analysis'
    };
    return categoryMap[template] || 'General';
  }

  /**
   * تولید Tags
   */
  private generateTags(topic: string, template: VideoTemplate): string[] {
    const baseTags = ['puzzle', 'educational', 'satisfying', 'ASMR'];
    const templateTags: Record<VideoTemplate, string[]> = {
      'SCIENTIFIC_DISCOVERY': ['science', 'discovery', 'research'],
      'HISTORICAL_MYSTERY': ['history', 'mystery', 'unsolved'],
      'NATURES_MARVEL': ['nature', 'wildlife', 'environment'],
      'TIME_EVOLUTION': ['evolution', 'timeline', 'progress'],
      'ZOOM_JOURNEY': ['zoom', 'scale', 'exploration'],
      'COMPARISON_STORY': ['comparison', 'analysis', 'contrast']
    };

    const topicWords = topic.toLowerCase().split(' ').slice(0, 3);
    return [...baseTags, ...templateTags[template], ...topicWords];
  }

  /**
   * دریافت Icon Template
   */
  private getTemplateIcon(template: VideoTemplate): string {
    const iconMap: Record<VideoTemplate, string> = {
      'SCIENTIFIC_DISCOVERY': '🔬',
      'HISTORICAL_MYSTERY': '🕵️',
      'NATURES_MARVEL': '🌿',
      'TIME_EVOLUTION': '⏳',
      'ZOOM_JOURNEY': '🔍',
      'COMPARISON_STORY': '⚖️'
    };
    return iconMap[template] || '📹';
  }

  /**
   * دریافت موضوعات مناسب
   */
  private getSuitableTopics(template: VideoTemplate): string[] {
    const topicsMap: Record<VideoTemplate, string[]> = {
      'SCIENTIFIC_DISCOVERY': [
        'DNA Structure', 'Penicillin', 'Electricity', 'Gravity',
        'Radioactivity', 'Atoms', 'Black Holes'
      ],
      'HISTORICAL_MYSTERY': [
        'Dyatlov Pass', 'Bermuda Triangle', 'Nazca Lines',
        'Stonehenge', 'Egyptian Pyramids'
      ],
      'NATURES_MARVEL': [
        'Mariana Trench', 'Northern Lights', 'Great Barrier Reef',
        'Amazon Rainforest', 'Mount Everest'
      ],
      'TIME_EVOLUTION': [
        'Evolution of Cities', 'History of Writing', 'Transportation Evolution'
      ],
      'ZOOM_JOURNEY': [
        'Macro to Micro', 'Earth to Universe', 'Cell to Organism'
      ],
      'COMPARISON_STORY': [
        'Past vs Future', 'Ancient vs Modern', 'East vs West'
      ]
    };
    return topicsMap[template] || [];
  }

  /**
   * Validation ورودی
   */
  validateInput(input: TemplateInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.topic || input.topic.trim().length === 0) {
      errors.push('Topic is required');
    }

    if (input.targetDuration < 300) {
      errors.push('Duration must be at least 300 seconds (5 minutes)');
    }

    if (input.targetDuration > 1200) {
      errors.push('Duration must not exceed 1200 seconds (20 minutes)');
    }

    if (!TEMPLATE_REGISTRY.has(input.template)) {
      errors.push(`Invalid template: ${input.template}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// ==================== EXPORT ====================

export const templateEngine = new TemplateEngine();

// Export template definitions برای استفاده در جاهای دیگر
export {
  SCIENTIFIC_DISCOVERY_TEMPLATE,
  HISTORICAL_MYSTERY_TEMPLATE,
  NATURES_MARVEL_TEMPLATE
};
