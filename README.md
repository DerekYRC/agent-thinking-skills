<p align="center">
  <h1 align="center">🧠 Agent Thinking Skills</h1>
</p>

<p align="center">
  <em>Two thinking frameworks that make AI agents 10x better at generating and verifying code.</em>
</p>

<p align="center">
<a href="https://github.com/DerekYRC/agent-thinking-skills"><img src="https://img.shields.io/badge/license-Apache%202.0-111111?style=flat-square" alt="Apache 2.0 license"></a>
<a href="https://github.com/DerekYRC/agent-thinking-skills"><img src="https://img.shields.io/badge/works%20with-Claude%20Code%20%7C%20Codex%20%7C%20OpenCode-111111?style=flat-square" alt="Works with Claude Code, Codex, OpenCode"></a>
</p>

<p align="center">
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🌐-中文-blue?style=for-the-badge" alt="中文"></a>
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

**Example:** You ask the AI to "add a cache for the slow API endpoint". The AI's analogical instinct is to wire up Redis. With first principles, it stops and questions: *What is actually slow?* It traces the real bottleneck to an N+1 query in the ORM — fixing the query eliminates the need for a cache entirely. One line changed instead of a new infrastructure dependency.

[Full skill docs →](skills/first-principles/SKILL.md)

---

## adversarial-review

> *"What would an attacker do?"*

Launches parallel AI agents, each attacking your code from a different angle. 6 dimensions: **Boundary conditions, Security, Performance bombs, Data consistency, Error handling, Concurrency**. Three tiers: quick (2-3 agents), standard (6 agents), deep (12-18 agents with cross-validation).

**Example:** You build a user registration form. An adversarial review finds: the email validation regex has a ReDoS vulnerability with crafted inputs (boundary), the username field allows invisible Unicode characters enabling impersonation (security), and the signup endpoint lacks rate limiting allowing mass bot account creation (performance). Three bugs caught before a single user signs up.

[Full skill docs →](skills/adversarial-review/SKILL.md)

---

## Usage

### first-principles

Use it when you want the agent to slow down, question assumptions, and derive the solution from fundamentals before coding.

One-shot prompts:

```text
Think from first principles before implementing this.
Find the root cause of this bug from first principles.
Design this architecture from first principles.
```

Persistent mode:

```text
enable first principles
disable first principles
stop first principles
normal mode
```

When persistent mode is enabled, problem-solving requests go through the 5-step framework automatically. Simple edits and casual questions are handled normally.

OpenCode command:

```text
/first-principles on
/first-principles off
```

### adversarial-review

Use it after implementation, before merging or deploying. It reviews code from an attacker's perspective and returns a ranked report instead of editing files.

Prompt triggers:

```text
Run a quick adversarial review of src/auth.ts.
Run an adversarial review of the current branch.
Run a deep adversarial review of the payment flow.
```

Review levels:

| Level | Trigger | Coverage |
|-------|---------|----------|
| Quick | `quick adversarial review`, `quick review` | 2-3 agents across merged dimensions |
| Standard | `adversarial review`, `adversarial audit` | 6 agents, one per review dimension |
| Deep | `deep adversarial review`, `thorough adversarial review` | 12-18 agents with cross-validation |

OpenCode command:

```text
/adversarial-review src/auth.ts
/adversarial-review quick review current branch
/adversarial-review deep payment flow
```

---

## Installation & Setup

### Via skills.sh (recommended)

Install each skill:

```bash
# First Principles
npx skills add https://github.com/derekyrc/agent-thinking-skills --skill first-principles

# Adversarial Review
npx skills add https://github.com/derekyrc/agent-thinking-skills --skill adversarial-review
```

The repository's `skills.sh.json` groups both skills under **Thinking Frameworks**.

### Claude Code / Codex

Install the skills with `skills.sh` or import this repository as a plugin. The Claude/Codex plugin manifests point at:

```text
skills/
hooks/claude-codex-hooks.json
```

The hook setup enables persistent `first-principles` mode tracking on session start, subagent start, and user prompts. `adversarial-review` works as a normal skill trigger and needs no extra hook setup.

### OpenCode

Use the included OpenCode plugin to register slash commands and load the skills path. Add this to `opencode.json`:

```json
{
  "plugin": ["./.opencode/plugins/first-principles.mjs"]
}
```

The plugin registers `/first-principles` and `/adversarial-review`, injects first-principles instructions while the mode is on, and stores the mode state in the OpenCode config directory.

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

Apache 2.0 © [DerekYRC](https://github.com/DerekYRC)
