# Interactive Learning Environment

The learning system uses Pi as the tutor/runtime while a lightweight local browser page acts as the primary learning interface.

## Normal flow

From the learning project root:

```text
pi
> learn
```

The learning environment automatically:

1. creates/restores a Markdown lesson transcript under `lessons/`
2. starts an HTTP server bound only to `127.0.0.1` on a free port
3. opens the lesson in the default browser
4. mirrors Pi's lesson prose, code, traces, questions, results and replies into the page
5. renders active graded quizzes as interactive browser controls
6. sends browser quiz answers back into the same `quiz` tool execution
7. sends free-text browser comments/questions into the same Pi conversation with `sendUserMessage()`
8. updates the page automatically as Pi continues the lesson

No framework, database, build step or extra npm package is required.

## Division of responsibility

```text
Browser
= read lessons
= answer graded quizzes
= attach notes to answers
= ask Pi questions / make comments
= read Pi replies

Pi terminal
= start/resume with learn
= runtime/control surface
= quiz fallback if browser is unavailable
= commands and diagnostics

Editor / terminal
= independent coding exercises

Obsidian
= personal notes and explanations in your own words
```

The browser is not a second chatbot. Everything feeds into the same Pi session, so the existing teaching skill, checkpointing, evidence, state and memory continue to work.

## Browser quiz flow

```text
Pi calls quiz
      ↓
quiz publishes the shuffled question/options to the shared bridge
      ↓
browser renders the live question
      ↓
you choose an answer + optional note
      ↓
browser POSTs the answer to localhost
      ↓
quiz tool resolves and grades normally
      ↓
Pi receives the real quiz result
      ↓
checkpoint/evidence logic continues
      ↓
Pi reply is mirrored into the browser
```

If the browser is not actively polling the viewer, `quiz` falls back to terminal UI rather than waiting for a browser that is not there. The browser also includes **Use terminal instead**.

## Free-text comments/questions

When no graded quiz is waiting, the bottom of the page contains a text box.

Sending a message there calls Pi's supported `sendUserMessage()` API. It enters the active session as a normal user message, triggers/queues Pi's response, and that reply is mirrored back into the browser lesson.

Use this for things like:

- "I don't understand this step"
- "Can you explain that with another example?"
- "I think this means X — is that right?"
- comments about what clicked or what is still confusing

Those messages therefore remain available to checkpointing and observational memory just like terminal messages.

## Commands

```text
/lesson
```

Opens or re-opens the current browser learning environment.

```text
/lesson-stop
```

Stops the localhost server. If a browser quiz is pending, the system releases it back to terminal fallback instead of leaving the tool stuck.

## Local-only design

The HTTP server binds only to:

```text
127.0.0.1
```

It is not intentionally exposed to the LAN or Internet.

## Persistence

Lesson Markdown is a readable workbook/history. It is **not** the mastery source of truth.

Progress continues to live in:

- `.pi/learner/checkpoint.md` — exact immediate resume point
- `.pi/learner/state.md` — curriculum state
- `.pi/learner/evidence/` — demonstrated capability
- `.memory/` — observational context

If Pi is interrupted, start it again and type `learn`. The learning-path skill should resume from the checkpoint and the browser environment will open again.

## Scope

Keep this deliberately small.

The browser currently provides the high-value interaction loop: lesson reading, graded quiz answering and free-text feedback. It is not intended to become a general LMS, authentication system, dashboard platform or replacement IDE.
