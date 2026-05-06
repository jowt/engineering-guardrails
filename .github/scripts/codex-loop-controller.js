const fs = require("node:fs");

const token = process.env.GITHUB_TOKEN;
const repoFullName = process.env.GITHUB_REPOSITORY;
const eventPath = process.env.GITHUB_EVENT_PATH;
const ownerLogin = process.env.CODEX_LOOP_OWNER_LOGIN || "jowt";

if (!token || !repoFullName || !eventPath) {
  throw new Error("Missing GitHub Actions environment");
}

const [owner, repo] = repoFullName.split("/");
const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));

const labels = {
  autoFix: "codex:auto-fix",
  paused: "codex:paused",
  needsHuman: "codex:needs-human",
  maxAttempts: "codex:max-attempts",
  ciFix: "codex:ci-fix",
  reviewFix: "codex:review-fix",
};

const budgets = {
  maxTotal: 3,
  maxCi: 2,
  maxReview: 2,
};

async function request(method, path, body, extraHeaders = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${text}`);
  }

  return data;
}

async function graphql(query, variables) {
  const response = await request("POST", "/graphql", { query, variables }, {
    accept: "application/vnd.github+json",
  });

  if (response.errors) {
    throw new Error(JSON.stringify(response.errors));
  }

  return response.data;
}

async function listOpenPulls() {
  return request("GET", `/repos/${owner}/${repo}/pulls?state=open&per_page=50`);
}

async function getPull(number) {
  return request("GET", `/repos/${owner}/${repo}/pulls/${number}`);
}

async function listIssueComments(number) {
  return request("GET", `/repos/${owner}/${repo}/issues/${number}/comments?per_page=100`);
}

async function createComment(number, body) {
  return request("POST", `/repos/${owner}/${repo}/issues/${number}/comments`, { body });
}

async function ensureLabel(name, color, description) {
  try {
    await request("POST", `/repos/${owner}/${repo}/labels`, { name, color, description });
  } catch (error) {
    if (!String(error.message).includes("already_exists")) {
      throw error;
    }
  }
}

async function addLabels(number, names) {
  await request("POST", `/repos/${owner}/${repo}/issues/${number}/labels`, { labels: names });
}

async function listCheckFailures(sha) {
  const checkRuns = await request(
    "GET",
    `/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`,
    null,
    { accept: "application/vnd.github+json" }
  );
  const failedRuns = (checkRuns.check_runs || []).filter((run) =>
    ["failure", "timed_out", "action_required", "startup_failure"].includes(run.conclusion)
  );

  const status = await request("GET", `/repos/${owner}/${repo}/commits/${sha}/status`);
  const failedStatuses = (status.statuses || []).filter((item) =>
    ["failure", "error"].includes(item.state)
  );

  return {
    failedRuns,
    failedStatuses,
    hasFailures: failedRuns.length > 0 || failedStatuses.length > 0,
    fingerprint: [...failedRuns.map((run) => `${run.name}:${run.conclusion}`), ...failedStatuses.map((item) => `${item.context}:${item.state}`)]
      .sort()
      .join("|")
      .slice(0, 500),
  };
}

async function listReviewThreads(number) {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          reviewThreads(first: 80) {
            nodes {
              id
              isResolved
              isOutdated
              comments(first: 10) {
                nodes {
                  body
                  path
                  line
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await graphql(query, { owner, repo, number });
  const nodes = data.repository.pullRequest.reviewThreads.nodes || [];
  const unresolved = nodes.filter((thread) => !thread.isResolved && !thread.isOutdated);
  return {
    unresolved,
    hasUnresolved: unresolved.length > 0,
    fingerprint: unresolved
      .map((thread) => {
        const first = thread.comments.nodes[0] || {};
        const body = String(first.body || "").replace(/\s+/g, " ").slice(0, 120);
        return `${thread.id}:${first.path || ""}:${first.line || ""}:${body}`;
      })
      .sort()
      .join("|")
      .slice(0, 500),
  };
}

function parseState(comments) {
  for (const comment of [...comments].reverse()) {
    const match = comment.body.match(/<!-- codex-loop-state:\n([\s\S]*?)-->/);
    if (!match) continue;

    return Object.fromEntries(
      match[1]
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );
  }

  return {};
}

function numberState(state, key) {
  return Number.parseInt(state[key] || "0", 10) || 0;
}

function stateBlock(next) {
  return `<!-- codex-loop-state:\n${Object.entries(next)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n-->`;
}

function hasAny(labelNames, blocked) {
  return blocked.some((label) => labelNames.includes(label));
}

async function markStopped(pr, state, reason, extraLabels = []) {
  const next = {
    ...state,
    stopped_at: new Date().toISOString(),
    stop_reason: reason.replace(/\s+/g, "-").slice(0, 80),
  };
  await addLabels(pr.number, [labels.needsHuman, ...extraLabels]);
  await createComment(
    pr.number,
    `Automation paused: ${reason}\n\nJoseph needs to review this PR before Codex is triggered again.\n\n${stateBlock(next)}`
  );
}

async function trigger(pr, state, kind, fingerprint) {
  const attemptsTotal = numberState(state, "attempts_total") + 1;
  const ciAttempts = numberState(state, "ci_attempts") + (kind === "ci" ? 1 : 0);
  const reviewAttempts = numberState(state, "review_attempts") + (kind === "review" ? 1 : 0);

  const next = {
    attempts_total: attemptsTotal,
    ci_attempts: ciAttempts,
    review_attempts: reviewAttempts,
    last_kind: kind,
    last_head_sha: pr.head.sha,
    last_fingerprint: fingerprint || "none",
    triggered_at: new Date().toISOString(),
  };

  const prompt =
    kind === "ci"
      ? "@codex fix the failing CI checks on this PR. Follow AGENTS.md and .github/codex/ci-repair.md. Push a focused follow-up commit if safe; otherwise explain the blocker."
      : "@codex address the unresolved actionable review comments on this PR. Follow AGENTS.md and .github/codex/review-repair.md. Push a focused follow-up commit if safe; otherwise explain the blocker.";

  await addLabels(pr.number, [kind === "ci" ? labels.ciFix : labels.reviewFix]);
  await createComment(pr.number, `${prompt}\n\n${stateBlock(next)}`);
}

async function candidateNumbers() {
  if (event.pull_request) {
    return [event.pull_request.number];
  }

  if (event.workflow_run && Array.isArray(event.workflow_run.pull_requests)) {
    return event.workflow_run.pull_requests.map((pull) => pull.number).filter(Boolean);
  }

  const pulls = await listOpenPulls();
  return pulls.map((pull) => pull.number);
}

async function processPull(number) {
  const pr = await getPull(number);
  const labelNames = pr.labels.map((label) => label.name);

  if (pr.user.login !== ownerLogin) return;
  if (pr.draft) return;
  if (pr.head.repo.full_name !== repoFullName) return;
  if (!labelNames.includes(labels.autoFix)) return;
  if (hasAny(labelNames, [labels.paused, labels.needsHuman, labels.maxAttempts])) return;

  const comments = await listIssueComments(pr.number);
  const state = parseState(comments);
  const attemptsTotal = numberState(state, "attempts_total");
  const ciAttempts = numberState(state, "ci_attempts");
  const reviewAttempts = numberState(state, "review_attempts");

  if (attemptsTotal >= budgets.maxTotal) {
    await markStopped(pr, state, `maximum total attempts (${budgets.maxTotal}) reached`, [labels.maxAttempts]);
    return;
  }

  const checks = await listCheckFailures(pr.head.sha);
  const reviews = await listReviewThreads(pr.number);

  let kind = null;
  let fingerprint = "";

  if (checks.hasFailures) {
    kind = "ci";
    fingerprint = checks.fingerprint;
    if (ciAttempts >= budgets.maxCi) {
      await markStopped(pr, state, `maximum CI attempts (${budgets.maxCi}) reached`, [labels.maxAttempts]);
      return;
    }
  } else if (reviews.hasUnresolved) {
    kind = "review";
    fingerprint = reviews.fingerprint;
    if (reviewAttempts >= budgets.maxReview) {
      await markStopped(pr, state, `maximum review attempts (${budgets.maxReview}) reached`, [labels.maxAttempts]);
      return;
    }
  } else {
    return;
  }

  if (state.last_kind === kind && state.last_head_sha === pr.head.sha) {
    return;
  }

  if (state.last_kind === kind && state.last_fingerprint === fingerprint) {
    await markStopped(pr, state, `same ${kind} fingerprint persisted after a Codex attempt`);
    return;
  }

  await trigger(pr, state, kind, fingerprint);
}

async function main() {
  await ensureLabel(labels.autoFix, "2ea44f", "PR is eligible for guarded Codex Cloud repair attempts.");
  await ensureLabel(labels.paused, "6a737d", "Codex repair loop is paused for this PR.");
  await ensureLabel(labels.needsHuman, "d73a4a", "Codex repair loop needs human attention.");
  await ensureLabel(labels.maxAttempts, "b60205", "Codex repair loop reached its attempt budget.");
  await ensureLabel(labels.ciFix, "1d76db", "Latest Codex repair request targeted CI failures.");
  await ensureLabel(labels.reviewFix, "5319e7", "Latest Codex repair request targeted review feedback.");

  const numbers = [...new Set(await candidateNumbers())];
  for (const number of numbers) {
    await processPull(number);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
