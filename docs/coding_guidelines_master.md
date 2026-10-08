# Comprehensive Coding Standards and Guardrails

## Purpose

This document defines standards for building and operating large, complex, AI-assisted software systems with high reliability, maintainability, and safety.

It is intended to be referenced by every repository in `~/repos`.

---

## 1) Architecture and Decoupling Standards

### 1.1 Design for explicit boundaries

Use clear layers:

- `domain` (pure business logic)
- `application/service` (orchestration/use cases)
- `integration/infrastructure` (DB, queues, APIs)
- `interface/handler` (HTTP/webhook/CLI entrypoints)

**Rule:** domain logic must not import infrastructure concerns.

### 1.2 Dependency inversion

- Depend on interfaces/ports, not concrete adapters.
- Compose implementations at startup (`container`, factory, DI setup).

### 1.3 Anti-patterns to avoid

- “God services” with mixed concerns.
- Shared mutable global state.
- Hidden side effects in utility functions.

### 1.4 Good example

- `TaskService` depends on `TaskRepository` interface.
- `PostgresTaskRepository` implements interface.
- Unit tests use in-memory stub repository.

---

## 2) Strict Typing and API Contracts

### 2.1 No `any`

- `any` is prohibited in production code.
- Use `unknown` + explicit narrowing when needed.

### 2.2 Strict compiler settings

For TypeScript:

- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- `"exactOptionalPropertyTypes": true`
- `"noImplicitOverride": true`

### 2.3 Typed APIs at compile-time + runtime

- Define schema once (e.g., Zod/JSON Schema/OpenAPI).
- Generate or derive types from schema.
- Validate at trust boundaries.

### 2.4 Bad vs good

**Bad:**
- Accept `req.body` as implicit shape.
- Cast with `as SomeType` without validation.

**Good:**
- Parse/validate payload with schema.
- Use resulting inferred type through service layer.

---

## 3) DRY, Shared Libraries, and Drift Prevention

### 3.1 Shared concerns must be centralized

Create shared libraries for:

- logging
- OTel setup and helpers
- retry/backoff/circuit breaker policies
- standard HTTP client wrappers
- schema definitions and contract helpers
- common domain error types

### 3.2 Refactor trigger

If logic appears in 2+ services and is expected to evolve, move it to shared package immediately.

### 3.3 Drift prevention controls

- Single-source schema packages.
- Golden integration tests for shared clients.
- Deprecation policy and migration guide for shared APIs.

---

## 4) Versioning and Change Management (SemVer)

### 4.1 When to SemVer

Use SemVer for any package that is:

- consumed by multiple repositories,
- released independently,
- not tightly coupled to a single deploy unit.

### 4.2 SemVer rules

- MAJOR: breaking API/behavior change
- MINOR: backward-compatible feature
- PATCH: backward-compatible bugfix

### 4.3 Release hygiene

- changelog required
- migration notes required for MAJOR
- automated compatibility checks in CI when possible

---

## 5) Observability (Hardened OTel Standard)

### 5.1 Baseline

All services must emit:

- traces (distributed)
- metrics (SLIs/SLO monitoring)
- structured logs with trace correlation

### 5.2 Required log fields

At minimum:

- `timestamp`
- `level`
- `message`
- `service.name`
- `service.version`
- `deployment.environment`
- `trace_id`
- `span_id`
- `request_id` (if applicable)

### 5.3 Trace propagation

- Use W3C Trace Context (`traceparent`, `tracestate`).
- Preserve context across async boundaries, worker queues, and message buses.

### 5.4 Span design

- Use meaningful span names (`http.request`, `db.query`, `notion.sync`).
- Add semantic attributes (endpoint, status code, retry count, target system).
- Record exceptions on spans with typed error classes.

### 5.5 Metrics design

Track:

- request rate
- latency (`p50`, `p95`, `p99`)
- error rate
- saturation (CPU/memory/queue depth)

### 5.6 Hardened practices

- Sampling strategy documented per environment.
- Redaction policy for logs and spans.
- Correlation IDs generated at ingress if missing.
- Alert routes tied to SLO burn rates.
- Runbooks linked from alerts.

### 5.7 What “good” looks like

Given an incident, an engineer can:

1. find alert,
2. jump to trace,
3. pivot to correlated logs,
4. identify failing dependency and retry behavior,
5. determine blast radius within minutes.

---

## 6) Retry, Timeouts, and External Client Safety

### 6.1 Standard client policy

Shared client wrappers must enforce:

- finite timeout per call
- bounded retries with exponential backoff + jitter
- idempotency awareness
- circuit breaking for repeated failures

### 6.2 Anti-patterns

- infinite retries
- no timeout (hung resources)
- retrying non-idempotent writes without idempotency key

### 6.3 Classification

- Retryable: transient network, 429, 503, timeout
- Non-retryable: validation, auth, 4xx contract errors (except throttling)

---

## 7) Testing Standards

## 7.1 Unit tests

### Good unit tests

- deterministic and fast (<100ms typical)
- test one behavior at a time
- assert outcomes, not implementation details
- include edge cases and failure paths

### Bad unit tests

- over-mocking internal collaborators
- fragile expectations on call order with no value
- broad assertions that always pass
- sleeping/time-based flakiness

## 7.2 Integration tests

Use for boundary behavior:

- API handlers + service + real DB (or realistic test container)
- queue producer + consumer flow
- outbound client with contract test double

Must verify:

- serialization formats
- schema compatibility
- transactionality and idempotency
- retries and timeout behavior

## 7.3 Smoke tests

Short post-deploy checks for critical user paths:

- health endpoint reachable
- primary write/read workflow works
- key dependency integration alive

## 7.4 Test hygiene

- no open handles
- no hidden test order dependencies
- isolate test data by namespace/id
- execute in parallel safely

## 7.5 Coverage

Coverage is a signal, not the goal.

Recommended defaults:

- Lines: 85%+
- Branches: 75%+
- Critical modules: higher thresholds with mutation testing where practical

Never write low-value tests only to increase coverage percentage.

---

## 8) Styling and Consistency

### 8.1 Enforced formatting

- single formatter (e.g., Prettier)
- single linter config per language
- import/order and naming rules automated

### 8.2 Naming conventions

- `*Service`, `*Repository`, `*Client` suffixes for role clarity
- `Result`/`Error` naming for typed outcomes
- avoid abbreviations unless domain-standard

### 8.3 File organization

- co-locate tests with module or under mirrored `tests/` tree
- keep modules small and focused
- avoid circular imports

---

## 9) Security and Compliance Basics

- Never commit secrets.
- Use secret managers and environment injection.
- Validate all external inputs.
- Enforce least privilege.
- Log security-relevant events without exposing sensitive fields.
- Keep dependency scanning active.

---

## 10) Documentation Standards and ADRs

### 10.1 Documentation obligations

Every non-trivial change should update at least one of:

- behavior docs
- API contract docs
- runbook
- ADR (if architectural)

### 10.2 ADR requirement

Create an ADR when you change:

- architecture boundaries
- persistence strategy
- protocol/contract standards
- observability strategy
- shared package ownership or versioning policy

### 10.3 ADR minimum sections

- Context
- Decision
- Alternatives considered
- Consequences (pros/cons)
- Rollout and rollback plan

---

## 11) Suggested Documentation Tree

See dedicated template: `docs/doc_tree_template.md`.

---

## 12) Quality Gates and Static Analysis

### 12.1 Mandatory CI gates

- lint
- typecheck
- unit tests
- integration tests (where applicable)
- coverage threshold
- SonarQube quality gate

### 12.2 SonarQube quality profile suggestions

- block on new critical security issues
- block on increased code duplication in new code
- block on maintainability regressions

### 12.3 Local development gate

Before PR, run local equivalent of CI checks.

---

## 13) AI-Specific Engineering Guardrails

- AI-generated code must meet same standards as hand-written code.
- Generated code requires schema + tests + observability.
- Do not accept generated code with hidden `any` or disabled lint/type checks.
- Treat AI as accelerator, not authority.

---

## 14) Context7 Usage Standard

Before changing package usage:

1. consult latest official docs via Context7,
2. verify version-specific APIs,
3. prefer stable patterns from official guidance,
4. document major usage changes in ADR/decision log.

---

## 15) Pull Request Definition of Done

A PR is complete only if all are true:

- strict typing preserved; no new `any`
- duplication reduced or justified
- OTel traces/metrics/log correlation present
- tests added/updated and stable
- no open handles in tests
- coverage/quality gates pass
- docs and ADR updated where needed
- migration notes included for breaking/shared changes

---

## 16) Practical “Bad vs Good” Quick Examples

### Example A: logging

**Bad:** plain text logs with no trace id.

**Good:** structured JSON log with `trace_id`, `span_id`, service metadata, and redacted sensitive fields.

### Example B: shared retry policy

**Bad:** each service defines its own retry rules.

**Good:** shared library `@org/retry-policy` with centralized defaults and overrides.

### Example C: schema ownership

**Bad:** request payload interface manually duplicated across repos.

**Good:** schema package exports runtime validators and inferred compile-time types.

### Example D: testing

**Bad:** unit test mocks every internal function and asserts call count only.

**Good:** unit test exercises real logic path and asserts domain output/error semantics.

---

## 17) Adoption Roadmap

1. Apply `models.txt` and PR checklist in all repos.
2. Introduce strict typing and remove existing `any` debt incrementally.
3. Standardize observability fields and OTel bootstrap.
4. Extract shared libs for logging/retry/schema/client wrappers.
5. Activate SonarQube local scans + CI quality gates.
6. Normalize docs tree and ADR workflows.

---

## 18) Non-Negotiable Rules

- No untyped production code paths.
- No non-correlated logs in request workflows.
- No silent retries without policy.
- No duplicated cross-service logic when shared lib is appropriate.
- No forced green tests.
- No undocumented breaking changes.
