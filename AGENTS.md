# Agent Instructions

This repository contains engineering guardrails and scaffolding. Keep changes small, reviewable, and useful to downstream agents or repository templates.

## Codex Cloud PR Repair Loop

This repository may use Codex Cloud through GitHub comments to repair Joseph-authored pull requests.

Guardrails:

- Only act on PRs labelled `codex:auto-fix`.
- Do not act when `codex:paused`, `codex:needs-human`, or `codex:max-attempts` is present.
- Do not merge PRs.
- Do not force-push, rebase, squash, or rewrite history.
- Do not modify secrets, billing, auth, deployment credentials, or security policy files unless Joseph explicitly asks.
- Make the smallest focused change for the failing check or unresolved review thread.
- Stop and explain when feedback is ambiguous, disputed, external, flaky, permission-related, or unrelated to the PR diff.
- Do not include `Codex`, `[codex]`, `AI-generated`, or similar branding in commit messages or review replies.
- Resolve only review threads that were concretely fixed or directly answered.
