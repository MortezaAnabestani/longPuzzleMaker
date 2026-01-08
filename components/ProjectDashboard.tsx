/**
 * Project Dashboard Component
 *
 * صفحه اصلی مدیریت پروژه
 * - نمایش اطلاعات کلی
 * - لیست Acts
 * - Timeline
 * - دکمه‌های عملیاتی
 */

import React, { useState } from 'react';
import { LongVideoProject, VideoAct } from '../types/longVideo.types';
import { TimelineManager } from '../services/timelineManager';
import { ActPreview } from './ActPreview';
import { TimelineView } from './TimelineView';

// ==================== INTERFACES ====================

interface ProjectDashboardProps {
  project: LongVideoProject;
  onExport?: () => void;
  onRegenerate?: () => void;
  onBack?: () => void;
}

// ==================== COMPONENT ====================

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onExport,
  onRegenerate,
  onBack
}) => {
  const [expandedActId, setExpandedActId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeline] = useState(() => new TimelineManager(project.acts));

  const totalFacts = project.acts.reduce((sum, act) => sum + act.facts.length, 0);
  const totalTexts = project.acts.reduce((sum, act) => sum + act.texts.length, 0);

  const handleToggleExpand = (actId: string) => {
    setExpandedActId(expandedActId === actId ? null : actId);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    timeline.seek(time);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      timeline.play();
    } else {
      timeline.pause();
    }
  };

  return (
    <div className="project-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header__content">
          {onBack && (
            <button className="dashboard-back-btn" onClick={onBack}>
              ← بازگشت
            </button>
          )}

          <div className="dashboard-title-section">
            <h1 className="dashboard-title">{project.title}</h1>
            <p className="dashboard-subtitle">{project.description}</p>
          </div>

          <div className="dashboard-actions">
            {onRegenerate && (
              <button
                className="dashboard-action-btn dashboard-action-btn--secondary"
                onClick={onRegenerate}
              >
                🔄 تولید مجدد
              </button>
            )}
            {onExport && (
              <button
                className="dashboard-action-btn dashboard-action-btn--primary"
                onClick={onExport}
              >
                📤 Export ویدیو
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <StatCard
          icon="🎬"
          label="Acts"
          value={project.acts.length}
          color="blue"
        />
        <StatCard
          icon="⏱️"
          label="مدت زمان"
          value={`${Math.floor(project.totalDuration / 60)} دقیقه`}
          color="green"
        />
        <StatCard
          icon="📚"
          label="Facts"
          value={totalFacts}
          color="purple"
        />
        <StatCard
          icon="💬"
          label="متن‌ها"
          value={totalTexts}
          color="orange"
        />
      </div>

      {/* Project Info */}
      <div className="dashboard-info-section">
        <div className="info-card">
          <h3 className="info-card__title">مشخصات پروژه</h3>
          <div className="info-grid">
            <InfoItem label="Template" value={project.template} />
            <InfoItem label="Art Style" value={project.artStyle} />
            <InfoItem label="Resolution" value={project.resolution} />
            <InfoItem label="Aspect Ratio" value={project.aspectRatio} />
            <InfoItem label="Educational Level" value={project.metadata.educationalLevel} />
            <InfoItem label="Language" value={project.metadata.language} />
            <InfoItem label="Category" value={project.metadata.category} />
            <InfoItem
              label="Tags"
              value={project.metadata.tags.slice(0, 5).join(', ')}
            />
          </div>
        </div>

        <div className="info-card">
          <h3 className="info-card__title">Color Palette</h3>
          <div className="color-palette-display">
            {project.colorPalette.map((color, index) => (
              <div
                key={index}
                className="color-swatch-large"
                style={{ backgroundColor: color }}
                title={color}
              >
                <span className="color-swatch-large__label">{color}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="dashboard-section">
        <h2 className="dashboard-section__title">📊 Timeline</h2>
        <TimelineView
          acts={project.acts}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          onPlayPause={handlePlayPause}
        />
      </div>

      {/* Acts List */}
      <div className="dashboard-section">
        <h2 className="dashboard-section__title">🎭 Acts</h2>
        <div className="acts-list">
          {project.acts.map((act, index) => (
            <ActPreview
              key={act.id}
              act={act}
              actIndex={index}
              isExpanded={expandedActId === act.id}
              onToggleExpand={() => handleToggleExpand(act.id)}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="dashboard-footer__info">
          <p>ساخته شده با ❤️ توسط Long Puzzle Maker</p>
          <p>
            Created: {new Date(project.createdAt).toLocaleDateString('fa-IR')}
            {' • '}
            Updated: {new Date(project.updatedAt).toLocaleDateString('fa-IR')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== STAT CARD ====================

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'stat-card--blue',
    green: 'stat-card--green',
    purple: 'stat-card--purple',
    orange: 'stat-card--orange'
  };

  return (
    <div className={`stat-card ${colorClasses[color]}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  );
};

// ==================== INFO ITEM ====================

interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => {
  return (
    <div className="info-item">
      <span className="info-item__label">{label}:</span>
      <span className="info-item__value">{value}</span>
    </div>
  );
};

export default ProjectDashboard;
