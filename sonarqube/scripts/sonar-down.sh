#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SONAR_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$SONAR_DIR"

echo "Stopping SonarQube stack..."
docker compose down
