const { admin } = require('./firebase');

const ALLOWED_UIDS = (process.env.OWNER_UID || '').split(',').filter(Boolean);

async function validateAuth(headers) {
  const authHeader = headers.authorization || headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) throw new AuthError('missing auth token', 401);

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw new AuthError('invalid auth token', 401);
  }

  if (ALLOWED_UIDS.length > 0 && !ALLOWED_UIDS.includes(decoded.uid)) {
    throw new AuthError('not authorized', 403);
  }

  return decoded;
}

class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

module.exports = { validateAuth, AuthError };
