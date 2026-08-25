# Pablo Learn — Single-Page Reference

## Goal

Build one persistent learning system that helps me make meaningful progress without constantly deciding what to study, searching for new courses, or getting distracted by the next interesting technology.

The end goal is:

> **Become an independently capable ML/AI engineer with enough Python, CS, software engineering and mathematical foundations to understand and build systems properly, while successfully completing the NVIDIA Level 6 Machine Learning Engineer apprenticeship.**

The apprenticeship remains the **main spine** of the curriculum. My biggest foundational blocker is currently **Python**.

---

## Core principle

I should not come home and ask:

- Should I watch CS50?
- Which Python course is best?
- Should I learn maths first?
- Should I do LeetCode?
- Should I watch another ML video?
- Should I investigate a new framework?

Instead:

```text
Open learning workspace
        ↓
Run Pi
        ↓
type: learn
        ↓
Pi decides the highest-value next action
        ↓
I do the work
        ↓
Progress is recorded
        ↓
Repeat
```

My job is **show up and do the work**.

The system's job is **remember, prioritise, teach, test, adapt and track**.

---

## Curriculum structure

### 1. NVIDIA Level 6 Apprenticeship — Primary spine

Apprenticeship deadlines and current modules always take priority.

The programme moves through Gen AI, process optimisation, security/XAI, developing and testing AI solutions, deep learning and transformers, deployment/MLOps, a major project and AI leadership.

### 2. Foundation backfill

These support the apprenticeship rather than competing with it.

**Python — highest priority foundation**

- fundamentals
- functions and scope
- lists, dictionaries, sets
- references and mutability
- files / JSON / APIs
- modules and environments
- classes
- typing
- debugging
- pytest
- problem solving
- data structures and algorithms
- independent coding

**Computer Science**

- memory and computing model
- processes / threads
- complexity
- data structures
- algorithms
- networking
- databases
- Linux fundamentals

**Software Engineering**

- Git
- debugging
- testing
- dependency management
- APIs
- databases
- architecture
- CI/CD
- maintainable code

**Maths — just in time**

Do not stop everything to become a mathematician.

Learn the minimum mathematical prerequisite when ML exposes the need:

```text
Regression → algebra, functions, mean/variance

Gradient descent → rate of change, derivatives, gradients

Neural networks → vectors, matrices, chain rule

Classification → probability, logs, exponentials
```

Maths should have a visible reason to exist.

### 3. ML reinforcement

ML is not a distant fifth-priority subject.

The apprenticeship is already teaching ML.

The learning system reinforces whatever the current apprenticeship module introduces and fills missing prerequisite knowledge.

### 4. Applied AI

Agents, RAG, fine-tuning, local inference, distillation, new frameworks and similar topics remain available, but they do not automatically displace the foundation path.

Interesting distractions go into the **parking lot**.

---

## First formal milestone

# Python Foundation Sprint — 12 weeks

Target:

> **Become independently competent enough in Python to solve small programming problems and build straightforward scripts without asking AI to write the implementation.**

Approximate path:

```text
Fundamentals
    ↓
Functions
    ↓
Collections
    ↓
References / mutability
    ↓
Files / JSON / APIs
    ↓
Modules / environments
    ↓
Classes / typing
    ↓
Debugging / pytest
    ↓
CS concepts through Python
    ↓
Independent problems / projects / LeetCode Easy
```

This is competency-based, not time-based.

If I already demonstrate something, skip it.

If something breaks, stop and teach there.

---

## What `learn` should do

When I type:

```text
learn
```

Pi checks:

```text
1. Urgent apprenticeship work?
2. Review due?
3. Current Python node?
4. Supporting CS/SWE gap?
5. Just-in-time maths gap?
6. ML reinforcement required?
7. Applied AI only if foundations permit
```

If there is no good reason to do something else:

> **Continue Python.**

---

## Normal learning session

A typical 60–90 minute session:

### 1. Probe / retrieval — 5–10 min

Test what I already know.

Do not assume.

Move quickly until Pi finds the edge of my understanding.

### 2. Teach the actual gap — 10–20 min

Teach from foundations.

Connect the new concept to what I already understand.

Avoid memorising disconnected rules.

### 3. Guided application — 20–30 min

Use the concept in a new problem.

Expose misconceptions.

### 4. AI-OFF assessment — 20–30 min

For programming:

- no generated solution
- no autocomplete from Pi
- documentation is allowed
- running code is allowed
- reading tracebacks is allowed
- I must attempt the implementation myself

### 5. Persist — ~5 min

Record:

- what I demonstrated
- what I got wrong
- current state
- evidence
- next node
- review date

---

## Evidence model

Discussion does not equal competence.

Each meaningful topic progresses through:

```text
Recognition
    ↓
Recall
    ↓
Application
    ↓
Production
```

Programming mastery requires independent production where appropriate.

Example:

```text
Python — mutability

Recognition       ✓
Recall            ✓
Application       ✓
Production        △

Weakness:
nested mutable structures

State:
practising

Next review:
3 days
```

---

## Persistence architecture

### Pi

**Tutor / coach / examiner**

Runs the probe → plan → teach → assess loop.

### `.pi/curriculum/`

**What should I learn?**

The curriculum and dependency path.

### `.pi/learner/state.md`

**Where am I now?**

Explicit source of truth for progress.

### `.pi/learner/evidence/`

**What can I actually demonstrate?**

Evidence of independent capability.

### `.memory/`

**What happened previously?**

Observational memory: misconceptions, explanations that worked, historical context and previous sessions.

Observational memory is useful context, but is **not proof of mastery**.

### Obsidian

**My human-facing workbook / scratchpad / learning notebook.**

Use it for:

- explanations in my own words
- mental models
- diagrams
- mistakes
- questions
- reflections
- tiny examples
- apprenticeship notes

Do **not** turn it into an automated dump of AI-generated notes.

The valuable notes are the ones that show how **I** understand something.

### Editor / terminal

**Where actual implementation happens.**

Python exercises, scripts, mini-projects and independent assessments belong here.

---

## Suggested workspace

```text
learning/
│
├── .pi/
│   ├── curriculum/
│   ├── learner/
│   ├── skills/
│   └── ...
│
├── .memory/
│
├── .obsidian/
│
├── 00 Dashboard.md
├── 01 Python/
├── 02 CS/
├── 03 Maths/
├── 04 ML/
├── 05 Apprenticeship/
│
├── Exercises/
└── Projects/
```

The same folder can therefore be:

- Pi project
- Obsidian vault
- coding workspace
- persistent learning record

---

## Role of YouTube, CS50, books and courses

They are **resources, not competing curricula**.

Bad flow:

```text
Open YouTube
→ search for Python
→ compare courses
→ watch recommendations
→ change topic
→ evening disappears
```

Correct flow:

```text
Pi identifies gap
        ↓
Specific external resource is useful
        ↓
Use one targeted section
        ↓
Close resource
        ↓
Return to Pi
        ↓
Demonstrate understanding
```

### Hard rule for the Python sprint

> **No learning-resource discovery during a scheduled learning session.**

Do not spend learning time searching for the perfect way to learn.

---

## Anti-distraction rule

Interesting technology does not automatically become a new learning track.

Instead:

```text
Interesting new thing
        ↓
Capture in parking lot
        ↓
Record why it matters
        ↓
Record prerequisite / future track
        ↓
Return to current work
```

This removes the fear that an idea will be forgotten without sacrificing the current path.

---

## Two main commands

### Normal

```text
learn
```

Let Pi choose the next step.

### Apprenticeship-focused

```text
learn apprenticeship
```

Flow:

```text
Current assignment/module
        ↓
Required knowledge
        ↓
Missing prerequisite
        ↓
Short backfill
        ↓
Return to apprenticeship task
```

---

## Review system

Mastered knowledge is revisited approximately:

```text
1 day
→ 3 days
→ 7 days
→ 14 days
→ 30 days
→ 90 days
```

Intervals adapt based on performance.

A failed review can move something back into practising.

Mastery is not permanent just because it was once understood.

---

## Definition of progress

Do not measure:

- videos watched
- hours of courses completed
- pages read
- AI conversations had

Measure:

- concepts independently demonstrated
- problems solved
- programs written
- bugs diagnosed
- retrieval reviews passed
- apprenticeship work completed
- evidence accumulated

Example:

```text
PYTHON FOUNDATION SPRINT

✓ functions
✓ lists
✓ dictionaries
✓ exceptions
✓ modules
✓ references

Independent programs: 8
Independent problems: 14
Reviews passed: 11

Current:
mutability / copying
```

That is meaningful progress.

---

# Operating rule

For the next 30 days:

**Do not redesign the learning system unless something is actually broken.**

No new:

- dashboards
- vector databases
- memory architectures
- elaborate knowledge graph systems
- learning frameworks

Use it first.

The loop is:

```text
Open workspace
      ↓
Pi
      ↓
learn
      ↓
Do the work honestly
      ↓
Persist
      ↓
Stop
      ↓
Repeat tomorrow
```

## Current focus

**Priority 1:** Successfully progress through the NVIDIA Level 6 Machine Learning Engineer apprenticeship.

**Priority 2:** Complete the Python Foundation Sprint and become independently capable in Python.

Everything else should support one of those two goals rather than compete with them.
