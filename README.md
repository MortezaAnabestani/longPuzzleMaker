# Long Puzzle Maker

> AI-Powered Long-Form Educational Video Generator with Puzzle Animations

## Overview

Long Puzzle Maker is an advanced system for creating 5-20 minute educational YouTube videos featuring puzzle animations, AI-generated content, smart audio mixing, and professional transitions.

## Features

### ✨ Core Capabilities
- 🎬 **5-20 Minute Videos** - Long-form educational content
- 🧩 **Puzzle Animations** - Progressive reveal with camera movements
- 🤖 **AI Content Generation** - Automated script, facts, and text overlays
- 🎵 **Smart Audio System** - Mood-based music selection and sound effects
- 📝 **Text Overlays** - Animated captions and facts
- 🎨 **Professional Transitions** - 8 transition types between acts
- 📊 **Timeline Management** - Multi-act story structure

### 🎯 Key Components

#### Phase 1: Data Structures & Timeline ✅
- Video project structure
- Act-based timeline
- Puzzle progress tracking
- Camera movement system

#### Phase 2: AI Content Generation ✅
- Template engine (7 educational templates)
- AI content generator with Gemini
- Chapter coordination
- Text overlay engine

#### Phase 3: UI Components ✅
- Template selector
- Project wizard (4-step)
- Act preview
- Timeline view
- Project dashboard

#### Phase 4: Audio System ✅
- Audio engine (Web Audio API)
- Music library (13 tracks, 7 moods)
- Sound effects manager (15 effects)
- Audio mixer with crossfades

#### Phase 5: Canvas & Rendering ✅
- Canvas engine (1920x1080 HD)
- Puzzle renderer with easing
- Text renderer (10 animations)
- Image manager with caching
- Frame renderer pipeline

## Project Structure

```
longPuzzleMaker/
├── types/
│   └── longVideo.types.ts          # Core type definitions
├── services/
│   ├── templateEngine.ts           # Video templates
│   ├── aiContentGenerator.ts       # AI content generation
│   ├── chapterEngine.ts            # Chapter coordination
│   ├── timelineManager.ts          # Timeline management
│   ├── textOverlayEngine.ts        # Text overlays
│   ├── audioEngine.ts              # Audio playback
│   ├── musicLibrary.ts             # Music catalog
│   ├── soundEffectsManager.ts      # Sound effects
│   ├── audioMixer.ts               # Audio mixing
│   ├── canvasEngine.ts             # Canvas infrastructure
│   ├── puzzleRenderer.ts           # Puzzle animation
│   ├── textRenderer.ts             # Text rendering
│   ├── imageManager.ts             # Image loading
│   └── frameRenderer.ts            # Frame composition
├── components/
│   ├── TemplateSelector.tsx        # Template selection UI
│   ├── ProjectWizard.tsx           # Project creation wizard
│   ├── ActPreview.tsx              # Act details viewer
│   ├── TimelineView.tsx            # Timeline visualization
│   ├── ProjectDashboard.tsx        # Project management
│   └── AudioControlPanel.tsx       # Audio controls
├── examples/
│   └── dnaDiscoveryExample.ts      # Example usage
└── MASTER_PLAN.md                  # Development roadmap

Documentation:
├── PHASE1_COMPLETED.md             # Data structures
├── PHASE2_COMPLETED.md             # AI generation
├── PHASE3_COMPLETED.md             # UI components
├── PHASE4_COMPLETED.md             # Audio system
└── PHASE5_COMPLETED.md             # Rendering system
```

## Quick Start

### Example: Creating a DNA Discovery Video

```typescript
import { templateEngine } from './services/templateEngine';
import { aiContentGenerator } from './services/aiContentGenerator';
import { chapterEngine } from './services/chapterEngine';
import { audioMixer } from './services/audioMixer';
import { createFrameRenderer } from './services/frameRenderer';

// 1. Generate project structure
const input = {
  template: 'science-discovery',
  topic: 'Structure of DNA',
  duration: 600, // 10 minutes
  actCount: 5,
  targetAudience: 'high-school',
  complexity: 'medium',
  imageUrls: [
    'https://example.com/dna-helix.jpg',
    'https://example.com/watson-crick.jpg',
    // ... more images
  ]
};

const structure = templateEngine.generateProjectStructure(input);

// 2. Generate AI content
const project = await aiContentGenerator.generateProjectContent(
  structure,
  'YOUR_GEMINI_API_KEY'
);

// 3. Coordinate puzzle progress
chapterEngine.coordinatePuzzleProgress(project.acts);

// 4. Setup audio
const mixResult = audioMixer.mixProject(project);

// 5. Render frames
const renderer = createFrameRenderer(
  canvasEngine,
  puzzleRenderer,
  textRenderer,
  imageManager
);

await renderer.setupProject(project);

const result = await renderer.renderAllFrames({
  onProgress: (progress, frame, total) => {
    console.log(`Rendering: ${Math.round(progress * 100)}%`);
  }
});

console.log(`✅ Rendered ${result.totalFrames} frames`);
```

## Templates

### Available Templates (7)

1. **Science Discovery** - Scientific breakthroughs and discoveries
2. **Historical Event** - Major historical moments
3. **Technology Evolution** - Tech innovation stories
4. **Mystery Solved** - Historical mysteries and solutions
5. **Biography** - Life stories of influential people
6. **Cultural Phenomenon** - Cultural movements and trends
7. **Nature Documentary** - Natural world exploration

Each template includes:
- Story arc structure
- Act count and duration
- Mood progression
- Puzzle progression curve
- Camera movement patterns

## Audio System

### Music Library
- **13 tracks** across **7 moods**
- Moods: mystery, curiosity, tension, revelation, triumph, reflection, wonder
- Smart mood-based selection
- Automatic crossfade between tracks

### Sound Effects
- **15 effects** with variations
- Types: snap, slide, wave, whoosh, impact, ambient
- Automatic generation based on puzzle progress
- Transition-specific effects

## Rendering Pipeline

### Frame Rendering Flow

```
Setup Project
  ├─ Build timeline (acts + transitions)
  ├─ Preload images
  └─ Setup text overlays

For each frame:
  ├─ Create render context (time → act/transition)
  ├─ Clear canvas (1920x1080)
  ├─ Render act OR transition
  │  ├─ Load image
  │  ├─ Update puzzle state
  │  ├─ Render puzzle
  │  └─ Render texts
  └─ Capture frame (ImageData/Blob)

Export
  └─ Encode to MP4 with audio
```

### Performance Features
- Layer-based rendering
- Image caching with LRU eviction
- Offscreen canvas for transitions
- Parallel image loading

## Animation System

### Puzzle Animation
- 7 easing functions (linear, easeIn, easeOut, dramatic, etc.)
- Progressive piece placement
- Camera movements (zoom, pan, rotate)
- Per-piece opacity and rotation

### Text Animations (10 types)
- fade, slide-up/down/left/right
- typewriter, reveal, glow, bounce

### Transition Effects (8 types)
- fade, crossfade
- slide-left/right/up/down
- zoom-in, zoom-out, dissolve

## Technical Specifications

- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 FPS
- **Video Length:** 5-20 minutes
- **Act Count:** 3-8 acts per video
- **Puzzle Pieces:** 9-100 pieces per act
- **Audio:** Stereo, 44.1kHz

## Development Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Data structures & timeline |
| Phase 2 | ✅ Complete | AI content generation |
| Phase 3 | ✅ Complete | UI components |
| Phase 4 | ✅ Complete | Audio system |
| Phase 5 | ✅ Complete | Canvas & rendering |
| Phase 6 | 🔄 Planned | Export pipeline (FFmpeg) |

## Next Steps (Phase 6)

### Export Pipeline
- [ ] FFmpeg.wasm integration
- [ ] H.264/VP9 video encoding
- [ ] AAC/Opus audio encoding
- [ ] MP4/WebM muxing
- [ ] Progress tracking
- [ ] Export UI

## API Reference

See individual PHASE documentation files for detailed API references:
- [PHASE1_COMPLETED.md](PHASE1_COMPLETED.md) - Data structures
- [PHASE2_COMPLETED.md](PHASE2_COMPLETED.md) - AI generation
- [PHASE3_COMPLETED.md](PHASE3_COMPLETED.md) - UI components
- [PHASE4_COMPLETED.md](PHASE4_COMPLETED.md) - Audio system
- [PHASE5_COMPLETED.md](PHASE5_COMPLETED.md) - Rendering

## License

MIT License

## Contributing

This is an AI-powered project. Contributions welcome!

---

**Built with:** TypeScript, React, Canvas API, Web Audio API, Gemini AI
