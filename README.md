# Engineering Guardrails

A reusable standards module for all repositories under `~/repos`.

This package is designed as a **single source of truth** for:

- AI coding and review standards (`models.txt`)
- Architecture and coding guidelines
- Observability standards (OpenTelemetry-first)
- Testing standards (unit, integration, smoke)
- Documentation and ADR standards
- SemVer and shared-library release policies
- Local SonarQube setup for quality, security, and duplication checks

---

## Repository Structure

```text
engineering-guardrails/
  README.md
  models.txt
  docs/
    coding_guidelines_master.md
    doc_tree_template.md
    observability_otel_playbook.md
  templates/
    sonar-project.properties.template
  scripts/
    repo-guardrails-checklist.md
  sonarqube/
    docker-compose.yml
    scripts/
      sonar-up.sh
      sonar-down.sh
      scan-repo.sh
```

---

## How to Use This Across All Repos

### 1) Reference this standards module from each repo

In each project repo, add:

- `ENGINEERING_STANDARDS.md` as the standards pointer file
- `AGENT.md` as the agent-facing entrypoint that points to `ENGINEERING_STANDARDS.md`
- `CLAUDE.md` as a compatibility pointer to `AGENT.md`

Both should point here:

- `../engineering-guardrails/models.txt`
- `../engineering-guardrails/docs/coding_guidelines_master.md`
- `../engineering-guardrails/docs/observability_otel_playbook.md`

(If your repo is nested differently, use the correct relative path.)

### 2) Make this part of PR review

Require that every PR confirms:

- No new `any` types introduced
- OTel traces + trace/log correlation retained
- Tests added/updated (unit + integration where relevant)
- No major code duplication introduced
- Docs updated for behavior/contract changes

### 3) Run local SonarQube against any repo

From this repository:

```bash
./sonarqube/scripts/sonar-up.sh
./sonarqube/scripts/scan-repo.sh /Users/josephwright/repos/notion notion
```

Open SonarQube at <http://localhost:9000>.

---

## SonarQube Quick Start

1. Start stack:
   - `./sonarqube/scripts/sonar-up.sh`
2. Open SonarQube UI:
   - <http://localhost:9000>
3. Log in (default on first boot):
   - username: `admin`
   - password: `admin` (you will be prompted to change)
4. Generate a token in SonarQube UI:
   - User → My Account → Security → Generate Token
5. Export token locally:
   - `export SONAR_TOKEN=<your_token>`
6. Scan any repo:
   - `./sonarqube/scripts/scan-repo.sh /Users/josephwright/repos/nsure-io-cpu-pipeline-challenge nsure-io-cpu-pipeline-challenge`

---

## Recommended Adoption Order

1. Adopt `models.txt` in every repo immediately.
2. Enforce strict typing + no-`any` policy.
3. Normalize observability with OTel and trace correlation.
4. Consolidate shared utilities into versioned shared libs.
5. Add SonarQube to local and CI quality gates.
6. Standardize testing strategy and minimum coverage thresholds.
7. Enforce ADR/doc updates for architectural changes.

---

## Notes

- This standards repository should be versioned and treated like production code.
- If shared libraries are consumed by multiple services and are not tightly coupled, release them with SemVer.
- Keep this repository technology-agnostic where possible; add language-specific appendices only when needed.
