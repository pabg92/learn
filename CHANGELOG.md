# Changelog

All notable changes to Pablo's learning fork are tracked here.

## 2026-08-27 — Browser interaction v0.2

### Interactive learning environment

- Upgraded the browser lesson viewer from a read-only surface into the primary learning interaction surface.
- Added `extensions/learning-bridge.ts`, a small in-process bridge shared by the browser viewer and graded quiz tool.
- Graded `quiz` questions can now be answered directly in the browser while preserving the normal Pi tool-result/grading flow.
- Browser quiz answers support an optional note so reasoning, uncertainty or misconceptions can travel with the answer.
- Added an explicit **I don't know** choice in the browser to distinguish a genuine gap from a guess.
- Added **Use terminal instead** so the existing terminal interaction remains available as a fallback.
- Browser activity is heartbeat-checked; if the browser is not actually connected, quizzes fall back to terminal instead of waiting indefinitely.
- Added a 30-minute browser-answer safety timeout before terminal fallback.

### Browser → Pi feedback

- Added a free-text question/comment box to the learning environment.
- Browser comments use Pi's supported `sendUserMessage()` API and enter the same active Pi conversation as normal user messages.
- Pi replies continue to be mirrored into the browser lesson automatically, so the browser can be used for an ongoing teaching conversation rather than only static reading.
- Existing checkpoint, evidence, learner-state and observational-memory behaviour remains downstream of the same Pi session rather than being duplicated in a second web agent.

### Architecture

- Pi remains the tutor/runtime and source conversation.
- Browser = lesson reading, quiz answering, notes and free-text feedback.
- Pi terminal = control surface and fallback.
- Editor/terminal = independent coding lab.
- The server remains localhost-only (`127.0.0.1`) and dependency-free: no React, Vite, Next.js, database or external web service was introduced.

## 2026-08-25 — Learning OS v0.1

### Added

- Persistent learning curriculum built around the NVIDIA Level 6 apprenticeship, with Python as the default foundation backfill track.
- `skills/learning-path/` to route `learn` sessions through apprenticeship priorities, due reviews, Python progression, prerequisite backfill and applied-AI parking.
- `curriculum/` with the staged Python, CS, maths, ML, software-engineering and applied-AI learning paths.
- `learner/state.md` as the explicit source of truth for current curriculum progress.
- `learner/evidence/` for auditable proof of recognition, recall, application and independent production.
- AI-off programming assessment rules so implementation ability is measured separately from AI-assisted competence.
- Spaced-retrieval policy using an approximate 1d → 3d → 7d → 14d → 30d → 90d cadence.
- `curriculum/parking-lot.md` to capture interesting tools/frameworks without interrupting the active learning track.
- `docs/LEARNING-OS.md` as the single-page operating reference for the whole system.

### Teaching improvements

- Added `skills/plain-language/` so lessons use plain English before technical terminology.
- Extended the teaching style from shallow analogy-first explanations to layered teaching: intuition → concrete execution trace → real model → terminology → contrasting cases → learner reconstruction → transfer check.
- Added explicit guidance to distinguish analogies from literal runtime/memory behaviour.

### Continuity and memory

- Added `learner/checkpoint.md` as an immediate crash/disconnect-safe resume point.
- Updated `learning-path` so the checkpoint is read first whenever `learn` starts.
- Checkpoints are intended to be updated after every meaningful learner turn, including quiz answers, explanations, coding attempts, corrections and hint requests.
- Checkpoints capture the most recent task, learner answer, result, misconception/uncertainty, assessment level and exact next action.
- Observational memory remains the richer historical/context layer; checkpoint/state/evidence remain separate so conversational memory is not treated as mastery.

### Lesson reading experience

- Added `extensions/lesson-viewer.ts`, a lightweight localhost-only browser lesson viewer using Node built-ins only.
- The viewer keeps Pi as the tutor/quiz/control surface while moving long-form explanations, code traces and Markdown rendering into the browser.
- `learn` sessions can create/use a current Markdown lesson, start the viewer in the background and open it automatically.
- Added `/lesson` to open/reopen the lesson viewer and `/lesson-stop` to stop it.
- Added `skills/lesson-viewer/` to define the browser as the primary reading surface while keeping answers and interaction in the terminal.
- Added `docs/LESSON-VIEWER.md` with the usage and architecture notes.
- The viewer intentionally avoids React, Next.js, Vite, databases or additional npm dependencies.

### Current operating model

- Priority 1: keep the NVIDIA Level 6 apprenticeship moving.
- Priority 2: complete the Python Foundation Sprint and become independently capable in Python.
- CS/SWE are pulled in when they support Python or apprenticeship work.
- Maths is taught just in time when a current ML concept exposes the prerequisite.
- ML reinforcement follows the apprenticeship rather than becoming a competing syllabus.
- Applied-AI exploration is intentionally subordinate to foundation progress unless it is directly relevant to urgent work.

### Scope guardrail

- The system is considered usable enough to learn with now.
- Further architecture/UI work should be driven by observed learning friction rather than feature ideas.
