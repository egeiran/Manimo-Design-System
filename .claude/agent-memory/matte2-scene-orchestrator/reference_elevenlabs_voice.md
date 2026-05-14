---
name: reference_elevenlabs_voice
description: ElevenLabs voice + model pinned across all mat2b scenes
metadata:
  type: reference
---

Every mat2b scene uses the same TTS voice for vocal consistency:

- Voice id: `JBFqnCBsd6RMkjVDRZzb` (ElevenLabs "George" — calm British male)
- Model: `eleven_multilingual_v2`
- Engine: `elevenlabs` (default of `npm run audio <id>` — single-track `/with-timestamps`)

The voice + model are the script defaults in `scripts/generate-audio.js`, so plain `npm run audio <id>` is enough — no flags needed. Confirmed in `motion/mat2b/audio/linear-transformation-grid/manifest.json`.

**How to apply:** do NOT pass `--voice` for mat2b scenes; let the default propagate. If a future scene ever needs a different voice, document the deviation here.
