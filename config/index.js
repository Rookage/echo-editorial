// Application configuration — paths, env vars, startup checks
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { maskKey } = require('../utils/log');

const TEMP_DIR = path.join(os.tmpdir(), 'echo-editorial');
const AUDIO_DIR = path.join(__dirname, '..', 'audio');
const VIDEO_DIR = path.join(__dirname, '..', 'video');
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const UPLOAD_DIR = path.join(TEMP_DIR, 'uploads');
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

// Ensure directories exist
[TEMP_DIR, AUDIO_DIR, VIDEO_DIR, IMAGES_DIR, UPLOAD_DIR].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

// Ensure templates/ and history/ exist (created manually or by git, but verify)
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const HISTORY_DIR = path.join(__dirname, '..', 'history');
[TEMPLATES_DIR, HISTORY_DIR].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

// Runtime config — starts from .env, can be overridden via UI
let runtimeConfig = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  pexelsApiKey: process.env.PEXELS_API_KEY || '',
};

// Load saved config from UI (overrides .env)
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (saved.deepseekApiKey) runtimeConfig.deepseekApiKey = saved.deepseekApiKey;
    if (saved.pexelsApiKey) runtimeConfig.pexelsApiKey = saved.pexelsApiKey;
    console.log(`[Config] Loaded saved API keys from config.json (deepseek=${maskKey(runtimeConfig.deepseekApiKey)}, pexels=${maskKey(runtimeConfig.pexelsApiKey)})`);
  } catch (e) { console.warn('[Config] Failed to parse config.json:', e.message); }
}

function saveRuntimeConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    deepseekApiKey: runtimeConfig.deepseekApiKey,
    pexelsApiKey: runtimeConfig.pexelsApiKey,
  }, null, 2), 'utf-8');
}

function checkDependency(label, exePath, args) {
  return new Promise((resolve) => {
    const proc = spawn(exePath, args, { stdio: 'pipe' });
    proc.on('error', () => resolve({ ok: false, label, path: exePath, message: `未找到 ${label}，请检查环境变量: ${exePath}` }));
    proc.on('exit', () => { resolve({ ok: true, label, path: exePath }); });
    setTimeout(() => { try { proc.kill(); } catch {} }, 5000);
  });
}

(async function startupChecks() {
  const results = await Promise.all([
    checkDependency('ffmpeg', FFMPEG_PATH, ['-version']),
    checkDependency('python', PYTHON_PATH, ['--version']),
  ]);
  for (const r of results) {
    if (r.ok) {
      console.log(`[Check] ✓ ${r.label} (${r.path})`);
    } else {
      console.warn(`[Check] ✗ ${r.message}`);
    }
  }
})();

module.exports = {
  TEMP_DIR, AUDIO_DIR, VIDEO_DIR, IMAGES_DIR, UPLOAD_DIR,
  TEMPLATES_DIR, HISTORY_DIR,
  FFMPEG_PATH, PYTHON_PATH, CONFIG_FILE,
  get runtimeConfig() { return runtimeConfig; },
  setRuntimeConfigKey(key, value) { runtimeConfig[key] = value; },
  saveRuntimeConfig,
};
