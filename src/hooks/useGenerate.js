import { auth } from '../firebase';

const GENERATE_URL = '/.netlify/functions/generate-draft';

async function callFunction(body) {
  const user = auth.currentUser;
  if (!user) throw new Error('not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function generateDraft(params) {
  return callFunction(params);
}

/**
 * Fetch model status. Returns:
 * { 'claude-sonnet': { connected, source, maskedKey }, ... }
 */
export async function fetchModelStatus() {
  try {
    const data = await callFunction({ action: 'model-status' });
    return data.ok ? data.models : {};
  } catch (e) { return {}; }
}

/**
 * Save an API key for a model. Encrypted server-side.
 */
export async function saveKey(model, apiKey) {
  return callFunction({ action: 'save-key', model, apiKey });
}

/**
 * Remove an API key for a model.
 */
export async function deleteKey(model) {
  return callFunction({ action: 'delete-key', model });
}
