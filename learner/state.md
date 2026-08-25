# Learner State

This file is the explicit source of truth for curriculum progress. Conversational memory may inform it, but must not silently replace it.

## Current strategy

The NVIDIA Level 6 apprenticeship is the learning spine. Python is the primary foundation backfill and the default track whenever there is no urgent apprenticeship work or due review.

CS and software engineering should be learned through Python and real engineering tasks. Maths should normally be pulled in just in time when an ML concept requires it. ML reinforcement follows the apprenticeship rather than competing with it.

## Current priorities

1. Keep NVIDIA Level 6 apprenticeship work current.
2. Complete the Python Foundation Sprint and build independent Python fluency.
3. Backfill CS/SWE concepts exposed by Python or apprenticeship work.
4. Pull maths prerequisites forward only when needed to genuinely understand the current ML concept.
5. Reinforce ML topics introduced by the apprenticeship.
6. Keep unrelated Applied AI exploration parked unless directly relevant.

## Active milestone

### Python Foundation Sprint

Target outcome:

> Independently solve small programming problems and build straightforward Python scripts without asking an AI to write the implementation.

Nominal envelope: ~12 weeks, but progression is evidence-driven rather than time-driven.

Current stage: **A0 Baseline — diagnostic probe**

## Track status

| Track | Current node | State | Confidence | Independent evidence | Next action |
|---|---|---|---:|---|---|
| Apprenticeship | current QA module | active | n/a | assessed externally | keep deadlines current |
| Python | A0 Baseline | probing | 0/5 | none recorded | diagnostic probe |
| Computer science | B0 Computing model | support-track | 0/5 | none recorded | pull in through Python when needed |
| Software engineering | C0 Engineering workflow | support-track | 0/5 | practical experience exists, not yet independently benchmarked | interleave with Python |
| Maths for ML | D0 Algebra foundations | just-in-time | 0/5 | none recorded | probe only when current ML work requires it |
| Machine learning | E0 ML problem framing | reinforcement | 2/5 | apprenticeship work exists, not yet assessed here | follow apprenticeship gaps |
| Applied AI engineering | F | parked/default-off | 0/5 | substantial practical exposure, not yet independently benchmarked | use only for work/apprenticeship relevance |

Confidence is deliberately conservative until this system has directly tested the topic.

## Mastery record

A node may move to `mastered` only when its evidence file demonstrates the required recognition, recall, application and (where relevant) independent production.

No mastered nodes recorded yet.

## Review queue

No scheduled reviews yet. Reviews should be created when a topic first reaches `mastered` or when the learner demonstrates fragile understanding.

Suggested retrieval cadence: 1d → 3d → 7d → 14d → 30d → 90d, adapting based on performance.

## Focus rules

- Default to Python when there is no urgent apprenticeship work or due review.
- Do not switch tracks because a new tool/model/framework is interesting.
- Capture unrelated interests in `.pi/curriculum/parking-lot.md`.
- Do not redesign the learning system during the initial sprint unless something is genuinely broken.
- Practical competence must be separated from AI-assisted competence.
- Videos, reading and explanations count as input, not mastery evidence.

## Session close protocol

At the end of a meaningful learning session, update only what evidence supports:

- current node/state
- confidence
- misconceptions discovered
- evidence created
- review date
- next action

Never inflate progress to make the session feel successful.