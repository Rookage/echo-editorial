// History routes — manage rewrite history records
const express = require('express');
const router = express.Router();
const historyStore = require('../services/historyStore');

// List history records
router.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const templateId = req.query.templateId || null;
    const result = historyStore.listRecords({ limit, offset, templateId });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'HISTORY_ERROR', message: '无法加载历史记录' } });
  }
});

// Get single record
router.get('/:id', (req, res) => {
  try {
    const record = historyStore.getRecord(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '记录不存在' } });
    }
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'HISTORY_ERROR', message: '无法获取记录' } });
  }
});

// Delete a record
router.delete('/:id', (req, res) => {
  try {
    const deleted = historyStore.deleteRecord(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '记录不存在' } });
    }
    res.json({ success: true, message: '记录已删除' });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'HISTORY_ERROR', message: '无法删除记录' } });
  }
});

module.exports = router;
