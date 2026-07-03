<p align="center">
  <h1 align="center">🧠 Agent Thinking Skills</h1>
</p>

<p align="center">
  <em>Two thinking frameworks that make AI agents 10x better at generating and verifying code.</em>
</p>

<p align="center">
  <a href="https://github.com/PlanBForFreedom/agent-thinking-skills"><img src="https://img.shields.io/github/stars/PlanBForFreedom/agent-thinking-skills?style=flat-square&color=111111&label=stars" alt="Stars"></a>
  <img src="https://img.shields.io/badge/works%20with-Claude%20Code%20%7C%20Codex%20%7C%20OpenCode-111111?style=flat-square" alt="Works with Claude Code, Codex, OpenCode">
  <img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT license">
</p>

<p align="center">
  <h4><a href="README.zh.md">🌐 中文</a></h4>
</p>

---

## What's Inside

Two skills that form a complete **generate → verify** loop for AI-assisted development:

| Skill | What it does | When to use |
|-------|-------------|-------------|
| **first-principles** | Breaks analogical reasoning, re-derives from fundamental truths | Before coding: design, architecture, root cause analysis |
| **adversarial-review** | Stands in the attacker's shoes, finds vulnerabilities systematically | After coding: audit, stability check, pre-deploy verification |

---

## first-principles

> *"Think from first principles."*

Forces the AI to interrupt pattern-matching and rebuild solutions from the most fundamental facts. A 5-step framework: **Identify Assumptions → Strip Assumptions → Ground Truths → Derive from Scratch → Compare**.

Supports both one-shot trigger ("think from first principles") and persistent mode ("enable first principles").

**Example:** AI says "fix the OpenAI scraping". With first principles, it digs deeper and finds the real problem is a traffic routing bug from April — not the scraping itself. Symptom vs root cause.

[Full skill docs →](skills/first-principles/SKILL.md)

---

## adversarial-review

> *"What would an attacker do?"*

Launches parallel AI agents, each attacking your code from a different angle. 6 dimensions: **Boundary conditions, Security, Performance bombs, Data consistency, Error handling, Concurrency**. Three tiers: quick (2-3 agents), standard (6 agents), deep (12-18 agents with cross-validation).

**Example:** Found an OOM infinite loop in background workers, a "future timestamp" data contamination bug, and cache stampede false positives — all before they hit production.

[Full skill docs →](skills/adversarial-review/SKILL.md)

---

## Installation

### Via skills.sh (recommended)

```bash
npx skills add PlanBForFreedom/agent-thinking-skills
```

Both skills install together. Enable them in your AI agent:

```bash
# Claude Code / Codex
/install PlanBForFreedom/agent-thinking-skills

# OpenCode
# Add to opencode.json: { "plugin": ["./skills/first-principles", "./skills/adversarial-review"] }
```

### Manual

Clone the repo and point your agent's skills directory:

```bash
git clone https://github.com/PlanBForFreedom/agent-thinking-skills.git
```

---

## Supported Platforms

| Platform | first-principles | adversarial-review |
|----------|:---:|:---:|
| Claude Code | ✅ hooks | ✅ skill trigger |
| Codex | ✅ hooks | ✅ skill trigger |
| OpenCode | ✅ plugin | ✅ command |

---

## Why Two Skills?

Vibe Coding has two weak points: **thinking depth** and **quality verification**. These two skills address both:

- **first-principles** handles the "generate" side — ensures the AI understands the problem before writing code
- **adversarial-review** handles the "verify" side — ensures the code survives real-world attacks before deploying

Together they form a closed loop. Use them separately or chain them: design with first principles, then audit the result with adversarial review.

---

## License

MIT © [DerekYRC](https://github.com/DerekYRC)
