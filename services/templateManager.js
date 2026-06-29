// Template Manager — loads and caches writing style templates from templates/
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
let templateCache = null;

function loadTemplates() {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
  const templates = {};
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      const t = JSON.parse(raw);
      if (t.id) templates[t.id] = t;
    } catch (e) {
      console.warn(`[TemplateManager] Failed to load ${file}:`, e.message);
    }
  }
  templateCache = templates;
  console.log(`[TemplateManager] Loaded ${Object.keys(templates).length} templates`);
  return templates;
}

function getTemplates() {
  if (!templateCache) loadTemplates();
  return templateCache;
}

function listTemplates() {
  const templates = getTemplates();
  return Object.values(templates).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    icon: t.icon,
    voice: t.voice,
    color: t.color,
  }));
}

function getTemplate(id) {
  const templates = getTemplates();
  // Allow fuzzy matching: style param "xhs" or "douyin" maps directly
  const t = templates[id];
  if (!t) {
    // Fallback to xhs
    console.warn(`[TemplateManager] Template "${id}" not found, falling back to xhs`);
    return templates['xhs'] || null;
  }
  return t;
}

function getTemplateFull(id) {
  return getTemplate(id); // Returns full template including systemPrompt
}

function updateTemplate(id, updates) {
  const templates = getTemplates();
  if (!templates[id]) return null;
  const t = templates[id];
  if (updates.systemPrompt !== undefined) t.systemPrompt = updates.systemPrompt;
  if (updates.userPromptTemplate !== undefined) t.userPromptTemplate = updates.userPromptTemplate;
  // Write back to disk
  fs.writeFileSync(path.join(TEMPLATES_DIR, `${id}.json`), JSON.stringify(t, null, 2), 'utf-8');
  return t;
}

function reloadTemplates() {
  templateCache = null;
  return loadTemplates();
}

module.exports = { loadTemplates, listTemplates, getTemplate, getTemplateFull, updateTemplate, reloadTemplates };
