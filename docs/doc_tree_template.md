# Standard Documentation Tree Template

Use this structure in each repository:

```text
docs/
  README.md                          # docs index
  architecture/
    system-overview.md
    context-diagram.md
    component-diagram.md
  adr/
    ADR-0001-template.md
    ADR-0002-<decision-title>.md
  api/
    openapi.yaml                     # or generated contracts
    event-schemas/
  observability/
    telemetry-standards.md
    dashboards.md
    alerts-and-slos.md
    runbooks/
      incident-<name>.md
  testing/
    test-strategy.md
    test-data-management.md
  operations/
    deployment.md
    rollback.md
    oncall.md
  security/
    threat-model.md
    secrets-handling.md
  changelogs/
    CHANGELOG.md                     # if not at repo root
```

## Required minimum

- `docs/README.md`
- `docs/adr/`
- `docs/observability/`
- `docs/testing/`
- `docs/operations/`

## Update rules

- API contract changed → update `docs/api/`
- Architecture changed → add ADR + update architecture docs
- Alerting/SLO changed → update `docs/observability/`
- Deployment behavior changed → update operations docs
