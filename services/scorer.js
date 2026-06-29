// Manuscript Scoring Service — 6-dimension evaluation via DeepSeek
const config = require('../config');

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const SCORING_PROMPT = `你是资深内容评审主编，精通多平台内容质量评估。你需要对一篇改写稿件进行6个维度的评分，并给出具体改进建议。

## 评分规则
- 每个维度 1-10 分（10分为满分）
- 评分基于该维度的客观标准，不是主观喜好
- 每个维度的建议必须具体、可执行，不是一个泛泛的"可以更好"
- 如果某个维度表现优秀（8分以上），建议可以是"保持当前水准"并指出哪里做得好

## 评分维度

1. 标题吸引力（titleAppeal）
   - 是否在2秒内抓住注意力？是否能激发点击欲望？是否避开了标题党？

2. 开头钩子（openingHook）
   - 前2句话是否打破了信息流惯性？是否有好奇心缺口/情绪共鸣/利益承诺？

3. 结构清晰度（structureClarity）
   - 内容组织是否有逻辑？段落是否利落？是否容易扫读？

4. 平台适配度（platformSuitability）
   - 是否符合目标平台的调性、用户预期和内容规范？

5. 口语自然度（conversationalNaturalness）
   - 读起来是否像真人在说话？是否有AI味/书面腔/翻译腔？

6. 转化引导（conversionGuidance）
   - 结尾是否有明确的互动引导？读者是否知道下一步该做什么？

## 输出格式
你必须返回严格的JSON，不要任何前缀或后缀。格式如下：
{
  "overallScore": 7.5,
  "overallComment": "一句话总体评价",
  "dimensions": [
    {"nameEn": "titleAppeal", "name": "标题吸引力", "score": 7, "maxScore": 10, "suggestion": "具体改进建议"},
    {"nameEn": "openingHook", "name": "开头钩子", "score": 8, "maxScore": 10, "suggestion": "具体改进建议"},
    {"nameEn": "structureClarity", "name": "结构清晰度", "score": 6, "maxScore": 10, "suggestion": "具体改进建议"},
    {"nameEn": "platformSuitability", "name": "平台适配度", "score": 8, "maxScore": 10, "suggestion": "具体改进建议"},
    {"nameEn": "conversationalNaturalness", "name": "口语自然度", "score": 7, "maxScore": 10, "suggestion": "具体改进建议"},
    {"nameEn": "conversionGuidance", "name": "转化引导", "score": 6, "maxScore": 10, "suggestion": "具体改进建议"}
  ]
}`;

const REOPTIMIZE_PROMPT = `你是资深内容主编。用户提交了一篇稿件，评审给出了改进建议。请基于这些建议重新优化稿件。

## 核心要求
1. 逐一处理每条建议——评审说了什么、你就改什么
2. 对于低分维度（6分以下），做明显调整
3. 对于高分维度（8分以上），保持原有优势不要改坏
4. 输出的必须是完整改写后的文案，不是修改说明
5. 保持原稿的核心观点和事实不变

## 输出格式
直接输出优化后的完整文案，不要写"修改说明""优化思路"等前缀。`;

async function scoreManuscript(originalText, rewrittenText, templateName) {
  const userMessage = [
    `目标平台/风格：${templateName || '通用'}`,
    '',
    '=== 原始素材（参考）===',
    (originalText || '').slice(0, 2000),
    '',
    '=== 改写稿件（请评分）===',
    rewrittenText,
  ].join('\n');

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
          { role: 'system', content: SCORING_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (err) {
    throw { code: 'DEEPSEEK_API_ERROR', message: '评分服务连接失败，请稍后重试' };
  }

  if (res.status === 429) throw { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后重试' };
  if (!res.ok) throw { code: 'DEEPSEEK_API_ERROR', message: `评分服务返回错误 (${res.status})` };

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw { code: 'DEEPSEEK_API_ERROR', message: '评分未能生成，请重试' };

  // Parse JSON from response (may have markdown code fences)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let scoreCard;
  try {
    scoreCard = JSON.parse(jsonStr);
  } catch {
    throw { code: 'PARSE_ERROR', message: '评分结果解析失败，请重试' };
  }

  // Validate structure
  if (!scoreCard.dimensions || !Array.isArray(scoreCard.dimensions) || scoreCard.dimensions.length < 4) {
    throw { code: 'PARSE_ERROR', message: '评分结果格式不完整，请重试' };
  }

  return {
    overallScore: scoreCard.overallScore || 0,
    overallComment: scoreCard.overallComment || '',
    dimensions: scoreCard.dimensions.map(d => ({
      nameEn: d.nameEn,
      name: d.name,
      score: Math.min(10, Math.max(1, d.score || 5)),
      maxScore: 10,
      suggestion: d.suggestion || '',
    })),
  };
}

async function reOptimize(originalText, rewrittenText, scoreCard, templateId, templateManager) {
  const template = templateManager ? templateManager.getTemplate(templateId) : null;
  const templateName = template ? template.name : templateId;

  // Build suggestions summary
  const lowScoreItems = (scoreCard.dimensions || [])
    .filter(d => d.score <= 6)
    .map(d => `【${d.name} ${d.score}分】${d.suggestion}`)
    .join('\n');

  const userMessage = [
    `目标平台：${templateName}`,
    '',
    '=== 评分反馈（需要改进的维度）===',
    lowScoreItems || '（无低分维度，保持当前水准即可）',
    '',
    '=== 当前稿件 ===',
    rewrittenText,
    '',
    '请基于以上反馈重新优化稿件。',
  ].join('\n');

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
          { role: 'system', content: REOPTIMIZE_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    throw { code: 'DEEPSEEK_API_ERROR', message: '优化服务连接失败，请稍后重试' };
  }

  if (res.status === 429) throw { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后重试' };
  if (!res.ok) throw { code: 'DEEPSEEK_API_ERROR', message: `优化服务返回错误 (${res.status})` };

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw { code: 'DEEPSEEK_API_ERROR', message: '优化未能生成内容，请重试' };

  return content.trim();
}

module.exports = { scoreManuscript, reOptimize };
