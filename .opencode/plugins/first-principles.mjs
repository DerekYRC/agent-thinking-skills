// first-principles — OpenCode plugin.
//
// Injects the first-principles ruleset into every chat's system prompt when
// mode is active, persists /first-principles on|off switches, and registers
// the slash command so it works when installed.
//
// OpenCode loads this as a server plugin — add it to your opencode.json:
//   { "plugin": ["./.opencode/plugins/first-principles.mjs"] }

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bridge to CommonJS hooks
const require = createRequire(import.meta.url);
const { getFpInstructions } = require('../../hooks/fp-instructions');
const { normalizeMode } = require('../../hooks/fp-config');

// State file beside OpenCode config
const statePath = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'opencode',
  '.first-principles-active',
);

function readMode() {
  try {
    const raw = fs.readFileSync(statePath, 'utf8').trim();
    return normalizeMode(raw) || 'on';
  } catch (e) {
    return 'on';
  }
}

function writeMode(mode) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode);
}

export function parseCommandFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim();
  return { description, template: match[2].trim() };
}

export default async ({ client } = {}) => {
  const log = (level, message) => {
    try { client && client.app && client.app.log({ body: { service: 'first-principles', level, message } }); } catch (e) {}
  };

  const fpSkillsDir = path.resolve(__dirname, '../../skills');

  return {
    // Register slash commands + skills directory.
    config: async (config) => {
      if (!config.command) config.command = {};
      const commandDir = path.join(__dirname, '..', 'command');
      try {
        for (const file of fs.readdirSync(commandDir).filter((f) => f.endsWith('.md'))) {
          const name = path.basename(file, '.md');
          const parsed = parseCommandFile(path.join(commandDir, file));
          if (parsed) config.command[name] = parsed;
        }
      } catch (e) {}

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(fpSkillsDir)) {
        config.skills.paths.push(fpSkillsDir);
      }
    },

    // Append the ruleset to the system prompt every turn.
    'experimental.chat.system.transform': async (_input, output) => {
      const mode = readMode();
      if (mode === 'off') return;
      output.system.push(getFpInstructions(mode));
    },

    // Persist /first-principles on|off so the next turn's injection follows it.
    'command.execute.before': async (input) => {
      if (!input || input.command !== 'first-principles') return;
      const arg = (input.arguments || '').trim().toLowerCase();
      let mode = 'on'; // default
      if (arg === 'off' || arg === 'disable' || arg === 'stop') {
        mode = 'off';
      } else if (arg === 'on' || arg === 'enable' || arg === 'start') {
        mode = 'on';
      }
      writeMode(mode);
      log('info', 'first-principles ' + mode);
    },
  };
};
