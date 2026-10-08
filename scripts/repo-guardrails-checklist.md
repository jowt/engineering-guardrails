# Repo Guardrails Adoption Checklist

Apply this checklist to each repository under `~/repos`.

## Foundation

- [ ] Add pointer file to central standards repository.
- [ ] Add PR template with guardrail checklist.
- [ ] Enforce branch protection + required checks.

## Type Safety

- [ ] Enable strict TypeScript compiler options.
- [ ] Ban `any` in lint rules.
- [ ] Add runtime schema validation at trust boundaries.

## Observability

- [ ] OTel SDK bootstrapped.
- [ ] Trace propagation verified across boundaries.
- [ ] Structured logging with trace/span IDs.
- [ ] Core RED metrics emitted and monitored.

## Shared Libraries

- [ ] Consolidate logging/retry/client/schema utilities.
- [ ] Remove duplicated implementations.
- [ ] Set SemVer/version policy for shared packages.

## Testing

- [ ] Unit tests are deterministic and fast.
- [ ] Integration tests cover critical boundaries.
- [ ] Smoke tests cover critical user path.
- [ ] No open handles after tests.

## Quality Gates

- [ ] Lint, typecheck, tests in CI.
- [ ] Coverage thresholds enforced.
- [ ] SonarQube quality gate enforced.

## Documentation

- [ ] Adopt docs tree template.
- [ ] ADR process active.
- [ ] Runbooks present for key incidents.
