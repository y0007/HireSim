'use strict';
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = path.join(LOG_DIR, `hiresim-${new Date().toISOString().split('T')[0]}.log`);

function log(level, event, data = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data
  };
  const line = JSON.stringify(entry);
  process.stdout.write(line + '\n');
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

module.exports = {
  info: (event, data) => log('INFO', event, data),
  warn: (event, data) => log('WARN', event, data),
  error: (event, data) => log('ERROR', event, data),
  llmCall: ({ model, promptTokens, completionTokens, latencyMs, success, endpoint }) => {
    log('INFO', 'llm_call', { model, promptTokens, completionTokens, latencyMs, success, endpoint });
  },
  interviewEvent: ({ interviewId, userId, event, meta }) => {
    log('INFO', 'interview_event', { interviewId, userId, event, ...meta });
  }
};
