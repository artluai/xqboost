import { useState, useEffect } from 'react';
import { useTheme } from '../theme';
import { fetchModelStatus, saveKey, deleteKey } from '../hooks/useGenerate';

const MODELS = [
  { key: 'claude-sonnet', name: 'Claude Sonnet', placeholder: 'sk-ant-...' },
  { key: 'gpt-4o', name: 'GPT-4o', placeholder: 'sk-...' },
  { key: 'kimi-k2.5', name: 'Kimi K2.5', placeholder: 'sk-...' },
];

export default function AIModelsSection() {
  const { t } = useTheme();
  const [models, setModels] = useState({});
  const [loading, setLoading] = useState(true);
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState({});
  const [error, setError] = useState({});

  const refresh = () => {
    fetchModelStatus()
      .then(m => { setModels(m); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const handleSave = async (model) => {
    const key = (inputs[model] || '').trim();
    if (!key) return;

    setSaving(s => ({ ...s, [model]: true }));
    setError(e => ({ ...e, [model]: null }));

    try {
      const result = await saveKey(model, key);
      if (result.ok) {
        setInputs(i => ({ ...i, [model]: '' }));
        refresh();
      } else {
        setError(e => ({ ...e, [model]: result.error || 'failed to save' }));
      }
    } catch (e) {
      setError(er => ({ ...er, [model]: 'failed to save' }));
    }

    setSaving(s => ({ ...s, [model]: false }));
  };

  const handleRemove = async (model) => {
    setSaving(s => ({ ...s, [model]: true }));
    setError(e => ({ ...e, [model]: null }));

    try {
      const result = await deleteKey(model);
      if (result.ok) refresh();
      else setError(e => ({ ...e, [model]: result.error || 'failed to remove' }));
    } catch (e) {
      setError(er => ({ ...er, [model]: 'failed to remove' }));
    }

    setSaving(s => ({ ...s, [model]: false }));
  };

  const sectionStyle = { padding: '20px 16px', borderBottom: `1px solid ${t.border}` };

  return (
    <div style={sectionStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: t.text, fontFamily: t.font, marginBottom: 4 }}>AI models</div>
      <div style={{ fontSize: 13, color: t.textSecondary, fontFamily: t.font, marginBottom: 16, lineHeight: 1.5 }}>
        API keys for draft generation. Keys are encrypted and stored securely.
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: t.textMuted, fontFamily: t.font }}>checking...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODELS.map(m => {
            const status = models[m.key] || {};
            const connected = status.connected;
            const isEnvOnly = status.source === 'env';
            const isSaving = saving[m.key];
            const modelError = error[m.key];

            return (
              <div key={m.key} style={{
                padding: '12px 14px', borderRadius: t.radiusSm,
                border: `1px solid ${t.border}`,
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: connected ? 0 : 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: connected ? '#22c55e' : t.red,
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: t.font, color: t.text, flex: 1 }}>
                    {m.name}
                  </span>

                  {connected && (
                    <span style={{
                      fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600, fontFamily: t.font,
                      background: t.name === 'light' ? '#e8f5e9' : '#062b12', color: t.greenText,
                    }}>
                      connected
                    </span>
                  )}
                </div>

                {/* Connected: show masked key + source + remove */}
                {connected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{
                      fontSize: 12, color: t.textMuted, fontFamily: 'ui-monospace, monospace',
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {status.maskedKey || (isEnvOnly ? 'set via environment variable' : '••••••••')}
                    </span>
                    {!isEnvOnly && (
                      <button
                        onClick={() => handleRemove(m.key)}
                        disabled={isSaving}
                        style={{
                          background: 'none', border: `1px solid ${t.name === 'light' ? '#fecaca' : '#3d1616'}`,
                          color: t.red, padding: '4px 12px', borderRadius: 9999,
                          fontSize: 11, fontFamily: t.font, cursor: isSaving ? 'default' : 'pointer',
                          opacity: isSaving ? 0.5 : 1,
                        }}
                      >
                        {isSaving ? '...' : 'remove'}
                      </button>
                    )}
                  </div>
                )}

                {/* Not connected: show input + save */}
                {!connected && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="password"
                      value={inputs[m.key] || ''}
                      onChange={e => setInputs(i => ({ ...i, [m.key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSave(m.key)}
                      placeholder={m.placeholder}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 9999,
                        border: `1px solid ${t.borderHover}`, fontSize: 13,
                        background: t.bg, outline: 'none', color: t.text,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    />
                    <button
                      onClick={() => handleSave(m.key)}
                      disabled={isSaving || !(inputs[m.key] || '').trim()}
                      style={{
                        background: t.btnPrimary, color: t.btnPrimaryText, border: 'none',
                        padding: '8px 16px', borderRadius: 9999, fontSize: 13,
                        fontWeight: 700, fontFamily: t.font, cursor: 'pointer',
                        opacity: (isSaving || !(inputs[m.key] || '').trim()) ? 0.4 : 1,
                      }}
                    >
                      {isSaving ? '...' : 'save'}
                    </button>
                  </div>
                )}

                {/* Error message */}
                {modelError && (
                  <div style={{ fontSize: 12, color: t.red, marginTop: 6, fontFamily: t.font }}>{modelError}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: t.textMuted, fontFamily: t.font, lineHeight: 1.5, textAlign: 'center' }}>
        Keys are encrypted server-side and never exposed to the browser.
      </div>
    </div>
  );
}
