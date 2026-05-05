# Manimo — Plan

Forward-looking plan and the rolling nightly-agent queue. Completed work
lives in git history, not here.

---

## Nightly agent queue

Single rolling section. The nightly agent processes [AGENT] items, removes
them from this list when done (git history is the audit trail), and appends
new items found during the run. Items tagged [HUMAN] are skipped by the agent
and require your input. Total queue size is kept ≤ 12 items.

### [AGENT] — safe for the next nightly run

_(empty — append new items as they're discovered)_

### [HUMAN] — needs your input

- **Next topic candidates beyond Spring Oscillation.** Adjacent picks
  that build on the spring-oscillation scene: §3.3 Pendel (small-angle
  pendulum, T = 2π√(L/g) — sets up "period independent of mass"),
  §2.3 Dreiemoment (torque, τ = r×F — needed before §2.4 spinn),
  §4.1 Coulombs lov (F = kq₁q₂/r², the electromagnetism opener). Reply
  in chat with a pick or say "agent's choice".

---

## Later — not blocking, in priority order

- **TTS pipeline** — `window.sceneNarration` → audio file via a TTS API
  (ElevenLabs or browser Web Speech API for prototyping). The narration
  stubs in each scene make this a one-afternoon task.
- **KaTeX formula rendering** — Replace Unicode formula strings (`½MR²`)
  with properly typeset math via KaTeX → SVG paths fed into `TraceIn`.
  Necessary for complex multi-line derivations.
- **More TFY4125 scenes** — Adding scenes is cheap now that
  `scripts/generate-scene.js` exists. Candidates: Newton's laws, energy
  conservation, wave interference, thermodynamics basics.
- **Watch UI** — Wire the watch player to the scene manifest so students
  can browse and play lessons. A thin layer on top of the existing mock.
