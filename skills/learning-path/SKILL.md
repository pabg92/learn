---
name: learning-path
description: Route learning sessions through Pablo's persistent curriculum, learner state, evidence and review system. Use when the user says learn, asks what to learn next, resumes a learning topic, or completes a meaningful learning assessment.
---

# Persistent Learning Path

This skill coordinates the existing `teach` skill with the repository's persistent curriculum.

## Source of truth

Before selecting or resuming a topic, read:

1. `curriculum/README.md`
2. `curriculum/path.md`
3. `learner/state.md`
4. Relevant files under `learner/evidence/`
5. Relevant durable observational memory if available

Treat these sources differently:

- `curriculum/*` = what should be learned and in what dependency order
- `learner/state.md` = explicit current progress
- `learner/evidence/*` = proof of demonstrated capability
- observational memory = context, misconceptions, preferences and historical detail

Observational memory may suggest a state change, but it is not itself proof of mastery.

## When the user says `learn`

If no topic is specified:

1. Prefer an overdue or fragile review.
2. Otherwise select the highest-priority non-mastered curriculum node whose prerequisites are met.
3. Apprenticeship deadlines override the default ordering.
4. Do not select Applied AI merely because it is interesting if a foundation node is currently more important.
5. Tell the user the selected node and why it is next.
6. Invoke the `teach` process: probe → plan → teach.

If a topic is specified:

1. Locate it in the curriculum.
2. Identify its prerequisites.
3. Probe prerequisite gaps before teaching the requested node.
4. If the topic is outside the current curriculum, determine whether it belongs in Applied AI or the parking lot.

## Persistence during a session

The tutor must distinguish:

### Conversation memory
Useful facts such as recurring misconceptions, explanations that clicked, terminology preferences and previous attempts. Allow observational memory to capture these.

### Curriculum state
Explicitly maintained in `learner/state.md`. Only update when the session provides evidence.

### Evidence
Create/update an evidence file when the learner completes a meaningful assessment, especially an application or production task.

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
- Hints should be withheld until the learner explicitly ends the independent attempt or asks for one.
- After the attempt, review errors and teach from them.

## Review scheduling

When a node becomes mastered, schedule retrieval checks conceptually at:

1 day → 3 days → 7 days → 14 days → 30 days → 90 days.

Adapt the interval based on performance. A failed review moves the node back to `practising` or `review-due`; mastery is not permanent by declaration.

## Session close

At the end of a meaningful session:

1. Summarize what was demonstrated, not merely covered.
2. Record misconceptions that matter for future teaching.
3. Update `learner/state.md` conservatively.
4. Add/update evidence when warranted.
5. Record the next review or next node.
6. If a distracting new technology came up, capture it in `curriculum/parking-lot.md` rather than switching tracks.

Never mark a node mastered because the learner said they understand it or because the explanation seemed clear. Evidence decides.