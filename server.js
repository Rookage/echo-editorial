require('dotenv').config();
const express = require('express');
const path = require('path');

const config = require('./config');
const imageSearch = require('./services/imageSearch');

// Init imageSearch with runtime config
imageSearch.init({
  deepseekApiKey: config.runtimeConfig.deepseekApiKey,
  pexelsApiKey: config.runtimeConfig.pexelsApiKey,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/audio', express.static(config.AUDIO_DIR));
app.use('/video', express.static(config.VIDEO_DIR));

// Disable caching for API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

// Mount routes
app.use('/api', require('./routes/extract'));
app.use('/api/rewrite', require('./routes/rewrite'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/video', require('./routes/video'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/scorer', require('./routes/scorer'));
app.use('/api/config', require('./routes/config'));
app.use('/api', require('./routes/cache'));

// Error handler — logs safe message only, never exposes paths or keys
app.use((err, req, res, next) => {
  console.error(`Server error on ${req.method} ${req.path}:`, err.message || err);
  res.status(500).json({ success: false, error: { code: 'UNKNOWN_ERROR', message: '服务器内部错误，请稍后重试' } });
});

app.listen(PORT, () => {
  console.log(`回声编辑部 / Echo Editorial: http://localhost:${PORT}`);
});
