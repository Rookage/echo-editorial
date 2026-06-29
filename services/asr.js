// ASR Transcription (faster-whisper, persistent daemon)
const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');

let asrProc = null;
let asrQueue = Promise.resolve();

function getAsrProc() {
  return new Promise((resolve, reject) => {
    if (asrProc && asrProc.exitCode === null) return resolve(asrProc);

    const script = path.join(__dirname, '..', 'transcribe.py');
    console.log('[ASR] Starting daemon...');
    const proc = spawn(config.PYTHON_PATH, [script, '--daemon', 'small'], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buf = '';
    proc.stdout.on('data', d => {
      buf += d.toString('utf-8');
      if (buf.includes('\n')) {
        const lines = buf.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.status === 'ready') {
              console.log('[ASR] Daemon ready.');
              asrProc = proc;
              resolve(proc);
              return;
            }
          } catch {}
        }
      }
    });

    proc.stderr.on('data', d => process.stderr.write(d));

    proc.on('close', code => {
      console.log(`[ASR] Daemon exited (${code}), will restart on next request.`);
      asrProc = null;
    });

    setTimeout(() => {
      if (!asrProc) {
        proc.kill();
        reject(new Error('ASR daemon startup timed out'));
      }
    }, 120000);
  });
}

function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    asrQueue = asrQueue.then(async () => {
      try {
        const proc = await getAsrProc();
        return new Promise((innerResolve, innerReject) => {
          const onData = d => {
            const line = d.toString('utf-8').trim();
            if (!line) return;
            try {
              const msg = JSON.parse(line);
              proc.stdout.removeListener('data', onData);
              if (msg.error) innerReject(new Error(msg.error));
              else if (msg.transcript) innerResolve(msg.transcript);
              else innerReject(new Error('Unexpected ASR response'));
            } catch { /* partial line, keep buffering */ }
          };
          proc.stdout.on('data', onData);
          proc.stdin.write(JSON.stringify({ audio_path: audioPath }) + '\n');
        });
      } catch (err) {
        throw err;
      }
    });
    asrQueue.then(resolve).catch(reject);
  });
}

function kill() {
  if (asrProc) { asrProc.kill(); asrProc = null; }
}

module.exports = { getAsrProc, transcribeAudio, kill };
