# QuizKaro — User Guide

A step-by-step guide to creating quiz videos with QuizKaro.

---

## Setup

### Prerequisites
- Node.js 18+
- FFmpeg installed on your system

### Install
```bash
git clone <repo-url>
cd quizkaro
npm install
```

### Verify it works
```bash
npm run render data/mcq/general-knowledge.json
# Output: output/mcq-general-knowledge.mp4
```

---

## Creating Videos

The workflow is simple:
1. Create a JSON data file with your questions
2. Run the CLI to render it into a video

```bash
npm run render <path-to-json> [options]
```

### Options

| Flag | Description | Default |
| --- | --- | --- |
| `--theme <name>` | Visual theme | From JSON file |
| `--out <filename>` | Output filename | Auto-generated |
| `--outdir <dir>` | Output directory | `./output` |
| `--workers <n>` | Parallel render workers | `2` |

### Available Themes

| Theme | Accent Color | Best For |
| --- | --- | --- |
| `dark-purple` | Red | General quizzes |
| `neon-pink` | Pink | Music, pop culture |
| `bollywood-gold` | Gold/Amber | Movies, Bollywood |
| `ocean-blue` | Cyan | Science, tech |
| `retro-arcade` | Red | Gaming, trivia |

You can override the theme from the command line:
```bash
npm run render data/mcq/science.json --theme ocean-blue
```

---

## Template 1: MCQ Quiz

Multiple choice quiz with 4 options per question.

### JSON Format

Create a file like `data/mcq/my-quiz.json`:

```json
{
  "template": "mcq",
  "title": "Science Quiz",
  "theme": "ocean-blue",
  "thinkTime": 10,
  "questions": [
    {
      "text": "What is the chemical symbol for water?",
      "options": ["H2O", "CO2", "NaCl", "O2"],
      "correctIndex": 0
    },
    {
      "text": "How many planets are in our solar system?",
      "options": ["7", "8", "9", "10"],
      "correctIndex": 1
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `template` | `"mcq"` | Yes | Must be `"mcq"` |
| `title` | string | Yes | Shown on intro screen |
| `theme` | string | No | Theme name (default: `dark-purple`) |
| `thinkTime` | number | No | Seconds per question (default: `10`) |
| `questions` | array | Yes | Array of question objects |
| `questions[].text` | string | Yes | The question text |
| `questions[].options` | string[] | Yes | Exactly 4 answer options |
| `questions[].correctIndex` | number | Yes | Index of correct answer (0-3) |

### Render

```bash
npm run render data/mcq/my-quiz.json
# Output: output/mcq-my-quiz.mp4
```

### Tips
- Keep questions under 80 characters for best readability
- Keep options short (1-4 words ideal)
- 5-10 questions makes a good 1-2 minute video
- `thinkTime: 8` for easy questions, `12-15` for harder ones

---

## Template 2: Guess the Song

Show a waveform animation while a song "plays", then reveal 4 options.

### JSON Format

Create a file like `data/guess-song/my-playlist.json`:

```json
{
  "template": "guess-song",
  "title": "90s Hits Quiz!",
  "theme": "neon-pink",
  "thinkTime": 12,
  "questions": [
    {
      "options": [
        "Nirvana - Smells Like Teen Spirit",
        "Pearl Jam - Alive",
        "Soundgarden - Black Hole Sun",
        "Alice in Chains - Rooster"
      ],
      "correctIndex": 0
    },
    {
      "options": [
        "Backstreet Boys - I Want It That Way",
        "NSYNC - Bye Bye Bye",
        "Spice Girls - Wannabe",
        "Britney Spears - Baby One More Time"
      ],
      "correctIndex": 2
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `template` | `"guess-song"` | Yes | Must be `"guess-song"` |
| `title` | string | Yes | Shown on intro screen |
| `theme` | string | No | Theme name (default: `neon-pink`) |
| `thinkTime` | number | No | Seconds per question (default: `10`) |
| `questions` | array | Yes | Array of question objects |
| `questions[].options` | string[] | Yes | 4 options in `"Artist - Song"` format |
| `questions[].correctIndex` | number | Yes | Index of correct answer (0-3) |
| `questions[].audioClip` | string | No | Path to audio file to play during waveform (e.g. `"clips/song.mp3"`) |

### Render

```bash
npm run render data/guess-song/my-playlist.json
# Output: output/guess-song-my-playlist.mp4
```

### Adding Real Audio Clips

You can play actual audio during the waveform animation. Add an `audioClip` field to each question:

```json
{
  "template": "guess-song",
  "title": "90s Hits Quiz!",
  "thinkTime": 12,
  "questions": [
    {
      "audioClip": "clips/smells-like-teen-spirit.mp3",
      "options": [
        "Nirvana - Smells Like Teen Spirit",
        "Pearl Jam - Alive",
        "Soundgarden - Black Hole Sun",
        "Alice in Chains - Rooster"
      ],
      "correctIndex": 0
    }
  ]
}
```

The audio plays during the waveform animation and continues through the countdown timer, then stops when the answer is revealed.

#### Audio file requirements

| Requirement | Details |
| --- | --- |
| Format | MP3 or WAV recommended |
| Duration | Should be long enough to cover the waveform + think time (~15-25s) |
| Path | Relative to the project root (e.g. `clips/song-clip.mp3`) or absolute path |

#### Preparing audio clips

Use FFmpeg to extract a clip from a full song:

```bash
# Extract 25 seconds starting at the chorus (0:45)
ffmpeg -ss 00:00:45 -i full-song.mp3 -t 25 -c copy clips/song-clip.mp3
```

> **Tip:** Pick a recognizable part of the song (chorus, intro riff) for the best quiz experience.

### Tips
- Use `"Artist - Song Title"` format for options
- Without `audioClip`, the waveform is visual-only (no audio)
- You can mix questions with and without audio clips
- Group songs by genre or decade for better engagement

---

## Template 3: Guess the Movie by Emoji

Show emoji clues, viewers guess which movie they represent.

### JSON Format

Create a file like `data/guess-movie-emoji/hollywood.json`:

```json
{
  "template": "guess-movie-emoji",
  "title": "Guess the Movie!",
  "subtitle": "From emojis 🎬",
  "theme": "bollywood-gold",
  "thinkTime": 10,
  "questions": [
    {
      "emojis": "🕷️🧑‍💼🏙️",
      "options": ["Spider-Man", "Batman", "Superman", "Iron Man"],
      "correctIndex": 0
    },
    {
      "emojis": "🧊🚢💑",
      "options": ["Frozen", "Titanic", "The Notebook", "Poseidon"],
      "correctIndex": 1
    },
    {
      "emojis": "🦖🏝️🔬",
      "options": ["King Kong", "Godzilla", "Jurassic Park", "The Lost World"],
      "correctIndex": 2
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `template` | `"guess-movie-emoji"` | Yes | Must be `"guess-movie-emoji"` |
| `title` | string | Yes | Shown on intro screen |
| `subtitle` | string | No | Shown below title on intro (e.g. `"From emojis 🎬"`) |
| `theme` | string | No | Theme name (default: `bollywood-gold`) |
| `thinkTime` | number | No | Seconds per question (default: `10`) |
| `questions` | array | Yes | Array of question objects |
| `questions[].emojis` | string | Yes | 2-5 emojis as clues |
| `questions[].options` | string[] | Yes | 4 movie title options |
| `questions[].correctIndex` | number | Yes | Index of correct answer (0-3) |

### Render

```bash
npm run render data/guess-movie-emoji/hollywood.json
# Output: output/guess-movie-emoji-hollywood.mp4
```

### Emoji Tips
- Use 2-4 emojis per movie for best readability
- Pick emojis that hint at the plot, characters, or setting
- Avoid country flag emojis (🇮🇳, 🇺🇸) — they may not render correctly
- Test your emojis by rendering a quick 1-question video first

### Good Emoji Examples

| Movie | Emojis | Why |
| --- | --- | --- |
| Titanic | 🧊🚢💑 | Ice + ship + love |
| Jurassic Park | 🦖🏝️🔬 | Dinosaur + island + science |
| The Lion King | 🦁👑🌍 | Lion + crown + Africa |
| Spider-Man | 🕷️🧑‍💼🏙️ | Spider + person + city |
| Finding Nemo | 🐠🔍🌊 | Fish + search + ocean |
| Dangal | 🤼🥇🏆 | Wrestling + gold + trophy |
| Mission Mangal | 🧑‍🚀🌙🚀 | Astronaut + moon + rocket |

---

## Template 4: Guess the Clip

Show a simulated clip playback (countdown + progress bar), then reveal 4 options.
This template is highly configurable — use it for movies, songs, cities, landmarks, etc.

### JSON Format

Create a file like `data/guess-the-clip/my-clips.json`:

```json
{
  "template": "guess-the-clip",
  "title": "Guess the Bollywood Scene!",
  "subtitle": "15 seconds to watch, then guess!",
  "icon": "🎬",
  "itemLabel": "SCENE",
  "promptText": "Which movie was this from?",
  "watchText": "👀  Watch the clip...",
  "clipDuration": 15,
  "thinkTime": 10,
  "accentColor": "#f43f5e",
  "questions": [
    {
      "options": ["3 Idiots", "PK", "Munna Bhai M.B.B.S.", "Lage Raho Munna Bhai"],
      "correctIndex": 0,
      "clipLabel": "Hint: A college comedy"
    },
    {
      "options": ["Sholay", "Deewar", "Don", "Agneepath"],
      "correctIndex": 0,
      "clipLabel": "Hint: Classic action"
    }
  ]
}
```

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `template` | `"guess-the-clip"` | Yes | Must be `"guess-the-clip"` |
| `title` | string | Yes | Shown on intro screen |
| `subtitle` | string | No | Intro subtitle (default: `"Can you guess from a Xs clip?"`) |
| `icon` | string | No | Emoji icon on intro screen (default: `"🎬"`) |
| `itemLabel` | string | No | Label for each item: `"SCENE"`, `"CITY"`, `"SONG"` etc. (default: `"CLIP"`) |
| `promptText` | string | No | Question shown after clip finishes (default: `"What is this?"`) |
| `watchText` | string | No | Text shown during clip playback (default: `"👀  Watch carefully..."`) |
| `clipDuration` | number | No | Seconds the "clip" plays for (default: `15`) |
| `thinkTime` | number | No | Seconds to answer after clip ends (default: `10`) |
| `accentColor` | string | No | Hex color for accents (default: `"#f43f5e"`) |
| `questions` | array | Yes | Array of question objects |
| `questions[].options` | string[] | Yes | 4 answer options |
| `questions[].correctIndex` | number | Yes | Index of correct answer (0-3) |
| `questions[].clipSrc` | string | No | Path to video file to play in the clip box (e.g. `"clips/scene.mp4"`) |
| `questions[].audioSrc` | string | No | Path to audio file to play during the clip (e.g. `"clips/audio.mp3"`) |
| `questions[].clipLabel` | string | No | Hint text shown inside the clip box (e.g. `"Hint: 90s classic"`) |

### Render

```bash
npm run render data/guess-the-clip/bollywood-scenes.json
# Output: output/guess-the-clip-bollywood-scenes.mp4
```

### Customization Examples

**Guess the City:**
```json
{
  "template": "guess-the-clip",
  "title": "Guess the City!",
  "icon": "🏙️",
  "itemLabel": "CITY",
  "promptText": "Which city is this?",
  "watchText": "🌍  Watch closely...",
  "clipDuration": 10,
  "accentColor": "#38bdf8"
}
```

**Guess the Song (clip version):**
```json
{
  "template": "guess-the-clip",
  "title": "Name That Tune!",
  "icon": "🎵",
  "itemLabel": "SONG",
  "promptText": "Which song is this?",
  "watchText": "🎧  Listen carefully...",
  "clipDuration": 10
}
```

### Adding Real Video Clips

You can embed actual video files inside the clip playback box. Add a `clipSrc` field to each question pointing to your video file:

```json
{
  "template": "guess-the-clip",
  "title": "Guess the Bollywood Scene!",
  "clipDuration": 15,
  "thinkTime": 10,
  "questions": [
    {
      "clipSrc": "clips/3-idiots-scene.mp4",
      "clipLabel": "Hint: A college comedy",
      "options": ["3 Idiots", "PK", "Munna Bhai M.B.B.S.", "Lage Raho Munna Bhai"],
      "correctIndex": 0
    }
  ]
}
```

#### Clip file requirements

| Requirement | Details |
| --- | --- |
| Format | MP4 (H.264) recommended — fastest decoder. WebM also supported (slower) |
| Resolution | Any — will be scaled to fit the 900×400 clip box. 720p or 1080p works well |
| Duration | Should be ≥ `clipDuration` seconds. Only the first `clipDuration` seconds will play |
| Path | Relative to the project root (e.g. `clips/my-scene.mp4`) or absolute path |
| Audio | Video audio is **not** embedded automatically — use `audioSrc` to add a separate audio track |

#### Where to put your clips

Create a `clips/` folder in the project root:

```
quizkaro/
├── clips/
│   ├── 3-idiots-scene.mp4
│   ├── sholay-scene.mp4
│   └── paris-timelapse.mp4
├── data/
│   └── guess-the-clip/
│       └── bollywood-scenes.json   ← references clips/3-idiots-scene.mp4
```

#### Mixed mode (some clips, some simulated)

You can mix questions with and without `clipSrc`. Questions without it will show the simulated countdown box:

```json
{
  "questions": [
    {
      "clipSrc": "clips/scene1.mp4",
      "options": ["Movie A", "Movie B", "Movie C", "Movie D"],
      "correctIndex": 0
    },
    {
      "clipLabel": "Hint: 80s action classic",
      "options": ["Die Hard", "Rambo", "Terminator", "Predator"],
      "correctIndex": 0
    }
  ]
}
```

#### Trimming clips

The template plays the first `clipDuration` seconds of the video. To use a specific segment, pre-trim your clip with FFmpeg:

```bash
# Extract 15 seconds starting at 1:30
ffmpeg -ss 00:01:30 -i full-movie.mp4 -t 15 -c copy clips/my-scene.mp4
```

### Adding Audio to Clips

You can also add audio that plays during the clip (useful for "Guess the Song" variants or adding movie dialogue):

```json
{
  "questions": [
    {
      "clipSrc": "clips/scene.mp4",
      "audioSrc": "clips/scene-audio.mp3",
      "options": ["Movie A", "Movie B", "Movie C", "Movie D"],
      "correctIndex": 0
    }
  ]
}
```

The audio plays during the clip countdown and stops when the answer is revealed. You can use `audioSrc` with or without `clipSrc`:

- **`clipSrc` + `audioSrc`** — Video plays with separate audio track
- **`audioSrc` only** — Audio plays over the simulated countdown box (great for audio-only quizzes)
- **`clipSrc` only** — Silent video clip

#### Extracting audio from video

```bash
# Extract audio from a movie clip
ffmpeg -i clips/scene.mp4 -vn -t 15 clips/scene-audio.mp3
```

### Tips
- `clipDuration: 10-15` works best for engagement — long enough to think, short enough to be exciting
- Use `clipLabel` to give viewers a hint during the clip (genre, era, category)
- 3 clips at 15s + 10s think time makes a ~2 minute video
- Without `clipSrc`, the template shows a simulated countdown box (no actual video)
- MP4 files render much faster than WebM — always use MP4 when possible

---

## Creating Content Ideas

### MCQ Quiz Topics
- General Knowledge
- Science & Nature
- History
- Geography (Capitals, Flags)
- Sports
- Technology
- Food & Cooking
- Language & Literature

### Guess the Song Categories
- Pop Hits 2020s
- Classic Rock
- Bollywood Songs
- 90s Nostalgia
- Hip Hop Classics
- Movie Soundtracks
- One-Hit Wonders

### Guess the Movie Categories
- Bollywood Classics
- Marvel / DC
- Disney / Pixar
- 90s Movies
- Horror Movies
- Oscar Winners
- Anime Movies

### Guess the Clip Categories
- Bollywood Scenes
- Famous Movie Moments
- Guess the City (travel footage)
- Guess the Landmark
- Guess the Sport (game highlights)
- Guess the Animal (nature clips)
- Guess the Dance Move

---

## Video Output

### Format
- Resolution: 1080×1920 (portrait / 9:16)
- Format: MP4 (H.264)
- Ideal for: YouTube Shorts, TikTok, Instagram Reels

### Duration Guide

| Questions | Think Time | Approx Duration |
| --- | --- | --- |
| 3 | 10s | ~1 minute |
| 5 | 10s | ~2 minutes |
| 5 | 8s | ~1.5 minutes |
| 10 | 8s | ~3 minutes |
| 10 | 5s | ~2 minutes |

YouTube Shorts max is 60 seconds — use 3 questions with 8-10s think time for Shorts.

---

## Troubleshooting

### Video renders but looks blank
Check that your JSON has the correct `"template"` value. It must exactly match one of: `mcq`, `guess-song`, `guess-movie-emoji`, `guess-the-clip`.

### Text is cut off or overlapping
- Shorten your question text (under 80 characters)
- Shorten option text (under 30 characters each)
- For movie emoji template, use 2-4 emojis max

### Emojis show as boxes
Some emojis (especially country flags and newer emojis) don't render in the headless browser. Stick to common emojis: animals, objects, food, people, weather, sports.

### Render is slow
- Increase `--workers` (try `4` if you have a multi-core machine)
- Reduce question count
- Close other heavy applications

### "File not found" error
Make sure the path to your JSON file is correct and relative to the project root:
```bash
# Correct
npm run render data/mcq/my-quiz.json

# Wrong
npm run render my-quiz.json
```
