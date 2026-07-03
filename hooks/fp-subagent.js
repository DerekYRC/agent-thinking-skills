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
