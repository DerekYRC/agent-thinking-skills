---
name: adversarial-review
description: >
  Use when the user wants an adversarial security and stability audit of their
  code. Stand in the attacker's shoes to systematically find boundary condition
  bugs, security vulnerabilities, performance bombs, data consistency issues,
  error handling gaps, and concurrency/race conditions. Supports three tiers:
  quick (2-3 agents), standard/默认 (6 agents), and deep (12-18 agents with
  cross-validation). Trigger phrases: "adversarial review", "adversarial audit",
  "quick review", "quick adversarial review", "deep adversarial review",
  "thorough adversarial review". Use whenever the user asks to audit, review for
  vulnerabilities, or find potential bugs in their code from an attacker's
  perspective.
---

# Adversarial Review

You are an attacker. Your task is to find and report vulnerabilities and
risks in code. You do NOT fix them — you report them.

## Determine Review Level

Parse user phrasing to select the review level:

| User says | Level | Agent count |
|-----------|-------|-------------|
| "quick review" / "quick adversarial review" | Quick | 2-3 agents |
| "adversarial review" / "adversarial audit" (default) | Standard | 6 agents |
| "deep adversarial review" / "thorough adversarial review" | Deep | 12-18 agents |

## Review Flow

### 1. Determine Scope

Use the user-specified scope if provided (files, directories, modules).
If no scope given, review the current branch's recent changes (`git diff
main...HEAD` or equivalent). Tell the user what scope you chose.

### 2. Launch Review Agents (in parallel)

Launch agents according to the selected tier. Each agent gets the attack
prompt for its assigned dimension(s). All agents run in parallel.

**Important:** Use the Workflow tool or Agent tool to spawn agents
concurrently. Do NOT review sequentially — parallel execution is the
core value of adversarial review.

### 3. Collect and Rank Findings

After all agents return, merge, deduplicate, and rank findings:

- **Critical**: causes data loss, security breach, system crash, or
  unrecoverable failure
- **Medium**: causes incorrect behavior, degraded service, or recoverable
  failure under specific conditions
- **Low**: edge case with minimal impact, or code smell that could become
  a problem later
- **Info**: observations worth noting but not actionable now

Every Critical and Medium finding MUST include:
- Exact file location with line number
- Concrete reproduction steps
- Impact description
- One-line suggested fix direction

### 4. Output Report

Use the exact report template below. Do not skip sections.

## 6 Review Dimensions and Agent Prompts

### Dimension 1: Boundary Conditions
**Agent prompt:** "You are a boundary condition tester. Scan the code for:
null/undefined handling gaps, oversized inputs, special characters in
strings, time anomalies (future dates, past dates, epoch edge cases),
negative values where only positives are expected, integer overflow,
type confusion between similar types. For each finding, provide: exact
location, reproduction steps, and impact. Be specific — 'might crash'
is not enough, explain exactly what input and what happens."

### Dimension 2: Security Vulnerabilities
**Agent prompt:** "You are a security auditor. Scan for: XSS vectors,
SQL/NoSQL injection, authentication/authorization bypass, sensitive data
exposure in logs/errors/responses, path traversal, insecure
deserialization, missing CSRF protection, hardcoded secrets. Approach
each input and each data flow with 'how would a malicious user exploit
this?' For each finding, provide: exact location, attack path, and
impact. Be concrete — show the malicious input if applicable."

### Dimension 3: Performance Bombs
**Agent prompt:** "You are a performance attacker. Find: OOM paths
(loading unbounded data into memory), infinite loops/recursion with no
termination guarantee, N+1 query patterns, blocking the event loop
with synchronous work on large inputs, resource leaks (file handles,
connections, timers), unbounded queues or buffers. For each finding,
provide exact location, the input pattern that triggers it, and what
happens (crash? hang? slowdown?)."

### Dimension 4: Data Consistency
**Agent prompt:** "You are a data integrity auditor. Find: missing
transaction boundaries on multi-step mutations, lost updates from
concurrent writes, idempotency gaps (double-submit creates duplicates),
state machine transitions that skip validation, stale data reads,
incorrect cascade/sync behavior, missing constraints at the data layer.
For each finding, provide the sequence of operations that triggers the
inconsistency and what data corruption results."

### Dimension 5: Error Handling
**Agent prompt:** "You are an error handling specialist. Find: swallowed
exceptions (catch blocks that do nothing or only log without handling),
retry storms (retry without backoff leading to thundering herd),
missing degradation paths (one dependency failure takes down everything),
broken error propagation (error type lost or context stripped between
layers), missing timeouts on external calls, error messages that leak
internal state. For each finding, trace the error from origin to
ultimate outcome."

### Dimension 6: Concurrency & Race Conditions
**Agent prompt:** "You are a concurrency auditor. Find: lock contention
hotspots, race conditions from unsynchronized shared state, TOCTOU
(time-of-check-time-of-use) bugs, duplicate submission paths without
idempotency guards, cache stampede (many callers rebuilding cache
simultaneously on miss), cache penetration (malicious keys that bypass
the cache), health check false positives (probe returns healthy while
the app is wedged), distributed timing assumptions. For each finding,
describe the interleaving that triggers the bug."

## Report Template

```markdown
# Adversarial Review Report

**Level**: Quick | Standard | Deep
**Review Time**: YYYY-MM-DD HH:MM
**Scope**: [description of code reviewed]

## Summary

- Total findings: N
- Critical: N | Medium: N | Low: N | Info: N

## Critical Issues

### [Issue Title]
- **Dimension**: [one of the 6 dimensions]
- **Location**: `path/to/file.ts:123`
- **Reproduction**: [concrete steps to trigger]
- **Impact**: [what happens when triggered]
- **Suggested Fix**: [one-line direction, not a full solution]

## Medium Issues

[Same format as Critical]

## Low Risk Issues

[Same format]

## Informational

[Same format]

## Coverage

| Dimension | Status | Agents |
|-----------|--------|--------|
| Boundary Conditions | ✅ Complete | N |
| Security Vulnerabilities | ✅ Complete | N |
| Performance Bombs | ✅ Complete | N |
| Data Consistency | ✅ Complete | N |
| Error Handling | ✅ Complete | N |
| Concurrency & Race Conditions | ✅ Complete | N |
```

---

## Tier Configurations

### Quick (2-3 Agents)

```
Agent 1: Security + Boundary Conditions (merged)
  "You are a security and boundary condition tester. [...merged prompts...]"

Agent 2: Performance + Data Consistency (merged)
  "You are a performance and data integrity auditor. [...merged prompts...]"

Agent 3 (optional): Error Handling + Concurrency (merged)
  Only launch if the codebase has meaningful async/concurrent code.
```

### Standard (6 Agents)

One agent per dimension with the full dimension prompt above. All 6 in parallel.

### Deep (12-18 Agents)

2-3 agents per dimension, each with a DISTINCT attack angle on the same
dimension. For deep review ONLY: after all dimension agents return, launch
a cross-validation round — agents within the same dimension review each
other's findings. Mark as "Verified" (both agree) or "Needs Confirmation"
(disagree or only one found it) in the report.

Deep dimension splits:
```
Boundary:  Agent A (data format/types) + Agent B (time/state/ordering)
           + Agent C (encoding/serialization/transport)
Security:  Agent A (OWASP Top 10) + Agent B (business logic flaws)
           + Agent C (infrastructure/config/misconfiguration)
Performance: Agent A (memory/OOM) + Agent B (CPU/loops/recursion)
             + Agent C (IO/files/network/resources)
Data Consistency: Agent A (transactions/atomicity) + Agent B (state machine/idempotency)
Error Handling: Agent A (exception propagation/suppression) + Agent B (retry/degradation/timeouts)
Concurrency: Agent A (locks/mutex/shared state) + Agent B (cache/duplicate submissions)
```
