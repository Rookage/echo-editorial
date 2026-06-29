// Puppeteer browser pool — singleton
const puppeteer = require('puppeteer');
const asrService = require('../services/asr');

let browser = null;

async function getBrowser() {
  if (browser && browser.connected) return browser;
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return browser;
}

async function closeBrowser() {
  if (browser) { await browser.close().catch(() => {}); browser = null; }
}

function shutdown() {
  closeBrowser();
  asrService.kill();
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { getBrowser, closeBrowser };
