# QuizKaro

Template-based quiz video generator for YouTube Shorts / TikTok / Reels, powered by Reelgen.

## Quick Start

```bash
# Render a video from a JSON data file
npm run render data/mcq/general-knowledge.json
npm run render data/guess-movie-emoji/bollywood.json --theme ocean-blue
npm run render data/guess-song/pop-hits.json --out my-quiz.mp4

# Interactive editor (Reelgen UI)
npm run serve

# CLI help
npx tsx src/cli.ts --help
```

## Project Structure

```
src/
├── cli.ts                          # Unified CLI entry point
├── components/                     # Shared animated components
│   ├── index.ts                    # Barrel exports
│   ├── intro.tsx                   # renderIntro() — title + icon + badge
│   ├── outro.tsx                   # renderOutro() — end screen + CTA
│   └── question-elements.tsx       # Options, timer, dots, reveal, fadeout
├── themes/
│   └── index.ts                    # QuizTheme interface + 5 built-in themes
├── scenes/                         # Video templates (Reelgen scenes)
│   ├── mcq-quiz.tsx                # Original MCQ template
│   ├── mcq-quiz-v2.tsx             # MCQ using shared components
│   ├── guess-song.tsx              # Guess the Song (waveform animation)
│   ├── guess-movie-emoji.tsx       # Guess the Movie by emoji clues
│   └── guess-the-clip.tsx          # Guess the Clip (simulated playback)
├── project-templates/              # Minimal project configs per template
│   ├── mcq.ts
│   ├── guess-song.ts
│   ├── guess-movie-emoji.ts
│   └── guess-the-clip.ts
├── project.ts                      # Original project config (legacy)
├── render.ts                       # Original render script (legacy)
data/                               # JSON quiz data files
├── mcq/
├── guess-song/
├── guess-movie-emoji/
└── guess-the-clip/
output/                             # Rendered MP4 videos
```

## Architecture

### Canvas
- Portrait: 1080×1920 (9:16)
- Coordinate system: origin at center, X: -540 to +540, Y: -960 to +960

### Templates
Each template is a Reelgen `makeScene2D` scene in `src/scenes/`. Templates receive data via `useScene().variables`:
- `title` — quiz title
- `questions` — JSON stringified array
- `thinkTime` — seconds per question
- `theme` — theme name (for v2 templates)
- `accentColor` — optional override

The `guess-the-clip` template has additional variables:
- `icon` — emoji icon on intro (default: `🎬`)
- `itemLabel` — label per item: SCENE, CITY, SONG (default: `CLIP`)
- `promptText` — question shown after clip (default: `What is this?`)
- `watchText` — text during clip playback (default: `👀  Watch carefully...`)
- `clipDuration` — seconds the simulated clip runs (default: `15`)

Each question in `guess-the-clip` can optionally include:
- `clipSrc` — path to an MP4 video file to play inside the clip box (visual only, no audio in final render)
- `clipLabel` — hint text shown during clip playback

### Themes (src/themes/index.ts)
`QuizTheme` interface defines: background gradient, card/accent/correct/wrong colors, option label colors.
Available: `dark-purple`, `neon-pink`, `bollywood-gold`, `ocean-blue`, `retro-arcade`.
Use `getTheme(name)` and `themeBgGradient(theme)`.

### Shared Components (src/components/)
Generator functions that `yield*` animation sequences:
- `renderIntro(view, config)` — animated intro with title, optional icon/subtitle, count badge
- `renderOutro(view, config)` — end screen with title, line, CTA
- `createProgressDots(config)` / `animateDotsIn(refs)` — question progress indicator
- `createOptionCards(config)` / `animateOptionsIn(refs, count)` — A/B/C/D option cards
- `createTimer(config)` / `animateTimerIn(refs)` / `runCountdown(refs, duration)` — circular timer
- `revealAnswer(correctIndex, count, optionRefs, theme)` — green correct, red wrong
- `fadeOutQuestion(nodes, optionRefs, count)` — exit animation + cleanup

### Data Format
JSON files in `data/` with structure:
```json
{
  "template": "mcq | guess-song | guess-movie-emoji",
  "title": "Quiz Title",
  "theme": "dark-purple",
  "thinkTime": 10,
  "questions": [...]
}
```

## Key Conventions

- Use absolute Y positioning for elements (not Layout) to avoid overlap issues with scale/opacity animations
- Reelgen scenes use generator functions — `yield*` for sequential, `all()` for parallel animations
- `createRef<T>()` for single nodes, `createRefArray<T>()` for repeated nodes
- Always `.remove()` nodes after fading out to prevent memory issues
- Render with `npx tsx` (not `node`) since project uses TypeScript + TSX

## Common Pitfalls

- `Layout` with `direction="row/column"` breaks when children start with `scale={0}` or `height={0}` — the layout engine can't distribute zero-size elements. Use absolute positioning instead.
- `chain()` inside `all()` can extend total duration beyond the timer if chains are sequential — be careful with parallel vs sequential composition.
- Flag emojis (🇮🇳) may not render in the headless browser — they show as letter boxes. Standard emojis work fine.
- The Reelgen default canvas is 1920×1080 (landscape). Always set `settings.shared.size` to `{x: 1080, y: 1920}` for portrait.
