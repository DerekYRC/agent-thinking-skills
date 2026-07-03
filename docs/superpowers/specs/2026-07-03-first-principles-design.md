# First Principles Skill — Design Spec

**Date**: 2026-07-03
**Status**: Confirmed, pending implementation

---

## Overview

Create a skill named `first-principles` that forces the AI to break out of analogical reasoning and re-derive solutions from first principles (fundamental truths). Two usage modes:
1. **One-shot trigger**: append "think from first principles" to your prompt
2. **Persistent mode**: manually toggle on/off, stays active across turns

Supports **Claude Code + Codex + OpenCode**.

---

## Triggering

### Keyword triggers (one-shot)

When these phrases appear in user input, inject the 5-step framework:
- "think from first principles"
- "from first principles"
- "find the root cause"
- "rethink from fundamentals"
- "derive from scratch"
- "what is the real problem here"

### Manual toggle (persistent mode)

| Command | Behavior |
|---------|----------|
| `enable first principles` / `turn on first principles` / `/first-principles on` | Enter persistent mode |
| `disable first principles` / `turn off first principles` / `/first-principles off` / `stop first principles` / `normal mode` | Exit persistent mode |

### After disabling

Once manually disabled, keyword triggers **no longer auto-activate** until the user re-enables.

---

## 5-Step Thinking Framework

```
Step 1: Identify Assumptions → Step 2: Strip Assumptions → Step 3: Ground Truths → Step 4: Derive from Scratch → Step 5: Compare & Conclude
```

### Step 1: Identify Assumptions
List all implicit assumptions behind the current approach/problem.
Output: "Current implied assumptions: [...]"

### Step 2: Strip Assumptions
Challenge each: must this assumption hold? What evidence supports it?
Output: "Assumptions that can be stripped: [...], remaining hard constraints: [...]"

### Step 3: Return to Ground Truths
Without referencing any existing solutions, list only the most fundamental facts and constraints.
Output: "The fundamental truths are: [...]"

### Step 4: Derive from Scratch
Starting from ground truths, re-derive a solution. Ignore existing code/architecture.
Output: "Deriving from ground truths: [...]"

### Step 5: Compare & Conclude
Compare the derived result with the current approach. Distinguish symptom-fixes from root-cause fixes.
Output: "Comparison & conclusion: [...]"

### Depth Adaptivity

- **Simple tasks** (config changes, typos): 1-2 sentences per step
- **Medium tasks** (bug fixes, feature changes): 3-5 sentences per step
- **Complex tasks** (architecture, refactoring): expand each step fully

Core rule: **Complete all 5 steps before considering code. No solution before Step 5.**

---

## Scene Classification (when persistent mode is on)

Classify every user request:

**Trigger scenes** (run the 5-step framework):
- A problem is described that needs solving
- Requesting a design or architecture
- Requesting root cause analysis / bug fix
- Requesting evaluation or critique of an approach
- Mentions "why", "root cause", "fundamentally", "essence"

**Non-trigger scenes** (respond normally, no framework):
- Casual conversation
- Factual questions
- Confirmation questions ("is this correct?")
- Simple operations ("add a comment", "rename this variable")
- Code implementation after 5 steps are done ("now write the code")

---

## Right to Question the Problem

The skill explicitly authorizes the AI to question the user's framing of the problem:

> "Fix A" — A might just be a symptom of B. In Step 1, you MUST treat **"the problem is A and not something else"** as an assumption to be examined.

---

## Project Structure

Mirrors ponytail, minimal footprint:

```
.claude-plugin/
├── plugin.json              # Claude Code plugin entry
└── marketplace.json         # Marketplace registration
.codex-plugin/
└── plugin.json              # Codex plugin entry (interface config)
.opencode/
├── plugins/
│   └── first-principles.mjs # OpenCode ES module plugin
└── command/
    └── first-principles.md  # OpenCode slash command
skills/
└── first-principles/
    └── SKILL.md             # Skill body
hooks/
├── claude-codex-hooks.json  # Shared hook config for CC + Codex
├── fp-activate.js           # SessionStart: inject rules into context
├── fp-mode-tracker.js       # UserPromptSubmit: detect toggle commands
├── fp-subagent.js           # SubagentStart: sub-agents inherit mode
├── fp-config.js             # Config: paths, mode definitions
├── fp-instructions.js       # Instruction builder: read SKILL.md + wrap with header
└── fp-runtime.js            # Runtime: state read/write + multi-platform output
opencode.json                # OpenCode plugin registration
package.json                 # npm package (pi / OpenCode extension)
```

### File Responsibilities

| File | Responsibility |
|------|---------------|
| `SKILL.md` | 5-step framework + scene classification + right to question + depth adaptivity. Single source of truth for behavior across all platforms |
| `fp-config.js` | `VALID_MODES = ['on','off']`, `getClaudeDir()`, `isDeactivationCommand()` |
| `fp-runtime.js` | `setMode()`/`clearMode()`/`readMode()`/`writeHookOutput()`, handles CC/Codex/Copilot/OpenCode multi-platform output |
| `fp-instructions.js` | `getFpInstructions(mode)`: read `SKILL.md` without frontmatter, prepend `FIRST PRINCIPLES ACTIVE` header |
| `fp-activate.js` | SessionStart hook: write state file + emit rules to context. Skip if mode==='off' |
| `fp-mode-tracker.js` | UserPromptSubmit hook: detect `/first-principles` command + natural language toggle + deactivation |
| `fp-subagent.js` | SubagentStart hook: read state file, inject rules into sub-agents when mode is on |
| `first-principles.mjs` | OpenCode ES module plugin: `experimental.chat.system.transform` + `command.execute.before` |
| `first-principles.md` | OpenCode slash command file: frontmatter description + template body |
| `claude-codex-hooks.json` | Hook config, SessionStart + SubagentStart + UserPromptSubmit |
| `opencode.json` | OpenCode plugin registration: `{ "plugin": ["./.opencode/plugins/first-principles.mjs"] }` |

### Reuse Hierarchy

```
SKILL.md  ←── single source of truth for behavior
  ↑
fp-instructions.js  ←── reads SKILL.md, strips frontmatter, prepends header
  ↑
fp-activate.js / fp-subagent.js / fp-mode-tracker.js  ←── call instructions
  ↑
fp-runtime.js  ←── setMode / clearMode / writeHookOutput
  ↑
claude-codex-hooks.json  ←── declares hook config
```

Reusing ponytail patterns:
- `writeHookOutput` logic in `fp-runtime.js` (SessionStart raw stdout for CC, JSON for Codex)
- `getClaudeDir()` logic in `fp-config.js`
- State file mechanism: `~/.claude/.first-principles-active` (Claude Code), `$PLUGIN_DATA/.first-principles-active` (Codex)

---

## Hook Config

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup|resume|clear|compact",
      "hooks": [{
        "type": "command",
        "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/hooks/fp-activate.js\"",
        "commandWindows": "...",
        "timeout": 5
      }]
    }],
    "SubagentStart": [{
      "hooks": [{
        "type": "command",
        "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/hooks/fp-subagent.js\"",
        "commandWindows": "...",
        "timeout": 5
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/hooks/fp-mode-tracker.js\"",
        "commandWindows": "...",
        "timeout": 5
      }]
    }]
  }
}
```

---

## OpenCode Platform Architecture

OpenCode differs from Claude Code/Codex: no hooks.json, uses an ES module server plugin instead.

### Three Hooks

| OpenCode hook | Equivalent function | Implementation |
|---------------|-------------------|----------------|
| `config` | Register slash command + skills directory | Read `.opencode/command/` md files, parse frontmatter |
| `experimental.chat.system.transform` | Inject rules into system prompt each turn | Read state file → append rules if not 'off' |
| `command.execute.before` | Intercept `/first-principles on\|off` command | Write state file, takes effect next turn |

### State File

`~/.config/opencode/.first-principles-active` (independent of Claude Code's `~/.claude/.first-principles-active`)

### Slash Command File

`.opencode/command/first-principles.md` — OpenCode format (frontmatter description + template body).
On command execution, plugin reads state file to determine on/off toggle.

### Plugin Registration

`opencode.json`:
```json
{ "plugin": ["./.opencode/plugins/first-principles.mjs"] }
```

### Reuse

- `first-principles.mjs` bridges to CJS `fp-instructions.js` + `fp-config.js` via `createRequire`
- Single source of truth for behavior remains `skills/first-principles/SKILL.md`

---

## Key Differences vs Ponytail

| Dimension | ponytail | first-principles |
|-----------|----------|------------------|
| Mode count | 3 (lite/full/ultra) + review | 1 (on/off) |
| State file | `.ponytail-active` | `.first-principles-active` |
| Intensity filter | `filterSkillBodyForMode` per level | Not needed (no levels) |
| Subagent | Must inherit (issue #252 fix) | Must inherit likewise |
| Deactivation | Full message match `stop ponytail` | Full message match `stop first principles` |

---

## SKILL.md Content (Final)

See `skills/first-principles/SKILL.md` (written during implementation).

---

## Implementation Steps

1. Create directory structure
2. Write `SKILL.md`
3. Write `fp-config.js`
4. Write `fp-runtime.js`
5. Write `fp-instructions.js`
6. Write `fp-activate.js`
7. Write `fp-mode-tracker.js`
8. Write `fp-subagent.js`
9. Write `claude-codex-hooks.json`
10. Write `.claude-plugin/plugin.json`
11. Write `.codex-plugin/plugin.json`
12. Write `.opencode/plugins/first-principles.mjs` (OpenCode ES module)
13. Write `.opencode/command/first-principles.md` (OpenCode slash command)
14. Write `opencode.json`
15. Write `package.json`
16. Verify: startup → enable mode → confirm injection → disable mode → confirm cleared (all 3 platforms)

---

## Self-Review

- No placeholders or TBDs
- No contradictions: 5-step framework aligns with scene classification; right-to-question aligns with Step 1
- Scope focused: only first-principles, no adversarial-review
- No ambiguity: trigger/non-trigger scenes have clear classification criteria
