# First-Principles & Adversarial-Review 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建两个 skill — first-principles（模式切换型，5步思维框架）和 adversarial-review（单次触发型，6维度攻击审计）

**Architecture:** first-principles 对标 ponytail 的两层架构（hooks + SKILL.md），支持 CC/Codex/OpenCode 三平台；adversarial-review 极简架构（SKILL.md + OpenCode command 文件），无 hook 层

**Tech Stack:** Node.js (CommonJS hooks), ES module (OpenCode plugin), 无外部依赖

---

## Global Constraints

- Spec 和 plan 用中文，skill 内容（SKILL.md、hooks、command）用英文
- 状态文件路径：`~/.claude/.first-principles-active`（Claude Code），`$PLUGIN_DATA/.first-principles-active`（Codex），`~/.config/opencode/.first-principles-active`（OpenCode）
- deactivation 命令必须全消息匹配（对标 ponytail 的 `isDeactivationCommand`），避免误触发
- OpenCode plugin 通过 `createRequire` 桥接 CJS 的 `fp-instructions.js` + `fp-config.js`

---

# Part A: first-principles

## File Map

```
skills/first-principles/SKILL.md       — 创建，行为定义源
hooks/fp-config.js                     — 创建，路径/模式配置
hooks/fp-runtime.js                    — 创建，状态读写+多平台输出
hooks/fp-instructions.js               — 创建，读SKILL.md拼接header
hooks/fp-activate.js                   — 创建，SessionStart hook
hooks/fp-mode-tracker.js               — 创建，UserPromptSubmit hook
hooks/fp-subagent.js                   — 创建，SubagentStart hook
hooks/claude-codex-hooks.json          — 创建，hook配置
.claude-plugin/plugin.json             — 创建，CC插件入口
.claude-plugin/marketplace.json        — 创建，市场注册
.codex-plugin/plugin.json              — 创建，Codex插件入口
.opencode/plugins/first-principles.mjs — 创建，OpenCode ES module
.opencode/command/first-principles.md  — 创建，OpenCode slash command
opencode.json                          — 创建或修改，插件注册
package.json                           — 创建，npm包定义
```

## Task Dependency Graph

```
Task 1 (SKILL.md)         ← 无依赖，先写行为定义源
Task 2 (fp-config.js)     ← 无依赖，工具层
Task 3 (fp-runtime.js)    ← 依赖 Task 2
Task 4 (fp-instructions.js)← 依赖 Task 1, 2
Task 5 (fp-activate.js)   ← 依赖 Task 3, 4
Task 6 (fp-mode-tracker.js)← 依赖 Task 2, 3
Task 7 (fp-subagent.js)   ← 依赖 Task 3, 4
Task 8 (hooks.json)       ← 依赖 Task 5, 6, 7
Task 9 (CC plugin)        ← 依赖 Task 8
Task 10 (Codex plugin)    ← 依赖 Task 8
Task 11 (OpenCode plugin) ← 依赖 Task 2, 4
Task 12 (OpenCode command)← 无依赖
Task 13 (opencode.json)   ← 依赖 Task 11
Task 14 (package.json)    ← 无依赖
Task 15 (验证)            ← 依赖所有
```

---

### Task 1: SKILL.md — 行为定义源

**Files:**
- Create: `skills/first-principles/SKILL.md`

**Interfaces:**
- Produces: SKILL.md frontmatter (`name: first-principles`, `description: ...`) + body (5-step framework, scene classification, right-to-question)

- [ ] **Step 1: 写 SKILL.md**

```markdown
---
name: first-principles
description: >
  Use when the user needs to break out of analogical reasoning and re-derive
  solutions from fundamental truths. Trigger phrases: "think from first
  principles", "from first principles", "find the root cause", "rethink from
  fundamentals", "derive from scratch". Supports persistent mode: "enable first
  principles" to enter, "disable first principles" to exit. When activated,
  every problem-solving request goes through a 5-step framework to identify
  assumptions, strip them, return to ground truths, derive from scratch, and
  compare. Use this whenever the user wants to find root causes, design
  architectures, evaluate approaches, or fix bugs at their true source — not
  just patch symptoms.
---

# First Principles

Interrupt analogical reasoning. Re-derive solutions from the most fundamental
truths. You are not looking for the most similar case in your training data —
you are reconstructing the solution from zero.

## Scene Classification (when persistent mode is on)

Classify every user request at the start of your response:

**Trigger scenes** (run the 5-step framework):
- A problem is described that needs solving
- Requesting a design, architecture, or plan
- Requesting root cause analysis or a bug fix
- Requesting evaluation or critique of an approach
- Mentions "why", "root cause", "fundamentally", "essence", "real reason"

**Non-trigger scenes** (respond normally, no framework):
- Casual conversation and chitchat
- Factual questions ("what does X do?", "where is Y?")
- Confirmation questions ("is this correct?")
- Simple operations ("add a comment", "rename this variable")
- Code implementation after the 5 steps are done ("now write the code")

If non-trigger, respond normally without explanation. If trigger, proceed
through the 5-step framework below.

## Right to Question the Problem

"Fix A" — A might just be a symptom of B, the deeper disease. In Step 1, you
MUST treat **"the problem is A and not something else"** itself as an
assumption to be examined. You have explicit permission to challenge the
user's framing when the evidence points deeper.

## 5-Step Framework (execute in order, do not skip)

### Step 1: Identify Assumptions
List ALL implicit assumptions behind the current approach or problem framing.
Include assumptions about the problem itself, about constraints, about what
solutions are possible, and about what the user said.
Output: **"Current implied assumptions: [...]"**

### Step 2: Strip Assumptions
Challenge each assumption one by one. Must this assumption hold? What
evidence supports it? What if we invert it?
Output: **"Assumptions that can be stripped: [...], remaining hard constraints: [...]"**

### Step 3: Return to Ground Truths
Without referencing ANY existing solutions, patterns, or prior art — list
only the most fundamental facts and constraints. Physical laws, mathematical
truths, the user's actual requirements (not their assumed solutions).
Output: **"The fundamental truths are: [...]"**

### Step 4: Derive from Scratch
Starting ONLY from the ground truths in Step 3, derive a solution. Ignore
existing code, known patterns, industry conventions — unless they re-emerge
as necessary consequences of the ground truths.
Output: **"Deriving from ground truths: [...]"**

### Step 5: Compare and Conclude
Contrast the derived solution from Step 4 with the current approach (or with
what the user originally asked for). Identify: is the original fix treating a
symptom or the root cause? What is the minimal change that addresses the real
problem?
Output: **"Comparison & conclusion: [...]"**

## Depth Adaptivity

- **Simple tasks** (config change, typo fix): 1-2 sentences per step
- **Medium tasks** (bug fix, feature change): 3-5 sentences per step
- **Complex tasks** (architecture design, refactoring): expand each step fully

**Core rule: Complete all 5 steps before considering code. No solution before Step 5.**

## Persistence

ACTIVE EVERY RESPONSE when mode is on. Deactivate with: "disable first
principles", "turn off first principles", "stop first principles", or
"normal mode". Mode persists until explicitly deactivated or session ends.
```

- [ ] **Step 2: 验证文件存在且格式正确**

```bash
test -f skills/first-principles/SKILL.md && echo "OK: file exists"
head -5 skills/first-principles/SKILL.md
```

- [ ] **Step 3: 提交**

```bash
git add skills/first-principles/SKILL.md
git commit -m "feat: add first-principles SKILL.md with 5-step framework

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: fp-config.js — 配置模块

**Files:**
- Create: `hooks/fp-config.js`

**Interfaces:**
- Produces:
  - `DEFAULT_MODE = 'on'`
  - `VALID_MODES = ['on', 'off']`
  - `normalizeMode(mode)` → `'on' | 'off' | null`
  - `getClaudeDir()` → `string` (路径)
  - `isDeactivationCommand(text)` → `boolean`

- [ ] **Step 1: 写 fp-config.js**

对标 ponytail 的 `ponytail-config.js`，简化版（无 level、无 config file）：

```javascript
#!/usr/bin/env node
// first-principles — shared configuration resolver
//
// On/off binary mode (no intensity levels).
// Default: 'on' (when enabled via hook). Manually toggled.

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_MODE = 'on';
const VALID_MODES = ['on', 'off'];

function normalizeMode(mode) {
  if (typeof mode !== 'string') return null;
  const normalized = mode.trim().toLowerCase();
  return VALID_MODES.includes(normalized) ? normalized : null;
}

// "stop first principles" / "normal mode" deactivate, but only as a standalone
// command. Matching the phrase anywhere in the message would deactivate mid-task
// for ordinary requests — so require the whole message to be the command,
// ignoring case and trailing punctuation.
function isDeactivationCommand(text) {
  const t = String(text || '').trim().toLowerCase().replace(/[.!?\s]+$/, '');
  return t === 'stop first principles' || t === 'disable first principles' ||
    t === 'turn off first principles' || t === 'normal mode';
}

function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

module.exports = {
  DEFAULT_MODE,
  VALID_MODES,
  normalizeMode,
  getClaudeDir,
  isDeactivationCommand,
};
```

- [ ] **Step 2: 验证**

```bash
node -e "const c = require('./hooks/fp-config'); console.log(c.normalizeMode('ON'), c.isDeactivationCommand('stop first principles'), c.getClaudeDir())"
# Expected: on true /Users/planb4freedom/.claude
```

- [ ] **Step 3: 提交**

```bash
git add hooks/fp-config.js
git commit -m "feat: add fp-config.js for first-principles mode config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: fp-runtime.js — 状态运行时

**Files:**
- Create: `hooks/fp-runtime.js`

**Interfaces:**
- Consumes: `getClaudeDir` from fp-config.js
- Produces:
  - `setMode(mode)` — 写状态文件
  - `clearMode()` — 删状态文件
  - `readMode()` → `string | null`
  - `writeHookOutput(event, mode, context)` — 多平台输出路由
  - `isCodex`, `isCopilot` (boolean exports)

- [ ] **Step 1: 写 fp-runtime.js**

对标 ponytail 的 `ponytail-runtime.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { getClaudeDir } = require('./fp-config');

const STATE_FILE = '.first-principles-active';
const isCopilot = Boolean(process.env.COPILOT_PLUGIN_DATA);
const isCodex = !isCopilot && Boolean(process.env.PLUGIN_DATA);

let stateDir = getClaudeDir();
if (isCodex) stateDir = process.env.PLUGIN_DATA;
if (isCopilot) stateDir = process.env.COPILOT_PLUGIN_DATA;

const statePath = path.join(stateDir, STATE_FILE);

function setMode(mode) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode);
}

function clearMode() {
  try { fs.unlinkSync(statePath); } catch (e) {}
}

function readMode() {
  try {
    return fs.readFileSync(statePath, 'utf8').trim() || null;
  } catch (e) {
    return null;
  }
}

function writeHookOutput(event, mode, context = '') {
  if (isCopilot) {
    process.stdout.write(JSON.stringify(
      event === 'SessionStart' && context ? { additionalContext: context } : {}));
    return;
  }
  if (isCodex) {
    // Codex requires JSON output with systemMessage + hookSpecificOutput
    const output = { systemMessage: 'FP:' + mode.toUpperCase() };
    if (context) {
      output.hookSpecificOutput = {
        hookEventName: event,
        additionalContext: context,
      };
    }
    process.stdout.write(JSON.stringify(output));
    return;
  }
  // Native Claude: SessionStart accepts raw stdout
  if (event === 'SubagentStart') {
    process.stdout.write(JSON.stringify(
      { hookSpecificOutput: { hookEventName: event, additionalContext: context } }));
    return;
  }
  process.stdout.write(context);
}

module.exports = {
  clearMode,
  isCodex,
  isCopilot,
  readMode,
  setMode,
  writeHookOutput,
};
```

- [ ] **Step 2: 验证**

```bash
node -e "
const r = require('./hooks/fp-runtime');
r.setMode('on');
console.log('set+read:', r.readMode());
r.clearMode();
console.log('cleared:', r.readMode());
"
# Expected: set+read: on  /  cleared: null
```

- [ ] **Step 3: 提交**

```bash
git add hooks/fp-runtime.js
git commit -m "feat: add fp-runtime.js for multi-platform state management

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: fp-instructions.js — 指令构建器

**Files:**
- Create: `hooks/fp-instructions.js`

**Interfaces:**
- Consumes: `normalizeMode` from fp-config.js, `skills/first-principles/SKILL.md`
- Produces: `getFpInstructions(mode)` → `string` (去 frontmatter 的 SKILL.md body，加 header)

- [ ] **Step 1: 写 fp-instructions.js**

对标 ponytail 的 `ponytail-instructions.js`，简化版（无 filterSkillBodyForMode）：

```javascript
#!/usr/bin/env node
// Shared first-principles instruction builder for Claude hooks and OpenCode plugin.

const fs = require('fs');
const path = require('path');
const { DEFAULT_MODE, normalizeMode } = require('./fp-config');

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'first-principles', 'SKILL.md');

function getFpInstructions(mode) {
  const effectiveMode = normalizeMode(mode) || DEFAULT_MODE;

  try {
    const body = fs.readFileSync(SKILL_PATH, 'utf8');
    const withoutFrontmatter = String(body).replace(/^---[\s\S]*?---\s*/, '');
    return 'FIRST PRINCIPLES ACTIVE\n\n' + withoutFrontmatter;
  } catch (e) {
    return 'FIRST PRINCIPLES ACTIVE\n\n' +
      'Interrupt analogical reasoning. Re-derive from the most fundamental truths.\n\n' +
      '## 5-Step Framework\n\n' +
      '1. Identify Assumptions — list ALL implicit assumptions\n' +
      '2. Strip Assumptions — challenge each, keep only what must hold\n' +
      '3. Return to Ground Truths — list only fundamental facts, no prior art\n' +
      '4. Derive from Scratch — build from ground truths only\n' +
      '5. Compare & Conclude — derived vs current, symptom vs root cause\n\n' +
      'Complete all 5 steps before considering code. No solution before Step 5.\n\n' +
      '## Right to Question\n\n' +
      '"Fix A" — A might be a symptom of B. Treat the problem framing itself as an assumption to examine.\n\n' +
      '## Persistence\n\n' +
      'ACTIVE EVERY RESPONSE. Deactivate: "disable first principles", "stop first principles", "normal mode".';
  }
}

module.exports = { getFpInstructions };
```

- [ ] **Step 2: 验证**

```bash
node -e "
const { getFpInstructions } = require('./hooks/fp-instructions');
const out = getFpInstructions('on');
console.log(out.substring(0, 100));
console.log('Contains 5-step:', out.includes('Step 1'));
"
# Expected: starts with FIRST PRINCIPLES ACTIVE, contains Step 1
```

- [ ] **Step 3: 提交**

```bash
git add hooks/fp-instructions.js
git commit -m "feat: add fp-instructions.js to build rules from SKILL.md

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: fp-activate.js — SessionStart Hook

**Files:**
- Create: `hooks/fp-activate.js`

**Interfaces:**
- Consumes: `getFpInstructions` from fp-instructions.js, `setMode`/`clearMode`/`writeHookOutput` from fp-runtime.js
- Produces: SessionStart hook output (注入规则到上下文)

- [ ] **Step 1: 写 fp-activate.js**

对标 ponytail 的 `ponytail-activate.js`：

```javascript
#!/usr/bin/env node
// first-principles — Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Reads current mode from state file
//   2. If mode is not 'off', emits first-principles ruleset as hidden SessionStart context
//   3. If mode is 'off', skips entirely

const fs = require('fs');
const path = require('path');
const { getFpInstructions } = require('./fp-instructions');
const { readMode, setMode, clearMode, writeHookOutput, isCodex } = require('./fp-runtime');

const mode = readMode() || 'on'; // default on for first startup

// "off" mode — skip activation, clear flag
if (mode === 'off') {
  clearMode();
  writeHookOutput('SessionStart', 'off', isCodex ? '' : 'OK');
  process.exit(0);
}

// Write flag file
try {
  setMode(mode);
} catch (e) {
  // Silent fail — flag is best-effort
}

// Emit the first-principles ruleset
const output = getFpInstructions(mode);
writeHookOutput('SessionStart', mode, output);
```

- [ ] **Step 2: 验证**

```bash
node hooks/fp-activate.js
# Expected: stdout 输出 FIRST PRINCIPLES ACTIVE + SKILL.md 内容（无 frontmatter）
# 同时写入 ~/.claude/.first-principles-active 状态文件
cat ~/.claude/.first-principles-active 2>/dev/null || echo "(file may exist, check manually)"
```

- [ ] **Step 3: 提交**

```bash
git add hooks/fp-activate.js
git commit -m "feat: add fp-activate.js SessionStart hook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: fp-mode-tracker.js — UserPromptSubmit Hook

**Files:**
- Create: `hooks/fp-mode-tracker.js`

**Interfaces:**
- Consumes: `normalizeMode`/`isDeactivationCommand` from fp-config.js, `setMode`/`clearMode`/`writeHookOutput` from fp-runtime.js
- Produces: UserPromptSubmit hook output (检测命令 + 写状态文件)

- [ ] **Step 1: 写 fp-mode-tracker.js**

对标 ponytail 的 `ponytail-mode-tracker.js`：

```javascript
#!/usr/bin/env node
// first-principles — UserPromptSubmit hook to track which mode is active
// Inspects user input for /first-principles commands and writes mode to flag file

const fs = require('fs');
const { normalizeMode, isDeactivationCommand } = require('./fp-config');
const { clearMode, setMode, writeHookOutput } = require('./fp-runtime');

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    // Strip UTF-8 BOM some shells prepend when piping
    const data = JSON.parse(input.replace(/^﻿/, ''));
    const prompt = (data.prompt || '').trim();
    const lower = prompt.toLowerCase();

    // Deactivation check (full-message match only, like ponytail)
    if (isDeactivationCommand(prompt)) {
      clearMode();
      writeHookOutput('UserPromptSubmit', 'off', 'FIRST PRINCIPLES OFF');
      return;
    }

    // Match /first-principles commands
    if (/^[/]first-principles/.test(prompt)) {
      const parts = prompt.split(/\s+/);
      const arg = parts[1] || '';

      let mode = null;

      if (arg === 'on' || arg === 'enable' || arg === 'start') {
        mode = 'on';
      } else if (arg === 'off' || arg === 'disable' || arg === 'stop') {
        mode = 'off';
      }

      if (mode === 'on') {
        setMode('on');
        writeHookOutput('UserPromptSubmit', 'on', 'FIRST PRINCIPLES ENABLED');
      } else if (mode === 'off') {
        clearMode();
        writeHookOutput('UserPromptSubmit', 'off', 'FIRST PRINCIPLES DISABLED');
      }
      return;
    }

    // Natural language activation
    if (/\b(enable|turn on|activate|start)\s+(first.principles)\b/i.test(lower)) {
      setMode('on');
      writeHookOutput('UserPromptSubmit', 'on', 'FIRST PRINCIPLES ENABLED');
    }

    // Natural language deactivation
    if (/\b(turn off|disable|deactivate|stop)\s+(first.principles)\b/i.test(lower)) {
      clearMode();
      writeHookOutput('UserPromptSubmit', 'off', 'FIRST PRINCIPLES DISABLED');
    }
  } catch (e) {
    // Silent fail
  }
});
```

- [ ] **Step 2: 验证**

```bash
# 测试 deactivation
echo '{"prompt":"stop first principles"}' | node hooks/fp-mode-tracker.js
# Expected: stdout 输出 FIRST PRINCIPLES OFF

# 测试 activation
echo '{"prompt":"enable first principles"}' | node hooks/fp-mode-tracker.js
# Expected: stdout 输出 FIRST PRINCIPLES ENABLED
```

- [ ] **Step 3: 提交**

```bash
git add hooks/fp-mode-tracker.js
git commit -m "feat: add fp-mode-tracker.js UserPromptSubmit hook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: fp-subagent.js — SubagentStart Hook

**Files:**
- Create: `hooks/fp-subagent.js`

**Interfaces:**
- Consumes: `getFpInstructions` from fp-instructions.js, `readMode`/`writeHookOutput` from fp-runtime.js
- Produces: SubagentStart hook output (注入规则到子 agent)

- [ ] **Step 1: 写 fp-subagent.js**

对标 ponytail 的 `ponytail-subagent.js`：

```javascript
#!/usr/bin/env node
// first-principles — Claude Code SubagentStart hook
//
// SessionStart context is parent-thread only and never reaches subagents.
// When first-principles mode is active, inject the same ruleset into each subagent.

const { getFpInstructions } = require('./fp-instructions');
const { readMode, writeHookOutput } = require('./fp-runtime');

const mode = readMode();

// Absent flag or off → first-principles isn't active; inject nothing.
if (!mode || mode === 'off') {
  process.exit(0);
}

try {
  writeHookOutput('SubagentStart', mode, getFpInstructions(mode));
} catch (e) {
  // Silent fail
}
```

- [ ] **Step 2: 验证**

```bash
# 先设置 mode 为 on
node -e "require('./hooks/fp-runtime').setMode('on')"
# 运行 subagent hook
node hooks/fp-subagent.js
# Expected: stdout 输出 JSON 包含 FIRST PRINCIPLES ACTIVE

# 清除后应该无输出
node -e "require('./hooks/fp-runtime').clearMode()"
node hooks/fp-subagent.js
# Expected: 无输出（exit 0）
```

- [ ] **Step 3: 提交**

```bash
git add hooks/fp-subagent.js
git commit -m "feat: add fp-subagent.js SubagentStart hook

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: claude-codex-hooks.json — Hook 配置

**Files:**
- Create: `hooks/claude-codex-hooks.json`

**Interfaces:**
- Produces: hook 配置文件，SessionStart + SubagentStart + UserPromptSubmit 三个事件

- [ ] **Step 1: 写 claude-codex-hooks.json**

对标 ponytail 的 `claude-codex-hooks.json`：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/hooks/fp-activate.js\"",
            "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"$env:CLAUDE_PLUGIN_ROOT\\hooks\\fp-activate.js\" }",
            "timeout": 5,
            "statusMessage": "Loading first-principles mode..."
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/hooks/fp-subagent.js\"",
            "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"$env:CLAUDE_PLUGIN_ROOT\\hooks\\fp-subagent.js\" }",
            "timeout": 5,
            "statusMessage": "Loading first-principles mode..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "exec node \"${CLAUDE_PLUGIN_ROOT}/hooks/fp-mode-tracker.js\"",
            "commandWindows": "if (Get-Command node -ErrorAction SilentlyContinue) { node \"$env:CLAUDE_PLUGIN_ROOT\\hooks\\fp-mode-tracker.js\" }",
            "timeout": 5,
            "statusMessage": "Tracking first-principles mode..."
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: 验证 JSON 格式**

```bash
node -e "JSON.parse(require('fs').readFileSync('hooks/claude-codex-hooks.json','utf8')); console.log('JSON valid')"
# Expected: JSON valid
```

- [ ] **Step 3: 提交**

```bash
git add hooks/claude-codex-hooks.json
git commit -m "feat: add claude-codex-hooks.json for CC+Codex hook config

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: .claude-plugin/plugin.json — Claude Code 插件入口

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.claude-plugin/marketplace.json`

**Interfaces:**
- Produces: CC 插件入口，指向 `hooks/claude-codex-hooks.json`

- [ ] **Step 1: 写 plugin.json**

```json
{
  "name": "first-principles",
  "version": "1.0.0",
  "description": "First Principles thinking mode. Forces AI to break out of analogical reasoning and re-derive solutions from fundamental truths. Five-step framework: identify assumptions, strip them, return to ground truths, derive from scratch, compare.",
  "author": {
    "name": "DerekYRC",
    "url": "https://github.com/DerekYRC"
  },
  "hooks": "./hooks/claude-codex-hooks.json"
}
```

- [ ] **Step 2: 写 marketplace.json**

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "first-principles",
  "description": "First Principles thinking for AI agents. Break out of analogical reasoning, re-derive from fundamental truths.",
  "owner": {
    "name": "DerekYRC",
    "url": "https://github.com/DerekYRC"
  },
  "plugins": [
    {
      "name": "first-principles",
      "description": "Five-step framework: identify assumptions, strip them, ground truths, derive from scratch, compare.",
      "source": "./",
      "category": "thinking"
    }
  ]
}
```

- [ ] **Step 3: 验证并提交**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')); console.log('OK')"
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "feat: add Claude Code plugin entry for first-principles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: .codex-plugin/plugin.json — Codex 插件入口

**Files:**
- Create: `.codex-plugin/plugin.json`

**Interfaces:**
- Produces: Codex 插件入口，含 interface 配置

- [ ] **Step 1: 写 plugin.json**

对标 ponytail 的 `.codex-plugin/plugin.json`：

```json
{
  "name": "first-principles",
  "version": "1.0.0",
  "description": "First Principles thinking mode. Five-step framework to re-derive solutions from fundamental truths.",
  "author": {
    "name": "DerekYRC",
    "url": "https://github.com/DerekYRC"
  },
  "homepage": "https://github.com/DerekYRC/hello-ai",
  "license": "MIT",
  "keywords": ["first-principles", "thinking", "problem-solving", "root-cause"],
  "skills": "./skills/",
  "hooks": "./hooks/claude-codex-hooks.json",
  "interface": {
    "displayName": "First Principles",
    "shortDescription": "Re-derive solutions from fundamental truths",
    "longDescription": "Interrupt analogical reasoning and re-derive solutions from the most fundamental facts. Five-step framework: identify assumptions, strip them, ground truths, derive from scratch, compare.",
    "developerName": "DerekYRC",
    "category": "Thinking",
    "capabilities": ["Instructions", "Lifecycle hooks"],
    "defaultPrompt": [
      "Think from first principles.",
      "Find the root cause of this bug from first principles.",
      "Design this architecture from first principles."
    ],
    "brandColor": "#1a1a2e"
  }
}
```

- [ ] **Step 2: 验证并提交**

```bash
node -e "JSON.parse(require('fs').readFileSync('.codex-plugin/plugin.json','utf8')); console.log('OK')"
git add .codex-plugin/plugin.json
git commit -m "feat: add Codex plugin entry for first-principles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: .opencode/plugins/first-principles.mjs — OpenCode ES Module

**Files:**
- Create: `.opencode/plugins/first-principles.mjs`

**Interfaces:**
- Consumes: `getFpInstructions` from fp-instructions.js (via createRequire), `normalizeMode` from fp-config.js (via createRequire)
- Produces: OpenCode plugin with `config` + `experimental.chat.system.transform` + `command.execute.before`

- [ ] **Step 1: 写 first-principles.mjs**

对标 ponytail 的 `.opencode/plugins/ponytail.mjs`：

```javascript
// first-principles — OpenCode plugin.
//
// Injects the first-principles ruleset into every chat's system prompt when
// mode is active, persists /first-principles on|off switches, and registers
// the slash command so it works when installed.
//
// OpenCode loads this as a server plugin — add it to your opencode.json:
//   { "plugin": ["./.opencode/plugins/first-principles.mjs"] }

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bridge to CommonJS hooks
const require = createRequire(import.meta.url);
const { getFpInstructions } = require('../../hooks/fp-instructions');
const { normalizeMode } = require('../../hooks/fp-config');

// State file beside OpenCode config
const statePath = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'opencode',
  '.first-principles-active',
);

function readMode() {
  try {
    const raw = fs.readFileSync(statePath, 'utf8').trim();
    return normalizeMode(raw) || 'on';
  } catch (e) {
    return 'on';
  }
}

function writeMode(mode) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode);
}

export function parseCommandFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim();
  return { description, template: match[2].trim() };
}

export default async ({ client } = {}) => {
  const log = (level, message) => {
    try { client && client.app && client.app.log({ body: { service: 'first-principles', level, message } }); } catch (e) {}
  };

  const fpSkillsDir = path.resolve(__dirname, '../../skills');

  return {
    // Register slash commands + skills directory.
    config: async (config) => {
      if (!config.command) config.command = {};
      const commandDir = path.join(__dirname, '..', 'command');
      try {
        for (const file of fs.readdirSync(commandDir).filter((f) => f.endsWith('.md'))) {
          const name = path.basename(file, '.md');
          const parsed = parseCommandFile(path.join(commandDir, file));
          if (parsed) config.command[name] = parsed;
        }
      } catch (e) {}

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(fpSkillsDir)) {
        config.skills.paths.push(fpSkillsDir);
      }
    },

    // Append the ruleset to the system prompt every turn.
    'experimental.chat.system.transform': async (_input, output) => {
      const mode = readMode();
      if (mode === 'off') return;
      output.system.push(getFpInstructions(mode));
    },

    // Persist /first-principles on|off so the next turn's injection follows it.
    'command.execute.before': async (input) => {
      if (!input || input.command !== 'first-principles') return;
      const arg = (input.arguments || '').trim().toLowerCase();
      let mode = 'on'; // default
      if (arg === 'off' || arg === 'disable' || arg === 'stop') {
        mode = 'off';
      } else if (arg === 'on' || arg === 'enable' || arg === 'start') {
        mode = 'on';
      }
      writeMode(mode);
      log('info', 'first-principles ' + mode);
    },
  };
};
```

- [ ] **Step 2: 验证 JS 语法**

```bash
node --input-type=module -e "import('./.opencode/plugins/first-principles.mjs').then(m => console.log('ES module loaded OK, exports:', Object.keys(m)))"
# Expected: ES module loaded OK, exports: [ 'parseCommandFile', 'default' ]
```

- [ ] **Step 3: 提交**

```bash
git add .opencode/plugins/first-principles.mjs
git commit -m "feat: add OpenCode ES module plugin for first-principles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: .opencode/command/first-principles.md — OpenCode Slash Command

**Files:**
- Create: `.opencode/command/first-principles.md`

**Interfaces:**
- Produces: OpenCode slash command 文件

- [ ] **Step 1: 写 first-principles.md**

对标 ponytail 的 `.opencode/command/ponytail.md`：

```markdown
---
description: Enable or disable First Principles thinking mode (on/off)
---

Switch to first-principles $ARGUMENTS mode. If no argument specified, defaults to on. First Principles mode interrupts analogical reasoning and forces the AI to re-derive solutions from fundamental truths using a 5-step framework: (1) Identify Assumptions, (2) Strip Assumptions, (3) Return to Ground Truths, (4) Derive from Scratch, (5) Compare & Conclude. Deactivate at any time with "disable first principles" or "stop first principles".
```

- [ ] **Step 2: 验证并提交**

```bash
test -f .opencode/command/first-principles.md && echo "OK"
git add .opencode/command/first-principles.md
git commit -m "feat: add OpenCode slash command for first-principles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: opencode.json — OpenCode 插件注册

**Files:**
- Create: `opencode.json` (如果不存在)

**Interfaces:**
- Produces: OpenCode 插件注册文件

- [ ] **Step 1: 写 opencode.json**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["./.opencode/plugins/first-principles.mjs"]
}
```

- [ ] **Step 2: 验证并提交**

```bash
node -e "JSON.parse(require('fs').readFileSync('opencode.json','utf8')); console.log('OK')"
git add opencode.json
git commit -m "feat: add opencode.json for first-principles plugin registration

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: package.json — npm 包定义

**Files:**
- Create: `package.json`

**Interfaces:**
- Produces: npm 包定义

- [ ] **Step 1: 写 package.json**

```json
{
  "name": "@derek/first-principles",
  "version": "1.0.0",
  "description": "First Principles thinking mode for AI agents. Break out of analogical reasoning and re-derive solutions from fundamental truths.",
  "keywords": ["opencode-plugin", "opencode", "first-principles", "claude-code", "codex"],
  "license": "MIT",
  "author": {
    "name": "DerekYRC",
    "url": "https://github.com/DerekYRC"
  },
  "main": "./.opencode/plugins/first-principles.mjs",
  "exports": {
    ".": "./.opencode/plugins/first-principles.mjs",
    "./plugin": "./.opencode/plugins/first-principles.mjs"
  },
  "files": [
    "hooks/",
    "skills/",
    ".opencode/",
    "LICENSE"
  ]
}
```

- [ ] **Step 2: 验证并提交**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('OK')"
git add package.json
git commit -m "feat: add package.json for first-principles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: 验证 — 端到端测试

**Files:**
- 无新文件

- [ ] **Step 1: 验证所有 hook 脚本可执行**

```bash
# 1. 测试 activate
echo "--- activate ---"
node hooks/fp-activate.js | head -3
# Expected: FIRST PRINCIPLES ACTIVE ...

# 2. 测试 mode-tracker (activation)
echo "--- mode-tracker enable ---"
echo '{"prompt":"enable first principles"}' | node hooks/fp-mode-tracker.js
# Expected: FIRST PRINCIPLES ENABLED

# 3. 验证状态文件
echo "--- state file ---"
cat ~/.claude/.first-principles-active
# Expected: on

# 4. 测试 subagent
echo "--- subagent ---"
node hooks/fp-subagent.js | head -3
# Expected: JSON with FIRST PRINCIPLES ACTIVE

# 5. 测试 deactivation
echo "--- mode-tracker disable ---"
echo '{"prompt":"stop first principles"}' | node hooks/fp-mode-tracker.js
# Expected: FIRST PRINCIPLES OFF

# 6. 验证关闭后 subagent 不输出
echo "--- subagent after off ---"
node hooks/fp-subagent.js
# Expected: 无输出

# 7. 测试 slash command
echo '{"prompt":"/first-principles on"}' | node hooks/fp-mode-tracker.js
# Expected: FIRST PRINCIPLES ENABLED

# 8. 验证 OpenCode plugin 可导入
echo "--- opencode plugin ---"
node --input-type=module -e "import('./.opencode/plugins/first-principles.mjs').then(m => console.log('OK:', Object.keys(m)))"
# Expected: OK: ['parseCommandFile', 'default']
```

- [ ] **Step 2: 提交**

```bash
git add -A && git commit -m "chore: end-to-end verification of first-principles hooks

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

# Part B: adversarial-review

## File Map

```
skills/adversarial-review/SKILL.md       — 创建，行为定义源
.opencode/command/adversarial-review.md  — 创建，OpenCode slash command
```

---

### Task 16: SKILL.md — adversarial-review 行为定义

**Files:**
- Create: `skills/adversarial-review/SKILL.md`

**Interfaces:**
- Produces: SKILL.md (审查流程 + 6维度 + 三档配置 + 报告格式)

- [ ] **Step 1: 写 SKILL.md**

```markdown
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
```

- [ ] **Step 2: 验证并提交**

```bash
test -f skills/adversarial-review/SKILL.md && echo "OK"
git add skills/adversarial-review/SKILL.md
git commit -m "feat: add adversarial-review SKILL.md with 6-dimension framework

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: .opencode/command/adversarial-review.md — OpenCode Slash Command

**Files:**
- Create: `.opencode/command/adversarial-review.md`

**Interfaces:**
- Produces: OpenCode slash command

- [ ] **Step 1: 写 adversarial-review.md**

```markdown
---
description: Run an adversarial security and stability audit of the code
---

Run an adversarial review. Attack the code from multiple dimensions: boundary conditions, security vulnerabilities, performance bombs, data consistency, error handling, and concurrency. $ARGUMENTS controls the scope and level — specify files or leave empty to review recent changes. Use "quick review" for 2-3 agents, default is 6 agents (one per dimension), "deep" for 12-18 agents with cross-validation.
```

- [ ] **Step 2: 验证并提交**

```bash
test -f .opencode/command/adversarial-review.md && echo "OK"
git add .opencode/command/adversarial-review.md
git commit -m "feat: add OpenCode slash command for adversarial-review

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 完成验证

- [ ] **最后一步: 总体验证**

```bash
echo "=== File Tree ==="
find skills/first-principles skills/adversarial-review hooks .claude-plugin .codex-plugin .opencode -type f | sort

echo ""
echo "=== SKILL.md files ==="
for f in skills/first-principles/SKILL.md skills/adversarial-review/SKILL.md; do
  echo "--- $f ---"
  head -5 "$f"
  echo "..."
done

echo ""
echo "=== All JSON files valid ==="
for f in hooks/claude-codex-hooks.json .claude-plugin/plugin.json .claude-plugin/marketplace.json .codex-plugin/plugin.json opencode.json package.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('$f: OK')"
done

echo ""
echo "=== Hook scripts runnable ==="
node -e "require('./hooks/fp-config')" && echo "fp-config: OK"
node -e "require('./hooks/fp-runtime')" && echo "fp-runtime: OK"
node -e "require('./hooks/fp-instructions')" && echo "fp-instructions: OK"

echo ""
echo "DONE"
```

- [ ] **提交最终状态**

```bash
git add -A && git commit -m "chore: final verification pass for both skills

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
