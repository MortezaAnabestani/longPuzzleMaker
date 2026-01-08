/**
 * Project Wizard Component
 *
 * راهنمای گام‌به‌گام برای ساخت پروژه
 * - انتخاب Template
 * - ورود اطلاعات پروژه
 * - تولید با AI
 * - نمایش پیشرفت
 */

import React, { useState } from 'react';
import { VideoTemplate, LongVideoProject } from '../types/longVideo.types';
import { templateEngine } from '../services/templateEngine';
import { aiContentGenerator } from '../services/aiContentGenerator';
import { chapterEngine } from '../services/chapterEngine';
import { TemplateSelector } from './TemplateSelector';

// ==================== INTERFACES ====================

type WizardStep = 'template' | 'details' | 'generating' | 'complete';

interface ProjectWizardProps {
  onComplete: (project: LongVideoProject) => void;
  onCancel?: () => void;
}

interface ProjectDetails {
  topic: string;
  targetDuration: number;
  educationalLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'en' | 'fa' | 'ar';
  additionalContext?: string;
}

// ==================== COMPONENT ====================

export const ProjectWizard: React.FC<ProjectWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    topic: '',
    targetDuration: 360,
    educationalLevel: 'intermediate',
    language: 'en'
  });
  const [generatedProject, setGeneratedProject] = useState<LongVideoProject | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // ==================== HANDLERS ====================

  const handleTemplateSelect = (template: VideoTemplate) => {
    setSelectedTemplate(template);
  };

  const handleNextFromTemplate = () => {
    if (selectedTemplate) {
      setCurrentStep('details');
    }
  };

  const handleDetailsChange = (updates: Partial<ProjectDetails>) => {
    setProjectDetails(prev => ({ ...prev, ...updates }));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setCurrentStep('generating');
    setGenerationProgress(0);
    setGenerationStatus('تولید ساختار پروژه...');

    try {
      // Step 1: Generate structure
      const structure = templateEngine.generateProjectStructure({
        template: selectedTemplate,
        topic: projectDetails.topic,
        targetDuration: projectDetails.targetDuration,
        educationalLevel: projectDetails.educationalLevel,
        language: projectDetails.language,
        additionalContext: projectDetails.additionalContext
      });

      setGenerationProgress(20);
      setGenerationStatus('تولید محتوای هوشمند با AI...');

      // Step 2: Generate AI content
      const project = await aiContentGenerator.generateProjectContent(
        structure,
        {
          topic: projectDetails.topic,
          template: selectedTemplate,
          actCount: structure.acts?.length || 4,
          educationalLevel: projectDetails.educationalLevel,
          language: projectDetails.language,
          additionalContext: projectDetails.additionalContext
        }
      );

      setGenerationProgress(80);
      setGenerationStatus('هماهنگی Timeline و Transition ها...');

      // Step 3: Coordinate
      chapterEngine.coordinatePuzzleProgress(project.acts);
      chapterEngine.autoSetTransitions(project.acts);

      setGenerationProgress(100);
      setGenerationStatus('کامل شد!');

      setGeneratedProject(project);
      setCurrentStep('complete');

    } catch (error) {
      console.error('❌ [Wizard] Generation failed:', error);
      setGenerationStatus(`خطا: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleComplete = () => {
    if (generatedProject) {
      onComplete(generatedProject);
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('template');
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="project-wizard">
      {/* Progress Bar */}
      <WizardProgressBar
        steps={['قالب', 'جزئیات', 'تولید', 'تکمیل']}
        currentStepIndex={
          currentStep === 'template' ? 0 :
          currentStep === 'details' ? 1 :
          currentStep === 'generating' ? 2 : 3
        }
      />

      {/* Step Content */}
      <div className="project-wizard__content">
        {currentStep === 'template' && (
          <TemplateStep
            selectedTemplate={selectedTemplate}
            onSelect={handleTemplateSelect}
            onNext={handleNextFromTemplate}
            onCancel={onCancel}
          />
        )}

        {currentStep === 'details' && selectedTemplate && (
          <DetailsStep
            template={selectedTemplate}
            details={projectDetails}
            onChange={handleDetailsChange}
            onNext={handleGenerate}
            onBack={handleBack}
          />
        )}

        {currentStep === 'generating' && (
          <GeneratingStep
            progress={generationProgress}
            status={generationStatus}
          />
        )}

        {currentStep === 'complete' && generatedProject && (
          <CompleteStep
            project={generatedProject}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
};

// ==================== WIZARD PROGRESS BAR ====================

interface WizardProgressBarProps {
  steps: string[];
  currentStepIndex: number;
}

const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  steps,
  currentStepIndex
}) => {
  return (
    <div className="wizard-progress">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div
            className={`wizard-progress__step ${
              index === currentStepIndex ? 'wizard-progress__step--active' :
              index < currentStepIndex ? 'wizard-progress__step--completed' : ''
            }`}
          >
            <div className="wizard-progress__step-number">
              {index < currentStepIndex ? '✓' : index + 1}
            </div>
            <div className="wizard-progress__step-label">{step}</div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`wizard-progress__connector ${
                index < currentStepIndex ? 'wizard-progress__connector--completed' : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ==================== TEMPLATE STEP ====================

interface TemplateStepProps {
  selectedTemplate: VideoTemplate | null;
  onSelect: (template: VideoTemplate) => void;
  onNext: () => void;
  onCancel?: () => void;
}

const TemplateStep: React.FC<TemplateStepProps> = ({
  selectedTemplate,
  onSelect,
  onNext,
  onCancel
}) => {
  return (
    <div className="wizard-step">
      <TemplateSelector
        selectedTemplate={selectedTemplate || undefined}
        onSelect={onSelect}
      />

      <div className="wizard-step__actions">
        {onCancel && (
          <button
            className="wizard-button wizard-button--secondary"
            onClick={onCancel}
          >
            انصراف
          </button>
        )}
        <button
          className="wizard-button wizard-button--primary"
          onClick={onNext}
          disabled={!selectedTemplate}
        >
          مرحله بعد →
        </button>
      </div>
    </div>
  );
};

// ==================== DETAILS STEP ====================

interface DetailsStepProps {
  template: VideoTemplate;
  details: ProjectDetails;
  onChange: (updates: Partial<ProjectDetails>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  template,
  details,
  onChange,
  onNext,
  onBack
}) => {
  const templateConfig = templateEngine.getAvailableTemplates()
    .find(t => t.name === template);

  const isValid = details.topic.trim().length > 0;

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">جزئیات پروژه</h2>
      <p className="wizard-step__subtitle">
        قالب انتخاب شده: {templateConfig?.displayName} {templateConfig?.icon}
      </p>

      <div className="wizard-form">
        {/* Topic */}
        <div className="form-group">
          <label className="form-label">
            موضوع ویدیو <span className="required">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={details.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            placeholder="مثال: DNA Structure Discovery"
            dir="ltr"
          />
          <p className="form-help">
            موضوع اصلی که می‌خواهید در مورد آن ویدیو بسازید
          </p>
        </div>

        {/* Duration */}
        <div className="form-group">
          <label className="form-label">مدت زمان (ثانیه)</label>
          <div className="duration-selector">
            {[300, 360, 420, 480, 600].map(duration => (
              <button
                key={duration}
                className={`duration-option ${
                  details.targetDuration === duration ? 'duration-option--selected' : ''
                }`}
                onClick={() => onChange({ targetDuration: duration })}
              >
                {Math.floor(duration / 60)} دقیقه
              </button>
            ))}
          </div>
          <input
            type="range"
            className="form-range"
            min="300"
            max="1200"
            step="60"
            value={details.targetDuration}
            onChange={(e) => onChange({ targetDuration: parseInt(e.target.value) })}
          />
          <p className="form-value">{details.targetDuration} ثانیه ({Math.floor(details.targetDuration / 60)} دقیقه)</p>
        </div>

        {/* Educational Level */}
        <div className="form-group">
          <label className="form-label">سطح آموزشی</label>
          <div className="level-selector">
            <button
              className={`level-option ${
                details.educationalLevel === 'basic' ? 'level-option--selected' : ''
              }`}
              onClick={() => onChange({ educationalLevel: 'basic' })}
            >
              ساده
            </button>
            <button
              className={`level-option ${
                details.educationalLevel === 'intermediate' ? 'level-option--selected' : ''
              }`}
              onClick={() => onChange({ educationalLevel: 'intermediate' })}
            >
              متوسط
            </button>
            <button
              className={`level-option ${
                details.educationalLevel === 'advanced' ? 'level-option--selected' : ''
              }`}
              onClick={() => onChange({ educationalLevel: 'advanced' })}
            >
              پیشرفته
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="form-group">
          <label className="form-label">زبان</label>
          <div className="language-selector">
            <button
              className={`language-option ${
                details.language === 'en' ? 'language-option--selected' : ''
              }`}
              onClick={() => onChange({ language: 'en' })}
            >
              🇬🇧 English
            </button>
            <button
              className={`language-option ${
                details.language === 'fa' ? 'language-option--selected' : ''
              }`}
              onClick={() => onChange({ language: 'fa' })}
            >
              🇮🇷 فارسی
            </button>
            <button
              className={`language-option ${
                details.language === 'ar' ? 'language-option--selected' : ''
              }`}
              onClick={() => onChange({ language: 'ar' })}
            >
              🇸🇦 العربية
            </button>
          </div>
        </div>

        {/* Additional Context */}
        <div className="form-group">
          <label className="form-label">توضیحات اضافی (اختیاری)</label>
          <textarea
            className="form-textarea"
            value={details.additionalContext || ''}
            onChange={(e) => onChange({ additionalContext: e.target.value })}
            placeholder="اطلاعات یا تأکیدات خاصی که می‌خواهید AI در نظر بگیرد..."
            rows={4}
          />
        </div>

        {/* Suggested Topics */}
        {templateConfig && (
          <div className="suggested-topics-box">
            <h4>موضوعات پیشنهادی:</h4>
            <div className="suggested-topics-list">
              {templateConfig.suitableFor.map((topic, index) => (
                <button
                  key={index}
                  className="suggested-topic-btn"
                  onClick={() => onChange({ topic })}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="wizard-step__actions">
        <button
          className="wizard-button wizard-button--secondary"
          onClick={onBack}
        >
          ← مرحله قبل
        </button>
        <button
          className="wizard-button wizard-button--primary"
          onClick={onNext}
          disabled={!isValid}
        >
          تولید با AI →
        </button>
      </div>
    </div>
  );
};

// ==================== GENERATING STEP ====================

interface GeneratingStepProps {
  progress: number;
  status: string;
}

const GeneratingStep: React.FC<GeneratingStepProps> = ({
  progress,
  status
}) => {
  return (
    <div className="wizard-step wizard-step--generating">
      <div className="generating-container">
        <div className="generating-icon">
          <div className="spinner"></div>
        </div>

        <h2 className="generating-title">در حال تولید پروژه...</h2>
        <p className="generating-status">{status}</p>

        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="progress-percentage">{progress}%</p>

        <div className="generating-info">
          <p>🤖 AI در حال تولید محتوای منسجم و آموزشی</p>
          <p>📝 تولید Fact ها، روایت‌ها، و Image Prompt ها</p>
          <p>🎨 هماهنگی بصری و Timeline</p>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPLETE STEP ====================

interface CompleteStepProps {
  project: LongVideoProject;
  onComplete: () => void;
}

const CompleteStep: React.FC<CompleteStepProps> = ({
  project,
  onComplete
}) => {
  const totalFacts = project.acts.reduce((sum, act) => sum + act.facts.length, 0);
  const totalTexts = project.acts.reduce((sum, act) => sum + act.texts.length, 0);

  return (
    <div className="wizard-step wizard-step--complete">
      <div className="complete-container">
        <div className="complete-icon">✅</div>

        <h2 className="complete-title">پروژه با موفقیت ساخته شد!</h2>
        <p className="complete-subtitle">{project.title}</p>

        <div className="project-summary">
          <div className="summary-card">
            <div className="summary-card__icon">🎬</div>
            <div className="summary-card__content">
              <div className="summary-card__value">{project.acts.length}</div>
              <div className="summary-card__label">Acts</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__icon">⏱️</div>
            <div className="summary-card__content">
              <div className="summary-card__value">{Math.floor(project.totalDuration / 60)}</div>
              <div className="summary-card__label">دقیقه</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__icon">📚</div>
            <div className="summary-card__content">
              <div className="summary-card__value">{totalFacts}</div>
              <div className="summary-card__label">Facts</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__icon">💬</div>
            <div className="summary-card__content">
              <div className="summary-card__value">{totalTexts}</div>
              <div className="summary-card__label">متن</div>
            </div>
          </div>
        </div>

        <div className="acts-preview">
          <h3>Acts:</h3>
          {project.acts.map((act, index) => (
            <div key={act.id} className="act-summary">
              <div className="act-summary__header">
                <span className="act-summary__number">Act {index + 1}</span>
                <span className="act-summary__title">{act.title}</span>
                <span className="act-summary__duration">{act.duration}s</span>
              </div>
              <div className="act-summary__facts">
                {act.facts.length} facts • {act.texts.length} texts
              </div>
            </div>
          ))}
        </div>

        <button
          className="wizard-button wizard-button--primary wizard-button--large"
          onClick={onComplete}
        >
          شروع ویرایش پروژه →
        </button>
      </div>
    </div>
  );
};

export default ProjectWizard;
