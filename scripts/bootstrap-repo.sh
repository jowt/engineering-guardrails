#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <absolute_repo_path>"
  echo "Example: $0 /Users/josephwright/repos/notion"
  exit 1
fi

TARGET_REPO="$1"
GUARDRAILS_REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ ! -d "$TARGET_REPO" ]]; then
  echo "Error: target repo not found: $TARGET_REPO"
  exit 1
fi

cat > "$TARGET_REPO/ENGINEERING_STANDARDS.md" <<EOF
# Engineering Standards Reference

This repository follows centralized standards from:

- $GUARDRAILS_REPO/models.txt
- $GUARDRAILS_REPO/docs/coding_guidelines_master.md
- $GUARDRAILS_REPO/docs/observability_otel_playbook.md
- $GUARDRAILS_REPO/docs/doc_tree_template.md

## Required PR confirmations

- Strict typing preserved; no new any.
- OTel observability and trace/log correlation preserved.
- Duplicate logic avoided; shared libraries used where applicable.
- Tests added/updated (unit/integration/smoke as relevant).
- Docs/ADR updated for architecture/contract changes.
EOF

cat > "$TARGET_REPO/AGENT.md" <<EOF
# Agent Instructions

This repository uses centralized engineering guardrails.

Primary local reference:

- ENGINEERING_STANDARDS.md

Central source-of-truth:

- $GUARDRAILS_REPO/models.txt
- $GUARDRAILS_REPO/docs/coding_guidelines_master.md
- $GUARDRAILS_REPO/docs/observability_otel_playbook.md
- $GUARDRAILS_REPO/docs/doc_tree_template.md

When making changes in this repository, follow ENGINEERING_STANDARDS.md first,
then the central guardrails above for detailed principles and policies.
EOF

cat > "$TARGET_REPO/CLAUDE.md" <<EOF
# Claude Instructions

See AGENT.md for the canonical agent instructions in this repository.

Primary local reference:

- ENGINEERING_STANDARDS.md

Central source-of-truth:

- $GUARDRAILS_REPO/models.txt
- $GUARDRAILS_REPO/docs/coding_guidelines_master.md
- $GUARDRAILS_REPO/docs/observability_otel_playbook.md
- $GUARDRAILS_REPO/docs/doc_tree_template.md
EOF

if [[ ! -f "$TARGET_REPO/sonar-project.properties" ]]; then
  cp "$GUARDRAILS_REPO/templates/sonar-project.properties.template" "$TARGET_REPO/sonar-project.properties"
  echo "Created sonar-project.properties template in target repo."
else
  echo "sonar-project.properties already exists, skipped."
fi

echo "Bootstrapped standards in: $TARGET_REPO"
