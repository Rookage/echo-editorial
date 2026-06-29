// DeepSeek AI Rewriter — template-driven
const config = require('../config');
const templateManager = require('./templateManager');

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// Fallback prompts for when no template is available (shouldn't happen if templates/ is populated)
const FALLBACK_PROMPT = '你是专业的内容改写编辑。请将原始文案改写为更具吸引力的风格。';
const FALLBACK_USER = '请改写以下内容：\n\n{{text}}';

async function rewriteText(originalText, style = 'xhs') {
  if (!originalText || !originalText.trim()) {
    throw { code: 'EMPTY_TEXT', message: '请先输入或提取文字内容' };
  }
  if (originalText.length > 8000) {
    originalText = originalText.slice(0, 8000);
  }

  const template = templateManager.getTemplate(style);
  const systemPrompt = template?.systemPrompt || FALLBACK_PROMPT;
  const userTemplate = template?.userPromptTemplate || FALLBACK_USER;
  const userMessage = userTemplate.replace('{{text}}', originalText);

  let res;
  try {
    res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.runtimeConfig.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    throw { code: 'DEEPSEEK_API_ERROR', message: 'AI 服务连接失败，请稍后重试' };
  }

  if (res.status === 429) throw { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后重试' };
  if (!res.ok) throw { code: 'DEEPSEEK_API_ERROR', message: `AI 服务返回错误 (${res.status})` };

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw { code: 'DEEPSEEK_API_ERROR', message: 'AI 未能生成内容，请重试' };

  return {
    text: content.trim(),
    template: {
      id: template?.id || style,
      name: template?.name || style,
      icon: template?.icon || '',
    },
  };
}

// Generate multiple versions with slight temperature variation
async function rewriteMultipleVersions(originalText, style = 'xhs', count = 3) {
  if (!originalText || !originalText.trim()) {
    throw { code: 'EMPTY_TEXT', message: '请先输入或提取文字内容' };
  }
  if (originalText.length > 8000) {
    originalText = originalText.slice(0, 8000);
  }

  const template = templateManager.getTemplate(style);
  const systemPrompt = template?.systemPrompt || FALLBACK_PROMPT;
  const userTemplate = template?.userPromptTemplate || FALLBACK_USER;
  const userMessage = userTemplate.replace('{{text}}', originalText);

  const versions = [];
  const temperatures = Array.from({ length: count }, (_, i) => 0.6 + (i * 0.2)); // 0.6, 0.8, 1.0

  for (const temp of temperatures) {
    try {
      const res = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.runtimeConfig.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 2048,
          temperature: temp,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) versions.push(content.trim());
    } catch {
      // Skip failed versions
    }
  }

  // If all versions failed, return single version
  if (versions.length === 0) {
    const result = await rewriteText(originalText, style);
    return [result.text];
  }

  return versions;
}

module.exports = { rewriteText, rewriteMultipleVersions };
