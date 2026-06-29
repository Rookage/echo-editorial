// Video generation route
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../config');
const imageSearch = require('../services/imageSearch');
const { getAudioDuration } = require('../utils/audio');
const { createSlideshowVideo, createTextOnlyVideo } = require('../services/video');

router.post('/generate', async (req, res, next) => {
  req.setTimeout(10 * 60 * 1000);
  try {
    const { text, audioUrl, style } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false, error: { code: 'EMPTY_TEXT', message: '请先改写文案再生成视频' }
      });
    }
    if (!audioUrl) {
      return res.status(400).json({
        success: false, error: { code: 'NO_AUDIO', message: '请先生成TTS音频' }
      });
    }

    const trimmedText = text.trim();
    const platform = style === 'douyin' ? 'douyin' : 'xhs';
    const timestamp = Date.now();

    console.log(`[Video] Starting generation for ${platform} (${trimmedText.length} chars)`);

    // Step 1: Fetch images
    const imageDir = path.join(config.IMAGES_DIR, `video_${timestamp}`);
    const images = await imageSearch.fetchImagesForText(trimmedText, imageDir, { count: 5 });
    console.log(`[Video] Fetched ${images.length} images`);

    // Step 2: Resolve audio path
    let audioPath;
    if (audioUrl.startsWith('/audio/')) {
      audioPath = path.join(config.AUDIO_DIR, audioUrl.replace('/audio/', ''));
    } else {
      audioPath = path.join(__dirname, '..', audioUrl);
    }

    if (!fs.existsSync(audioPath)) {
      return res.status(400).json({
        success: false, error: { code: 'AUDIO_NOT_FOUND', message: '音频文件不存在，请重新生成TTS' }
      });
    }

    // Step 3: Get audio duration
    const duration = await getAudioDuration(audioPath);
    console.log(`[Video] Audio duration: ${duration}s`);

    // Step 4: Build ffmpeg command
    const outputFilename = `video_${platform}_${timestamp}.mp4`;
    const outputPath = path.join(config.VIDEO_DIR, outputFilename);

    if (images.length === 0) {
      await createTextOnlyVideo(trimmedText, audioPath, outputPath, duration);
    } else {
      await createSlideshowVideo(images, audioPath, outputPath, duration);
    }

    const videoUrl = `/video/${outputFilename}`;
    console.log(`[Video] Generated: ${videoUrl}`);

    res.json({
      success: true,
      videoUrl,
      imageCount: images.length,
      duration: Math.round(duration),
      message: images.length > 0
        ? `视频已生成，使用了 ${images.length} 张配图`
        : '视频已生成（无配图，使用了文字背景）',
    });
  } catch (err) {
    if (err.code) {
      const m = { EMPTY_TEXT: 400, NO_AUDIO: 400, AUDIO_NOT_FOUND: 400 };
      return res.status(m[err.code] || 500).json({ success: false, error: err });
    }
    next(err);
  }
});

module.exports = router;
