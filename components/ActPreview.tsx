/**
 * Act Preview Component
 *
 * نمایش جزئیات یک Act
 * - Facts
 * - Texts با Timeline
 * - Image Prompt
 * - Puzzle Configuration
 */

import React, { useState } from 'react';
import { VideoAct, TextOverlay } from '../types/longVideo.types';
import { chapterEngine } from '../services/chapterEngine';

// ==================== INTERFACES ====================

interface ActPreviewProps {
  act: VideoAct;
  actIndex: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// ==================== COMPONENT ====================

export const ActPreview: React.FC<ActPreviewProps> = ({
  act,
  actIndex,
  isExpanded = false,
  onToggleExpand
}) => {
  const stats = chapterEngine.getActStats(act);

  return (
    <div className={`act-preview-card ${isExpanded ? 'act-preview-card--expanded' : ''}`}>
      {/* Header */}
      <div className="act-preview-card__header" onClick={onToggleExpand}>
        <div className="act-preview-card__number">
          Act {actIndex + 1}
        </div>

        <div className="act-preview-card__title-section">
          <h3 className="act-preview-card__title">{act.title}</h3>
          <p className="act-preview-card__message">{act.keyMessage}</p>
        </div>

        <div className="act-preview-card__meta">
          <div className="meta-badge">
            <span className="meta-badge__icon">⏱️</span>
            <span className="meta-badge__value">{act.duration}s</span>
          </div>
          <div className="meta-badge">
            <span className="meta-badge__icon">🎭</span>
            <span className="meta-badge__value">{act.mood}</span>
          </div>
          <div className="meta-badge">
            <span className="meta-badge__icon">📚</span>
            <span className="meta-badge__value">{stats.factCount}</span>
          </div>
        </div>

        {onToggleExpand && (
          <button className="act-preview-card__expand-btn">
            {isExpanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="act-preview-card__content">
          {/* Puzzle Progress */}
          <ActPuzzleSection puzzleConfig={act.puzzleConfig} />

          {/* Facts */}
          <ActFactsSection facts={act.facts} />

          {/* Texts Timeline */}
          <ActTextsTimeline
            texts={act.texts}
            actDuration={act.duration}
          />

          {/* Visual Info */}
          <ActVisualSection
            artStyle={act.artStyle}
            imagePrompt={act.imagePrompt}
            colorGrading={act.colorGrading}
          />

          {/* Audio Info */}
          <ActAudioSection
            musicMood={act.musicMood}
            soundEffects={act.soundEffects}
          />
        </div>
      )}
    </div>
  );
};

// ==================== PUZZLE SECTION ====================

interface ActPuzzleSectionProps {
  puzzleConfig: VideoAct['puzzleConfig'];
}

const ActPuzzleSection: React.FC<ActPuzzleSectionProps> = ({ puzzleConfig }) => {
  return (
    <div className="act-section">
      <h4 className="act-section__title">🧩 پیشرفت پازل</h4>

      <div className="puzzle-progress-bar">
        <div
          className="puzzle-progress-bar__fill puzzle-progress-bar__fill--start"
          style={{ width: `${puzzleConfig.startPercentage}%` }}
        />
        <div
          className="puzzle-progress-bar__fill puzzle-progress-bar__fill--current"
          style={{
            width: `${puzzleConfig.endPercentage - puzzleConfig.startPercentage}%`,
            marginLeft: `${puzzleConfig.startPercentage}%`
          }}
        />
      </div>

      <div className="puzzle-info">
        <div className="puzzle-info__item">
          <span className="label">شروع:</span>
          <span className="value">{puzzleConfig.startPercentage}%</span>
        </div>
        <div className="puzzle-info__item">
          <span className="label">پایان:</span>
          <span className="value">{puzzleConfig.endPercentage}%</span>
        </div>
        <div className="puzzle-info__item">
          <span className="label">قطعات:</span>
          <span className="value">{puzzleConfig.pieceCount}</span>
        </div>
        <div className="puzzle-info__item">
          <span className="label">سرعت:</span>
          <span className="value">{puzzleConfig.animationSpeed}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== FACTS SECTION ====================

interface ActFactsSectionProps {
  facts: string[];
}

const ActFactsSection: React.FC<ActFactsSectionProps> = ({ facts }) => {
  return (
    <div className="act-section">
      <h4 className="act-section__title">📚 حقایق علمی</h4>

      <div className="facts-list">
        {facts.map((fact, index) => (
          <div key={index} className="fact-item">
            <div className="fact-item__number">{index + 1}</div>
            <div className="fact-item__content">{fact}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== TEXTS TIMELINE ====================

interface ActTextsTimelineProps {
  texts: TextOverlay[];
  actDuration: number;
}

const ActTextsTimeline: React.FC<ActTextsTimelineProps> = ({
  texts,
  actDuration
}) => {
  const [hoveredTextId, setHoveredTextId] = useState<string | null>(null);

  const sortedTexts = [...texts].sort((a, b) => a.startTime - b.startTime);

  return (
    <div className="act-section">
      <h4 className="act-section__title">💬 متن‌ها</h4>

      {/* Timeline Visual */}
      <div className="texts-timeline">
        <div className="texts-timeline__track">
          {sortedTexts.map((text) => {
            const leftPercent = (text.startTime / actDuration) * 100;
            const widthPercent = (text.duration / actDuration) * 100;

            return (
              <div
                key={text.id}
                className={`texts-timeline__block texts-timeline__block--${text.type} ${
                  hoveredTextId === text.id ? 'texts-timeline__block--hovered' : ''
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`
                }}
                onMouseEnter={() => setHoveredTextId(text.id)}
                onMouseLeave={() => setHoveredTextId(null)}
                title={text.content}
              >
                <div className="texts-timeline__block-label">
                  {text.type}
                </div>
              </div>
            );
          })}
        </div>

        <div className="texts-timeline__markers">
          <span>0s</span>
          <span>{Math.floor(actDuration / 2)}s</span>
          <span>{actDuration}s</span>
        </div>
      </div>

      {/* Text List */}
      <div className="texts-list">
        {sortedTexts.map((text, index) => (
          <TextItem
            key={text.id}
            text={text}
            index={index}
            isHovered={hoveredTextId === text.id}
            onHover={() => setHoveredTextId(text.id)}
            onUnhover={() => setHoveredTextId(null)}
          />
        ))}
      </div>
    </div>
  );
};

// ==================== TEXT ITEM ====================

interface TextItemProps {
  text: TextOverlay;
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}

const TextItem: React.FC<TextItemProps> = ({
  text,
  index,
  isHovered,
  onHover,
  onUnhover
}) => {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'title': '🎬',
      'fact': '📌',
      'narration': '📖',
      'question': '❓',
      'stat': '📊',
      'quote': '💬'
    };
    return icons[type] || '💬';
  };

  return (
    <div
      className={`text-item ${isHovered ? 'text-item--hovered' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onUnhover}
    >
      <div className="text-item__header">
        <span className="text-item__icon">{getTypeIcon(text.type)}</span>
        <span className="text-item__type">{text.type}</span>
        <span className="text-item__timing">
          {text.startTime}s - {text.startTime + text.duration}s
        </span>
        <span className="text-item__position">{text.position}</span>
        <span className="text-item__animation">{text.animation}</span>
      </div>
      <div className="text-item__content">{text.content}</div>
    </div>
  );
};

// ==================== VISUAL SECTION ====================

interface ActVisualSectionProps {
  artStyle: string;
  imagePrompt: string;
  colorGrading?: string;
}

const ActVisualSection: React.FC<ActVisualSectionProps> = ({
  artStyle,
  imagePrompt,
  colorGrading
}) => {
  return (
    <div className="act-section">
      <h4 className="act-section__title">🎨 بصری</h4>

      <div className="visual-info">
        <div className="visual-info__row">
          <span className="visual-info__label">Art Style:</span>
          <span className="visual-info__value">{artStyle}</span>
        </div>

        {colorGrading && (
          <div className="visual-info__row">
            <span className="visual-info__label">Color Grading:</span>
            <span className="visual-info__value">{colorGrading}</span>
          </div>
        )}

        <div className="visual-info__row visual-info__row--full">
          <span className="visual-info__label">Image Prompt:</span>
          <div className="image-prompt">
            {imagePrompt}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== AUDIO SECTION ====================

interface ActAudioSectionProps {
  musicMood: string;
  soundEffects?: string[];
}

const ActAudioSection: React.FC<ActAudioSectionProps> = ({
  musicMood,
  soundEffects
}) => {
  return (
    <div className="act-section">
      <h4 className="act-section__title">🎵 صدا</h4>

      <div className="audio-info">
        <div className="audio-info__row">
          <span className="audio-info__label">Music Mood:</span>
          <span className="audio-info__value">{musicMood}</span>
        </div>

        {soundEffects && soundEffects.length > 0 && (
          <div className="audio-info__row">
            <span className="audio-info__label">Sound Effects:</span>
            <div className="sound-effects-list">
              {soundEffects.map((effect, index) => (
                <span key={index} className="sound-effect-tag">
                  {effect}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActPreview;
