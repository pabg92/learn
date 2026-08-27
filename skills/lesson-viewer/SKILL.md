---
name: lesson-viewer
description: Use during Pablo's `learn` sessions so the automatic browser learning environment is the primary place to read lessons, answer graded quizzes, and send comments/questions back to the same Pi session.
---

# Browser-first learning workflow

During a learning session, the browser learning environment is the preferred place for Pablo to **read, answer, and ask questions**.

Pi remains the tutor/runtime underneath. The browser is an interaction surface for that same live Pi session, not a second agent or separate LMS.

## Division of responsibility

### Browser — primary learning surface

Use the browser for:

- long-form teaching and explanations
- code traces, tables and diagrams
- graded quiz answers
- optional notes explaining why an answer was chosen
- free-text questions and comments to Pi
- reading Pi's subsequent replies as they are mirrored into the lesson

### Pi terminal — control and fallback

Use the terminal for:

- starting/resuming with `learn`
- emergency/manual interaction
- terminal quiz fallback when the browser is unavailable
- commands such as `/lesson` and `/lesson-stop`
- seeing runtime/tool status

### Editor / terminal — practical lab

Actual independent coding exercises still happen in the editor/terminal. The browser should tell Pablo what to build, but it should not turn production assessments into point-and-click exercises.

## Presentation rule

Do not require Pablo to study a long explanation inside the terminal.

When delivering a substantial explanation:

1. Structure it as clear Markdown with headings, short paragraphs, code fences, tables or traces where useful.
2. Assume the content is being mirrored live into the browser.
3. Keep the learning rhythm explicit: explanation → question → answer → feedback → next explanation.
4. Keep terminal prose concise when the browser already contains the full lesson.
5. Do not create bespoke per-lesson HTML. The extension owns the reusable presentation layer; the teaching agent owns the content.

## Browser interaction

The browser may submit a graded `quiz` answer directly into the same tool execution. This must preserve the normal quiz result so the agent, checkpoint, evidence and transcript see the answer exactly as if it had been supplied through the terminal UI.

The browser may also send a free-text comment/question back through Pi as a real user message. Pi's answer should then be mirrored into the lesson normally.

Browser interaction must not bypass:

- grading
- checkpoint updates
- learner state/evidence rules
- observational memory
- the `teach` / `plain-language` process

The terminal remains a fallback. If the browser is not actively connected, quizzes should use the terminal rather than blocking indefinitely.

## Teaching method remains unchanged

Continue to follow `teach` and `plain-language`:

- foundations first
- plain English before jargon
- layered explanations
- concrete execution traces
- real technical model after intuition
- learner reconstruction
- transfer checks
- independent practice

A better interface must not make learning more passive.

## Persistence

The lesson Markdown is a human-readable workbook/history, not the source of truth for mastery.

Continue to use:

- `.pi/learner/checkpoint.md` for the immediate resume position
- `.pi/learner/state.md` for durable curriculum progress
- `.pi/learner/evidence/` for demonstrated capability
- `.memory/` for observational context
