# React to Angular Migration Plan

## Purpose

This document defines a low-risk migration path from the current React app to Angular, with clear phases, branch strategy, test gates, and cutover criteria.

## Goals

- Preserve all current user-facing behavior.
- Reuse enclosure geometry logic where possible.
- Migrate incrementally without breaking existing deploys.
- Keep each migration phase independently reviewable.

## Scope Summary

### Reuse (mostly unchanged)

- Geometry and enclosure domain logic in `src/lib/enclosure/*`.
- Param type model structure from `src/lib/params.ts` (with Angular state adaptation).
- Existing CSS as baseline styling.

### Rewrite

- React component layer in `src/ui/*.tsx`.
- React bootstrap in `src/index.tsx`.
- Hookstate usage in params/loading state.
- React-specific test harness and dependencies.

## Recommended Execution Model

Build Angular app in parallel and cut over only after parity checks pass.

1. Keep current React app untouched during early phases.
2. Implement Angular app in a parallel folder.
3. Port features in dependency order (state -> renderer -> tools -> form).
4. Validate parity with explicit acceptance checks.
5. Remove React stack only after final sign-off.

## Branch Plan

Use one branch per phase for safe reviews and rollback.

1. `chore/angular-workspace-bootstrap`
2. `feat/angular-domain-and-state`
3. `feat/angular-renderer-parity`
4. `feat/angular-tools-parity`
5. `feat/angular-params-form-parity`
6. `test/angular-regression-suite`
7. `chore/angular-cutover-cleanup`

## Target Angular Structure

Example target layout:

```text
angular-app/
  src/
    app/
      app.component.ts
      core/
        enclosure/
          base.ts
          holes.ts
          index.ts
          internalwalls.ts
          lid.ts
          pcbmount.ts
          screws.ts
          utils.ts
          wallmount.ts
          waterproofseal.ts
        state/
          enclosure-state.service.ts
      features/
        renderer/
          renderer.component.ts
        params/
          params-form.component.ts
        tools/
          tools.component.ts
      shared/
        funding/
          funding.component.ts
        loading-indicator/
          loading-indicator.component.ts
```

## File Mapping

- `src/index.tsx` -> `angular-app/src/main.ts`, `angular-app/src/app/app.component.ts`
- `src/ui/App.tsx` -> `angular-app/src/app/app.component.ts`
- `src/ui/Renderer.tsx` -> `angular-app/src/app/features/renderer/renderer.component.ts`
- `src/ui/ParamForm.tsx` -> `angular-app/src/app/features/params/params-form.component.ts`
- `src/ui/Tools.tsx` -> `angular-app/src/app/features/tools/tools.component.ts`
- `src/ui/LoadingIndicator.tsx` -> `angular-app/src/app/shared/loading-indicator/loading-indicator.component.ts`
- `src/ui/Funding.tsx` -> `angular-app/src/app/shared/funding/funding.component.ts`
- `src/lib/params.ts` -> `angular-app/src/app/core/state/enclosure-state.service.ts`
- `src/lib/enclosure/*` -> `angular-app/src/app/core/enclosure/*` (or imported from existing location)
- `src/ui/css/*.css` -> `angular-app/src/styles.css` and feature/shared component stylesheets
- `src/ui/App.test.tsx` -> `angular-app/src/app/app.component.spec.ts`
- `vite.config.ts` / React scripts -> Angular CLI config and scripts

## Phase Plan

### Phase 0: Workspace Bootstrap

Objective: Add Angular workspace and verify basic dev/build/test flow.

Tasks:

- Generate Angular standalone app in `angular-app`.
- Configure base path for GitHub Pages compatibility.
- Add scripts for Angular dev/build/test.

Exit criteria:

- Angular app serves locally.
- Angular production build succeeds.
- Basic unit test command succeeds.

### Phase 1: Domain and State

Objective: Port state management and connect reusable domain logic.

Tasks:

- Add `EnclosureStateService` using Angular signals.
- Mirror current params model and defaults.
- Migrate loading state to signal-based store.
- Copy or reference enclosure library.

Exit criteria:

- Params can be read/updated from service.
- Derived state and reset behavior validated.
- Service tests pass.

### Phase 2: Renderer Parity

Objective: Recreate 3D rendering lifecycle and interaction behavior.

Tasks:

- Port JSCAD renderer setup and animation loop.
- Port pointer/zoom/pan interactions.
- Port diff-based dependency recomputation logic.
- Ensure cleanup on component destroy.

Exit criteria:

- Model renders correctly.
- Param changes trigger expected visual updates.
- No obvious perf regressions during interaction.

### Phase 3: Tools Parity

Objective: Port STL export and JSON load/save workflows.

Tasks:

- Port export actions (lid/base/seal).
- Port save settings to JSON.
- Port load settings from JSON with merge behavior.
- Port export confirmation modal.

Exit criteria:

- Exported STL files generated as expected.
- Saved JSON reloads without data loss.
- Modal and actions function correctly.

### Phase 4: Params Form Parity

Objective: Rebuild the full dynamic parameter UI.

Tasks:

- Rebuild accordion UI sections.
- Port dynamic arrays (holes, mounts, internal walls).
- Port conditional fields and cross-field constraints.
- Preserve keyboard/input blur behavior where required.

Exit criteria:

- Full editing flow works across all sections.
- Add/remove/edit dynamic items works correctly.
- Cross-toggle behavior (waterproof/lid screws) matches current behavior.

### Phase 5: Test and Regression Hardening

Objective: Add enough automated coverage for safe cutover.

Tasks:

- Add component tests for shell and key features.
- Add state service tests.
- Add at least one integration test for params -> renderer update.
- Add sanity checks for tools workflows.

Exit criteria:

- CI test suite stable.
- Core workflows covered by automated tests.

### Phase 6: Cutover and Cleanup

Objective: Switch default app to Angular and remove React stack.

Tasks:

- Change root scripts to Angular equivalents.
- Remove React-specific dependencies and source files.
- Update README and contribution instructions.
- Validate deploy path and static asset behavior.

Exit criteria:

- Angular app is default and deployable.
- No React runtime/dependencies remain.
- Smoke checks pass in production build.

## Task Matrix

Use this table as the migration tracker.

| ID    | Task                                            | Owner      | Status      | Notes                                                                    |
| ----- | ----------------------------------------------- | ---------- | ----------- | ------------------------------------------------------------------------ |
| M-001 | Bootstrap Angular workspace in `angular-app`    | Unassigned | Complete    | Done on 2026-04-07                                                       |
| M-002 | Configure Angular base path for GitHub Pages    | Unassigned | Complete    | `baseHref` set to `/easy-enclosure/`                                     |
| M-003 | Add Angular scripts to root package workflow    | Unassigned | Complete    | Added `ng:dev`, `ng:build`, `ng:build:ghpages`, `ng:test`                |
| M-004 | Create signal-based enclosure state service     | Unassigned | Complete    | Added `EnclosureStateService` with signals and reset APIs                |
| M-005 | Port params defaults and reset behaviors        | Unassigned | Complete    | Ported to `angular-app/src/app/core/params.ts`                           |
| M-006 | Integrate enclosure geometry library in Angular | Unassigned | Complete    | Copied `src/lib/enclosure/*` to Angular core and added `@jscad/modeling` |
| M-007 | Port renderer setup and animation lifecycle     | Unassigned | Complete    | Added `RendererComponent` with RAF loop and JSCAD render initialization  |
| M-008 | Port pointer pan/zoom/rotate interactions       | Unassigned | Complete    | Ported pointer handlers and orbit controls interactions                  |
| M-009 | Port dependency-diff model recompute logic      | Unassigned | Complete    | Ported param diff/dependency arrays and selective model recomputation    |
| M-010 | Port STL export flow                            | Unassigned | Not Started |                                                                          |
| M-011 | Port load/save JSON settings flow               | Unassigned | Not Started |                                                                          |
| M-012 | Port tools modal UX                             | Unassigned | Not Started |                                                                          |
| M-013 | Rebuild params accordion sections               | Unassigned | Not Started |                                                                          |
| M-014 | Port holes dynamic array CRUD                   | Unassigned | Not Started |                                                                          |
| M-015 | Port PCB mounts dynamic array CRUD              | Unassigned | Not Started |                                                                          |
| M-016 | Port internal walls dynamic array CRUD          | Unassigned | Not Started |                                                                          |
| M-017 | Port waterproof and lid screw coupling rules    | Unassigned | Not Started |                                                                          |
| M-018 | Port wall mount and insert settings behavior    | Unassigned | Not Started |                                                                          |
| M-019 | Add Angular unit tests for app shell            | Unassigned | Not Started |                                                                          |
| M-020 | Add state service unit tests                    | Unassigned | Not Started |                                                                          |
| M-021 | Add params-to-renderer integration test         | Unassigned | Not Started |                                                                          |
| M-022 | Add tools workflow tests                        | Unassigned | Not Started |                                                                          |
| M-023 | Cut over build/deploy scripts to Angular        | Unassigned | Not Started |                                                                          |
| M-024 | Remove React dependencies and old source        | Unassigned | Not Started |                                                                          |
| M-025 | Update README and contributor setup docs        | Unassigned | Not Started |                                                                          |

Status values:

- Not Started
- In Progress
- Blocked
- Complete

## Risk Register

| Risk                            | Severity | Trigger                                     | Mitigation                                                         |
| ------------------------------- | -------- | ------------------------------------------- | ------------------------------------------------------------------ |
| Renderer performance regression | High     | Choppy interaction or slow updates          | Preserve diff-based recompute strategy and test with large configs |
| Dynamic form behavior drift     | High     | Missing or inconsistent fields after edits  | Add representative form scenario tests before cutover              |
| JSON compatibility break        | Medium   | Existing saved files fail to load correctly | Keep schema compatible and add load/save round-trip tests          |
| Deploy base path mismatch       | Medium   | Broken asset links on Pages                 | Validate base-href/deploy-url in staging build                     |

## Acceptance Checklist for Final Sign-off

- Param editing works across all sections.
- 3D preview updates correctly while editing.
- STL export works for lid, base, and waterproof seal.
- Save/load JSON works with expected schema.
- Loading indicator behavior is correct during heavy updates.
- Layout works on desktop and mobile.
- Tests are green in CI.
- Production deployment works on target base path.

## Suggested Cadence

- Week 1: Phases 0-2
- Week 2: Phases 3-4
- Week 3: Phases 5-6 and stabilization buffer

## Notes

- Keep commits small and scoped to one migration objective.
- Do not remove React files until Phase 6 is complete.
- Prefer behavior parity first, then refactor/optimize.
