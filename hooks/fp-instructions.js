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
