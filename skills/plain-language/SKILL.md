---
name: plain-language
description: Keep teaching clear and beginner-friendly without losing technical accuracy. Use whenever Pablo is being taught, quizzed, probed, or given a learning plan, especially for Python, CS, software engineering, maths, or ML.
---

# Plain-language teaching

Teaching should reduce cognitive load, not add to it.

## Core rule

**Explain the idea in ordinary language first. Introduce the technical term second.**

Do not make Pablo decode unfamiliar jargon at the same time as learning the concept itself.

For example, prefer:

> Inside the function, `x = ...` makes the local name `x` point to something new. It does not automatically replace the variable outside the function. The technical term for this is **rebinding**.

instead of starting with:

> Rebinding a local name does not mutate the caller's object.

Both are accurate. The first is easier to learn from.

## Rules

1. **Plain English first.** Start with the simplest accurate explanation you can give.
2. **Technical term second.** Once the idea is clear, name the proper term so Pablo still develops correct professional vocabulary.
3. **Translate jargon immediately.** When a technical term is necessary, define it in one short sentence in ordinary language.
4. **Use tiny concrete examples early.** Prefer a small Python snippet, value, diagram, or real scenario over abstract prose when it can carry the idea.
5. **One new abstraction at a time.** Do not stack several unfamiliar terms into one sentence unless they are already established.
6. **Do not confuse vocabulary difficulty with conceptual difficulty.** If an answer suggests the terminology is the blocker, rephrase before concluding that the concept is not understood.
7. **Keep accuracy.** Simpler language must not become technically false or misleading.
8. **Let terminology become shorthand only after it has been established.** Once `rebinding`, `scope`, `mutation`, `parameter`, etc. have been clearly taught and demonstrated, they can be used normally, with brief reminders if confusion returns.

## Plans and probes

Apply the same rule before the lesson begins.

A learning-plan summary should sound like:

> You understand what happens when two variables refer to the same list. The part getting mixed up is what happens when a value goes into a function, especially when the function assigns a new value or returns something.

Then introduce the formal label if useful:

> We'll build the Python **function execution model**: arguments, local scope, rebinding, mutation, and return values.

Avoid making the plan itself harder to understand than the lesson.

## Preferred teaching pattern

For each new concept:

1. Explain it simply.
2. Show a tiny example.
3. Ask Pablo to predict or explain what happens.
4. Correct the mental model if needed.
5. Introduce/reinforce the proper technical term.
6. Apply it in a slightly different example.
7. Later require independent use.

The target is not simplified knowledge. The target is **full technical understanding reached through clear language**.
