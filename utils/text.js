// Text helpers — hashtag stripping, chunking
function stripHashtags(text) {
  return text
    .split('\n')
    .filter(line => !/^[\s#]+[#＃]/.test(line.trim()) && !/^#[一-鿿\w]+(?:[\s　]+#[一-鿿\w]+)*$/.test(line.trim()))
    .join('\n')
    .trim();
}

function splitLongParagraph(para, maxLen) {
  const sentences = para.split(/(?<=[。！？!?\n])/);
  const result = [];
  for (const sent of sentences) {
    if (!sent.trim()) continue;
    if (sent.length <= maxLen) {
      const last = result[result.length - 1];
      if (last && last.length + sent.length <= maxLen) {
        result[result.length - 1] = last + sent;
      } else {
        result.push(sent);
      }
    } else {
      for (let i = 0; i < sent.length; i += maxLen) {
        result.push(sent.slice(i, i + maxLen));
      }
    }
  }
  return result;
}

function splitIntoChunks(text, maxLen) {
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    if (trimmed.length <= maxLen) {
      const last = chunks[chunks.length - 1];
      if (last && last.length + trimmed.length + 2 <= maxLen) {
        chunks[chunks.length - 1] = last + '\n\n' + trimmed;
      } else {
        chunks.push(trimmed);
      }
    } else {
      const subChunks = splitLongParagraph(trimmed, maxLen);
      for (const sub of subChunks) {
        const last = chunks[chunks.length - 1];
        if (last && last.length + sub.length + 1 <= maxLen) {
          chunks[chunks.length - 1] = last + '\n' + sub;
        } else {
          chunks.push(sub);
        }
      }
    }
  }
  return chunks;
}

module.exports = { stripHashtags, splitIntoChunks };
