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
