# Observability Playbook (OpenTelemetry)

## Goal

Provide a hardened, implementation-oriented OTel standard for services in `~/repos`.

---

## 1) Required Telemetry Pillars

Every production service must emit:

1. **Traces** — end-to-end request/task flow
2. **Metrics** — RED + saturation indicators
3. **Structured Logs** — correlated to trace/span context

---

## 2) Minimum Required Attributes

Attach these resource attributes at startup:

- `service.name`
- `service.version`
- `deployment.environment`
- `service.namespace` (if applicable)

Attach these log fields per event:

- `trace_id`
- `span_id`
- `severity`
- `message`
- `event.name` (optional but recommended)

---

## 3) Trace Context Propagation

### Inbound HTTP

- Extract W3C context from `traceparent`/`tracestate`.
- If missing, generate new root trace.

### Outbound HTTP

- Inject W3C context on every call.

### Async/Queue workflows

- Carry context fields in message metadata.
- Restore context before processing consumer spans.

---

## 4) Span Modeling Guidelines

### Name spans by operation

Good examples:

- `http GET /tasks`
- `db select task`
- `notion sync page`

### Add meaningful attributes

- `http.method`, `http.route`, `http.status_code`
- `db.system`, `db.operation`, `db.statement` (sanitized)
- `retry.count`, `retry.max`, `timeout.ms`

### Record errors correctly

- `span.recordException(error)`
- set status to error
- include typed error code attribute (e.g., `error.code=NOTION_RATE_LIMITED`)

---

## 5) Logging Correlation Pattern

If logger supports bindings/context:

1. obtain active span context,
2. enrich log fields with `trace_id` and `span_id`,
3. write JSON log.

Pseudo-example:

```ts
logger.info({
  trace_id,
  span_id,
  service: "notion-sync",
  operation: "syncPage",
  pageId,
}, "sync started");
```

---

## 6) Metrics Baseline (RED + USE)

### RED for services

- Rate: requests/sec
- Errors: failed requests/sec
- Duration: latency histogram

### USE for infrastructure/components

- Utilization
- Saturation
- Errors

Recommended initial SLO indicators:

- availability: success ratio for core endpoint
- latency: `p95` below target

---

## 7) Sampling Strategy

- Dev/local: high sampling (often 100%)
- Staging: moderate sampling
- Prod: head sampling baseline + tail sampling for errors/high latency if supported

Always sample:

- error traces
- latency outliers
- critical workflows

---

## 8) Data Hygiene and Security

- Never emit secrets/PII in logs/spans.
- Sanitize query strings and payload bodies.
- Limit high-cardinality labels (avoid user IDs as metric labels).

---

## 9) Alerting and Incident Readiness

Alerts should map to user impact and include:

- SLO breach context
- dashboard links
- runbook link
- ownership metadata

On-call should be able to traverse:

alert → dashboard → trace → logs → failing dependency.

---

## 10) OTel Rollout Checklist

- [ ] SDK initialized at process start
- [ ] resource attributes set
- [ ] inbound/outbound propagation verified
- [ ] logger correlation enabled
- [ ] retry/timeout attributes emitted
- [ ] metrics exported and visualized
- [ ] alerts and runbooks linked
- [ ] redaction tests in place
