// Douyin URL helpers
function isValidDouyinUrl(url) {
  return /douyin\.com|iesdouyin\.com/.test(url);
}

function extractAwemeId(url) {
  const m = url.match(/video\/(\d+)/);
  return m ? m[1] : null;
}

// Clean share text: extract douyin URL from pasted fluff
function cleanDouyinUrl(raw) {
  const m = raw.match(/https?:\/\/(?:v\.douyin\.com\/[a-zA-Z0-9_-]+|www\.douyin\.com\/(?:video\/\d+|user\/[^\s?]+))\S*/);
  return m ? m[0].replace(/[，,。！!？?\s]+$/, '') : raw;
}

module.exports = { isValidDouyinUrl, extractAwemeId, cleanDouyinUrl };
