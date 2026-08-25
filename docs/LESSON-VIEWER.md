# Live Lesson Viewer

The learning system uses Pi as the interactive tutor while a lightweight browser page acts as the comfortable reading surface for lessons.

## Normal flow

From the learning project root:

```text
pi
> learn
```

On the first `learn` prompt in a Pi session, `extensions/lesson-viewer.ts` automatically:

1. creates a lesson transcript under `lessons/`
2. starts an HTTP server bound only to `127.0.0.1` on a free port
3. opens the lesson in the default browser
4. mirrors assistant lesson prose, questions, quiz results and explanations into the page
5. refreshes the page automatically as the lesson progresses

No framework, database, build step or external package is required.

## Division of responsibility

```text
Browser
= read the lesson, examples, traces and explanations

Pi terminal
= answer quizzes, respond to questions, ask for clarification

Editor / terminal
= independent coding exercises

Obsidian
= personal notes and explanations in your own words
```

The Pi transcript will still contain the assistant's teaching text because it remains the canonical conversation, but the browser should be treated as the main reading surface.

## Commands

```text
/lesson
```

Opens or re-opens the current live lesson page.

```text
/lesson-stop
```

Stops the local lesson HTTP server. It can be started again with `/lesson` or another learning session.

## Persistence

Lesson Markdown is a readable workbook/history. It is **not** the mastery source of truth.

Progress continues to live in:

- `.pi/learner/checkpoint.md` — exact immediate resume point
- `.pi/learner/state.md` — curriculum state
- `.pi/learner/evidence/` — demonstrated capability
- `.memory/` — observational context

If Pi is interrupted, start it again and type `learn`. The learning-path skill should resume from the checkpoint while the new lesson viewer starts automatically.

## Scope

Keep this deliberately small for now. The browser viewer renders Markdown and follows the lesson live. Quiz interaction remains in Pi.

Do not add an LMS, authentication, database, React app, dashboards or browser-side grading unless real usage demonstrates a need.
