# 🎬 Long Puzzle Maker - Master Plan

**تاریخ شروع:** 2026-01-07
**هدف:** ساخت سیستم تولید ویدیوهای 5-10 دقیقه‌ای پازل با ساختار Chapter-based

---

## 📊 خلاصه پروژه

### تفاوت اصلی با Short Videos:
| ویژگی | Short (فعلی) | Long (هدف) |
|-------|--------------|------------|
| **مدت زمان** | 15-60 ثانیه | 300-600 ثانیه (5-10 دقیقه) |
| **Aspect Ratio** | 9:16 (عمودی) | 16:9 (افقی) |
| **Resolution** | 1080x1920 | 1920x1080 |
| **ساختار** | تک‌بخشی | چند Chapter |
| **داستان** | Hook→Climax→Reveal | Discovery Journey |
| **پازل** | یک پازل ساده | چند پازل یا یک پازل پیچیده |

---

## 🎯 اولین Template: "The Scientific Discovery Journey"

### ساختار:
```
Act 1: The Mystery (0-120s)
  ├─ Puzzle: 30% complete
  ├─ Text: معرفی موضوع
  └─ Mood: Mysterious

Act 2: The Investigation (120-300s)
  ├─ Puzzle: 30% → 60%
  ├─ Text: فکت‌های علمی
  └─ Mood: Tension Building

Act 3: The Breakthrough (300-480s)
  ├─ Puzzle: 60% → 90%
  ├─ Text: لحظات کلیدی
  └─ Mood: Epic Rising

Act 4: The Impact (480-600s)
  ├─ Puzzle: 90% → 100%
  ├─ Text: نتیجه و تاثیر
  └─ Mood: Triumphant
```

---

## 🏗️ فاز 1: Foundation (Week 1)

### 1.1. Type Definitions
- [x] `longVideo.types.ts` - تعریف Interface های جدید
- [ ] `chapter.types.ts` - ساختار Chapter
- [ ] `template.types.ts` - ساختار Template

### 1.2. Core Engine
- [ ] `chapterEngine.ts` - مدیریت Chapter ها
- [ ] `timelineManager.ts` - مدیریت Timeline کلی
- [ ] `textOverlayEngine.ts` - سیستم نمایش متن

### 1.3. Canvas System
- [ ] تغییر Canvas از 1080x1920 به 1920x1080
- [ ] پشتیبانی از Multi-Chapter rendering
- [ ] Camera system (zoom, pan)

---

## 🎨 فاز 2: Template System (Week 2)

### 2.1. Template: Scientific Discovery
- [ ] Act structure implementation
- [ ] Progressive puzzle reveal
- [ ] Text timing system
- [ ] Mood-based music selection

### 2.2. AI Integration
- [ ] Gemini prompt engineering برای 4 Act
- [ ] Visual consistency across Acts
- [ ] Fact generation system
- [ ] Story arc generator

---

## 🖼️ فاز 3: UI Components (Week 3)

### 3.1. Chapter Builder
- [ ] `ChapterCard.tsx` - کارت هر Chapter
- [ ] `ActEditor.tsx` - ویرایش هر Act
- [ ] `TimelineView.tsx` - نمای Timeline

### 3.2. Text Overlay Editor
- [ ] `TextEditor.tsx` - ویرایشگر متن
- [ ] `TextTimeline.tsx` - زمان‌بندی متن‌ها
- [ ] `TextStylePicker.tsx` - انتخاب style متن

### 3.3. Preview System
- [ ] Live preview هر Chapter
- [ ] Scrubbing timeline
- [ ] Play/Pause control

---

## 🎵 فاز 4: Audio System (Week 4)

### 4.1. Background Music
- [ ] Per-Chapter music selection
- [ ] Crossfade between Chapters
- [ ] Mood-based music library

### 4.2. Sound Effects
- [ ] Puzzle sounds per Chapter
- [ ] Ambient sounds
- [ ] Dramatic moments (crescendo)

---

## 🎬 فاز 5: Video Export (Week 5)

### 5.1. Rendering Pipeline
- [ ] Multi-Chapter rendering
- [ ] Transition effects
- [ ] Progress tracking
- [ ] Error handling

### 5.2. Optimization
- [ ] Memory management
- [ ] Rendering speed
- [ ] Quality settings

---

## 🧪 فاز 6: Testing & Polish (Week 6)

### 6.1. Testing
- [ ] Template test با موضوعات مختلف
- [ ] Performance test
- [ ] Memory leak test

### 6.2. Documentation
- [ ] User guide
- [ ] Template guide
- [ ] API documentation

---

## 🚀 اولین Milestone: MVP

**هدف:** یک ویدیو 5 دقیقه‌ای با Template "Scientific Discovery"

**شامل:**
- ✅ Canvas 16:9
- ✅ 4 Act ساختار
- ✅ Text overlay system
- ✅ Progressive puzzle reveal
- ✅ Background music
- ✅ Export to MP4

**نمونه اول:** "کشف ساختار DNA - 1953"

---

## 📁 ساختار پوشه‌های جدید

```
longPuzzleMaker/
├── types/
│   ├── longVideo.types.ts       ✅ Done
│   ├── chapter.types.ts         🔄 In Progress
│   └── template.types.ts        ⏳ Pending
├── services/
│   ├── chapterEngine.ts         ⏳ Pending
│   ├── timelineManager.ts       ⏳ Pending
│   ├── textOverlayEngine.ts     ⏳ Pending
│   └── longVideoExport.ts       ⏳ Pending
├── components/
│   ├── builder/
│   │   ├── ChapterCard.tsx      ⏳ Pending
│   │   ├── ActEditor.tsx        ⏳ Pending
│   │   └── TimelineView.tsx     ⏳ Pending
│   ├── text/
│   │   ├── TextEditor.tsx       ⏳ Pending
│   │   ├── TextTimeline.tsx     ⏳ Pending
│   │   └── TextStylePicker.tsx  ⏳ Pending
│   └── preview/
│       └── VideoPreview.tsx     ⏳ Pending
└── templates/
    └── ScientificDiscovery.ts   ⏳ Pending
```

---

## 🎯 Success Criteria

ویدیوی خروجی باید:
- [ ] 5-10 دقیقه طول داشته باشد
- [ ] 16:9 aspect ratio
- [ ] 1920x1080 resolution
- [ ] حداقل 5 فکت علمی جدید
- [ ] Art style منحصر به فرد
- [ ] ASMR satisfying
- [ ] بدون صدای راوی قابل فهم باشد
- [ ] Emotional arc واضح داشته باشد
- [ ] Visual consistency در همه Act ها

---

## 📝 نکات مهم

### از Short Videos حفظ می‌شود:
- ✅ Gemini image generation
- ✅ Puzzle engine (با تغییرات)
- ✅ Audio system (با تغییرات)
- ✅ Global state management
- ✅ Backend integration

### چیزهای جدید:
- 🆕 Chapter system
- 🆕 Act structure
- 🆕 Timeline management
- 🆕 Camera movements (zoom, pan)
- 🆕 Text overlay engine
- 🆕 Multi-puzzle coordination

---

## ⏱️ Timeline

- **Week 1:** Foundation + Type definitions
- **Week 2:** Template implementation
- **Week 3:** UI Components
- **Week 4:** Audio system
- **Week 5:** Export pipeline
- **Week 6:** Testing + Polish

**اولین ویدیو کامل:** تا 6 هفته

---

## 🎬 مثال اول: "DNA Structure Discovery"

```typescript
const firstVideo: LongVideoProject = {
  title: "کشف ساختار DNA - داستانی که جهان را تغییر داد",
  template: "SCIENTIFIC_DISCOVERY",
  duration: 600, // 10 minutes

  acts: [
    {
      title: "The Mystery",
      duration: 120,
      keyMessage: "چیستی DNA مرموز بود...",
      facts: [
        "DNA: Deoxyribonucleic acid",
        "کشف شد: 1953",
        "محل: کمبریج، انگلستان"
      ]
    },
    {
      title: "The Investigation",
      duration: 180,
      keyMessage: "Watson و Crick شبانه روز کار می‌کردند",
      facts: [
        "51 عکس اشعه X از Rosalind Franklin",
        "مدل‌سازی با سیم و مقوا",
        "رقابت با Linus Pauling"
      ]
    },
    {
      title: "The Breakthrough",
      duration: 180,
      keyMessage: "28 فوریه 1953: لحظه تاریخی",
      facts: [
        "ساختار Double Helix",
        "جفت‌های باز: A-T, G-C",
        "کد ژنتیک رمزگشایی شد"
      ]
    },
    {
      title: "The Impact",
      duration: 120,
      keyMessage: "تاثیر بر جهان امروز",
      facts: [
        "جایزه نوبل 1962",
        "پروژه ژنوم انسانی",
        "پزشکی شخصی‌سازی شده"
      ]
    }
  ],

  artStyle: "Stained Glass Mixed with Scientific Diagrams",
  colorPalette: ["#1a2f5c", "#3d5a80", "#98c1d9", "#e0fbfc", "#ee6c4d"],
  musicMood: "mysterious-to-triumphant"
};
```

---

**Status:** 🟢 Ready to start coding
**Next Step:** Type definitions + Chapter engine