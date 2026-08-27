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
8. renders a live **Progress** map from curriculum + learner state + evidence
9. updates the page automatically as Pi continues the lesson

No framework, database, build step or extra npm package is required.

## Division of responsibility

```text
Browser
= read lessons
= answer graded quizzes
= attach notes to answers
= ask Pi questions / make comments
= read Pi replies
= inspect the living Progress map

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
checkpoint / progress-ledger / evidence logic continues
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

## Living progress map

The header contains two views:

```text
Lesson | Progress
```

The **Progress** view is derived live from:

- `.pi/curriculum/path.md` — the available paths, nodes and topics
- `.pi/learner/state.md` — especially the `## Progress ledger`
- `.pi/learner/checkpoint.md` — current node/topic and next action
- `.pi/learner/evidence/` — durable evidence count/history

There is deliberately **no separate progress database** and no manually maintained `progress.md` percentage file.

### What the percentage means

Each curriculum topic has an evidence stage:

```text
not assessed  = 0%
recognition   = 25%
recall        = 50%
application   = 75%
production    = 100%
```

The node/path percentage is the average evidence stage across its curriculum topics. `mastered` also renders as fully evidenced for aggregation.

This is an orientation metric, not a claim that knowledge is permanently retained. Topic-level stage/status remains more important than the headline percentage.

Examples:

- reading an explanation = **no progress increase**
- a multiple-choice answer can support `recognition`
- reconstructing the idea without choices can support `recall`
- correctly using the idea on a different problem can support `application`
- independent implementation can support `production`
- `mastered` still requires the normal evidence standard and can later become `review-due`

### Progress ledger

Pi maintains rows in `.pi/learner/state.md` using:

```text
| Node | Topic | Stage | Status | Evidence | Last updated |
```

`Topic` must match the exact bullet wording in the curriculum so the browser can map it reliably.

Untouched topics are intentionally absent from the ledger and display as **not assessed**.

The map currently shows:

- current checkpoint topic / node / next action
- high-level path cards
- path evidence percentage
- mastered / practising / review-due / not-assessed counts
- node-level percentage
- every curriculum topic and its evidence stage/status
- evidence-file count

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
- `.pi/learner/state.md` — curriculum state + granular Progress ledger
- `.pi/learner/evidence/` — demonstrated capability
- `.memory/` — observational context

If Pi is interrupted, start it again and type `learn`. The learning-path skill should resume from the checkpoint and the browser environment will open again.

## Scope

Keep this deliberately small.

The browser provides the high-value interaction loop: lesson reading, graded quiz answering, free-text feedback and evidence-driven progress visibility. It is not intended to become a general LMS, authentication system, dashboard platform or replacement IDE.
