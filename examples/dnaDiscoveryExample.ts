/**
 * DNA Discovery Example
 *
 * مثال کامل از تولید یک ویدیوی طولانی با Template Engine و AI
 * موضوع: کشف ساختار DNA
 */

import { templateEngine } from '../services/templateEngine';
import { aiContentGenerator } from '../services/aiContentGenerator';
import { chapterEngine } from '../services/chapterEngine';
import { TimelineManager } from '../services/timelineManager';
import { LongVideoProject } from '../types/longVideo.types';

/**
 * مثال 1: تولید ساختار پروژه بدون AI
 */
export async function exampleBasicStructure() {
  console.log('\n📋 Example 1: Generate Basic Project Structure\n');

  // ورودی کاربر
  const input = {
    template: 'SCIENTIFIC_DISCOVERY' as const,
    topic: 'DNA Structure Discovery',
    targetDuration: 360, // 6 minutes
    educationalLevel: 'intermediate' as const,
    language: 'en' as const,
    additionalContext: 'Focus on Watson, Crick, and Rosalind Franklin'
  };

  // تولید ساختار
  const projectStructure = templateEngine.generateProjectStructure(input);

  console.log('Generated Project Structure:');
  console.log(`- Title: ${projectStructure.title}`);
  console.log(`- Template: ${projectStructure.template}`);
  console.log(`- Total Duration: ${projectStructure.totalDuration}s`);
  console.log(`- Acts: ${projectStructure.acts?.length}`);
  console.log(`- Art Style: ${projectStructure.artStyle}`);
  console.log(`- Resolution: ${projectStructure.resolution}`);

  projectStructure.acts?.forEach((act, index) => {
    console.log(`\nAct ${index + 1}: ${act.title}`);
    console.log(`  - Duration: ${act.duration}s`);
    console.log(`  - Mood: ${act.mood}`);
    console.log(`  - Puzzle: ${act.puzzleConfig.startPercentage}% → ${act.puzzleConfig.endPercentage}%`);
    console.log(`  - Key Message: ${act.keyMessage}`);
  });

  return projectStructure;
}

/**
 * مثال 2: تولید محتوای کامل با AI
 */
export async function exampleFullAIGeneration() {
  console.log('\n🤖 Example 2: Generate Complete Project with AI\n');

  // ورودی
  const input = {
    template: 'SCIENTIFIC_DISCOVERY' as const,
    topic: 'DNA Structure Discovery',
    targetDuration: 360,
    educationalLevel: 'intermediate' as const,
    language: 'en' as const,
    additionalContext: 'Emphasize the collaborative nature and the X-ray crystallography breakthrough'
  };

  // 1. تولید ساختار اولیه
  console.log('Step 1: Generating project structure...');
  const projectStructure = templateEngine.generateProjectStructure(input);

  // 2. تولید محتوا با AI
  console.log('Step 2: Generating AI content for all acts...');
  const completeProject = await aiContentGenerator.generateProjectContent(
    projectStructure,
    {
      topic: input.topic,
      template: input.template,
      actCount: projectStructure.acts?.length || 4,
      educationalLevel: input.educationalLevel,
      language: input.language,
      additionalContext: input.additionalContext
    }
  );

  // 3. هماهنگی پازل و Transition ها
  console.log('Step 3: Coordinating puzzle progress and transitions...');
  chapterEngine.coordinatePuzzleProgress(completeProject.acts);
  chapterEngine.autoSetTransitions(completeProject.acts);

  // 4. ایجاد Timeline
  console.log('Step 4: Creating timeline...');
  const timeline = new TimelineManager(completeProject.acts);

  // 5. نمایش نتیجه
  console.log('\n✅ Complete Project Generated!\n');
  console.log(`Title: ${completeProject.title}`);
  console.log(`Total Duration: ${timeline.getTotalDuration()}s`);
  console.log(`Acts: ${completeProject.acts.length}\n`);

  completeProject.acts.forEach((act, index) => {
    console.log(`\n━━━ Act ${index + 1}: ${act.title} ━━━`);
    console.log(`Duration: ${act.duration}s`);
    console.log(`Mood: ${act.mood}`);
    console.log(`Puzzle: ${act.puzzleConfig.startPercentage}% → ${act.puzzleConfig.endPercentage}%`);
    console.log(`\nKey Message: ${act.keyMessage}`);
    console.log(`\nFacts (${act.facts.length}):`);
    act.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. ${fact}`);
    });
    console.log(`\nTexts (${act.texts.length}):`);
    act.texts.forEach((text, i) => {
      console.log(`  ${i + 1}. [${text.type}] at ${text.startTime}s: "${text.content.substring(0, 50)}..."`);
    });
    console.log(`\nImage Prompt: ${act.imagePrompt.substring(0, 100)}...`);
  });

  // 6. Timeline Markers
  const markers = timeline.generateMarkers();
  console.log(`\n📍 Timeline Markers: ${markers.length} total`);

  return completeProject;
}

/**
 * مثال 3: تولید تنها یک Act با AI
 */
export async function exampleSingleAct() {
  console.log('\n🎬 Example 3: Generate Single Act with AI\n');

  const actContent = await aiContentGenerator.generateActContent({
    actTitle: 'The Mystery of DNA',
    actMood: 'mystery',
    keyMessage: 'What is DNA and why was its structure unknown?',
    duration: 90,
    factCount: 4,
    topic: 'DNA Structure Discovery',
    template: 'SCIENTIFIC_DISCOVERY',
    educationalLevel: 'intermediate',
    language: 'en',
    context: 'Focus on the pre-1953 era when DNA structure was a mystery'
  });

  console.log('Generated Act Content:\n');
  console.log('Facts:');
  actContent.facts.forEach((fact, i) => {
    console.log(`  ${i + 1}. ${fact}`);
  });

  console.log('\nNarrative Texts:');
  console.log(`  Opening: ${actContent.narrativeTexts.opening}`);
  console.log(`  Middle: ${actContent.narrativeTexts.middle}`);
  console.log(`  Closing: ${actContent.narrativeTexts.closing}`);

  console.log(`\nImage Prompt:\n${actContent.imagePromptEnhanced}`);

  if (actContent.stats && actContent.stats.length > 0) {
    console.log('\nStats:');
    actContent.stats.forEach(stat => {
      console.log(`  - ${stat.label}: ${stat.value}`);
    });
  }

  if (actContent.quotes && actContent.quotes.length > 0) {
    console.log('\nQuotes:');
    actContent.quotes.forEach(quote => {
      console.log(`  "${quote}"`);
    });
  }

  return actContent;
}

/**
 * مثال 4: Validation و Statistics
 */
export async function exampleValidation() {
  console.log('\n✅ Example 4: Validation and Statistics\n');

  // تولید پروژه
  const input = {
    template: 'SCIENTIFIC_DISCOVERY' as const,
    topic: 'DNA Structure Discovery',
    targetDuration: 360,
    educationalLevel: 'basic' as const,
    language: 'en' as const
  };

  // بررسی Validation ورودی
  const validation = templateEngine.validateInput(input);
  console.log('Input Validation:');
  console.log(`  Valid: ${validation.isValid}`);
  if (!validation.isValid) {
    console.log('  Errors:', validation.errors);
  }

  // تولید پروژه
  const project = templateEngine.generateProjectStructure(input);

  // Validation هر Act
  console.log('\nAct Validations:');
  project.acts?.forEach((act, index) => {
    const actValidation = chapterEngine.validateAct(act as any);
    console.log(`\nAct ${index + 1}: ${act.title}`);
    console.log(`  Valid: ${actValidation.isValid}`);
    if (actValidation.errors.length > 0) {
      console.log('  Errors:', actValidation.errors);
    }
    if (actValidation.warnings.length > 0) {
      console.log('  Warnings:', actValidation.warnings);
    }

    // آمار Act
    const stats = chapterEngine.getActStats(act as any);
    console.log('  Stats:');
    console.log(`    - Total Texts: ${stats.totalTexts}`);
    console.log(`    - Text Duration: ${stats.textDuration}s`);
    console.log(`    - Empty Duration: ${stats.emptyDuration}s`);
    console.log(`    - Puzzle Progress: ${stats.puzzleProgress}%`);
    console.log(`    - Fact Count: ${stats.factCount}`);
  });
}

/**
 * مثال 5: Timeline Navigation
 */
export async function exampleTimelineNavigation() {
  console.log('\n⏱️ Example 5: Timeline Navigation\n');

  // تولید پروژه ساده
  const project = templateEngine.generateProjectStructure({
    template: 'SCIENTIFIC_DISCOVERY',
    topic: 'DNA Discovery',
    targetDuration: 360,
    educationalLevel: 'intermediate',
    language: 'en'
  });

  const timeline = new TimelineManager(project.acts as any);

  console.log(`Total Duration: ${timeline.getTotalDuration()}s`);
  console.log(`Total Acts: ${timeline.getActs().length}\n`);

  // Simulate playback
  console.log('Simulating playback:\n');

  // Start
  timeline.play();
  console.log(`▶️  Playing from ${timeline.getState().currentTime}s`);

  // Seek to middle
  timeline.seek(180);
  const actAt180 = timeline.getActAtTime(180);
  console.log(`⏩ Seeked to 180s - Current Act: "${actAt180?.act.title}"`);

  // Next act
  timeline.nextAct();
  console.log(`⏭️  Next Act: "${timeline.getCurrentAct()?.title}"`);

  // Previous act
  timeline.previousAct();
  console.log(`⏮️  Previous Act: "${timeline.getCurrentAct()?.title}"`);

  // Get progress
  console.log(`\n📊 Progress: ${timeline.getProgress().toFixed(1)}%`);

  // Export timeline
  const exported = timeline.export();
  console.log(`\n📦 Exported Timeline:`);
  console.log(`   - Total Duration: ${exported.totalDuration}s`);
  console.log(`   - Act Count: ${exported.actCount}`);
  console.log(`   - Markers: ${exported.markers.length}`);
  console.log(`   - Ranges: ${exported.ranges.length}`);
}

/**
 * مثال 6: Template Comparison
 */
export async function exampleTemplateComparison() {
  console.log('\n🎨 Example 6: Template Comparison\n');

  const templates = templateEngine.getAvailableTemplates();

  console.log(`Available Templates: ${templates.length}\n`);

  templates.forEach(template => {
    console.log(`━━━ ${template.displayName} ${template.icon} ━━━`);
    console.log(`Description: ${template.description}`);
    console.log(`Default Duration: ${template.defaultDuration}s (${Math.floor(template.defaultDuration / 60)} minutes)`);
    console.log(`Acts: ${template.defaultActCount}`);
    console.log(`Suitable Topics: ${template.suitableFor.slice(0, 3).join(', ')}, ...`);
    console.log();
  });
}

/**
 * اجرای تمام مثال‌ها
 */
export async function runAllExamples() {
  try {
    await exampleBasicStructure();
    await exampleTemplateComparison();
    await exampleValidation();
    await exampleTimelineNavigation();

    // Examples نیازمند API Key
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Following examples require ANTHROPIC_API_KEY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (process.env.ANTHROPIC_API_KEY) {
      await exampleSingleAct();
      await exampleFullAIGeneration();
    } else {
      console.log('Skipping AI examples (no API key found)');
    }

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// اگر به صورت مستقیم اجرا شود
if (require.main === module) {
  runAllExamples();
}
