import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

const DNA_SECTIONS = [
  { key: 'quem',         header: '## Quem é a Reveny',     label: 'Quem é a Reveny',    hint: 'O que é, o que faz, para quem', rows: 3 },
  { key: 'icp',          header: '## Público-alvo (ICP)',  label: 'Público-alvo (ICP)', hint: 'Perfis de cliente ideais',      rows: 4 },
  { key: 'diferenciais', header: '## Diferenciais',        label: 'Diferenciais',       hint: 'O que nos distingue',          rows: 4 },
  { key: 'modelo',       header: '## Modelo de negócio',   label: 'Modelo de negócio',  hint: 'Planos, preços, MRR, foco',    rows: 3 },
  { key: 'prioridades',  header: '## Prioridades atuais',  label: 'Prioridades atuais', hint: 'Foco deste mês/trimestre',     rows: 3 },
  { key: 'stack',        header: '## Stack técnica',       label: 'Stack técnica',      hint: 'Frontend, backend, banco',     rows: 2 },
  { key: 'voz',          header: '## Voz da marca',        label: 'Voz da marca',       hint: 'Tom, estilo, o que evitar',    rows: 2 },
  { key: 'fundador',     header: '## Fundador',            label: 'Fundador',           hint: 'Perfil, estilo de trabalho',   rows: 2 },
];

const AGENT_CHIPS = [
  { label: 'PM',       color: '#7aaa4a' },
  { label: 'Builder',  color: '#4a7fa5' },
  { label: 'Pipeline', color: '#f59e0b' },
  { label: 'Carteira', color: '#7aaec7' },
  { label: 'Conteúdo', color: '#a78bfa' },
];

function parseDNA(dna: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < DNA_SECTIONS.length; i++) {
    const s = DNA_SECTIONS[i], next = DNA_SECTIONS[i + 1];
    const start = dna.indexOf(s.header);
    if (start === -1) { result[s.key] = ''; continue; }
    const end = next ? dna.indexOf(next.header) : dna.length;
    result[s.key] = dna.slice(start + s.header.length, end === -1 ? dna.length : end).trim();
  }
  return result;
}

function assembleDNA(sections: Record<string, string>): string {
  return DNA_SECTIONS.map(s => `${s.header}\n${sections[s.key] || ''}`).join('\n\n');
}

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };

export default function Contexto() {
  const { token } = useAuth();
  const [sections, setSections] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const dirty = JSON.stringify(sections) !== JSON.stringify(original);

  useEffect(() => {
    fetch(`${PROXY}/api/hq/config`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.dna) {
          const parsed = parseDNA(data.dna);
          setSections(parsed); setOriginal(parsed);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true); setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/config`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ dna: assembleDNA(sections) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar');
      setOriginal({ ...sections });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erro ao salvar'); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-inner)', border: '1px solid var(--border-inner)',
    borderRadius: 6, padding: '0.65rem 0.85rem', color: 'var(--text-sec)',
    fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.6, resize: 'none',
    outline: 'none', transition: 'border-color .15s',
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
          Contexto da Reveny
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', marginTop: '0.3rem' }}>
          DNA injetado em todos os agentes
        </p>
        <div style={{ marginTop: '1.5rem', borderBottom: '1px solid var(--border-main)' }} />
      </div>

      {/* Agent chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: '2rem' }}>
        {AGENT_CHIPS.map(a => (
          <span key={a.label} style={{
            fontSize: '0.68rem', fontWeight: 500, padding: '0.25rem 0.75rem', borderRadius: 999,
            color: a.color, background: `${a.color}18`, border: `1px solid ${a.color}30`,
          }}>{a.label}</span>
        ))}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-ter)', marginLeft: 4 }}>
          recebem este contexto a cada chamada
        </span>
      </div>

      {/* Sections */}
      {loading ? (
        <div className="flex flex-col gap-5">
          {DNA_SECTIONS.map(s => (
            <div key={s.key}>
              <div style={{ height: 12, width: 128, background: 'var(--skel-bg)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 80, background: 'var(--skel-bg)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {DNA_SECTIONS.map(s => (
            <div key={s.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-sec)' }}>{s.label}</label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-ter)' }}>{s.hint}</span>
                {sections[s.key] !== original[s.key] && (
                  <span style={{ fontSize: '0.62rem', color: 'rgba(251,191,36,.6)', marginLeft: 'auto' }}>● editado</span>
                )}
              </div>
              <textarea
                value={sections[s.key] ?? ''}
                onChange={e => setSections(prev => ({ ...prev, [s.key]: e.target.value }))}
                rows={s.rows}
                spellCheck={false}
                style={inputStyle}
                placeholder={`${s.label}...`}
                onFocus={e => (e.target.style.borderColor = 'rgba(74,127,165,.35)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-inner)')}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '1.25rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>{error}</div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-main)' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-ter)', maxWidth: 280, lineHeight: 1.5 }}>
          Alterações entram em vigor na próxima chamada de qualquer agente.
        </p>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          style={{
            background: dirty && !saving ? '#4a7fa5' : 'rgba(74,127,165,.2)',
            color: dirty && !saving ? 'white' : 'var(--text-ter)',
            fontSize: '0.78rem', fontWeight: 600, padding: '0.55rem 1.25rem',
            borderRadius: 6, border: 'none', cursor: dirty && !saving ? 'pointer' : 'not-allowed', transition: 'all .15s',
          }}
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar →'}
        </button>
      </div>
    </div>
  );
}
