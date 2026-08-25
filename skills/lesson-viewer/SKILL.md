---
name: lesson-viewer
description: Use during Pablo's `learn` sessions so long-form teaching is consumed in the automatic browser lesson viewer while Pi remains the interactive quiz/control surface in the terminal.
---

# Browser-first lesson workflow

During a learning session, the browser lesson viewer is the preferred place for Pablo to **read and study long-form teaching content**.

The Pi terminal remains the place where Pablo:

- starts/resumes learning with `learn`
- answers `quiz` and `ask_user_question` prompts
- gives short free-text answers
- asks for clarification
- performs terminal/editor exercises
- receives concise transitions and feedback

The `lesson-viewer` extension automatically starts a local viewer when a `learn` prompt is seen, creates a Markdown lesson transcript under the project's `lessons/` directory, opens the browser, and mirrors teaching/Q&A there live.

## Presentation rule

Do not require Pablo to study a long explanation inside the terminal.

When delivering a substantial explanation:

1. Structure it as good Markdown with clear headings, short paragraphs, code fences, tables or traces where useful.
2. Assume the same content is being mirrored into the live browser lesson page.
3. Keep the interactive rhythm obvious: explanation → terminal question/quiz → feedback → next explanation.
4. When useful, briefly tell Pablo to read the updated lesson in the browser and then answer the question in Pi.
5. Do not create bespoke HTML, CSS, JavaScript, React components, or a separate lesson application. The extension owns presentation; the teaching agent owns content.

The terminal transcript may still contain the teaching text because it is Pi's canonical conversation, but Pablo should not be expected to use the terminal as the main reading surface.

## Lesson content

Browser presentation does not change the teaching method. Continue to follow `teach` and `plain-language`:

- foundations first
- plain English before jargon
- layered explanations
- concrete execution traces
- real technical model after intuition
- learner reconstruction
- transfer checks
- independent practice

The browser is only a better reading surface; it must not make the lesson more passive.

## Interaction boundary

Keep answers and grading in Pi for now.

Do not move quiz submission into the browser. The live page may display the current question and later show the result, but Pablo answers through the existing terminal quiz UI.

This deliberately keeps v1 simple:

```text
Pi chooses/teaches
      ↓
Browser displays lesson comfortably
      ↓
Pi asks question
      ↓
Pablo answers in terminal
      ↓
Browser updates with result/explanation
      ↓
Checkpoint is updated
```

## Persistence

The browser lesson transcript is a readable learning artifact, not the source of truth for mastery.

Continue to use:

- `.pi/learner/checkpoint.md` for immediate resume position
- `.pi/learner/state.md` for durable curriculum progress
- `.pi/learner/evidence/` for demonstrated capability
- `.memory/` for observational context

The lesson Markdown is primarily the human-readable workbook/history of what was taught and attempted.
