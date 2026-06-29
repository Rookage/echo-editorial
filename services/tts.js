// TTS service — edge-tts via Python
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { stripHashtags } = require('../utils/text');
const { concatMP3s } = require('../utils/audio');

const ALLOWED_VOICES = [
  'zh-CN-XiaoxiaoNeural',
  'zh-CN-XiaoyiNeural',
  'zh-CN-YunxiNeural',
  'zh-CN-YunjianNeural',
  'zh-CN-YunyangNeural',
  'zh-CN-XiaochenNeural',
];

function generateTTS(text, voice, outputPath, rate, pitch) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, '..', 'tts.py');
    const rateArg = (rate != null && rate !== '') ? rate : '-3%';
    const pitchArg = (pitch != null && pitch !== '') ? pitch : '+2Hz';
    const cleanText = stripHashtags(text);
    const proc = spawn(config.PYTHON_PATH, [script, cleanText, voice, outputPath, rateArg, pitchArg], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    });
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString('utf-8'); });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`TTS failed (exit ${code}): ${stderr.slice(-300)}`));
    });
    proc.on('error', err => reject(new Error(`TTS spawn failed: ${err.message}`)));
  });
}

module.exports = { ALLOWED_VOICES, generateTTS };
