# Adversarial Review 技能 — 设计 Spec

**日期**: 2026-07-03
**状态**: 已确认，待实现

---

## 概述

创建一个名为 `adversarial-review` 的 skill，站在攻击者角度审查代码，系统性找出潜在漏洞和风险。纯单次触发（无模式切换），审查完输出报告即结束。

支持 **Claude Code + Codex + OpenCode**。

---

## 触发方式

**纯单次触发**，没有模式切换。每次调用跑一次完整审查，输出报告。

### 触发词与级别

| 触发词 | 级别 | Agent 数 | 覆盖 |
|--------|------|---------|------|
| "quick review" / "quick adversarial review" | 快速 | 2-3 | 安全+边界合并，性能+数据合并 |
| "adversarial review" / "adversarial audit"（默认） | 标准 | 6 | 每维度一个 Agent |
| "deep adversarial review" / "thorough adversarial review" | 深度 | 12-18 | 每维度 2-3 Agent，不同攻击角度 + 交叉验证 |

---

## 6 个审查维度

| 维度 | 攻击角度 | Agent prompt 核心 |
|------|---------|------------------|
| **边界条件** | 空值、超大输入、特殊字符、时间异常（未来/过去）、负值、类型混淆、溢出 | 输入什么样的极端数据能让系统崩溃或行为异常？ |
| **安全漏洞** | XSS、注入、权限绕过、敏感信息泄露、反序列化攻击、路径遍历 | 如果我是恶意用户，我如何窃取、破坏或绕过？ |
| **性能炸弹** | OOM、死循环、无限递归、N+1 查询、大文件阻塞、资源泄漏 | 什么样的输入或调用模式能让系统资源耗尽？ |
| **数据一致性** | 脏数据、丢失更新、事务边界缺失、幂等性缺失、状态机错误 | 在什么时序或失败场景下数据会出错或丢失？ |
| **错误处理** | 吞异常、重试风暴、降级缺失、错误传播断裂、超时缺失 | 什么故障场景下错误处理本身会变成问题？ |
| **并发竞态** | 锁竞争、重复提交、缓存穿透/击穿、探活假阳性、分布式时序 | 同时发生两个操作时，什么会出错？ |

---

## 三档配置

### 快速（2-3 Agent）

```
Agent 1: 安全 + 边界条件  合并
Agent 2: 性能 + 数据一致性  合并
Agent 3: 错误处理 + 并发竞态  合并（可选，默认 2 个 Agent）
```

### 标准（6 Agent）

每维度一个独立 Agent，并行执行。

### 深度（12-18 Agent）

每维度 2-3 Agent，从不同视角攻击同一维度：

```
边界条件:  Agent 1 (数据格式角度) + Agent 2 (时间/状态角度) + Agent 3 (编码/序列化角度)
安全漏洞:  Agent 1 (OWASP Top 10) + Agent 2 (业务逻辑漏洞) + Agent 3 (基础设施/配置角度)
性能炸弹:  Agent 1 (内存/OOM) + Agent 2 (CPU/死循环) + Agent 3 (IO/文件/网络)
数据一致性: Agent 1 (事务/原子性) + Agent 2 (状态机/幂等性)
错误处理:  Agent 1 (异常传播) + Agent 2 (重试/降级/超时)
并发竞态:  Agent 1 (锁/互斥) + Agent 2 (缓存/重复提交)
```

深度审查特有：**交叉验证轮**——同维度内各 Agent 的发现互相审阅，不一致的标记为"待确认"。

---

## 报告格式

```markdown
# Adversarial Review Report

**Level**: Quick | Standard | Deep
**Review Time**: YYYY-MM-DD HH:MM
**Scope**: [用户指定的范围，或当前 branch diff]

## Summary

- Total findings: N
- Critical: N | Medium: N | Low: N | Info: N

## Critical Issues

### [问题标题]
- **Dimension**: Boundary Conditions | Security | Performance | Data Consistency | Error Handling | Concurrency
- **Location**: `file.ts:123`
- **Reproduction**: [复现步骤]
- **Impact**: [触发后的影响]
- **Suggested Fix**: [一句话建议，不做详细方案]

## Medium Issues

[同上格式]

## Low Risk Issues

[同上格式]

## Informational

[同上格式]

## Coverage

| Dimension | Status | Agents |
|-----------|--------|--------|
| Boundary Conditions | ✅ Complete | 1 |
| Security Vulnerabilities | ✅ Complete | 1 |
| ... | | |

## Cross-Validation Results（仅深度审查）

[交叉验证后的确认/修正]
```

---

## 项目结构

```
skills/
└── adversarial-review/
    └── SKILL.md                 # skill 主体（英文）
.opencode/
└── command/
    └── adversarial-review.md    # OpenCode slash command
```

不需要 hook 层：
- **不是模式切换**，没有状态需要持久化
- **纯单次触发**，用户说一句话就跑一次
- Claude Code / Codex 通过 SKILL.md 的 description 自动触发
- OpenCode 通过 command 文件 + skills 目录注册触发

### 与 first-principles 的架构对比

| 维度 | first-principles | adversarial-review |
|------|-----------------|-------------------|
| 触发方式 | 单次 + 持续模式 | 纯单次 |
| 状态文件 | 有 | 无 |
| Hook 层 | 需要（activate/mode-tracker/subagent） | 不需要 |
| OpenCode plugin | 需要 .mjs（处理模式切换） | 只需要 command 文件 |
| 复杂度 | 对标 ponytail | 一个 SKILL.md + 一个 command 文件 |

---

## 实现步骤

1. 写 `SKILL.md`（英文）
2. 写 `.opencode/command/adversarial-review.md`
3. 验证：触发 → 审查 → 确认报告格式

---

## 自审

- 无 placeholder、TBD
- 无矛盾：三档配置与报告格式一致（深度多了交叉验证）
- 范围聚焦：只审查不修复
- 无歧义：触发词明确，级别与 Agent 数对应明确
- 架构最简：不需要 hook 层，不需要模式持久化
