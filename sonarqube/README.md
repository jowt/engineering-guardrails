# Local SonarQube (One-Stop Quality Gate)

Use this setup to analyze any repository under `~/repos` for:

- code smells
- security hotspots/issues
- duplicated code
- maintainability and reliability concerns

## Prerequisites

- Docker Desktop running
- `sonar-scanner` installed (`brew install sonar-scanner`)

## Start SonarQube

```bash
./scripts/sonar-up.sh
```

Open: <http://localhost:9000>

First login defaults:

- user: `admin`
- password: `admin` (must change on first login)

## Generate token

In SonarQube UI:

- My Account → Security → Generate Token

Set in terminal:

```bash
export SONAR_TOKEN=<token>
```

## Scan any repository

```bash
./scripts/scan-repo.sh ~/repos/my-service my-service
```

## Stop SonarQube

```bash
./scripts/sonar-down.sh
```

## Notes

- For best results, each target repo should include a tuned `sonar-project.properties`.
- Use `templates/sonar-project.properties.template` as the baseline.
- You can wire the same scan into CI once local quality gate behavior is validated.
