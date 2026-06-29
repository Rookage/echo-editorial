// Config routes — API key status and management
const express = require('express');
const router = express.Router();
const config = require('../config');
const imageSearch = require('../services/imageSearch');
const { maskKey } = require('../utils/log');

// Get API key config status (no real keys returned)
router.get('/', (req, res) => {
  res.json({
    success: true,
    deepseekConfigured: !!config.runtimeConfig.deepseekApiKey,
    pexelsConfigured: !!config.runtimeConfig.pexelsApiKey,
  });
});

// Save API keys from UI
router.post('/', (req, res) => {
  const { deepseekApiKey, pexelsApiKey } = req.body;
  if (deepseekApiKey !== undefined) config.setRuntimeConfigKey('deepseekApiKey', deepseekApiKey.trim());
  if (pexelsApiKey !== undefined) config.setRuntimeConfigKey('pexelsApiKey', pexelsApiKey.trim());
  config.saveRuntimeConfig();
  imageSearch.init({
    deepseekApiKey: config.runtimeConfig.deepseekApiKey,
    pexelsApiKey: config.runtimeConfig.pexelsApiKey,
  });
  console.log(`[Config] API keys saved via UI (deepseek=${maskKey(config.runtimeConfig.deepseekApiKey)}, pexels=${maskKey(config.runtimeConfig.pexelsApiKey)})`);
  res.json({ success: true });
});

module.exports = router;
