// TTS route
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { ALLOWED_VOICES, generateTTS } = require('../services/tts');
const { splitIntoChunks } = require('../utils/text');
const { concatMP3s } = require('../utils/audio');

router.post('/', async (req, res, next) => {
  req.setTimeout(5 * 60 * 1000);
  try {
    const { text, voice, rate } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: { code: 'EMPTY_TEXT', message: '请先改写文案再生成音频' } });
    }
    const selectedVoice = ALLOWED_VOICES.includes(voice) ? voice : 'zh-CN-XiaoxiaoNeural';

    let rateArg = '-3%';
    if (typeof rate === 'number' && rate >= -50 && rate <= 50) {
      rateArg = (rate >= 0 ? '+' : '') + rate + '%';
    }

    let pitchArg = '+2Hz';
    if (typeof rate === 'number') {
      const hz = Math.round(rate * 0.08);
      pitchArg = (hz >= 0 ? '+' : '') + hz + 'Hz';
    }

    const MAX_CHUNK = 2000;
    const cleanText = text.trim();

    // Single chunk path
    if (cleanText.length <= MAX_CHUNK) {
      const filename = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mp3`;
      const outputPath = path.join(config.AUDIO_DIR, filename);

      console.log(`[TTS] Generating audio: ${filename} (voice: ${selectedVoice}, rate: ${rateArg}, pitch: ${pitchArg})`);
      await generateTTS(cleanText, selectedVoice, outputPath, rateArg, pitchArg);
      console.log(`[TTS] Done: ${filename}`);

      return res.json({ success: true, audioUrl: `/audio/${filename}` });
    }

    // Multi-chunk path for text > 2000 chars
    const chunks = splitIntoChunks(cleanText, MAX_CHUNK);
    console.log(`[TTS] Text length ${cleanText.length}, split into ${chunks.length} chunks`);

    const chunkFiles = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkFilename = `tts-chunk-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}.mp3`;
      const chunkPath = path.join(config.AUDIO_DIR, chunkFilename);
      console.log(`[TTS] Chunk ${i + 1}/${chunks.length}: ${chunkFilename} (${chunks[i].length} chars)`);
      await generateTTS(chunks[i], selectedVoice, chunkPath, rateArg, pitchArg);
      chunkFiles.push(chunkPath);
    }

    // Concatenate chunks
    const finalFilename = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.mp3`;
    const finalPath = path.join(config.AUDIO_DIR, finalFilename);
    console.log(`[TTS] Concatenating ${chunks.length} chunks into ${finalFilename}`);
    await concatMP3s(chunkFiles, finalPath);

    for (const f of chunkFiles) {
      fs.unlink(f, () => {});
    }

    console.log(`[TTS] Done: ${finalFilename}`);
    res.json({ success: true, audioUrl: `/audio/${finalFilename}` });
  } catch (err) {
    if (err.message?.includes('TTS') || err.message?.includes('ffmpeg')) {
      return res.status(500).json({ success: false, error: { code: 'TTS_FAILED', message: '音频生成失败，请重试' } });
    }
    next(err);
  }
});

module.exports = router;
