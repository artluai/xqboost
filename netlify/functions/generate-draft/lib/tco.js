/**
 * Count characters with t.co URL wrapping (X counts all URLs as 23 chars).
 */
function countTcoChars(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  let adjusted = text;
  const urls = text.match(urlRegex) || [];
  for (const url of urls) {
    adjusted = adjusted.replace(url, 'x'.repeat(23));
  }
  const bareDomainRegex = /(?<!\w)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g;
  const bareDomains = adjusted.match(bareDomainRegex) || [];
  for (const domain of bareDomains) {
    if (domain.length !== 23) {
      adjusted = adjusted.replace(domain, 'x'.repeat(23));
    }
  }
  return adjusted.length;
}

module.exports = { countTcoChars };
