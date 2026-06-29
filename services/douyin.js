// Douyin video extraction — description, transcript pipeline
const fs = require('fs');
const path = require('path');
const { isValidDouyinUrl, extractAwemeId } = require('../utils/url');
const { extractAudio } = require('../utils/audio');
const { getBrowser } = require('./browser');
const { transcribeAudio } = require('./asr');
const config = require('../config');

// --- Video Download URL ---

async function getVideoDownloadUrl(url) {
  const b = await getBrowser();
  const ctx = await b.createBrowserContext();
  const page = await ctx.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
  await page.setCacheEnabled(false);

  try {
    const respPromise = page.waitForResponse(
      res => res.url().includes('aweme/detail') && res.headers()['content-type']?.includes('json'),
      { timeout: 30000 }
    );
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const resp = await respPromise;
    const data = await resp.json();
    const aweme = data.aweme_detail;
    const rawUrl = aweme?.video?.play_addr?.url_list?.[0];
    if (rawUrl) {
      return rawUrl.replace('/playwm/', '/play/').replace('watermark=1', 'watermark=0');
    }
  } catch {
    // fall through
  } finally {
    await ctx.close().catch(() => {});
  }
  return null;
}

// --- Video Download ---

async function downloadVideo(videoUrl, outputPath) {
  const res = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.douyin.com/',
    },
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

  const fileStream = fs.createWriteStream(outputPath);
  const reader = res.body.getReader();
  let downloaded = 0;
  const total = parseInt(res.headers.get('content-length') || '0');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!fileStream.write(value)) {
      await new Promise(resolve => fileStream.once('drain', resolve));
    }
    downloaded += value.length;
    if (total) console.log(`[Download] ${((downloaded / total) * 100).toFixed(0)}%`);
  }
  fileStream.end();
  console.log(`[Download] Done: ${(downloaded / 1024 / 1024).toFixed(1)} MB`);
}

// --- Description Extract ---

async function extractDescription(url) {
  if (!isValidDouyinUrl(url)) {
    throw { code: 'INVALID_URL', message: '请输入有效的抖音链接' };
  }

  let finalUrl = url;
  if (url.includes('v.douyin.com')) {
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      const loc = r.headers.get('location');
      if (loc) finalUrl = new URL(loc, url).href;
    } catch {}
  }

  const b = await getBrowser();
  const ctx = await b.createBrowserContext();
  const page = await ctx.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });
  await page.setCacheEnabled(false);

  try {
    await page.goto(finalUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const expandClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, span, a');
      for (const el of btns) {
        if (el.textContent.trim() === '展开') { el.click(); return true; }
      }
      return false;
    });
    if (expandClicked) await new Promise(r => setTimeout(r, 1000));

    const text = await page.evaluate(() => {
      const title = document.title.replace(/\s*[-–|]\s*抖音.*$/, '').trim();
      const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      let desc = ogDesc || ogTitle || title;
      desc = desc.replace(/@\S+创作的原声[一-龥]*@\S+/g, '').replace(/作者声明[：:].+/g, '').trim();
      return desc || title;
    });

    if (!text) throw { code: 'EXTRACTION_FAILED', message: '未能从页面提取到文字，请使用手动粘贴' };
    return text;
  } catch (err) {
    if (err.code) throw err;
    throw { code: 'FETCH_FAILED', message: '无法访问抖音页面，请使用手动粘贴' };
  } finally {
    await ctx.close().catch(() => {});
  }
}

// --- Transcript Pipeline ---

async function extractTranscript(url) {
  if (!isValidDouyinUrl(url)) {
    throw { code: 'INVALID_URL', message: '请输入有效的抖音链接' };
  }

  const awemeId = extractAwemeId(url);
  const videoFile = path.join(config.TEMP_DIR, `${awemeId || 'video'}.mp4`);
  const audioFile = path.join(config.TEMP_DIR, `${awemeId || 'audio'}.wav`);

  console.log('[Pipeline] Step 1: Getting video URL...');
  const videoUrl = await getVideoDownloadUrl(url);
  if (!videoUrl) {
    throw { code: 'FETCH_FAILED', message: '无法获取视频下载地址，该视频可能受限' };
  }
  console.log('[Pipeline] Video URL:', videoUrl.slice(0, 100) + '...');

  if (fs.existsSync(videoFile)) {
    console.log('[Pipeline] Step 2: Video already cached, skipping download.');
  } else {
    console.log('[Pipeline] Step 2: Downloading video...');
    await downloadVideo(videoUrl, videoFile);
  }

  if (fs.existsSync(audioFile)) {
    console.log('[Pipeline] Step 3: Audio already cached, skipping extraction.');
  } else {
    console.log('[Pipeline] Step 3: Extracting audio...');
    await extractAudio(videoFile, audioFile);
  }

  console.log('[Pipeline] Step 4: Transcribing...');
  const transcript = await transcribeAudio(audioFile);
  return transcript;
}

module.exports = { extractDescription, extractTranscript };
