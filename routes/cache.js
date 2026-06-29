// Cache management route
const express = require('express');
const router = express.Router();
const fs = require('fs');
const config = require('../config');
const { closeBrowser } = require('../services/browser');

router.post('/clear-cache', async (req, res) => {
  try {
    await closeBrowser();
    [config.TEMP_DIR, config.VIDEO_DIR, config.IMAGES_DIR, config.UPLOAD_DIR].forEach(d => {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch {}
      fs.mkdirSync(d, { recursive: true });
    });
    console.log('[Cache] Browser restarted, temp files, videos, images and uploads cleared.');
    res.json({ success: true, message: '缓存已清除' });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CLEAR_FAILED', message: '清除缓存失败' } });
  }
});

module.exports = router;
