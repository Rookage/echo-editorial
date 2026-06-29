# Echo Editorial / 回声编辑部

Use this project when the task is about turning short-video material into editable content assets: transcript, platform copy, voiceover, and vertical video.

## Product Frame

回声编辑部 is a local-first AI editorial room. Its direction is not a one-shot rewrite pipeline, but an editorial workflow:

```text
source -> topic judgment -> draft -> review -> package -> feedback
```

Current implementation already supports the content-generation core:

1. Input Douyin URL, local MP4, or manual copy.
2. Extract page description or full transcript.
3. Rewrite into Xiaohongshu or Douyin Select styles.
4. Generate Chinese TTS voiceover.
5. Synthesize a vertical MP4.

## Project Structure

```text
echo-editorial/
├── server.js             # Express backend, API routes, extraction, rewrite, TTS, video generation
├── transcribe.py         # faster-whisper ASR, one-shot and daemon mode
├── tts.py                # edge-tts voice generation with SSML
├── services/
│   └── imageSearch.js    # DeepSeek keyword generation + Pexels image search
├── public/               # local app UI
├── docs/                 # GitHub Pages landing page
├── PROJECT_CHARTER.md    # product north star
└── .env.example          # DEEPSEEK_API_KEY, PEXELS_API_KEY
```

## Useful Commands

```bash
npm install
pip install edge-tts faster-whisper
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/config` | GET/POST | Read or save local API key config |
| `/api/extract` | POST | Extract Douyin page description |
| `/api/transcript` | POST | Download video and generate transcript |
| `/api/upload` | POST | Upload MP4 and generate transcript |
| `/api/rewrite` | POST | Rewrite text, style: `xhs` or `douyin` |
| `/api/tts` | POST | Generate MP3 voiceover |
| `/api/video/generate` | POST | Generate vertical MP4 |
| `/api/clear-cache` | POST | Clear browser, temp, video, image, upload cache |

## Product Direction

Keep future work aligned with `PROJECT_CHARTER.md`:

- First: editorial OS, a creator workflow with topic, draft, review, package, feedback.
- Next: template ecosystem, where editorial methods become shareable assets.
- Later: publishing and data feedback loops.

Avoid reintroducing legacy naming, pixel-game styling, or visual language that conflicts with Echo Editorial. The direction is bright, clean, efficient, and editorial.
