---
name: explain-changes
description: Writes a learning-focused walkthrough of code that was just implemented, so the developer can understand, review, and explain it. Use this at the end of EVERY implementation task in this repo, even small ones, and whenever the developer asks to explain, walk through, or teach the recent changes (e.g. "explain what you did", "walk me through this", /explain-changes).
---

# Explain Changes

The developer is learning software engineering through this project. They plan features in a separate conversation, you implement them, and they study the result. Your explanation is how they learn, so it matters as much as the code.

Write for someone who knows programming fundamentals but may be new to Java, Spring Boot, and professional backend practices. Don't simplify the code to make it easier to explain; explain the real code clearly.

## Where to write it

Save the walkthrough to `docs/learning/NNN-short-topic.md`, where `NNN` is the next number in sequence (`001`, `002`, ...). Then print a 2-3 sentence summary in the terminal pointing to the file.

## Structure

Use these sections, in this order.

### 1. What changed and why
Two or three sentences: what the task was, and what now works that didn't before.

### 2. How it fits together
Trace the flow of one real request or operation through the code, step by step, e.g. HTTP request → controller → service → repository → database → response. Name the actual classes and methods. This is the most important section: it builds the mental model the rest hangs on.

### 3. Walkthrough, in reading order
List changed files in the order the developer should **read** them (usually following the flow above, not alphabetically). For each file, explain its responsibility and point out the lines that matter most. Skip trivial boilerplate, but say that you skipped it.

### 4. Design decisions
For each meaningful choice: what you chose, at least one realistic alternative, and why you chose this one. Include choices that came from CLAUDE.md rules, and say so. If a decision deserves an ADR, say that explicitly.

### 5. Concepts to study
Name the concepts this change used that the developer should understand well enough to explain in an interview (e.g. "dependency injection", "JPA entity lifecycle", "@Transactional boundaries"). For each, one sentence on what it is and where it appears in this change. Keep to the concepts that actually appear in the code.

### 6. Try it yourself
Two to four small hands-on exercises that deepen understanding, e.g. "Call the endpoint with a negative amount and predict the response before running it", "Break the ownership check and watch which test fails", "Add a field to the response DTO". Don't solve them.

### 7. Review carefully
Be honest. List anything the developer should scrutinize: shortcuts you took, assumptions you made, edge cases not handled, code you're less confident about, or anything that deviates from CLAUDE.md. If there's nothing notable, say so in one line.

### 8. Check your understanding
Three to five questions the developer should be able to answer after reading, mixing "what does this do" with "why is it done this way" and "what would happen if". Put answers in a collapsed block:

```
<details>
<summary>Answers</summary>

...
</details>
```

## Tone and length

- Plain, direct prose. Explain like a senior engineer walking a teammate through a PR.
- Reference real class, method, and file names so the developer can jump straight to the code.
- Scale length to the change: a small fix might be half a page, a new feature a few pages. Don't pad.