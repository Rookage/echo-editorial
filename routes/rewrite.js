// Rewrite routes — single and multi-version rewrite
const express = require('express');
const router = express.Router();
const { rewriteText, rewriteMultipleVersions } = require('../services/rewriter');

// Single rewrite
router.post('/', async (req, res, next) => {
  try {
    const { text, style } = req.body;
    const result = await rewriteText(text, style || 'xhs');
    res.json({ success: true, rewritten: result.text, template: result.template });
  } catch (err) {
    if (err.code) {
      const m = { EMPTY_TEXT: 400, TEXT_TOO_LONG: 400, RATE_LIMITED: 429, DEEPSEEK_API_ERROR: 500 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

// Multi-version rewrite
router.post('/multi', async (req, res, next) => {
  try {
    const { text, style, count } = req.body;
    const versions = await rewriteMultipleVersions(text, style || 'xhs', count || 3);
    const template = require('../services/templateManager').getTemplate(style || 'xhs');
    res.json({
      success: true,
      versions: versions.map((v, i) => ({
        index: i,
        text: v,
      })),
      template: template ? { id: template.id, name: template.name, icon: template.icon } : { id: style, name: style, icon: '' },
    });
  } catch (err) {
    if (err.code) {
      const m = { EMPTY_TEXT: 400, TEXT_TOO_LONG: 400, RATE_LIMITED: 429, DEEPSEEK_API_ERROR: 500 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

module.exports = router;
