#!/usr/bin/env bash
set -euo pipefail

ROOT_REPOS="${ROOT_REPOS:-$HOME/repos}"
GUARDRAILS_REPO="$ROOT_REPOS/engineering-guardrails"
BOOTSTRAP_SCRIPT="$GUARDRAILS_REPO/scripts/bootstrap-repo.sh"

if [[ ! -x "$BOOTSTRAP_SCRIPT" ]]; then
  echo "Error: bootstrap script missing or not executable: $BOOTSTRAP_SCRIPT"
  exit 1
fi

for dir in "$ROOT_REPOS"/*; do
  [[ -d "$dir" ]] || continue
  name="$(basename "$dir")"

  if [[ "$name" == "engineering-guardrails" || "$name" == .* ]]; then
    continue
  fi

  echo "Bootstrapping $name"
  "$BOOTSTRAP_SCRIPT" "$dir"
done

echo "Done. All repos under $ROOT_REPOS have standards pointers."
