const anthropicAdapter = {
  name: 'claude-sonnet',
  async generate(systemPrompt, userPrompt, apiKey) {
    const key = apiKey || process.env.CLAUDE_API_KEY;
    if (!key) throw new Error('CLAUDE_API_KEY not configured');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        system: systemPrompt, messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    if (!content) throw new Error('empty response from Claude');
    return { content: content.trim(), model: 'claude-sonnet' };
  },
};

function createOpenAIAdapter({ name, envKey, baseURL, model }) {
  return {
    name,
    async generate(systemPrompt, userPrompt, apiKey) {
      const key = apiKey || process.env[envKey];
      if (!key) throw new Error(`${envKey} not configured`);

      const res = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model, max_tokens: 1000,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        }),
      });

      if (!res.ok) throw new Error(`${name} API ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) throw new Error(`empty response from ${name}`);
      return { content: content.trim(), model: name };
    },
  };
}

const ADAPTERS = {
  'claude-sonnet': anthropicAdapter,
  'gpt-4o': createOpenAIAdapter({ name: 'gpt-4o', envKey: 'OPENAI_API_KEY', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' }),
  'kimi-k2.5': {
    name: 'kimi-k2.5',
    async generate(systemPrompt, userPrompt, apiKey) {
      const key = apiKey || process.env.KIMI_API_KEY;
      if (!key) throw new Error('KIMI_API_KEY not configured');

      const res = await fetch('https://api.moonshot.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'kimi-k2.5',
          max_tokens: 1000,
          temperature: 0.7,
          thinking: { type: 'disabled' },
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        }),
      });

      if (!res.ok) throw new Error(`kimi-k2.5 API ${res.status}`);
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) throw new Error('empty response from kimi-k2.5');
      return { content: content.trim(), model: 'kimi-k2.5' };
    },
  },
};

const MODEL_ENV_KEYS = {
  'claude-sonnet': 'CLAUDE_API_KEY',
  'gpt-4o': 'OPENAI_API_KEY',
  'kimi-k2.5': 'KIMI_API_KEY',
};

function getAdapter(modelName) {
  const adapter = ADAPTERS[modelName];
  if (!adapter) throw new Error(`unknown model: ${modelName}`);
  return adapter;
}

module.exports = { getAdapter, MODEL_ENV_KEYS };
