/**
 * Template Selector Component
 *
 * انتخاب Template برای ویدیوی طولانی
 * - نمایش کارت‌های Template
 * - پیش‌نمایش ویژگی‌ها
 * - انتخاب و تأیید
 */

import React, { useState, useEffect } from 'react';
import { VideoTemplate, TemplateConfig } from '../types/longVideo.types';
import { templateEngine } from '../services/templateEngine';

// ==================== INTERFACES ====================

interface TemplateSelectorProps {
  onSelect: (template: VideoTemplate) => void;
  selectedTemplate?: VideoTemplate;
}

// ==================== COMPONENT ====================

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  selectedTemplate
}) => {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [hoveredTemplate, setHoveredTemplate] = useState<VideoTemplate | null>(null);

  useEffect(() => {
    const availableTemplates = templateEngine.getAvailableTemplates();
    setTemplates(availableTemplates);
  }, []);

  const handleTemplateClick = (template: VideoTemplate) => {
    onSelect(template);
  };

  return (
    <div className="template-selector">
      <div className="template-selector__header">
        <h2 className="template-selector__title">انتخاب قالب ویدیو</h2>
        <p className="template-selector__subtitle">
          قالبی را انتخاب کنید که با موضوع شما مناسب است
        </p>
      </div>

      <div className="template-selector__grid">
        {templates.map((template) => (
          <TemplateCard
            key={template.name}
            template={template}
            isSelected={selectedTemplate === template.name}
            isHovered={hoveredTemplate === template.name}
            onClick={() => handleTemplateClick(template.name)}
            onMouseEnter={() => setHoveredTemplate(template.name)}
            onMouseLeave={() => setHoveredTemplate(null)}
          />
        ))}
      </div>

      {selectedTemplate && (
        <div className="template-selector__selected-info">
          <TemplateDetailPanel
            template={templates.find(t => t.name === selectedTemplate)!}
          />
        </div>
      )}
    </div>
  );
};

// ==================== TEMPLATE CARD ====================

interface TemplateCardProps {
  template: TemplateConfig;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      className={`template-card ${isSelected ? 'template-card--selected' : ''} ${isHovered ? 'template-card--hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="template-card__icon">
        {template.icon}
      </div>

      <div className="template-card__content">
        <h3 className="template-card__name">{template.displayName}</h3>
        <p className="template-card__description">{template.description}</p>

        <div className="template-card__meta">
          <div className="template-card__meta-item">
            <span className="template-card__meta-label">مدت زمان:</span>
            <span className="template-card__meta-value">
              {Math.floor(template.defaultDuration / 60)} دقیقه
            </span>
          </div>
          <div className="template-card__meta-item">
            <span className="template-card__meta-label">فصل‌ها:</span>
            <span className="template-card__meta-value">
              {template.defaultActCount} Act
            </span>
          </div>
        </div>

        <div className="template-card__topics">
          <span className="template-card__topics-label">مناسب برای:</span>
          <div className="template-card__topics-list">
            {template.suitableFor.slice(0, 3).map((topic, index) => (
              <span key={index} className="template-card__topic-tag">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="template-card__checkmark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
};

// ==================== TEMPLATE DETAIL PANEL ====================

interface TemplateDetailPanelProps {
  template: TemplateConfig;
}

const TemplateDetailPanel: React.FC<TemplateDetailPanelPanelProps> = ({ template }) => {
  const templateDefinition = templateEngine.getTemplate(template.name);

  if (!templateDefinition) return null;

  return (
    <div className="template-detail">
      <h3 className="template-detail__title">
        {template.icon} {template.displayName}
      </h3>

      <div className="template-detail__info">
        <div className="template-detail__section">
          <h4 className="template-detail__section-title">ساختار داستان</h4>
          <div className="template-detail__story-arc">
            <div className="story-arc__step">
              <div className="story-arc__step-number">1</div>
              <div className="story-arc__step-content">
                <strong>Opening:</strong> {templateDefinition.storyArc.opening}
              </div>
            </div>
            <div className="story-arc__arrow">→</div>
            <div className="story-arc__step">
              <div className="story-arc__step-number">2</div>
              <div className="story-arc__step-content">
                <strong>Rising:</strong> {templateDefinition.storyArc.rising}
              </div>
            </div>
            <div className="story-arc__arrow">→</div>
            <div className="story-arc__step">
              <div className="story-arc__step-number">3</div>
              <div className="story-arc__step-content">
                <strong>Climax:</strong> {templateDefinition.storyArc.climax}
              </div>
            </div>
            <div className="story-arc__arrow">→</div>
            <div className="story-arc__step">
              <div className="story-arc__step-number">4</div>
              <div className="story-arc__step-content">
                <strong>Resolution:</strong> {templateDefinition.storyArc.resolution}
              </div>
            </div>
          </div>
        </div>

        <div className="template-detail__section">
          <h4 className="template-detail__section-title">Acts</h4>
          <div className="template-detail__acts">
            {templateDefinition.acts.map((act, index) => (
              <div key={index} className="act-preview">
                <div className="act-preview__header">
                  <span className="act-preview__number">Act {index + 1}</span>
                  <span className="act-preview__title">{act.title}</span>
                  <span className="act-preview__mood">{act.mood}</span>
                </div>
                <div className="act-preview__facts">
                  {act.factCount} Facts
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="template-detail__section">
          <h4 className="template-detail__section-title">سبک بصری</h4>
          <div className="template-detail__visual">
            <div className="visual-info">
              <strong>Art Style:</strong> {templateDefinition.artStyle}
            </div>
            <div className="visual-info">
              <strong>Color Palette:</strong>
              <div className="color-palette">
                {templateDefinition.colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="visual-info">
              <strong>Music Mood:</strong> {templateDefinition.musicMood}
            </div>
          </div>
        </div>

        <div className="template-detail__section">
          <h4 className="template-detail__section-title">موضوعات پیشنهادی</h4>
          <div className="template-detail__suggested-topics">
            {template.suitableFor.map((topic, index) => (
              <span key={index} className="suggested-topic">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fix typo
const TemplateDetailPanelPanel = TemplateDetailPanel;

export default TemplateSelector;
