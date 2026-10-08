#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <absolute_repo_path> <project_key> [project_name]"
  echo "Example: $0 ~/repos/my-service my-service"
  exit 1
fi

REPO_PATH="$1"
PROJECT_KEY="$2"
PROJECT_NAME="${3:-$PROJECT_KEY}"

if [[ ! -d "$REPO_PATH" ]]; then
  echo "Error: repo path not found: $REPO_PATH"
  exit 1
fi

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "Error: SONAR_TOKEN is not set."
  echo "Generate token in SonarQube UI (My Account -> Security), then:"
  echo "export SONAR_TOKEN=<your_token>"
  exit 1
fi

if ! command -v sonar-scanner >/dev/null 2>&1; then
  echo "Error: sonar-scanner is not installed."
  echo "Install with Homebrew: brew install sonar-scanner"
  exit 1
fi

cd "$REPO_PATH"

echo "Running Sonar scan for $PROJECT_KEY on $REPO_PATH"

sonar-scanner \
  -Dsonar.projectKey="$PROJECT_KEY" \
  -Dsonar.projectName="$PROJECT_NAME" \
  -Dsonar.projectBaseDir="$REPO_PATH" \
  -Dsonar.sources=. \
  -Dsonar.host.url="http://localhost:9000" \
  -Dsonar.token="$SONAR_TOKEN" \
  -Dsonar.sourceEncoding="UTF-8" \
  -Dsonar.exclusions="**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/.next/**,**/.turbo/**,**/*.min.js"

echo "Scan complete. Review at http://localhost:9000/dashboard?id=$PROJECT_KEY"
