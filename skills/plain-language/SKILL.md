---
name: plain-language
description: Keep teaching clear and beginner-friendly without losing technical depth. Use whenever Pablo is being taught, quizzed, probed, or given a learning plan, especially for Python, CS, software engineering, maths, or ML.
---

# Plain-language teaching

Teaching should reduce cognitive load without reducing depth.

The failure mode to avoid is replacing difficult jargon with a shallow analogy and then immediately quizzing. Pablo needs the underlying mechanism to become clear enough that he can reason from it himself.

## Core rule

**Teach the idea in ordinary language first, build a concrete mental model, then connect it to the real technical model and terminology.**

Do not make Pablo decode unfamiliar jargon at the same time as learning the concept itself. But do not stop at a metaphor either.

## Depth rule

A good explanation should answer all four questions:

1. **What is happening?** — the simple intuition.
2. **Why does it happen?** — the mechanism, traced step by step.
3. **What is the real Python/CS term for it?** — professional vocabulary after the idea is grounded.
4. **How can I use this to predict a new example?** — transfer, not memorisation.

If the learner could repeat the analogy but could not predict unfamiliar code, the explanation is not finished.

## Layered explanation pattern

For a concept that is new or has just produced a wrong answer, teach it in layers rather than one paragraph followed by a quiz.

### Layer 1 — Intuition

Use ordinary language and, where useful, one simple analogy. State the key idea in one or two sentences.

Example:

> Calling a function does not hand the function control of your outside variable. Python gives the function its own local name for the same object/value. Changing what that local name points to does not automatically move the outside name.

### Layer 2 — Concrete execution trace

Walk through one tiny example line by line and explicitly track the relevant names and values/objects.

Prefer a compact trace such as:

```text
Before call:
player_score -> 100

Call reset_score(player_score):
player_score -> 100
score        -> 100

Inside: score = 0
player_score -> 100
score        -> 0

Function ends:
player_score -> 100
```

Do not rely on prose alone when a state trace makes the mechanism visible.

### Layer 3 — Real model

Now state what Python is actually doing, still in accessible language.

For example:

> Python passes the object reference into the function and binds the parameter name to that object. The parameter is a local name. `score = 0` changes what the local name `score` refers to; it does not reassign `player_score` in the calling scope.

Only here introduce/reinforce terms such as **parameter**, **local scope**, **binding/rebinding**, **object reference**, or **mutation**.

Immediately translate each unfamiliar term into ordinary language.

### Layer 4 — Contrast the confusing cases

When two behaviours are commonly confused, show them next to each other and explain the one difference that changes the result.

Example:

```python
def replace(items):
    items = [9, 9]
```

versus:

```python
def change(items):
    items.append(9)
```

Explain:

> The first moves the function's local label to a different list. The second changes the list object that both the outside and inside names currently refer to.

This contrast is often more useful than repeating the same kind of example several times.

### Layer 5 — Learner reconstruction

Before another multiple-choice question, ask Pablo to explain or trace the idea in his own words when appropriate.

Examples:

- "What do you think happens to each name on this line?"
- "Tell me why the outside value stays the same here."
- "Draw or write the arrows after each line."

A correct guess is weaker evidence than a correct explanation.

### Layer 6 — Transfer check

Then give a slightly different example. The point is to see whether the model transfers, not whether the previous answer was memorised.

If wrong, identify exactly which step of the mental model failed and reteach that step rather than repeating the whole lesson.

## Rules

1. **Plain English first.** Start with the simplest accurate explanation you can give.
2. **Depth before quiz repetition.** After a wrong answer, teach the mechanism properly before presenting a near-identical question.
3. **Technical term second.** Once the idea is grounded, name the proper term so Pablo develops correct professional vocabulary.
4. **Translate jargon immediately.** Define unfamiliar technical terms in one short ordinary-language sentence.
5. **Use visible state.** For code execution, show values, names, objects, call flow, or state changes explicitly when that clarifies what happened.
6. **Contrast similar-looking behaviours.** Especially useful for assignment vs mutation, return vs print, local vs outside names, equality vs identity, shallow vs deep copy, and related concepts.
7. **One new abstraction at a time.** Do not stack several unfamiliar terms into one sentence unless they are already established.
8. **Prefer causal explanations.** Explain why the output follows from the rules, not merely what the output is.
9. **Do not confuse vocabulary difficulty with conceptual difficulty.** Rephrase terminology before deciding the underlying concept is missing.
10. **Keep accuracy.** Analogies are scaffolding, not the final model. Explicitly say where an analogy stops being literal if it could mislead later.
11. **Let terminology become shorthand only after it has been established.** Once terms such as `rebinding`, `scope`, `mutation`, and `parameter` are understood and demonstrated, use them normally.
12. **Aim for derivation.** The learner should eventually be able to work out an unfamiliar example from the model instead of remembering a rule for a familiar example.

## Analogy policy

Analogies such as sticky notes are useful as a first foothold, but never present them as the physical implementation of Python.

Avoid wording like:

> "Let's look at what is physically happening in memory using sticky notes."

Prefer:

> "Here's a simple model that makes the behaviour easier to see. It isn't literally how memory looks, but it captures the rule we care about."

Then transition to the actual model after the intuition lands.

## Plans and probes

Apply the same language rule before the lesson begins.

A learning-plan summary should sound like:

> You understand what happens when two variables refer to the same list. The part getting mixed up is what happens when a value goes into a function, especially when the function assigns a new value or returns something.

Then introduce the formal label if useful:

> We'll build the Python **function execution model**: arguments, local scope, rebinding, mutation, and return values.

Avoid making the plan itself harder to understand than the lesson.

## Preferred teaching loop

For each new concept or misconception:

1. State the simple idea.
2. Show a concrete line-by-line/state trace.
3. Explain the actual mechanism.
4. Introduce the technical vocabulary.
5. Contrast it with the nearest confusing case.
6. Ask Pablo to reconstruct the reasoning.
7. Test transfer with a new example.
8. Later require independent use.

The target is not simplified knowledge. The target is **deep technical understanding reached through clear language**.
