const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY || '';

function getKey() {
  if (!KEY) throw new Error('ENCRYPTION_KEY not configured');
  // If hex string (64 chars = 32 bytes), convert. Otherwise hash it to 32 bytes.
  if (/^[0-9a-f]{64}$/i.test(KEY)) return Buffer.from(KEY, 'hex');
  return crypto.createHash('sha256').update(KEY).digest();
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  // Store as iv:tag:ciphertext
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(stored) {
  const key = getKey();
  const [ivHex, tagHex, ciphertext] = stored.split(':');
  if (!ivHex || !tagHex || !ciphertext) throw new Error('invalid encrypted format');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Mask an API key for display: show first 8 and last 4 chars.
 */
function mask(key) {
  if (!key || key.length < 16) return '••••••••';
  return key.slice(0, 8) + '••••' + key.slice(-4);
}

module.exports = { encrypt, decrypt, mask };
