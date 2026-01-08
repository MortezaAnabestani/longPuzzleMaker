/**
 * Audio Control Panel Component
 *
 * پنل کنترل صدا
 * - تنظیم Volume موسیقی و افکت ها
 * - Preview Audio Mix
 * - نمایش Track ها
 */

import React, { useState, useEffect } from 'react';
import { LongVideoProject } from '../types/longVideo.types';
import { audioMixer, MixConfig, MixResult } from '../services/audioMixer';

// ==================== INTERFACES ====================

interface AudioControlPanelProps {
  project: LongVideoProject;
  onConfigChange?: (config: MixConfig) => void;
}

// ==================== COMPONENT ====================

export const AudioControlPanel: React.FC<AudioControlPanelProps> = ({
  project,
  onConfigChange
}) => {
  const [config, setConfig] = useState<MixConfig>(audioMixer.getConfig());
  const [mixResult, setMixResult] = useState<MixResult | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  useEffect(() => {
    // تولید Mix
    const result = audioMixer.mixProject(project, config);
    setMixResult(result);
  }, [project, config]);

  const handleConfigChange = (updates: Partial<MixConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    audioMixer.updateConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  return (
    <div className="audio-control-panel">
      <h3 className="audio-control-panel__title">🎵 تنظیمات صدا</h3>

      {/* Volume Controls */}
      <div className="audio-controls">
        <VolumeControl
          label="موسیقی پس‌زمینه"
          value={config.musicVolume}
          onChange={(value) => handleConfigChange({ musicVolume: value })}
          icon="🎵"
        />

        <VolumeControl
          label="افکت های صوتی"
          value={config.effectsVolume}
          onChange={(value) => handleConfigChange({ effectsVolume: value })}
          icon="🔊"
        />

        <VolumeControl
          label="حجم کلی"
          value={config.masterVolume}
          onChange={(value) => handleConfigChange({ masterVolume: value })}
          icon="🔈"
        />
      </div>

      {/* Crossfade Duration */}
      <div className="audio-setting">
        <label className="audio-setting__label">
          🔀 مدت Crossfade (ثانیه)
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={config.crossfadeDuration}
          onChange={(e) => handleConfigChange({ crossfadeDuration: parseFloat(e.target.value) })}
          className="audio-range"
        />
        <span className="audio-setting__value">{config.crossfadeDuration.toFixed(1)}s</span>
      </div>

      {/* Options */}
      <div className="audio-options">
        <label className="audio-checkbox">
          <input
            type="checkbox"
            checked={config.normalize}
            onChange={(e) => handleConfigChange({ normalize: e.target.checked })}
          />
          <span>Normalize Volume</span>
        </label>

        <label className="audio-checkbox">
          <input
            type="checkbox"
            checked={config.compress}
            onChange={(e) => handleConfigChange({ compress: e.target.checked })}
          />
          <span>Compression</span>
        </label>
      </div>

      {/* Mix Stats */}
      {mixResult && (
        <div className="mix-stats">
          <h4 className="mix-stats__title">📊 آمار Mix</h4>
          <div className="mix-stats__grid">
            <StatItem label="تعداد Track ها" value={mixResult.stats.totalTracks} />
            <StatItem label="موسیقی" value={mixResult.stats.musicCount} />
            <StatItem label="افکت ها" value={mixResult.stats.effectsCount} />
            <StatItem
              label="Peak Volume"
              value={`${(mixResult.stats.peakVolume * 100).toFixed(0)}%`}
            />
            <StatItem
              label="Average Volume"
              value={`${(mixResult.stats.averageVolume * 100).toFixed(0)}%`}
            />
            <StatItem
              label="Duration"
              value={`${Math.floor(mixResult.totalDuration / 60)}:${(mixResult.totalDuration % 60).toFixed(0).padStart(2, '0')}`}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="mix-preview">
        <button
          className="mix-preview__toggle"
          onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
        >
          {isPreviewExpanded ? '▼' : '▶'} پیش‌نمایش Track ها
        </button>

        {isPreviewExpanded && mixResult && (
          <div className="mix-preview__content">
            <TracksList mixResult={mixResult} />
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== VOLUME CONTROL ====================

interface VolumeControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: string;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  label,
  value,
  onChange,
  icon
}) => {
  return (
    <div className="volume-control">
      <label className="volume-control__label">
        <span className="volume-control__icon">{icon}</span>
        {label}
      </label>
      <div className="volume-control__slider">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="volume-range"
        />
        <span className="volume-control__value">{Math.round(value * 100)}%</span>
      </div>
      <div className="volume-meter">
        <div
          className="volume-meter__fill"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
};

// ==================== STAT ITEM ====================

interface StatItemProps {
  label: string;
  value: string | number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => {
  return (
    <div className="stat-item">
      <div className="stat-item__label">{label}</div>
      <div className="stat-item__value">{value}</div>
    </div>
  );
};

// ==================== TRACKS LIST ====================

interface TracksListProps {
  mixResult: MixResult;
}

const TracksList: React.FC<TracksListProps> = ({ mixResult }) => {
  const [selectedType, setSelectedType] = useState<'all' | 'music' | 'effects'>('all');

  const filteredTracks = selectedType === 'all' ? mixResult.tracks :
    selectedType === 'music' ? mixResult.musicTracks :
    mixResult.effectTracks;

  return (
    <div className="tracks-list">
      <div className="tracks-filter">
        <button
          className={`filter-btn ${selectedType === 'all' ? 'filter-btn--active' : ''}`}
          onClick={() => setSelectedType('all')}
        >
          همه ({mixResult.tracks.length})
        </button>
        <button
          className={`filter-btn ${selectedType === 'music' ? 'filter-btn--active' : ''}`}
          onClick={() => setSelectedType('music')}
        >
          موسیقی ({mixResult.musicTracks.length})
        </button>
        <button
          className={`filter-btn ${selectedType === 'effects' ? 'filter-btn--active' : ''}`}
          onClick={() => setSelectedType('effects')}
        >
          افکت ها ({mixResult.effectTracks.length})
        </button>
      </div>

      <div className="tracks-items">
        {filteredTracks.map((track, index) => (
          <TrackItem key={track.id} track={track} index={index} />
        ))}
      </div>
    </div>
  );
};

// ==================== TRACK ITEM ====================

interface TrackItemProps {
  track: any;
  index: number;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, index }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`track-item track-item--${track.type}`}>
      <div className="track-item__index">{index + 1}</div>
      <div className="track-item__info">
        <div className="track-item__type">
          {track.type === 'music' ? '🎵 Music' : '🔊 Effect'}
        </div>
        <div className="track-item__timing">
          {formatTime(track.startTime)} → {formatTime(track.startTime + track.duration)}
        </div>
      </div>
      <div className="track-item__volume">
        <div className="volume-badge">
          {Math.round(track.volume * 100)}%
        </div>
      </div>
    </div>
  );
};

export default AudioControlPanel;
