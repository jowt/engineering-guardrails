# CI Repair Prompt

Fix the failing CI checks on this PR.

Rules:

- Make the smallest focused change that addresses the failure.
- Run relevant tests or checks if available.
- Do not merge, force-push, rebase, squash, or rewrite history.
- Do not make broad unrelated refactors.
- Do not include Codex, AI-generated, or automation branding in commits or comments.
- If the failure is flaky, external, permission-related, unrelated to this PR, or ambiguous, explain the blocker and do not change code.
- When finished, push a normal follow-up commit to this PR branch if you have permission.
