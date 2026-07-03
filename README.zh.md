<br/><br/>
<h1 align="center">🧠 智维技能 · Agent Thinking Skills</h1>
<br/><br/>
<h3 align="center"><em>两个思维框架，让 AI Agent 的生成和验证能力提升十倍。</em></h3>
<br/><br/>
<h3 align="center">
  <a href="https://github.com/DerekYRC/agent-thinking-skills"><img src="https://img.shields.io/badge/协议-Apache%202.0-111111?style=flat-square" alt="Apache 2.0 协议"></a>
  <a href="https://github.com/DerekYRC/agent-thinking-skills"><img src="https://img.shields.io/badge/支持-Claude%20Code%20%7C%20Codex%20%7C%20OpenCode-111111?style=flat-square" alt="支持 Claude Code、Codex、OpenCode"></a>
</h3>
<br/>
<h1 align="center"><a href="README.md"><kbd>🌐 English</kbd></a></h1>
<br/>
<br/>

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

**示例：** 你让 AI "给慢接口加个缓存"。AI 的类比直觉是直接上 Redis。加入第一性原理后，它停下来反问：*到底慢在哪？* 追到真正的瓶颈是 ORM 里的 N+1 查询——优化掉这行 SQL，缓存根本不需要。一行代码 vs 一套新基础设施。

[完整 skill 文档 →](skills/first-principles/SKILL.md)

---

## adversarial-review（对抗式审查）

> *"攻击者会怎么做？"*

启动多个 AI Agent 并行审查，每个 Agent 从不同角度攻击你的代码。6 个维度：**边界条件、安全漏洞、性能炸弹、数据一致性、错误处理、并发竞态**。三档：快速（2-3 Agent）、标准（6 Agent）、深度（12-18 Agent + 交叉验证）。

**示例：** 你写好了一个用户注册表单。对抗式审查发现了：邮箱正则里有 ReDoS 漏洞（边界），用户名允许隐形 Unicode 字符可用于冒充他人（安全），注册接口没有限流可以批量注册僵尸号（性能）。一个用户都还没注册，三个隐患已被揪出。

[完整 skill 文档 →](skills/adversarial-review/SKILL.md)

---

## 安装

通过 skills.sh 分别安装：

```bash
# 第一性原理
npx skills add https://github.com/derekyrc/agent-thinking-skills --skill first-principles

# 对抗式审查
npx skills add https://github.com/derekyrc/agent-thinking-skills --skill adversarial-review
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
