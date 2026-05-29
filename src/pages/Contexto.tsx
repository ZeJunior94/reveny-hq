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

function parseDNA(dna: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < DNA_SECTIONS.length; i++) {
    const s = DNA_SECTIONS[i];
    const next = DNA_SECTIONS[i + 1];
    const start = dna.indexOf(s.header);
    if (start === -1) { result[s.key] = ''; continue; }
    const contentStart = start + s.header.length;
    const end = next ? dna.indexOf(next.header) : dna.length;
    result[s.key] = dna.slice(contentStart, end === -1 ? dna.length : end).trim();
  }
  return result;
}

function assembleDNA(sections: Record<string, string>): string {
  return DNA_SECTIONS
    .map(s => `${s.header}\n${sections[s.key] || ''}`)
    .join('\n\n');
}

const INPUT_CLS =
  'w-full bg-[#1a1a1a] border border-white/6 rounded-lg px-3 py-2.5 text-white/75 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:border-white/20 focus:bg-[#1e1e1e] transition-all placeholder-white/18';

export default function Contexto() {
  const { token } = useAuth();
  const [sections, setSections] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const dirty = JSON.stringify(sections) !== JSON.stringify(original);

  useEffect(() => {
    fetch(`${PROXY}/api/hq/config`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.dna) {
          const parsed = parseDNA(data.dna);
          setSections(parsed);
          setOriginal(parsed);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSection(key: string, value: string) {
    setSections(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const dna = assembleDNA(sections);
      const r = await fetch(`${PROXY}/api/hq/config`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ dna }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar');
      setOriginal({ ...sections });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-10 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Contexto da Reveny</h1>
        <p className="mono text-white/30 text-sm">DNA injetado em todos os agentes</p>
      </div>

      {/* Agentes que usam */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {[
          { label: 'PM', color: '#7aaa4a' },
          { label: 'Builder', color: '#60a5fa' },
          { label: 'Pipeline', color: '#f59e0b' },
          { label: 'Carteira', color: '#34d399' },
          { label: 'Conteúdo', color: '#a78bfa' },
        ].map(a => (
          <span
            key={a.label}
            className="mono text-[10px] px-2.5 py-1 rounded-full"
            style={{ color: a.color, background: `${a.color}18`, border: `1px solid ${a.color}30` }}
          >
            {a.label}
          </span>
        ))}
        <span className="text-white/20 text-xs ml-1">recebem este contexto a cada chamada</span>
      </div>

      {/* Sections */}
      {loading ? (
        <div className="flex flex-col gap-5">
          {DNA_SECTIONS.map(s => (
            <div key={s.key}>
              <div className="h-3 w-32 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-20 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {DNA_SECTIONS.map(s => (
            <div key={s.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-white/60 text-xs font-medium">{s.label}</label>
                <span className="text-white/20 text-xs">{s.hint}</span>
                {sections[s.key] !== original[s.key] && (
                  <span className="mono text-amber-400/60 text-[10px] ml-auto">● editado</span>
                )}
              </div>
              <textarea
                value={sections[s.key] ?? ''}
                onChange={e => updateSection(s.key, e.target.value)}
                rows={s.rows}
                spellCheck={false}
                className={INPUT_CLS}
                placeholder={`${s.label}...`}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-5 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/5">
        <p className="text-white/18 text-xs">Alterações entram em vigor na próxima chamada de qualquer agente.</p>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-white hover:bg-white/90 disabled:opacity-25 text-black text-xs font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar →'}
        </button>
      </div>
    </div>
  );
}
