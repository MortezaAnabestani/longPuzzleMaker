/**
 * Timeline View Component
 *
 * نمایش Timeline کامل ویدیو
 * - نمایش Acts و Transitions
 * - Seek و Playback Control
 * - Zoom و Pan
 */

import React, { useState, useRef, useEffect } from 'react';
import { VideoAct } from '../types/longVideo.types';
import { TimelineManager } from '../services/timelineManager';

// ==================== INTERFACES ====================

interface TimelineViewProps {
  acts: VideoAct[];
  currentTime?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onPlayPause?: () => void;
}

// ==================== COMPONENT ====================

export const TimelineView: React.FC<TimelineViewProps> = ({
  acts,
  currentTime = 0,
  isPlaying = false,
  onSeek,
  onPlayPause
}) => {
  const [timeline] = useState(() => new TimelineManager(acts));
  const [zoom, setZoom] = useState(1.0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timeline.updateActs(acts);
  }, [acts, timeline]);

  const totalDuration = timeline.getTotalDuration();
  const markers = timeline.generateMarkers();

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !onSeek) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentX = clickX / rect.width;
    const clickedTime = percentX * totalDuration;

    onSeek(clickedTime);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleZoomReset = () => {
    setZoom(1.0);
  };

  return (
    <div className="timeline-view">
      {/* Controls */}
      <div className="timeline-controls">
        <button
          className="timeline-control-btn timeline-control-btn--play"
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="timeline-time-display">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>

        <div className="timeline-zoom-controls">
          <button
            className="timeline-control-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            🔍−
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="timeline-control-btn"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            🔍+
          </button>
          <button
            className="timeline-control-btn"
            onClick={handleZoomReset}
            title="Reset Zoom"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Timeline Track */}
      <div
        ref={timelineRef}
        className="timeline-track-container"
        onClick={handleTimelineClick}
      >
        <div
          className="timeline-track"
          style={{ width: `${zoom * 100}%` }}
        >
          {/* Acts */}
          {acts.map((act, index) => {
            const startTime = timeline.getActStartTime(index);
            const endTime = timeline.getActEndTime(index);
            const leftPercent = (startTime / totalDuration) * 100;
            const widthPercent = ((endTime - startTime) / totalDuration) * 100;

            return (
              <React.Fragment key={act.id}>
                {/* Act Block */}
                <ActBlock
                  act={act}
                  actIndex={index}
                  leftPercent={leftPercent}
                  widthPercent={widthPercent}
                  currentTime={currentTime}
                  startTime={startTime}
                  endTime={endTime}
                />

                {/* Transition */}
                {act.transition && index < acts.length - 1 && (
                  <TransitionBlock
                    transition={act.transition}
                    leftPercent={leftPercent + widthPercent}
                    widthPercent={(act.transition.duration / totalDuration) * 100}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Playhead */}
          <div
            className="timeline-playhead"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="timeline-playhead__line" />
            <div className="timeline-playhead__handle" />
          </div>

          {/* Markers */}
          {markers.map((marker) => (
            <TimelineMarker
              key={marker.id}
              marker={marker}
              totalDuration={totalDuration}
            />
          ))}
        </div>
      </div>

      {/* Time Markers */}
      <div className="timeline-time-markers" style={{ width: `${zoom * 100}%` }}>
        {generateTimeMarkers(totalDuration, zoom).map((time, index) => (
          <div key={index} className="time-marker">
            <div className="time-marker__tick" />
            <div className="time-marker__label">{formatTime(time)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== ACT BLOCK ====================

interface ActBlockProps {
  act: VideoAct;
  actIndex: number;
  leftPercent: number;
  widthPercent: number;
  currentTime: number;
  startTime: number;
  endTime: number;
}

const ActBlock: React.FC<ActBlockProps> = ({
  act,
  actIndex,
  leftPercent,
  widthPercent,
  currentTime,
  startTime,
  endTime
}) => {
  const isActive = currentTime >= startTime && currentTime < endTime;
  const progressPercent = isActive
    ? ((currentTime - startTime) / (endTime - startTime)) * 100
    : currentTime >= endTime ? 100 : 0;

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      'mystery': '#673AB7',
      'curiosity': '#2196F3',
      'tension': '#FF5722',
      'excitement': '#FF9800',
      'breakthrough': '#FFC107',
      'triumph': '#4CAF50',
      'satisfaction': '#009688'
    };
    return colors[mood] || '#9E9E9E';
  };

  return (
    <div
      className={`act-block ${isActive ? 'act-block--active' : ''}`}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        borderColor: getMoodColor(act.mood)
      }}
    >
      <div
        className="act-block__progress"
        style={{
          width: `${progressPercent}%`,
          background: getMoodColor(act.mood)
        }}
      />

      <div className="act-block__content">
        <div className="act-block__number">Act {actIndex + 1}</div>
        <div className="act-block__title">{act.title}</div>
        <div className="act-block__duration">{act.duration}s</div>
      </div>

      {/* Puzzle Progress */}
      <div className="act-block__puzzle-progress">
        <div
          className="puzzle-progress-fill"
          style={{
            width: `${act.puzzleConfig.endPercentage}%`,
            background: `linear-gradient(90deg, transparent ${act.puzzleConfig.startPercentage}%, ${getMoodColor(act.mood)} ${act.puzzleConfig.startPercentage}%)`
          }}
        />
      </div>
    </div>
  );
};

// ==================== TRANSITION BLOCK ====================

interface TransitionBlockProps {
  transition: VideoAct['transition'];
  leftPercent: number;
  widthPercent: number;
}

const TransitionBlock: React.FC<TransitionBlockProps> = ({
  transition,
  leftPercent,
  widthPercent
}) => {
  if (!transition) return null;

  return (
    <div
      className="transition-block"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`
      }}
      title={`Transition: ${transition.type} (${transition.duration}s)`}
    >
      <div className="transition-block__icon">
        {getTransitionIcon(transition.type)}
      </div>
    </div>
  );
};

function getTransitionIcon(type: string): string {
  const icons: Record<string, string> = {
    'fade': '◐',
    'crossfade': '⇄',
    'zoom-in': '⊕',
    'zoom-out': '⊖',
    'slide': '→',
    'puzzle-merge': '⊞',
    'dissolve': '◌'
  };
  return icons[type] || '•';
}

// ==================== TIMELINE MARKER ====================

interface TimelineMarkerProps {
  marker: any;
  totalDuration: number;
}

const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  marker,
  totalDuration
}) => {
  const leftPercent = (marker.time / totalDuration) * 100;

  if (marker.type === 'act-start' || marker.type === 'act-end') {
    return null; // Act blocks already show these
  }

  return (
    <div
      className={`timeline-marker timeline-marker--${marker.type}`}
      style={{ left: `${leftPercent}%` }}
      title={marker.label}
    >
      <div className="timeline-marker__tick" />
    </div>
  );
};

// ==================== HELPER FUNCTIONS ====================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateTimeMarkers(totalDuration: number, zoom: number): number[] {
  const interval = zoom > 2 ? 10 : zoom > 1 ? 30 : 60;
  const markers: number[] = [];

  for (let time = 0; time <= totalDuration; time += interval) {
    markers.push(time);
  }

  if (markers[markers.length - 1] !== totalDuration) {
    markers.push(totalDuration);
  }

  return markers;
}

export default TimelineView;
