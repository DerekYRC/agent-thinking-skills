<p align="center">
  <h1 align="center">🧠 智维技能 · Agent Thinking Skills</h1>
</p>

<p align="center">
  <em>两个思维框架，让 AI Agent 的生成和验证能力提升十倍。</em>
</p>

<p align="center">
  <a href="https://github.com/PlanBForFreedom/agent-thinking-skills"><img src="https://img.shields.io/github/stars/PlanBForFreedom/agent-thinking-skills?style=flat-square&color=111111&label=stars" alt="Stars"></a>
  <img src="https://img.shields.io/badge/支持-Claude%20Code%20%7C%20Codex%20%7C%20OpenCode-111111?style=flat-square" alt="支持 Claude Code、Codex、OpenCode">
  <img src="https://img.shields.io/badge/协议-MIT-111111?style=flat-square" alt="MIT 协议">
</p>

<p align="center">
  <h4><a href="README.md">🌐 English</a></h4>
</p>

---

## 里面有什么

两个 skill，构成一套完整的 **生成 → 验证** 闭环：

| Skill | 做什么 | 什么时候用 |
|-------|--------|-----------|
| **first-principles（第一性原理）** | 打断类比推理，从最基本事实重新推导 | 写代码之前：设计、架构、根因分析 |
| **adversarial-review（对抗式审查）** | 站在攻击者角度，系统性地找出漏洞 | 写代码之后：审计、稳定性检查、上线前验证 |

---

## first-principles（第一性原理）

> *"从第一性原理出发。"*

强制 AI 中断模式匹配，从最基本的事实重新构建解决方案。5 步框架：**识别假设 → 剥离假设 → 回到基础事实 → 从零推导 → 对比结论**。

支持单次触发（在 prompt 末尾加"think from first principles"）和持续模式（"enable first principles"）。

**实际案例：** AI 说"修复 OpenAI 的抓取"。加了第一性原理后，它发现真正的问题是一个 4 月份写的底层流量路由缺陷——那只国产模型只是不小心暴露了它。治标 vs 治本。

[完整 skill 文档 →](skills/first-principles/SKILL.md)

---

## adversarial-review（对抗式审查）

> *"攻击者会怎么做？"*

启动多个 AI Agent 并行审查，每个 Agent 从不同角度攻击你的代码。6 个维度：**边界条件、安全漏洞、性能炸弹、数据一致性、错误处理、并发竞态**。三档：快速（2-3 Agent）、标准（6 Agent）、深度（12-18 Agent + 交叉验证）。

**实际案例：** 发现后台 Worker 的 OOM 死循环、"未来时间戳"数据污染 BUG、部署探活的缓存穿透假阳性——全都在上线之前。

[完整 skill 文档 →](skills/adversarial-review/SKILL.md)

---

## 安装

### 通过 skills.sh（推荐）

```bash
npx skills add PlanBForFreedom/agent-thinking-skills
```

两个 skill 一起安装。在你的 AI Agent 中启用：

```bash
# Claude Code / Codex
/install PlanBForFreedom/agent-thinking-skills

# OpenCode
# 在 opencode.json 中添加：{ "plugin": ["./skills/first-principles", "./skills/adversarial-review"] }
```

### 手动安装

克隆仓库并指向你的 Agent 的 skills 目录：

```bash
git clone https://github.com/PlanBForFreedom/agent-thinking-skills.git
```

---

## 支持平台

| 平台 | first-principles | adversarial-review |
|------|:---:|:---:|
| Claude Code | ✅ hooks | ✅ skill 触发 |
| Codex | ✅ hooks | ✅ skill 触发 |
| OpenCode | ✅ plugin | ✅ command |

---

## 为什么是两个？

Vibe Coding 有两大薄弱环节：**思考深度**和**质量验证**。这两个 skill 各解决一个：

- **第一性原理**管"生成"——确保 AI 在写代码之前真正理解问题
- **对抗式审查**管"验证"——确保代码在上线之前经得起真实世界的攻击

两者构成闭环。可以单独使用，也可以串联：先用第一性原理设计，再用对抗式审查审计结果。

---

## 协议

MIT © [DerekYRC](https://github.com/DerekYRC)
