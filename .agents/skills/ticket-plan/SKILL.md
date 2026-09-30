---
name: ticket-plan
description: Use when the user asks to execute, start, or plan a ROADMAP.md ticket (for example "do T-104" or "run the next ticket"). Produces an implementation plan and stops for approval before any code is written.
---

# Ticket plan

Planning step of the mandatory ticket workflow in `AGENTS.md`. No code, no file edits, no installs in this step.

## Steps

1. Read `MEMORY.md`, then the ticket in `ROADMAP.md`. Read `DESIGN.md` if the ticket touches UI.
2. Check the ticket's `Deps`. If any dependency is not `[x]`, say so and stop.
3. Inspect only the existing code the ticket touches (services, components, tests, native module) so the plan matches current structure.
4. If something is ambiguous, ask at most three short questions before planning.
5. Write the plan in Spanish using the template below, then stop and wait for explicit approval.

## Plan template

```
## Plan T-XXX: <title>

**Objetivo:** one or two sentences.
**Dependencias:** each dep and its status.

**Archivos**
- create: path (purpose)
- change: path (what changes)

**Enfoque:** 3 to 6 bullets, key decisions and why.

**Tests:** what will be tested and where (Vitest, @ng-native/testing, JUnit).

**Verificacion:** commands to run (typecheck, lint, test, build) and the manual checks Julio will need to do.

**Riesgos y dudas:** alpha limitations, native or device-specific behavior, open questions.

**Fuera de alcance:** related work deliberately not included.

¿Apruebas este plan?
```

## Rules

- Keep the plan under about 40 lines; link to paths instead of pasting code.
- Do not add dependencies, new files outside the ticket scope, or refactors that are not in the ticket.
- If the ticket conflicts with `AGENTS.md`, `DESIGN.md`, or a decision in `MEMORY.md`, flag it in the plan instead of choosing silently.
- Do not start implementing until the user approves. After approval, follow the workflow in `AGENTS.md`.
