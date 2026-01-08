/**
 * AI Content Generator
 *
 * تولید محتوای هوشمند برای ویدیوهای طولانی
 * - تولید Fact های منسجم و مرتبط
 * - تولید متن‌های روایی
 * - تولید Image Prompt های دقیق
 * - هماهنگی محتوا بین Act ها
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  VideoAct,
  LongVideoProject,
  VideoTemplate,
  TextOverlay,
  ActMood
} from '../types/longVideo.types';

// ==================== INTERFACES ====================

/**
 * درخواست تولید محتوا برای یک Act
 */
export interface ActContentRequest {
  actTitle: string;
  actMood: ActMood;
  keyMessage: string;
  duration: number;
  factCount: number;
  topic: string;
  template: VideoTemplate;
  educationalLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'en' | 'fa' | 'ar';
  previousActSummary?: string; // خلاصه Act قبلی برای انسجام
  context?: string;
}

/**
 * نتیجه تولید محتوا
 */
export interface ActContentResult {
  facts: string[];
  narrativeTexts: {
    opening?: string;
    middle?: string;
    closing?: string;
  };
  imagePromptEnhanced: string;
  stats?: Array<{
    label: string;
    value: string;
  }>;
  quotes?: string[];
}

/**
 * درخواست تولید پروژه کامل
 */
export interface ProjectContentRequest {
  topic: string;
  template: VideoTemplate;
  actCount: number;
  educationalLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'en' | 'fa' | 'ar';
  additionalContext?: string;
}

// ==================== AI CONTENT GENERATOR ====================

export class AIContentGenerator {
  private client: Anthropic;
  private model: string = 'claude-sonnet-4-5-20250929';

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * تولید محتوا برای یک Act
   */
  async generateActContent(request: ActContentRequest): Promise<ActContentResult> {
    console.log(`🤖 [AI] Generating content for Act: "${request.actTitle}"`);

    const prompt = this.buildActPrompt(request);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from API');
      }

      const result = this.parseActContent(content.text, request);
      console.log(`✅ [AI] Generated ${result.facts.length} facts for "${request.actTitle}"`);

      return result;

    } catch (error) {
      console.error(`❌ [AI] Error generating content:`, error);
      throw error;
    }
  }

  /**
   * تولید محتوا برای پروژه کامل (تمام Act ها)
   */
  async generateProjectContent(
    project: Partial<LongVideoProject>,
    request: ProjectContentRequest
  ): Promise<LongVideoProject> {
    console.log(`🤖 [AI] Generating complete project content for: "${request.topic}"`);

    const acts = project.acts || [];
    const enrichedActs: VideoAct[] = [];
    let previousSummary = '';

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];
      console.log(`   Processing Act ${i + 1}/${acts.length}: "${act.title}"`);

      // تولید محتوا برای Act
      const actContent = await this.generateActContent({
        actTitle: act.title || `Act ${i + 1}`,
        actMood: act.mood || 'curiosity',
        keyMessage: act.keyMessage || '',
        duration: act.duration || 90,
        factCount: this.getFactCountForAct(i, acts.length),
        topic: request.topic,
        template: request.template,
        educationalLevel: request.educationalLevel,
        language: request.language,
        previousActSummary: previousSummary,
        context: request.additionalContext
      });

      // به‌روزرسانی Act با محتوای تولید شده
      const enrichedAct: VideoAct = {
        ...act,
        id: act.id || `act_${Date.now()}_${i}`,
        facts: actContent.facts,
        imagePrompt: actContent.imagePromptEnhanced,
        texts: this.generateTextsFromContent(act, actContent),
        createdAt: new Date(),
        updatedAt: new Date()
      } as VideoAct;

      enrichedActs.push(enrichedAct);

      // ذخیره خلاصه برای Act بعدی
      previousSummary = this.summarizeAct(enrichedAct);

      // کمی تأخیر برای Rate Limit
      if (i < acts.length - 1) {
        await this.delay(1000);
      }
    }

    // تکمیل پروژه
    const completeProject: LongVideoProject = {
      ...project,
      id: project.id || `project_${Date.now()}`,
      acts: enrichedActs,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    } as LongVideoProject;

    console.log(`✅ [AI] Complete project generated with ${enrichedActs.length} acts`);
    return completeProject;
  }

  /**
   * بهبود Image Prompt
   */
  async enhanceImagePrompt(
    basePrompt: string,
    artStyle: string,
    mood: ActMood
  ): Promise<string> {
    const prompt = `You are an expert at creating detailed, artistic image generation prompts.

Base prompt: "${basePrompt}"
Art style: ${artStyle}
Mood: ${mood}

Enhance this prompt to create a stunning, detailed image for an educational puzzle video.
Include:
- Detailed visual elements
- Color palette appropriate for the mood
- Artistic techniques specific to the art style
- Composition and framing
- Lighting and atmosphere

Return ONLY the enhanced prompt, nothing else.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 300,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      return basePrompt;

    } catch (error) {
      console.warn(`⚠️ [AI] Failed to enhance image prompt:`, error);
      return basePrompt;
    }
  }

  /**
   * ساخت Prompt برای تولید محتوای Act
   */
  private buildActPrompt(request: ActContentRequest): string {
    const languageInstructions = {
      'en': 'Write in English.',
      'fa': 'Write in Persian (Farsi). Use proper Persian grammar and vocabulary.',
      'ar': 'Write in Arabic. Use proper Arabic grammar and vocabulary.'
    };

    const levelInstructions = {
      'basic': 'Use simple language suitable for general audience. Avoid technical jargon.',
      'intermediate': 'Use moderately technical language. Explain complex terms when used.',
      'advanced': 'Use technical and scientific language appropriate for educated audience.'
    };

    const moodInstructions: Record<ActMood, string> = {
      'mystery': 'Create intrigue and curiosity. Use questions and mysterious language.',
      'curiosity': 'Encourage wonder and exploration. Use engaging, inquisitive tone.',
      'tension': 'Build suspense and anticipation. Use dramatic language.',
      'excitement': 'Create energy and enthusiasm. Use dynamic, vivid language.',
      'breakthrough': 'Convey discovery and revelation. Use triumphant language.',
      'triumph': 'Celebrate success and achievement. Use victorious language.',
      'satisfaction': 'Provide closure and reflection. Use contemplative language.'
    };

    return `You are creating educational content for a puzzle video about: "${request.topic}"

Act Title: ${request.actTitle}
Act Mood: ${request.actMood}
Key Message: ${request.keyMessage}
Duration: ${request.duration} seconds
Educational Level: ${request.educationalLevel}

${languageInstructions[request.language]}
${levelInstructions[request.educationalLevel]}
${moodInstructions[request.actMood]}

${request.previousActSummary ? `Previous Act Summary: ${request.previousActSummary}` : ''}
${request.context ? `Additional Context: ${request.context}` : ''}

Generate content in this EXACT format:

FACTS:
1. [First fact - 1-2 sentences, interesting and educational]
2. [Second fact - 1-2 sentences]
3. [Third fact - 1-2 sentences]
${request.factCount > 3 ? '4. [Fourth fact - 1-2 sentences]' : ''}
${request.factCount > 4 ? '5. [Fifth fact - 1-2 sentences]' : ''}

NARRATIVE_OPENING:
[One sentence to open this act - set the mood and introduce the theme]

NARRATIVE_MIDDLE:
[One sentence for the middle of the act - develop the story]

NARRATIVE_CLOSING:
[One sentence to close this act - transition or conclude]

IMAGE_PROMPT:
[Enhanced, detailed image generation prompt incorporating the art style and mood]

${request.actMood === 'breakthrough' || request.actTitle.includes('Impact') ? `
STATS:
- [Statistic 1]: [Value]
- [Statistic 2]: [Value]
` : ''}

${request.actMood === 'triumph' || request.actMood === 'satisfaction' ? `
QUOTE:
"[Memorable quote related to the topic]" - [Attribution]
` : ''}

Requirements:
- Facts must be accurate, interesting, and appropriate for ${request.educationalLevel} level
- Facts should build on each other to tell a coherent story within this act
- Narrative text should match the ${request.actMood} mood
- Image prompt should be detailed and artistic
- All content must relate to: ${request.topic}
`;
  }

  /**
   * Parse کردن نتیجه AI
   */
  private parseActContent(text: string, request: ActContentRequest): ActContentResult {
    const result: ActContentResult = {
      facts: [],
      narrativeTexts: {},
      imagePromptEnhanced: '',
      stats: [],
      quotes: []
    };

    // Extract facts
    const factsMatch = text.match(/FACTS:([\s\S]*?)(?=NARRATIVE_OPENING:|$)/);
    if (factsMatch) {
      const factsText = factsMatch[1];
      const factLines = factsText
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);

      result.facts = factLines.slice(0, request.factCount);
    }

    // Extract narratives
    const openingMatch = text.match(/NARRATIVE_OPENING:\s*\n([^\n]+)/);
    if (openingMatch) {
      result.narrativeTexts.opening = openingMatch[1].trim();
    }

    const middleMatch = text.match(/NARRATIVE_MIDDLE:\s*\n([^\n]+)/);
    if (middleMatch) {
      result.narrativeTexts.middle = middleMatch[1].trim();
    }

    const closingMatch = text.match(/NARRATIVE_CLOSING:\s*\n([^\n]+)/);
    if (closingMatch) {
      result.narrativeTexts.closing = closingMatch[1].trim();
    }

    // Extract image prompt
    const imageMatch = text.match(/IMAGE_PROMPT:\s*\n([\s\S]*?)(?=STATS:|QUOTE:|$)/);
    if (imageMatch) {
      result.imagePromptEnhanced = imageMatch[1].trim();
    }

    // Extract stats
    const statsMatch = text.match(/STATS:([\s\S]*?)(?=QUOTE:|$)/);
    if (statsMatch) {
      const statsText = statsMatch[1];
      const statLines = statsText
        .split('\n')
        .filter(line => line.includes(':'))
        .map(line => {
          const [label, value] = line.split(':').map(s => s.trim().replace(/^-\s*/, ''));
          return { label, value };
        });

      result.stats = statLines;
    }

    // Extract quote
    const quoteMatch = text.match(/QUOTE:\s*\n"([^"]+)"\s*-\s*(.+)/);
    if (quoteMatch) {
      result.quotes = [`"${quoteMatch[1]}" - ${quoteMatch[2]}`];
    }

    return result;
  }

  /**
   * تولید TextOverlay ها از محتوای تولید شده
   */
  private generateTextsFromContent(
    act: Partial<VideoAct>,
    content: ActContentResult
  ): TextOverlay[] {
    const texts: TextOverlay[] = [];
    const duration = act.duration || 90;
    let currentTime = 0;

    // Opening narrative
    if (content.narrativeTexts.opening) {
      texts.push({
        id: `text_${Date.now()}_opening`,
        content: content.narrativeTexts.opening,
        startTime: 3,
        duration: 5,
        type: 'narration',
        position: 'bottom',
        animation: 'fade',
        style: this.getDefaultTextStyle('narration')
      });
      currentTime = 10;
    }

    // Facts
    const factInterval = (duration - 20) / content.facts.length;
    content.facts.forEach((fact, index) => {
      texts.push({
        id: `text_${Date.now()}_fact_${index}`,
        content: fact,
        startTime: currentTime + (index * factInterval),
        duration: 5,
        type: 'fact',
        position: 'bottom',
        animation: 'slide-up',
        style: this.getDefaultTextStyle('fact')
      });
    });

    // Middle narrative
    if (content.narrativeTexts.middle) {
      texts.push({
        id: `text_${Date.now()}_middle`,
        content: content.narrativeTexts.middle,
        startTime: duration / 2,
        duration: 6,
        type: 'narration',
        position: 'center',
        animation: 'fade',
        style: this.getDefaultTextStyle('narration')
      });
    }

    // Stats
    if (content.stats && content.stats.length > 0) {
      content.stats.forEach((stat, index) => {
        texts.push({
          id: `text_${Date.now()}_stat_${index}`,
          content: `${stat.label}: ${stat.value}`,
          startTime: duration - 25 + (index * 8),
          duration: 6,
          type: 'stat',
          position: 'center',
          animation: 'reveal',
          style: this.getDefaultTextStyle('stat')
        });
      });
    }

    // Quote
    if (content.quotes && content.quotes.length > 0) {
      texts.push({
        id: `text_${Date.now()}_quote`,
        content: content.quotes[0],
        startTime: duration - 15,
        duration: 8,
        type: 'quote',
        position: 'center',
        animation: 'fade',
        style: this.getDefaultTextStyle('quote')
      });
    }

    // Closing narrative
    if (content.narrativeTexts.closing) {
      texts.push({
        id: `text_${Date.now()}_closing`,
        content: content.narrativeTexts.closing,
        startTime: duration - 8,
        duration: 5,
        type: 'narration',
        position: 'bottom',
        animation: 'fade',
        style: this.getDefaultTextStyle('narration')
      });
    }

    return texts;
  }

  /**
   * دریافت Style پیش‌فرض برای هر نوع متن
   */
  private getDefaultTextStyle(type: string): TextOverlay['style'] {
    const styles: Record<string, TextOverlay['style']> = {
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

    return styles[type] || styles['fact'];
  }

  /**
   * محاسبه تعداد Fact ها برای هر Act
   */
  private getFactCountForAct(actIndex: number, totalActs: number): number {
    // Act اول: 3 facts (مقدمه)
    // Act های میانی: 4-5 facts
    // Act آخر: 4 facts (نتیجه‌گیری)

    if (actIndex === 0) return 3;
    if (actIndex === totalActs - 1) return 4;
    return 5;
  }

  /**
   * خلاصه کردن یک Act برای استفاده در Act بعدی
   */
  private summarizeAct(act: VideoAct): string {
    const factsSummary = act.facts.slice(0, 2).join(' ');
    return `${act.title}: ${act.keyMessage}. ${factsSummary}`;
  }

  /**
   * تأخیر برای Rate Limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * تولید عنوان جذاب برای یوتیوب
   */
  async generateYouTubeTitle(topic: string, template: VideoTemplate): Promise<string> {
    const prompt = `Generate a compelling, clickable YouTube title for an educational puzzle video about: "${topic}"

Template type: ${template}

Requirements:
- Maximum 60 characters
- Must be intriguing and clickable
- Should hint at the educational content
- Can use emojis if appropriate
- Should match the mystery/discovery theme

Return ONLY the title, nothing else.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 100,
        temperature: 0.9,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      return topic;

    } catch (error) {
      console.warn(`⚠️ [AI] Failed to generate title:`, error);
      return topic;
    }
  }

  /**
   * تولید توضیحات یوتیوب
   */
  async generateYouTubeDescription(project: LongVideoProject): Promise<string> {
    const facts = project.acts.flatMap(act => act.facts).slice(0, 5);

    const prompt = `Generate a YouTube video description for an educational puzzle video.

Title: ${project.title}
Facts covered:
${facts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Requirements:
- 2-3 paragraphs
- Engaging and educational
- Include key facts
- Encourage viewers to like and subscribe
- Maximum 300 words

Return ONLY the description, nothing else.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      return project.description;

    } catch (error) {
      console.warn(`⚠️ [AI] Failed to generate description:`, error);
      return project.description;
    }
  }
}

// ==================== EXPORT ====================

export const aiContentGenerator = new AIContentGenerator();
