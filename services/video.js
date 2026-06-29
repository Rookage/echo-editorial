// Video generation via ffmpeg
const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');

function createSlideshowVideo(images, audioPath, outputPath, totalDuration) {
  return new Promise((resolve, reject) => {
    const perImage = totalDuration / images.length;
    const args = [];
    const filterParts = [];

    for (let i = 0; i < images.length; i++) {
      args.push('-loop', '1', '-t', String(perImage + 0.5), '-i', images[i].path);
      const fadeStart = Math.max(0, perImage - 0.5).toFixed(1);
      filterParts.push(
        `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black:eval=frame,setsar=1,format=yuv420p,fade=t=in:d=0.5,fade=t=out:d=0.5:st=${fadeStart}[v${i}]`
      );
    }

    const concatInputs = images.map((_, i) => `[v${i}]`).join('');
    const filterComplex = [
      ...filterParts,
      `${concatInputs}concat=n=${images.length}:v=1:a=0,format=yuv420p[v]`,
    ].join(';');

    args.push('-i', audioPath);
    args.push('-filter_complex', filterComplex);
    args.push('-map', '[v]');
    args.push('-map', `${images.length}:a:0`);
    args.push('-c:v', 'libx264');
    args.push('-preset', 'fast');
    args.push('-crf', '23');
    args.push('-c:a', 'aac');
    args.push('-b:a', '128k');
    args.push('-shortest');
    args.push('-pix_fmt', 'yuv420p');
    args.push('-movflags', '+faststart');
    args.push('-y');
    args.push(outputPath);

    const proc = spawn(config.FFMPEG_PATH, args, { timeout: 5 * 60 * 1000 });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code !== 0) {
        console.error('[Video] ffmpeg failed:', stderr.slice(-500));
        reject(new Error('Video generation failed'));
        return;
      }
      resolve();
    });
    proc.on('error', reject);
  });
}

function createTextOnlyVideo(text, audioPath, outputPath, duration) {
  return new Promise((resolve, reject) => {
    const overlayText = text.length > 160 ? text.slice(0, 160) : text;
    const safe = overlayText
      .replace(/'/g, '’')
      .replace(/\\/g, '/')
      .replace(/:/g, '：')
      .replace(/\n/g, ' ')
      .replace(/%/g, '%%');

    const args = [
      '-f', 'lavfi', '-i', 'color=c=0x1a1a2e:s=1080x1920:d=' + duration,
      '-i', audioPath,
      '-vf', `drawtext=text='${safe}':fontcolor=white:fontsize=36:fontfile=/Windows/Fonts/msyh.ttc:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.4:boxborderw=20`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '128k',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-shortest', '-y', outputPath,
    ];

    const proc = spawn(config.FFMPEG_PATH, args, { timeout: 5 * 60 * 1000 });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code !== 0) {
        console.error('[Video] ffmpeg text-only failed:', stderr.slice(-500));
        reject(new Error('Video generation failed'));
        return;
      }
      resolve();
    });
    proc.on('error', reject);
  });
}

module.exports = { createSlideshowVideo, createTextOnlyVideo };
