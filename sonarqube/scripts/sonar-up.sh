#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SONAR_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$SONAR_DIR"

echo "Starting SonarQube stack..."
docker compose up -d

echo "SonarQube is starting at http://localhost:9000"
echo "Initial startup may take a minute."
