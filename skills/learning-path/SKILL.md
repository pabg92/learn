---
name: learning-path
description: Route learning sessions through Pablo's persistent curriculum, learner state, evidence and review system. Use when the user says learn, asks what to learn next, resumes a learning topic, or completes a meaningful learning assessment.
---

# Persistent Learning Path

This skill coordinates the existing `teach` skill with the repository's persistent curriculum.

This repository is installed as the project's `.pi` directory. Therefore curriculum and learner files are addressed from the project root as `.pi/...`.

## Core objective

The goal is to help Pablo become an independently capable ML/AI engineer by using the NVIDIA Level 6 apprenticeship as the main curriculum while systematically backfilling weak Python, CS, software engineering and mathematical prerequisites.

Do not turn the foundation work into a competing degree. Foundations exist to remove blockers and build independent engineering competence.

## Non-negotiable priority model

Use this hierarchy when choosing what to work on:

1. **Urgent NVIDIA Level 6 apprenticeship work**
2. **Due/fragile retrieval review**
3. **Python foundation progression**
4. **CS/SWE prerequisites exposed by Python or apprenticeship work**
5. **Maths prerequisites required for the current ML concept**
6. **ML reinforcement tied to the apprenticeship**
7. **Applied AI exploration**

Python is the default foundation track. Maths is taught just in time rather than as a long prerequisite wall. ML reinforcement should follow the apprenticeship rather than creating a separate competing syllabus.

## Source of truth

Before selecting or resuming a topic, read:

1. `.pi/learner/checkpoint.md`
2. `.pi/curriculum/README.md`
3. `.pi/curriculum/path.md`
4. `.pi/learner/state.md`
5. Relevant files under `.pi/learner/evidence/`
6. Relevant durable observational memory under the project's `.memory/` tree if available

Treat these sources differently:

- `.pi/learner/checkpoint.md` = immediate crash-safe record of the most recent learning turn and exact resume point
- `.pi/curriculum/*` = what should be learned and in what dependency order
- `.pi/learner/state.md` = explicit durable progress across topics, including the granular Progress ledger
- `.pi/learner/evidence/*` = proof of demonstrated capability
- observational memory = richer context, misconceptions, preferences and historical detail

Observational memory may suggest a state change, but it is not itself proof of mastery. The checkpoint is for continuity, not mastery.

## Immediate checkpointing — after every meaningful learner turn

Learning continuity must not depend on a graceful session close.

After **every meaningful learner response** during a `learn` session — especially every quiz answer, prediction, explanation, coding attempt, hint request, correction or assessment result — update `.pi/learner/checkpoint.md` before moving on.

The checkpoint should stay compact and contain:

- timestamp
- active track and curriculum node
- current lesson/topic
- what question/task was just attempted
- learner's answer or a short summary of it
- correct / incorrect / partial / not-graded
- what the result demonstrates
- misconception or uncertainty discovered, if any
- important note about what explanation clicked or did not click
- current assessment level: recognition / recall / application / production
- exact next action

Do not wait until the end of the lesson. If the process disconnects immediately after a wrong quiz answer, the checkpoint should already contain enough information to resume intelligently.

Do **not** treat a checkpoint entry as evidence of mastery by itself. Promote meaningful results into `.pi/learner/evidence/` and `.pi/learner/state.md` only when warranted.

## Living progress map

The browser learning environment renders a living progress map directly from the curriculum and the `## Progress ledger` table in `.pi/learner/state.md`.

The map is **derived state**. Do not create a separate dashboard database or manually maintained percentage file.

After checkpointing a meaningful learner turn, decide whether that turn changes the directly supported evidence stage or status for one curriculum topic. If it does, upsert the corresponding row in the Progress ledger before continuing.

Use this exact schema:

```text
| Node | Topic | Stage | Status | Evidence | Last updated |
```

Rules:

1. `Node` must be the exact curriculum node such as `A0`, `A1`, `D2` or `E1`.
2. `Topic` must use the exact bullet wording from `.pi/curriculum/path.md`, e.g. `Functions and scope`. A sublesson such as `print() vs return` belongs in the checkpoint but maps to its nearest curriculum topic.
3. `Stage` is one of `recognition`, `recall`, `application`, `production`.
4. `Status` should normally be `probing`, `practising`, `review-due`, or `mastered`.
5. `Evidence` is a compact pointer or description such as `checkpoint: return-value transfer check` or an evidence filename. Do not paste long transcripts into the table.
6. `Last updated` should be an ISO date or timestamp.
7. Do not create rows for untouched topics. Missing rows intentionally mean `not assessed`.
8. Do not advance a stage because content was explained or read. Input is not evidence.
9. A multiple-choice success can support recognition, but should not by itself establish recall or application if guessing/recognition cannot be ruled out.
10. Recall requires the learner to reconstruct the idea without answer choices or heavy prompting.
11. Application requires correct use or reasoning on a meaningfully different example/problem.
12. Production requires independent creation/implementation where production is appropriate.
13. `mastered` still requires the normal evidence standard; never use it merely because the stage reached production once.
14. A failed review may lower the currently supported stage/status when previous evidence is no longer reliable. Do this conservatively and preserve durable evidence/history rather than rewriting history to look cleaner.

At the start of `learn`, if the current local checkpoint contains a clear assessed result that is not yet represented in the ledger, reconcile that **specific checkpoint result** conservatively. Do not mine old chat history or observational memory to manufacture backfilled progress.

This makes progress update as a side effect of real learning rather than as an extra administrative task.

## Resume behaviour

When the user says `learn`, inspect `.pi/learner/checkpoint.md` first.

If it contains an unfinished learning thread:

1. Resume that thread before selecting a new curriculum node, unless urgent apprenticeship work overrides it.
2. Briefly orient the learner in plain English, e.g. "Last time we were working on function arguments. You predicted X; the result showed Y. Let's pick up there."
3. If the previous turn exposed a misconception, begin by checking or repairing that misconception rather than restarting the whole diagnostic.
4. If the previous task was completed and the checkpoint explicitly identifies a next node/review, continue from that next action.
5. Never restart A0 or another broad diagnostic merely because this is a new Pi session.

A fresh session should feel like reopening a workbook at the page where the learner stopped.

## When the user says `learn`

If no topic is specified:

1. Read the checkpoint and resume unfinished work if present.
2. Reconcile any clear checkpoint evidence missing from the Progress ledger.
3. Check for urgent apprenticeship work or a current assessed task.
4. Check for overdue or fragile reviews.
5. If neither exists, select the next Python node whose prerequisites are satisfied.
6. Pull CS, SWE, maths or ML concepts into the session only when they are genuine dependencies of the current task.
7. Do not select Applied AI merely because it is interesting.
8. Tell the user what was selected and why it is the highest-value next step.
9. Invoke the `teach` process: probe → plan → teach → application.

Default bias: if there is no good reason to do something else, continue Python.

If a topic is specified:

1. Locate it in the curriculum.
2. Identify its prerequisites.
3. Probe prerequisite gaps before teaching the requested node.
4. If it is directly relevant to an apprenticeship module, teach the minimum prerequisite chain needed to make progress and then return to the module.
5. If the topic is outside the current curriculum and not urgent, determine whether it belongs in Applied AI or the parking lot.

## Focus protection

The learner has a parking lot specifically so curiosity does not become the scheduler.

When an interesting new tool, framework, model, repository or technology appears:

1. Determine whether it materially changes an urgent apprenticeship task or the current learning dependency chain.
2. If not, capture it briefly in `.pi/curriculum/parking-lot.md`.
3. Do not switch the active learning track.
4. Return immediately to the current node.

Do not encourage redesigning the learning system itself during the initial foundation sprint unless something is genuinely broken. Learning-system optimisation must not become a substitute for learning.

## Python Foundation Sprint

The first major foundation milestone is approximately 12 weeks, adapted by demonstrated mastery rather than calendar completion.

Target outcome:

> Independently solve small programming problems and build straightforward Python scripts without asking an AI to write the implementation.

Use the staged Python curriculum in `.pi/curriculum/path.md`, but probe aggressively so already-mastered material is skipped.

Measure progress through outputs such as:

- functions implemented independently
- small scripts completed
- bugs diagnosed
- tests written
- retrieval reviews passed
- programming problems solved without AI implementation help

Do not count videos watched, explanations consumed or hours logged as mastery evidence.

## Maths policy

Maths is important but should normally be taught at the point of need.

Examples:

- regression exposes algebra/statistics needs
- gradient descent exposes derivative/gradient needs
- neural networks expose vectors/matrices/chain-rule needs
- classification exposes probability/logarithm needs

Teach enough to make the ML idea genuinely understandable, then revisit and deepen through spaced retrieval. Do not force completion of a broad maths syllabus before allowing practical ML progress.

## Persistence during a session

The tutor must distinguish:

### Immediate checkpoint

`.pi/learner/checkpoint.md` is updated after every meaningful learner turn so an interruption loses as little progress as possible.

### Conversation memory

Useful facts such as recurring misconceptions, explanations that clicked, terminology preferences and previous attempts. Allow observational memory to capture these.

### Curriculum state

Explicitly maintained in `.pi/learner/state.md`. Update when the session provides evidence or materially changes the learner's position in the curriculum. Maintain the Progress ledger as the granular evidence-backed map over individual curriculum topics.

### Evidence

Create/update an evidence file under `.pi/learner/evidence/` when the learner completes a meaningful assessment, especially an application or production task.

## Assessment ladder

For each substantial node, aim to establish:

1. Recognition
2. Recall
3. Application
4. Production where applicable

Programming mastery requires an independent AI-off attempt unless the node is purely conceptual.

During an AI-off assessment:

- Do not provide the solution.
- Do not autocomplete code.
- Do not give leading hints unless the learner explicitly ends the independent attempt or asks for help.
- After the attempt, review errors and teach from them.

Practical experience, AI-assisted implementation and conversational fluency are useful signals but do not replace independent evidence.

## Review scheduling

When a node becomes mastered, schedule retrieval checks conceptually at:

1 day → 3 days → 7 days → 14 days → 30 days → 90 days.

Adapt the interval based on performance. A failed review moves the node back to `practising` or `review-due`; mastery is not permanent by declaration.

## Session close

At the end of a meaningful session:

1. Ensure `.pi/learner/checkpoint.md` reflects the exact stopping point and next action.
2. Ensure the Progress ledger reflects any evidence-stage/status change demonstrated during the session.
3. Summarize what was demonstrated, not merely covered.
4. Record misconceptions that matter for future teaching.
5. Update `.pi/learner/state.md` conservatively.
6. Add/update evidence when warranted.
7. Record the next review or next node.
8. If a distracting new technology came up, capture it in `.pi/curriculum/parking-lot.md` rather than switching tracks.
9. Preserve the default next action: continue the apprenticeship if urgent; otherwise continue Python.

Never mark a node mastered because the learner said they understand it or because the explanation seemed clear. Evidence decides.