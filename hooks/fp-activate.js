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
