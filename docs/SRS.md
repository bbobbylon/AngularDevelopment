# Software Requirements Specification

**Version:** 1.0
**Last Updated:** 2026-08-29
**Status:** Final

## Overview

Defines what the Angular Concepts study app is for, who uses it, and what it has to do.
The app is a self-contained, offline-capable study tool for the Angular certification
tracks: 100 interactive lessons plus a practice, exam and spaced-repetition system, with
no backend and no account.

## Table of Contents

- [1. Executive summary](#1-executive-summary)
- [2. System overview](#2-system-overview)
- [3. Functional requirements](#3-functional-requirements)
- [4. Non-functional requirements](#4-non-functional-requirements)
- [5. User stories](#5-user-stories)
- [6. Success criteria](#6-success-criteria)
- [7. Constraints](#7-constraints)
- [8. Out of scope](#8-out-of-scope)

---

## 1. Executive summary

**Project:** Angular Concepts — Certification Study App
**Version:** 1.0 (curriculum complete: all 100 lessons live)

**Purpose.** Cover every concept on the Angular certification tracks — beginner,
intermediate and expert — plus the JavaScript, web and TypeScript groundwork that the
official material assumes you already have, and pair that coverage with enough practice
material to actually be ready for the exam.

**Stakeholders.** The author, as the primary user preparing for certification. Secondary:
anyone else studying for the same exam, and anyone using the repository as a reference
for modern Angular patterns.

---

## 2. System overview

### What problem does it solve?

Angular's own documentation is a reference: accurate, well organised, and written to be
looked things up in rather than learned from. Certification preparation needs three
things it does not provide:

1. **Runnable demonstrations of the failure modes.** Knowing that `OnPush` compares
   inputs by reference is not the same as watching a mutated object fail to re-render
   next to a replaced one that succeeds.
2. **The prerequisites.** The official beginner material assumes JavaScript, the DOM,
   npm, Git and TypeScript. Someone who is genuinely new needs those first.
3. **Assessment.** Reading does not reveal what you do not know. A question bank, timed
   exams and spaced repetition do.

### Who are the users?

| User | Needs |
|---|---|
| **Certification candidate** (primary) | Full concept coverage, realistic practice questions, timed exams, a readiness verdict |
| **Angular developer filling gaps** | Direct navigation to one topic, depth beyond the docs, edge cases |
| **Complete beginner** | The Foundations and TypeScript tracks before any Angular |

### Main features

- 100 interactive lessons across six tracks
- 424-question practice bank with explanations and topic links
- Timed mock exams
- Leitner spaced repetition fed by every wrong answer
- Flashcards, coding tasks, an exam-day readiness check
- Progress dashboard, streak tracking, achievements
- Glossary, bookmarks with notes, HTTP API playground, interview drill

---

## 3. Functional requirements

### FR-1 Curriculum and lessons

- **FR-1.1** The app shall present 100 lessons across six tracks: Foundations (12),
  TypeScript (13), Beginner (24), Intermediate (26), Expert (22), Projects (3).
- **FR-1.2** Each lesson shall be reachable at its own route (`/<lesson-id>`) and be
  lazily loaded.
- **FR-1.3** Each lesson shall contain at least one **interactive demo** the reader can
  manipulate — not only prose and static code samples.
- **FR-1.4** Each lesson shall cover the concept's edge cases and common failure modes,
  not only its happy path. (See [CONTRIBUTING.md](CONTRIBUTING.md) for the standard.)
- **FR-1.5** The home page shall list the entire curriculum, grouped by track and
  category, with a text filter and per-track completion counts.
- **FR-1.6** Routes, navigation and dashboard cards shall all be generated from a single
  curriculum definition, so the three can never disagree.

### FR-2 Practice

- **FR-2.1** The app shall provide a bank of at least 400 multiple-choice questions
  spanning every track.
- **FR-2.2** Answer options shall be shuffled per session, so position cannot be
  memorised.
- **FR-2.3** Answer-option lengths shall be balanced across the bank, so neither "pick
  the longest" nor "pick the shortest" is a usable strategy. Target: roughly 25% of
  questions having the longest option correct — matching chance, not zero, since zero
  is the same exploit reversed.
- **FR-2.4** After answering, the app shall show whether the answer was correct, which
  option was correct, and an explanation covering **why the wrong options are wrong**.
- **FR-2.5** Each question shall link to the lesson that teaches it.
- **FR-2.6** Questions shall be filterable by category and difficulty.
- **FR-2.7** Answer state shall persist across reloads.
- **FR-2.8** An optional adaptive mode shall shift question difficulty based on a
  rolling streak.

### FR-3 Mock exam

- **FR-3.1** The user shall configure question count, categories and time limit.
- **FR-3.2** The exam shall run against a countdown timer and submit automatically when
  it expires.
- **FR-3.3** On submission the app shall show a score, a per-category breakdown, and a
  question-by-question review.
- **FR-3.4** Every missed question shall be added to the review queue.
- **FR-3.5** Attempts shall be recorded in a history.

### FR-4 Spaced repetition

- **FR-4.1** Missed questions from Practice and Mock Exam shall enter a Leitner queue.
- **FR-4.2** A correct answer shall promote an item one box; a wrong answer shall return
  it to box 1.
- **FR-4.3** Items shall be served only when their box interval has elapsed.
- **FR-4.4** Items reaching the final box shall graduate to a mastered list.

### FR-5 Additional study tools

- **FR-5.1 Flashcards** — quick-recall cards over the same question bank.
- **FR-5.2 Coding tasks** — 17 hands-on tasks with acceptance criteria and completion
  tracking.
- **FR-5.3 Exam day** — a readiness check combining a timed exam and two coding briefs,
  producing a pass/not-yet verdict; in-flight state shall survive a reload.
- **FR-5.4 Progress** — an aggregate dashboard over every other feature's state, which
  reads and never writes.
- **FR-5.5 Glossary** — 65 terms, each linked to the lesson that teaches it.
- **FR-5.6 Bookmarks** — starring lessons and questions, with free-text notes.
- **FR-5.7 Streak** — consecutive study days, current and longest.
- **FR-5.8 Achievements** — 13 badges with defined unlock rules.
- **FR-5.9 API playground** — a step-by-step visualisation of an HTTP request lifecycle.
- **FR-5.10 Interview drill** — interview-style questions with model answers.

### FR-6 Content integrity

- **FR-6.1** Every `topicPath` in the question bank and glossary shall resolve to a real
  lesson id, enforced by an automated test.
- **FR-6.2** Question ids shall be unique, enforced by an automated test.
- **FR-6.3** `topicPath` values shall be bare lesson ids with **no** leading slash.

### FR-7 Presentation

- **FR-7.1** Light and dark themes, with the choice persisted.
- **FR-7.2** Responsive from ~360px to desktop.
- **FR-7.3** Lesson and result pages shall print legibly.

---

## 4. Non-functional requirements

### Performance

| Requirement | Target |
|---|---|
| **NFR-P1** Initial load | Only the shell and the landing route; every lesson lazily loaded |
| **NFR-P2** Route transition | Under ~200ms on a warm cache |
| **NFR-P3** Large lists | Practice's 424 cards render in batches, so first paint is flat in bank size |
| **NFR-P4** Change detection | Zoneless; signal writes within a microtask coalesce into one pass |

### Security

- **NFR-S1** No backend, no authentication, no network transmission of user data.
- **NFR-S2** No `bypassSecurityTrust*` on any dynamic or user-supplied value.
- **NFR-S3** `localStorage` shall hold study progress only — never credentials or
  personal data.
- **NFR-S4** Any auth demonstration shall be an explicitly-labelled mock.

### Reliability

- **NFR-R1** Corrupt, absent or unavailable storage shall never prevent the app from
  loading. Every read falls back to a default.
- **NFR-R2** Persisted shapes shall be versioned, so an incompatible change invalidates
  old data cleanly rather than crashing on it.
- **NFR-R3** The app shall function fully offline after first load.

### Maintainability

- **NFR-M1** Every class, method, property and exported symbol shall carry JSDoc
  explaining not just what it is but why it exists where it matters. (Currently: zero
  undocumented declarations.)
- **NFR-M2** The `core/` layer shall be unit tested.
- **NFR-M3** Content shall be guarded by integrity tests, not review alone.
- **NFR-M4** Adding a lesson shall require editing exactly one shared file
  (`curriculum.ts`) plus the lesson itself.

### Scalability

The constraint is content, not traffic — the app is static and scales with its CDN.
Doubling the curriculum adds chunks, not startup cost, because everything is lazy. The
one thing that does not scale automatically is a page rendering the whole question bank,
which is why Practice batches.

### Accessibility

- **NFR-A1** Target WCAG 2.1 AA.
- **NFR-A2** Every interactive control reachable and operable by keyboard.
- **NFR-A3** Body text at 4.5:1 contrast or better, in both themes.
- **NFR-A4** Honour `prefers-reduced-motion`.

---

## 5. User stories

- As a **certification candidate**, I want a lesson for every exam topic, so I can be
  sure I have not skipped anything.
- As a **certification candidate**, I want to sit a timed exam, so I find out whether I
  can work at exam pace rather than only whether I know the material.
- As a **certification candidate**, I want the questions I got wrong to come back on a
  schedule, so I stop re-reading what I already know.
- As a **certification candidate**, I want a readiness verdict before booking the exam,
  so the decision is based on something other than optimism.
- As a **developer with gaps**, I want to jump straight to one topic and see the edge
  cases demonstrated, so I learn the parts the docs state but do not show.
- As a **beginner**, I want the prerequisites covered in the same place, so I am not
  sent elsewhere to learn what npm is.
- As **any user**, I want a question's explanation to say why the *other* answers are
  wrong, so I correct the misconception and not just the answer.
- As **any user**, I want my progress kept locally without an account, so studying costs
  nothing and shares nothing.

---

## 6. Success criteria

| Criterion | Measure |
|---|---|
| **Coverage** | Every certification topic has a lesson. ✅ 100/100 live |
| **Depth** | Every lesson has an interactive demo and covers failure modes, not just syntax |
| **Assessment volume** | 400+ questions across every track. ✅ 424 |
| **Question quality** | Length-guessing yields ~chance. ✅ verified at 25.9% |
| **Correctness** | Test suite green; no dead study links. ✅ 162 tests, topicPath guard passing |
| **Documentation** | Zero undocumented declarations in source. ✅ |
| **The real one** | The author passes the certification exam |

---

## 7. Constraints

**Technical**

- Angular 21, standalone + signals + zoneless throughout. Legacy patterns appear only
  where a lesson is explicitly teaching them for recognition.
- Static hosting only — no server-side rendering in the deployed app (SSR is taught, not
  used).
- Browser storage only. Capacity is a few MB and per-origin; no cross-device sync.
- Runtime dependencies limited to `@angular/*`, `rxjs`, `tslib`.

**Timeline** — Paced by the author's exam date. Curriculum first, study tools second,
polish third; all three now complete.

**Resource** — Single author. This is why content integrity is enforced by tests rather
than review: there is no second reviewer.

---

## 8. Out of scope

- User accounts, server-side persistence, cross-device sync
- Multi-user features: sharing, leaderboards, classrooms
- An in-browser code editor or compiler (the coding tasks are done in a real editor)
- Official certification affiliation — this is independent study material
- Localisation of the app itself (i18n is taught; the UI is English only)

## Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — how it is built
- [UI-DESIGN.md](UI-DESIGN.md) — how it looks and behaves
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to add to it
- [../DEPLOYMENT.md](../DEPLOYMENT.md) — how to ship it
