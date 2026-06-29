// Rewrite routes — single and multi-version rewrite with history persistence
const express = require('express');
const router = express.Router();
const { rewriteText, rewriteMultipleVersions } = require('../services/rewriter');
const templateManager = require('../services/templateManager');
const historyStore = require('../services/historyStore');

// Single rewrite — auto-saves to history
router.post('/', async (req, res, next) => {
  let result;
  try {
    const { text, style } = req.body;
    result = await rewriteText(text, style || 'xhs');

    // Save to history (fire-and-forget, don't block response)
    const template = templateManager.getTemplate(style || 'xhs');
    const record = historyStore.saveRecord({
      originalText: text || '',
      rewrittenText: result.text,
      templateId: result.template.id,
      templateName: result.template.name,
      templateIcon: result.template.icon,
    });

    res.json({
      success: true,
      rewritten: result.text,
      template: result.template,
      recordId: record.id,
    });
  } catch (err) {
    if (err.code) {
      const m = { EMPTY_TEXT: 400, TEXT_TOO_LONG: 400, RATE_LIMITED: 429, DEEPSEEK_API_ERROR: 500 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

// Multi-version rewrite — saves all versions to history
router.post('/multi', async (req, res, next) => {
  try {
    const { text, style, count } = req.body;
    const template = templateManager.getTemplate(style || 'xhs');
    const versions = await rewriteMultipleVersions(text, style || 'xhs', count || 3);

    // Save all versions with same batchId
    const batchId = historyStore.generateId();
    const records = versions.map((v, i) =>
      historyStore.saveRecord({
        originalText: text || '',
        rewrittenText: v,
        templateId: template ? template.id : (style || 'xhs'),
        templateName: template ? template.name : (style || 'xhs'),
        templateIcon: template ? template.icon : '',
        versionIndex: i,
        batchId,
      })
    );

    res.json({
      success: true,
      versions: versions.map((v, i) => ({
        index: i,
        text: v,
        recordId: records[i] ? records[i].id : null,
      })),
      batchId,
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
