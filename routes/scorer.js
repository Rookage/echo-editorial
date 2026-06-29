// Scorer routes — manuscript scoring and re-optimization
const express = require('express');
const router = express.Router();
const { scoreManuscript, reOptimize } = require('../services/scorer');
const templateManager = require('../services/templateManager');

// Score a manuscript
router.post('/score', async (req, res, next) => {
  try {
    const { originalText, rewrittenText, templateId } = req.body;
    if (!rewrittenText || !rewrittenText.trim()) {
      return res.status(400).json({ success: false, error: { code: 'EMPTY_TEXT', message: '请先生成改写稿件' } });
    }

    const template = templateManager.getTemplate(templateId || 'xhs');
    const scoreCard = await scoreManuscript(
      originalText || '',
      rewrittenText,
      template ? template.name : (templateId || 'xhs')
    );

    res.json({ success: true, scoreCard });
  } catch (err) {
    if (err.code) {
      const m = { DEEPSEEK_API_ERROR: 500, RATE_LIMITED: 429, PARSE_ERROR: 422 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

// Re-optimize based on score suggestions
router.post('/reoptimize', async (req, res, next) => {
  try {
    const { originalText, rewrittenText, scoreCard, templateId } = req.body;
    if (!rewrittenText || !rewrittenText.trim()) {
      return res.status(400).json({ success: false, error: { code: 'EMPTY_TEXT', message: '请先生成改写稿件' } });
    }
    if (!scoreCard || !scoreCard.dimensions) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_SCORE', message: '请先评分再优化' } });
    }

    const optimizedText = await reOptimize(
      originalText || '',
      rewrittenText,
      scoreCard,
      templateId || 'xhs',
      templateManager
    );

    const template = templateManager.getTemplate(templateId || 'xhs');
    res.json({
      success: true,
      rewritten: optimizedText,
      template: template ? { id: template.id, name: template.name, icon: template.icon } : null,
    });
  } catch (err) {
    if (err.code) {
      const m = { DEEPSEEK_API_ERROR: 500, RATE_LIMITED: 429 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

module.exports = router;
