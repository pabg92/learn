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

1. `.pi/curriculum/README.md`
2. `.pi/curriculum/path.md`
3. `.pi/learner/state.md`
4. Relevant files under `.pi/learner/evidence/`
5. Relevant durable observational memory under the project's `.memory/` tree if available

Treat these sources differently:

- `.pi/curriculum/*` = what should be learned and in what dependency order
- `.pi/learner/state.md` = explicit current progress
- `.pi/learner/evidence/*` = proof of demonstrated capability
- observational memory = context, misconceptions, preferences and historical detail

Observational memory may suggest a state change, but it is not itself proof of mastery.

## When the user says `learn`

If no topic is specified:

1. Check for urgent apprenticeship work or a current assessed task.
2. Check for overdue or fragile reviews.
3. If neither exists, select the next Python node whose prerequisites are satisfied.
4. Pull CS, SWE, maths or ML concepts into the session only when they are genuine dependencies of the current task.
5. Do not select Applied AI merely because it is interesting.
6. Tell the user what was selected and why it is the highest-value next step.
7. Invoke the `teach` process: probe → plan → teach → application.

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

### Conversation memory
Useful facts such as recurring misconceptions, explanations that clicked, terminology preferences and previous attempts. Allow observational memory to capture these.

### Curriculum state
Explicitly maintained in `.pi/learner/state.md`. Only update when the session provides evidence.

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

1. Summarize what was demonstrated, not merely covered.
2. Record misconceptions that matter for future teaching.
3. Update `.pi/learner/state.md` conservatively.
4. Add/update evidence when warranted.
5. Record the next review or next node.
6. If a distracting new technology came up, capture it in `.pi/curriculum/parking-lot.md` rather than switching tracks.
7. Preserve the default next action: continue the apprenticeship if urgent; otherwise continue Python.

Never mark a node mastered because the learner said they understand it or because the explanation seemed clear. Evidence decides.