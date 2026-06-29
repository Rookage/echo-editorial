// Extract routes — description, transcript, upload MP4
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { cleanDouyinUrl } = require('../utils/url');
const { extractAudio } = require('../utils/audio');
const { extractDescription, extractTranscript } = require('../services/douyin');
const { transcribeAudio } = require('../services/asr');

const upload = multer({
  dest: config.UPLOAD_DIR,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isMp4 = file.mimetype === 'video/mp4' || file.originalname.toLowerCase().endsWith('.mp4');
    cb(null, isMp4);
  },
});

// Extract video description (fast)
router.post('/extract', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: { code: 'INVALID_URL', message: '请提供抖音链接' } });
    const cleanUrl = cleanDouyinUrl(url);
    const text = await extractDescription(cleanUrl);
    res.json({ success: true, text, source: 'auto' });
  } catch (err) {
    if (err.code) {
      const m = { INVALID_URL: 400, FETCH_FAILED: 502, EXTRACTION_FAILED: 422 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

// Extract full transcript (slow)
router.post('/transcript', async (req, res, next) => {
  req.setTimeout(10 * 60 * 1000);
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: { code: 'INVALID_URL', message: '请提供抖音链接' } });
    const cleanUrl = cleanDouyinUrl(url);
    const transcript = await extractTranscript(cleanUrl);
    res.json({ success: true, text: transcript, source: 'transcript' });
  } catch (err) {
    if (err.code) {
      const m = { INVALID_URL: 400, FETCH_FAILED: 502, EXTRACTION_FAILED: 422 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

// Upload MP4 and extract transcript
router.post('/upload', upload.single('video'), async (req, res, next) => {
  req.setTimeout(10 * 60 * 1000);
  let videoPath = null;
  let audioPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: '请选择MP4文件' } });
    }

    videoPath = req.file.path;
    audioPath = path.join(config.UPLOAD_DIR, `audio_${Date.now()}.wav`);

    console.log('[Upload] Extracting audio from uploaded MP4...');
    await extractAudio(videoPath, audioPath);

    try { fs.unlinkSync(videoPath); videoPath = null; } catch {}

    console.log('[Upload] Transcribing...');
    const transcript = await transcribeAudio(audioPath);

    try { fs.unlinkSync(audioPath); audioPath = null; } catch {}

    res.json({ success: true, text: transcript, source: 'upload' });
  } catch (err) {
    try { if (videoPath) fs.unlinkSync(videoPath); } catch {}
    try { if (audioPath) fs.unlinkSync(audioPath); } catch {}
    if (err.code) {
      const m = { INVALID_URL: 400, FETCH_FAILED: 502, EXTRACTION_FAILED: 422 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

// Multer error handler (mounted here to catch upload errors)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: '文件过大，最大支持 500MB',
      LIMIT_FILE_COUNT: '一次只能上传一个文件',
      LIMIT_UNEXPECTED_FILE: '请选择 MP4 视频文件',
    };
    const message = messages[err.code] || `文件上传失败: ${err.message}`;
    return res.status(400).json({ success: false, error: { code: err.code, message } });
  }
  next(err);
});

module.exports = router;
