---
name: ticket-summary
description: Use at the end of a ticket, after implementation and verification, to update ROADMAP.md and MEMORY.md and deliver the final summary with the suggested commit message. Never commits.
---

# Ticket summary

Closing step of the ticket workflow in `AGENTS.md`.

## Preconditions

Typecheck, lint, tests and a bundle or build have been run for this ticket. If any was not run or failed, say so in the summary; never report it as passing.

## Steps

1. In `ROADMAP.md`, change the ticket from `[ ]` or `[~]` to `[x]`. Touch nothing else in that file unless the ticket changed scope.
2. Rewrite the affected parts of `MEMORY.md` (do not append history):
   - Snapshot: current phase, next ticket, last updated date.
   - Done: one line for this ticket.
   - Decisions, gotchas, risks, next steps: only what this ticket changed or discovered.
   - Keep the file short; delete stale detail.
3. Do not run `git commit`, `git push` or change git config. Julio commits.
4. Send the summary in Spanish using the template below.

## Summary template

```
## T-XXX completado: <title>

**Implementado**
- bullets, outcome first, no play-by-play

**Archivos**
- created / changed, grouped, paths only

**Verificacion ejecutada**
- typecheck: ok | fallo | no ejecutado
- lint: ...
- tests: N passed
- build/bundle: ...

**Pruebas manuales para ti**
1. numbered steps Julio can follow on the emulator or device, with the expected result

**Notas**
- limitations found, ideas outside scope, anything recorded in MEMORY.md

**Commit sugerido**
<type>(<scope>): <imperative subject>
```

## Commit message rules

- Conventional Commits, English, imperative mood, lowercase type and scope, subject at most 72 characters, no trailing period.
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`.
- Scope is the feature or area (`player`, `library`, `audio`, `theme`, `ci`).
- Add a short body only when the change is not obvious from the subject.
- One ticket, one commit message.
