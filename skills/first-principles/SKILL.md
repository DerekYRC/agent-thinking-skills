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
