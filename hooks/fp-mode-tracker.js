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
