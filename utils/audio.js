// Audio helpers — ffmpeg extraction, duration probe, MP3 concat
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(config.FFMPEG_PATH, [
      '-i', videoPath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      audioPath,
    ]);
    let stderr = '';
    ffmpeg.stderr.on('data', d => { stderr += d.toString(); });
    ffmpeg.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-200)}`));
    });
  });
}

function getAudioDuration(audioPath) {
  const ffprobePath = path.join(path.dirname(config.FFMPEG_PATH), 'ffprobe.exe');
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(ffprobePath, [
      '-v', 'quiet', '-show_entries', 'format=duration',
      '-of', 'csv=p=0', audioPath,
    ], { timeout: 10000 });
    let output = '';
    ffprobe.stdout.on('data', d => output += d);
    ffprobe.on('close', code => {
      if (code !== 0) { reject(new Error('ffprobe failed')); return; }
      resolve(parseFloat(output.trim()) || 30);
    });
    ffprobe.on('error', reject);
  });
}

function concatMP3s(inputFiles, outputPath) {
  return new Promise((resolve, reject) => {
    const listPath = outputPath + '.list.txt';
    const listContent = inputFiles.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(listPath, listContent, 'utf-8');
    const proc = spawn(config.FFMPEG_PATH, ['-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outputPath]);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString('utf-8'); });
    proc.on('close', code => {
      try { fs.unlinkSync(listPath); } catch {}
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg concat failed (exit ${code}): ${stderr.slice(-300)}`));
    });
    proc.on('error', err => reject(new Error(`ffmpeg concat spawn failed: ${err.message}`)));
  });
}

module.exports = { extractAudio, getAudioDuration, concatMP3s };
