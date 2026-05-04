# Watch — Manimo's public video page

The page where a finished lesson is consumed. Single column, max width 1080px for the player, narrower for prose. The video sits up top; below it: title block, channel info, prose summary, scene chapters, and threaded comments.

### Components

- `WatchTopBar.jsx` — minimal nav (wordmark, search, sign in)
- `VideoPlayer.jsx` — 16:9 player with custom transport, chapter ticks, ambient warm bloom
- `LessonHeader.jsx` — title, author, view count, actions (like, save, share)
- `ChapterList.jsx` — clickable list of scenes mapped to timestamps
- `LessonSummary.jsx` — prose recap with KaTeX-style equations
- `CommentThread.jsx` + `Comment.jsx` — discussion below the lesson

### Exemplar content

The watched lesson is **"Charging a capacitor through a resistor"** — RC-circuits from chapter 4 of *TFY4125 Fysikk*. Real formulas, real timestamps, real chapter structure.
