# QuizKaro - Video Quiz Generator

## Vision

A template-based video generation platform that creates engaging quiz/trivia short-form videos (YouTube Shorts, TikTok, Instagram Reels) using Reelgen. Inspired by channels like QuizBlitz.

---

## Current State (Phase 1 - Complete)

### What's Built

- **MCQ Quiz Template** (`src/scenes/mcq-quiz.tsx`)
  - Animated intro screen with title + question count badge
  - Per-question flow: header → progress dots → question card → 4 options (A/B/C/D) → countdown timer → answer reveal
  - Correct answer highlighted green with glow, wrong answers faded with red borders
  - Animated outro with CTA
- **Render Pipeline** (`src/render.ts`)
  - Programmatic rendering via `renderVideo()` from `@reelgen/renderer`
  - Configurable via variables: title, questions JSON, think time, accent color
  - Multi-worker rendering (~11s for a 1-minute video)
- **Project Config** (`src/project.ts`)
  - Portrait canvas: 1080x1920 (9:16 for mobile)
  - Dark purple/blue gradient background
  - Sample 3-question quiz for testing

### Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Animation    | Reelgen (Motion Canvas fork) v0.10  |
| Language     | TypeScript + TSX                    |
| Build        | Vite + @reelgen/vite-plugin         |
| Rendering    | @reelgen/renderer + FFmpeg          |
| Runtime      | Node.js via tsx                     |

### Project Structure

```
quizkaro/
├── src/
│   ├── project.ts                # Reelgen project config (canvas size, variables)
│   ├── render.ts                 # CLI render script
│   └── scenes/
│       └── mcq-quiz.tsx          # MCQ quiz scene (intro → questions → outro)
├── public/                       # Static assets (fonts, images, audio)
├── output/                       # Rendered MP4 files
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Phase 2 - More Quiz Templates

### Template 2: Guess the Song

**Concept:** Play a short audio clip, show 4 song title options, reveal the answer.

**Flow:**
1. Intro: "Guess the Song!" + genre/decade tag
2. Per-question:
   - Audio waveform animation plays while clip is heard
   - "What song is this?" prompt
   - 4 options with artist + song title
   - Countdown timer (15s)
   - Reveal: correct song highlighted, show album art
3. Outro with score/CTA

**New capabilities needed:**
- Audio integration (background music + song clips)
- Waveform/equalizer animation component
- Image embedding (album art)

**File:** `src/scenes/guess-song.tsx`

### Template 3: Guess the Movie

**Concept:** Show a blurred/pixelated still frame or emoji clues, guess the movie.

**Flow:**
1. Intro: "Guess the Movie!" + category tag (e.g., "90s Classics")
2. Per-question:
   - Blurred image that gradually sharpens (or emoji hint sequence)
   - "Which movie is this?" prompt
   - 4 movie title options
   - Countdown timer (10s)
   - Reveal: correct movie + show clear poster/still
3. Outro

**New capabilities needed:**
- Image loading + blur/pixelate filters
- Progressive reveal animation (blur → clear)
- Emoji rendering for hint mode

**File:** `src/scenes/guess-movie.tsx`

### Template 4: True or False

**Concept:** Simple true/false rapid-fire questions.

**Flow:**
1. Intro: "True or False!" + topic
2. Per-question:
   - Statement displayed prominently
   - Two large buttons: TRUE (green) / FALSE (red)
   - Short timer (5s) for fast pace
   - Reveal with brief explanation text
3. Outro with score

**File:** `src/scenes/true-false.tsx`

### Template 5: Fill in the Blank

**Concept:** Complete the sentence/lyric/quote.

**Flow:**
1. Intro: "Complete the ___!" + category
2. Per-question:
   - Sentence with a blank (underlined gap)
   - 4 word/phrase options
   - Timer (8s)
   - Reveal: blank fills in with correct answer + highlight
3. Outro

**File:** `src/scenes/fill-blank.tsx`

---

## Phase 3 - Shared Component Library (Complete ✅)

Reusable animated components and theme system extracted from templates:

### Components (`src/components/`)

| Component | File | What it does |
| --- | --- | --- |
| **Intro Screen** | `intro.tsx` | Animated title + optional icon + line + count badge. Configurable via `IntroConfig`. |
| **Outro Screen** | `outro.tsx` | End screen with title + line + subtitle CTA. Configurable via `OutroConfig`. |
| **Progress Dots** | `question-elements.tsx` | Shows completed/current/remaining dots for question tracking. |
| **Option Cards** | `question-elements.tsx` | 4 answer options (A/B/C/D) with label badges, slide-in animation. |
| **Timer** | `question-elements.tsx` | Circular countdown timer with glow effect. |
| **Answer Reveal** | `question-elements.tsx` | Highlights correct answer green, dims wrong answers red. |
| **Fade Out** | `question-elements.tsx` | Slides out options and fades all elements, then removes nodes. |

### Theme System (`src/themes/`)

5 built-in themes with `QuizTheme` interface:

| Theme | Accent | Vibe |
| --- | --- | --- |
| `dark-purple` | Red (#e94560) | Default quiz look |
| `neon-pink` | Pink (#ff6b9d) | Music/party feel |
| `bollywood-gold` | Amber (#f59e0b) | Cinema/Bollywood |
| `ocean-blue` | Cyan (#38bdf8) | Clean/modern |
| `retro-arcade` | Red (#e94560) | Gaming retro |

Each theme defines: background gradient, card colors, accent/glow, correct/wrong colors, and option label colors.

### Usage Example (mcq-quiz-v2.tsx)

```tsx
import {renderIntro, renderOutro, createOptionCards, ...} from '../components';
import {getTheme, themeBgGradient} from '../themes';

const theme = getTheme('ocean-blue');
view.fill(themeBgGradient(theme));

yield* renderIntro(view, {title, countLabel: '5 QUESTIONS', accentColor});
// ... question loop using createOptionCards(), createTimer(), revealAnswer() ...
yield* renderOutro(view, {accentColor});
```

The v2 MCQ template (`mcq-quiz-v2.tsx`) demonstrates the full refactored approach — ~160 lines vs ~430 lines in the original.

---

## Phase 4 - Data Pipeline & Content Management

### Question Data Format

Standardize a JSON schema for all quiz types:

```jsonc
{
  "template": "mcq" | "guess-song" | "guess-movie" | "true-false" | "fill-blank",
  "metadata": {
    "title": "General Knowledge Quiz",
    "category": "Science",
    "difficulty": "easy" | "medium" | "hard",
    "language": "en"
  },
  "settings": {
    "thinkTime": 10,
    "accentColor": "#e94560",
    "theme": "dark-purple"
  },
  "questions": [
    {
      "text": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctIndex": 2,
      // Optional per-template fields:
      "audioClip": "path/to/clip.mp3",        // guess-song
      "image": "path/to/image.jpg",            // guess-movie
      "explanation": "Paris has been the capital since 508 AD"  // true-false
    }
  ]
}
```

### Content Sources

- **Manual JSON files** — hand-crafted question sets in `data/` folder
- **CSV/spreadsheet import** — bulk question ingestion from Google Sheets or Excel
- **AI generation** — use an LLM API to generate question sets given a topic + difficulty
- **API integrations** — Open Trivia DB, TMDb (movies), Spotify (songs)

### File Structure

```
data/
├── mcq/
│   ├── general-knowledge.json
│   ├── science.json
│   └── history.json
├── guess-song/
│   ├── pop-2020s.json
│   └── classic-rock.json
├── guess-movie/
│   ├── 90s-classics.json
│   └── marvel.json
└── assets/
    ├── audio/                    # Song clips
    └── images/                   # Movie stills, album art
```

---

## Phase 5 - API Server & Batch Rendering

### REST API for Video Generation

Build a simple API server that accepts quiz data and returns rendered videos.

```
src/
├── server/
│   ├── index.ts                  # Express/Fastify server
│   ├── routes/
│   │   ├── render.ts             # POST /render — queue a video render
│   │   ├── status.ts             # GET /status/:id — check render progress
│   │   └── templates.ts          # GET /templates — list available templates
│   ├── queue/
│   │   ├── render-queue.ts       # Job queue (BullMQ or similar)
│   │   └── worker.ts             # Render worker process
│   └── storage/
│       └── output.ts             # File storage / S3 upload
```

### API Endpoints

| Method | Endpoint             | Description                          |
| ------ | -------------------- | ------------------------------------ |
| POST   | `/api/render`        | Submit a render job with quiz JSON   |
| GET    | `/api/render/:id`    | Get render status + download URL     |
| GET    | `/api/templates`     | List available templates             |
| POST   | `/api/generate`      | AI-generate questions for a topic    |
| DELETE | `/api/render/:id`    | Cancel a pending render              |

### Batch Rendering

```bash
# CLI for batch rendering from a folder of JSON files
npx tsx src/cli.ts batch --input data/mcq/ --output output/mcq/ --theme dark-purple
```

---

## Phase 6 - Web Dashboard (Future)

A frontend dashboard for non-technical users to create and manage quiz videos.

### Features

- Template picker (MCQ, Guess Song, Guess Movie, etc.)
- Visual question editor with live preview
- Theme/color customization
- Render queue with progress tracking
- Video gallery with download/share links
- Analytics (view counts, engagement if connected to YouTube API)

### Tech Options

- **Frontend:** Next.js or Remix
- **Database:** SQLite (simple) or PostgreSQL
- **Queue:** BullMQ with Redis
- **Storage:** Local filesystem → S3/R2 for production
- **Auth:** Simple API key or OAuth for multi-user

---

## Phase 7 - Distribution & Automation

### Auto-Upload Pipeline

- YouTube Data API integration for auto-uploading Shorts
- Auto-generate titles, descriptions, tags, and thumbnails
- Scheduling: upload X videos per day at optimal times
- TikTok / Instagram Reels upload via their APIs

### Content Calendar

- Define weekly content plan (e.g., Mon=Science, Wed=Movies, Fri=Music)
- Auto-generate + render + upload on schedule
- Track what's been published to avoid duplicates

---

## Execution Priority

| Priority | Phase | Effort   | Impact |
| -------- | ----- | -------- | ------ |
| 1        | Phase 2: More templates (start with Guess the Song) | Medium | High |
| 2        | Phase 3: Component library + themes | Medium | Medium |
| 3        | Phase 4: Data pipeline + AI question generation | Medium | High |
| 4        | Phase 5: API server + batch rendering | High | High |
| 5        | Phase 6: Web dashboard | High | Medium |
| 6        | Phase 7: Auto-upload pipeline | Medium | High |

---

## Quick Reference

### Commands

```bash
# Development (interactive editor)
npm run serve

# Render a video
npm run render

# Dev server (Vite)
npm run dev
```

### Adding a New Template

1. Create `src/scenes/my-template.tsx` with a `makeScene2D` export
2. Register it in a new project file or make the render script template-aware
3. Define the question JSON schema for the template
4. Add sample data in `data/my-template/`
5. Test with `npx tsx src/render.ts --template my-template --data data/my-template/sample.json`
