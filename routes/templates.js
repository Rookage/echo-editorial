// Template routes — list and manage writing style templates
const express = require('express');
const router = express.Router();
const templateManager = require('../services/templateManager');

// List all templates (metadata only, no prompts)
router.get('/', (req, res) => {
  try {
    const templates = templateManager.listTemplates();
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TEMPLATE_ERROR', message: '无法加载模板列表' } });
  }
});

// Get single template metadata
router.get('/:id', (req, res) => {
  try {
    const t = templateManager.getTemplate(req.params.id);
    if (!t) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '模板不存在' } });
    }
    // Return metadata only (not the full system prompt)
    res.json({ success: true, template: {
      id: t.id, name: t.name, description: t.description,
      icon: t.icon, voice: t.voice, color: t.color,
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TEMPLATE_ERROR', message: '无法获取模板信息' } });
  }
});

// Update template prompts (PUT)
router.put('/:id', (req, res) => {
  try {
    const { systemPrompt, userPromptTemplate } = req.body;
    const updated = templateManager.updateTemplate(req.params.id, { systemPrompt, userPromptTemplate });
    if (!updated) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '模板不存在' } });
    }
    res.json({ success: true, template: {
      id: updated.id, name: updated.name, description: updated.description,
      icon: updated.icon, voice: updated.voice, color: updated.color,
    }});
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TEMPLATE_ERROR', message: '无法更新模板' } });
  }
});

module.exports = router;
