# First Principles 技能 — 设计 Spec

**日期**: 2026-07-03
**状态**: 已确认，待实现

---

## 概述

创建一个名为 `first-principles` 的 skill，强制 AI 中断类比推理，从第一性原理（基本事实）重新推导问题的解决方案。支持两种使用方式：
1. **单次触发**：在 prompt 末尾加"think from first principles"
2. **模式切换**：手动开关，开启后持续保持第一性原理思维

支持 **Claude Code + Codex + OpenCode** 三平台。

---

## 触发机制

### 关键词触发（单次）

以下关键词出现时自动注入 5 步框架：
- "think from first principles"
- "from first principles"
- "find the root cause"
- "rethink from fundamentals"
- "derive from scratch"
- "what is the real problem here"

### 手动开关（持续模式）

| 命令 | 行为 |
|------|------|
| `enable first principles` / `turn on first principles` / `/first-principles on` | 进入持续模式 |
| `disable first principles` / `turn off first principles` / `/first-principles off` / `stop first principles` / `normal mode` | 退出模式 |

### 关闭后行为

手动关闭后，关键词**不再自动触发**，直到用户重新开启。

---

## 5 步思维框架

```
Step 1: 识别假设 → Step 2: 剥离假设 → Step 3: 基础事实 → Step 4: 从零推导 → Step 5: 对比结论
```

### Step 1: 识别假设
列出当前方案/问题背后的所有隐含假设。
输出："Current implied assumptions: [...]"

### Step 2: 剥离假设
逐个挑战：这个假设必须成立吗？有证据吗？
输出："Assumptions that can be stripped: [...], remaining hard constraints: [...]"

### Step 3: 回到基础事实
不参考任何已有方案，只列出最底层的事实和约束。
输出："The fundamental truths are: [...]"

### Step 4: 从零推导
从基础事实出发重新推导方案。忽略现有代码/架构。
输出："Deriving from ground truths: [...]"

### Step 5: 对比结论
推导结果 vs 当前方案，判断治标还是治本。
输出："Comparison & conclusion: [...]"

### 深度自适应

- **简单任务**（改配置、修 typo）：每步 1-2 句
- **中等任务**（修 BUG、改功能）：每步 3-5 句
- **复杂任务**（架构设计、重构）：每步充分展开

核心规则：**走完 5 步后再考虑代码，第 5 步之前不下结论。**

---

## 场景判断（持续模式开启后）

每轮用户请求做分类：

**触发场景**（走 5 步框架）：
- 描述了一个待解决的问题
- 要求设计方案/架构
- 要求分析原因/修 BUG
- 要求评价或审视某个方案
- 提到了"why""root cause""fundamentally""essence"

**不触发场景**（正常回答，不走框架）：
- 闲聊
- 询问事实信息
- 确认型问题（"is this correct?"）
- 简单操作指令（"add a comment"）
- 5 步完成后的代码实现请求（"now write the code"）

---

## 质疑问题本身的权力

skill 显式授权 AI 可以质疑用户提出问题的前提：

> "Fix A" — A 可能只是 B 的表象。在 Step 1 识别假设时，必须把 **"问题是 A 而不是别的"** 本身当作一条假设来审查。

---

## 项目结构

对标 ponytail，最小化结构：

```
.claude-plugin/
├── plugin.json              # Claude Code 插件入口
└── marketplace.json         # 市场注册
.codex-plugin/
└── plugin.json              # Codex 插件入口（interface 配置）
.opencode/
├── plugins/
│   └── first-principles.mjs # OpenCode ES module 插件
└── command/
    └── first-principles.md  # OpenCode slash command
skills/
└── first-principles/
    └── SKILL.md             # skill 主体（英文）
hooks/
├── claude-codex-hooks.json  # CC + Codex 共享 hook 配置
├── fp-activate.js           # SessionStart：注入规则到上下文
├── fp-mode-tracker.js       # UserPromptSubmit：检测开关命令
├── fp-subagent.js           # SubagentStart：子 agent 继承模式
├── fp-config.js             # 配置：路径、模式定义
├── fp-instructions.js       # 指令构建器：读 SKILL.md + 运行时包装
└── fp-runtime.js            # 运行时：状态读写 + 多平台输出
opencode.json                # OpenCode 插件注册
package.json                 # npm 包（pi / OpenCode 扩展）
```

### 各文件职责

| 文件 | 职责 |
|------|------|
| `SKILL.md` | 5 步框架 + 场景判断 + 质疑权力 + 深度自适应。所有平台的唯一行为定义源（**英文**） |
| `fp-config.js` | `VALID_MODES = ['on','off']`，`getClaudeDir()`，`isDeactivationCommand()` |
| `fp-runtime.js` | `setMode()`/`clearMode()`/`readMode()`/`writeHookOutput()`，处理 CC/Codex/Copilot/OpenCode 多平台输出 |
| `fp-instructions.js` | `getFpInstructions(mode)`：读 `SKILL.md` 去 frontmatter，拼接模式 header |
| `fp-activate.js` | SessionStart hook：写状态文件 + emit 规则到上下文。mode==='off' 时跳过 |
| `fp-mode-tracker.js` | UserPromptSubmit hook：检测命令 + 自然语言开关 + 关闭命令 |
| `fp-subagent.js` | SubagentStart hook：读状态文件，mode 为 on 时注入规则到子 agent |
| `first-principles.mjs` | OpenCode ES module plugin：`experimental.chat.system.transform` + `command.execute.before` |
| `first-principles.md` | OpenCode slash command 文件 |
| `claude-codex-hooks.json` | hook 配置，SessionStart + SubagentStart + UserPromptSubmit |
| `opencode.json` | OpenCode 插件注册 |

### 复用层次

```
SKILL.md  ←── 唯一的行为定义源
  ↑
fp-instructions.js  ←── 读 SKILL.md 去 frontmatter，拼接 header
  ↑
fp-activate.js / fp-subagent.js / fp-mode-tracker.js  ←── 调用 instructions
  ↑
fp-runtime.js  ←── setMode / clearMode / writeHookOutput
  ↑
claude-codex-hooks.json  ←── 声明 hook 配置
```

复用 ponytail 的模式：
- `fp-runtime.js` 中的 `writeHookOutput` 逻辑（SessionStart raw stdout for CC, JSON for Codex）
- `fp-config.js` 中的 `getClaudeDir()` 逻辑
- 状态文件：`~/.claude/.first-principles-active`（Claude Code），`$PLUGIN_DATA/.first-principles-active`（Codex）

---

## OpenCode 平台架构

OpenCode 跟 CC/Codex 不同：没有 hooks.json，而是 ES module server plugin。

### 三个 Hook

| OpenCode hook | 对应功能 | 实现 |
|---------------|---------|------|
| `config` | 注册 slash command + skills 目录 | 读 `.opencode/command/` 下的 md 文件，解析 frontmatter |
| `experimental.chat.system.transform` | 每轮注入规则到 system prompt | 读状态文件 → 非 off 时追加规则 |
| `command.execute.before` | 拦截 `/first-principles on\|off` 命令 | 写状态文件，下一轮生效 |

### 状态文件

`~/.config/opencode/.first-principles-active`（独立于 CC 的 `~/.claude/.first-principles-active`）

### 复用

- `first-principles.mjs` 通过 `createRequire` 桥接 CJS 的 `fp-instructions.js` + `fp-config.js`
- 行为定义源仍是 `skills/first-principles/SKILL.md`

---

## 与 ponytail 的关键差异

| 维度 | ponytail | first-principles |
|------|----------|-----------------|
| 模式数量 | 3 (lite/full/ultra) + review | 1 (on/off) |
| 状态文件 | `.ponytail-active` | `.first-principles-active` |
| 强度过滤 | `filterSkillBodyForMode` | 不需要（无 level） |
| Subagent | 必须继承（issue #252） | 同样必须继承 |
| 关闭方式 | 全消息匹配 `stop ponytail` | 全消息匹配 `stop first principles` |

---

## 实现步骤

1. 创建目录结构
2. 写 `SKILL.md`（英文）
3. 写 `fp-config.js`
4. 写 `fp-runtime.js`
5. 写 `fp-instructions.js`
6. 写 `fp-activate.js`
7. 写 `fp-mode-tracker.js`
8. 写 `fp-subagent.js`
9. 写 `claude-codex-hooks.json`
10. 写 `.claude-plugin/plugin.json`
11. 写 `.codex-plugin/plugin.json`
12. 写 `.opencode/plugins/first-principles.mjs`
13. 写 `.opencode/command/first-principles.md`
14. 写 `opencode.json`
15. 写 `package.json`
16. 验证：启动 → 开启模式 → 确认注入 → 关闭模式 → 确认清除（三平台）

---

## 自审

- 无 placeholder、TBD
- 无矛盾：5 步框架与场景判断一致，质疑权力与 Step 1 一致
- 范围聚焦：只做 first-principles，不涉及 adversarial-review
- 无歧义：触发/不触发场景有明确分类标准
