// History Store — filesystem-based persistence for rewrite records
const fs = require('fs');
const path = require('path');
const config = require('../config');

const HISTORY_DIR = config.HISTORY_DIR;

// Generate a unique record ID
function generateId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${date}-${time}-${rand}`;
}

// Save a record
function saveRecord(record) {
  const id = record.id || generateId();
  const filePath = path.join(HISTORY_DIR, `${id}.json`);
  const data = {
    id,
    originalText: (record.originalText || '').slice(0, 8000),
    rewrittenText: record.rewrittenText || '',
    templateId: record.templateId || 'xhs',
    templateName: record.templateName || '',
    templateIcon: record.templateIcon || '',
    scoreCard: record.scoreCard || null,
    timestamp: record.timestamp || new Date().toISOString(),
    versionIndex: record.versionIndex || 0,
    batchId: record.batchId || null,
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

// List records, optionally filtered
function listRecords(filter) {
  const opts = filter || {};
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;

  let files;
  try {
    files = fs.readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json'));
  } catch {
    return { records: [], total: 0 };
  }

  const records = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(HISTORY_DIR, file), 'utf-8');
      const r = JSON.parse(raw);
      if (opts.templateId && r.templateId !== opts.templateId) continue;
      records.push({
        id: r.id,
        originalText: r.originalText,
        rewrittenText: r.rewrittenText,
        templateId: r.templateId,
        templateName: r.templateName,
        templateIcon: r.templateIcon,
        scoreCard: r.scoreCard,
        timestamp: r.timestamp,
        versionIndex: r.versionIndex,
        batchId: r.batchId,
        preview: (r.rewrittenText || '').slice(0, 120),
      });
    } catch {
      // Skip corrupted files
    }
  }

  // Sort by timestamp descending
  records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  return {
    records: records.slice(offset, offset + limit),
    total: records.length,
    hasMore: offset + limit < records.length,
  };
}

// Get a single record
function getRecord(id) {
  const filePath = path.join(HISTORY_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const r = JSON.parse(raw);
    return {
      id: r.id,
      originalText: r.originalText,
      rewrittenText: r.rewrittenText,
      templateId: r.templateId,
      templateName: r.templateName,
      templateIcon: r.templateIcon,
      scoreCard: r.scoreCard,
      timestamp: r.timestamp,
      versionIndex: r.versionIndex,
      batchId: r.batchId,
      preview: (r.rewrittenText || '').slice(0, 120),
    };
  } catch {
    return null;
  }
}

// Delete a record
function deleteRecord(id) {
  const filePath = path.join(HISTORY_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

module.exports = { saveRecord, listRecords, getRecord, deleteRecord, generateId };
