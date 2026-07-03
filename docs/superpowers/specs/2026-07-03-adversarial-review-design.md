# Adversarial Review Skill — Design Spec

**Date**: 2026-07-03
**Status**: Confirmed, pending implementation

---

## Overview

Create a skill named `adversarial-review` that systematically audits code from an attacker's perspective, finding vulnerabilities and risks. Pure one-shot trigger — no persistent mode. Runs a review, outputs a report, done.

Supports **Claude Code + Codex + OpenCode**.

---

## Triggering

**Pure one-shot**, no persistent mode. Each invocation runs a complete review and outputs a report.

### Trigger Phrases and Levels

| Trigger phrase | Level | Agents | Coverage |
|---------------|-------|--------|----------|
| "quick review" / "quick adversarial review" | Quick | 2-3 | Security+Boundary merged, Performance+Data merged |
| "adversarial review" / "adversarial audit" (default) | Standard | 6 | One agent per dimension |
| "deep adversarial review" / "thorough adversarial review" | Deep | 12-18 | 2-3 agents per dimension, different attack angles + cross-validation |

---

## 6 Review Dimensions

| Dimension | Attack Angle | Agent Prompt Core |
|-----------|-------------|-------------------|
| **Boundary Conditions** | null, oversized input, special chars, time anomalies (future/past), negative values, type confusion, overflow | What extreme inputs can crash the system or cause incorrect behavior? |
| **Security Vulnerabilities** | XSS, injection, auth bypass, sensitive data exposure, deserialization attacks, path traversal | If I were a malicious user, how would I steal, destroy, or bypass? |
| **Performance Bombs** | OOM, infinite loops, infinite recursion, N+1 queries, large file blocking, resource leaks | What inputs or call patterns can exhaust system resources? |
| **Data Consistency** | dirty data, lost updates, missing transaction boundaries, idempotency gaps, state machine errors | Under what timing or failure scenarios would data become corrupted or lost? |
| **Error Handling** | swallowed exceptions, retry storms, missing degradation, broken error propagation, missing timeouts | What failure scenarios would make error handling itself the problem? |
| **Concurrency & Race Conditions** | lock contention, duplicate submissions, cache penetration/stampede, health check false positives, distributed timing | When two things happen at the same time, what goes wrong? |

---

## Three Tier Configurations

### Quick (2-3 Agents)

```
Agent 1: Security + Boundary Conditions  (merged)
Agent 2: Performance + Data Consistency  (merged)
Agent 3: Error Handling + Concurrency    (merged, optional; default is 2 agents)
```

### Standard (6 Agents)

One independent agent per dimension, all running in parallel.

### Deep (12-18 Agents)

2-3 agents per dimension, attacking from different angles within the same dimension:

```
Boundary:  Agent 1 (data format perspective) + Agent 2 (time/state perspective) + Agent 3 (encoding/serialization perspective)
Security:  Agent 1 (OWASP Top 10) + Agent 2 (business logic flaws) + Agent 3 (infrastructure/config)
Performance: Agent 1 (memory/OOM) + Agent 2 (CPU/infinite loops) + Agent 3 (IO/file/network)
Data Consistency: Agent 1 (transactions/atomicity) + Agent 2 (state machine/idempotency)
Error Handling: Agent 1 (exception propagation) + Agent 2 (retry/degradation/timeouts)
Concurrency: Agent 1 (lock/mutex) + Agent 2 (cache/duplicate submissions)
```

Deep-only feature: **cross-validation round**. Findings from agents within the same dimension are cross-reviewed by each other. Findings that don't receive cross-validation are marked as "not cross-validated".

---

## Report Format

All reviews output a unified report:

```markdown
# Adversarial Review Report

**Level**: Quick | Standard | Deep
**Review Time**: YYYY-MM-DD HH:MM
**Scope**: [user-specified files/module/project, or current branch diff]

## Summary

- Total findings: N
- Critical: N | Medium: N | Low: N | Info: N

## Critical Issues

### [Issue Title]
- **Dimension**: Boundary Conditions | Security | Performance | Data Consistency | Error Handling | Concurrency
- **Location**: `file.ts:123`
- **Reproduction**: [Concrete steps to trigger the issue]
- **Impact**: [What happens when triggered]
- **Suggested Fix**: [One-line suggestion, no detailed solution]

## Medium Issues

[same format]

## Low Risk Issues

[same format]

## Informational

[same format]

## Coverage

| Dimension | Status | Agents |
|-----------|--------|--------|
| Boundary Conditions | ✅ Complete | 1 |
| Security Vulnerabilities | ✅ Complete | 1 |
| ... | | |

## Cross-Validation Results (deep reviews only)

[Confirmed/corrected findings after cross-validation]
```

---

## Project Structure

```
skills/
└── adversarial-review/
    └── SKILL.md                 # Skill body: review flow + dimension definitions + report template
.opencode/
└── command/
    └── adversarial-review.md    # OpenCode slash command
```

No hook layer needed because:
- **Not a persistent mode** — no state to persist
- **Pure one-shot trigger** — user says the phrase, review runs, done
- Claude Code and Codex auto-trigger via SKILL.md description
- OpenCode triggers via `.opencode/command/` slash command + skills directory registration

### Architecture Comparison with First-Principles

| Dimension | first-principles | adversarial-review |
|-----------|-----------------|-------------------|
| Trigger | One-shot + persistent mode | Pure one-shot |
| State file | Yes | No |
| Hook layer | Needed (activate/mode-tracker/subagent) | Not needed |
| OpenCode plugin | Needs .mjs (handles mode toggle) | Command file only |
| Complexity | Mirrors ponytail | One SKILL.md + one command file |

---

## SKILL.md Core Content

```markdown
---
name: adversarial-review
description: >
  Use when the user wants an adversarial security/stability audit of their code.
  Stand in the attacker's shoes to systematically find boundary condition bugs,
  security vulnerabilities, performance bombs, data consistency issues, error
  handling gaps, and concurrency/race conditions. Supports three review tiers:
  quick (2-3 agents), standard (6 agents), and deep (12-18 agents with
  cross-validation). Trigger phrases include "adversarial review", "adversarial
  audit", "quick review", "deep adversarial review".
---

# Adversarial Review

You are an attacker. Your task is to find and report vulnerabilities and risks in code.

## Determine Review Level

Parse user phrasing to select review level:
- "quick review" → quick: 2-3 agents
- "adversarial review" (default) → standard: 6 agents
- "deep adversarial review" → deep: 12-18 agents

## Review Flow

### 1. Determine Scope
Use user-specified scope if provided. Otherwise, review the current branch's recent changes.

### 2. Launch Review Agents (parallel)

[Launch agents per the selected tier. Each agent gets the attack prompt for its assigned dimension(s).]

### 3. Collect Findings

After all agents return, merge, deduplicate, and rank findings by severity (Critical/Medium/Low/Info).

Critical issues must include: exact location, reproduction path, impact description, one-line suggested fix.

### 4. Output Report

Use the unified report template (see report section).

## 6 Review Dimensions

[Dimension definitions table]

## Report Template

[Report format]

## Cross-Validation (deep reviews only)

In deep reviews, findings from different agents within the same dimension are cross-reviewed.
Matches are marked "Verified". Disagreements are marked "Needs Confirmation" with explanation.
```

See `skills/adversarial-review/SKILL.md` (written during implementation).

---

## Implementation Steps

1. Write `SKILL.md`
2. Write `.opencode/command/adversarial-review.md`
3. Verify: trigger → review → confirm report format

---

## Self-Review

- No placeholders or TBDs
- No contradictions: 3 tiers consistent with report format (deep adds cross-validation)
- Scope focused: review only, no auto-fix
- No ambiguity: clear trigger phrases, clear level-to-agent mapping
- Minimal architecture: no hook layer needed, no mode persistence
