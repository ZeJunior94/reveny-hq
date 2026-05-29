import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

export default function Contexto() {
  const { token } = useAuth();
  const [dna, setDna] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const dirty = dna !== original;

  useEffect(() => {
    fetch(`${PROXY}/api/hq/config`, { headers: authHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.dna) { setDna(data.dna); setOriginal(data.dna); }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch(`${PROXY}/api/hq/config`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ dna }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erro ao salvar');
      setOriginal(dna);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Contexto da Reveny</h1>
        <p className="mono text-white/30">DNA injetado em todos os agentes</p>
      </div>

      {/* Como funciona */}
      <div className="bg-[#141414] border border-white/5 rounded-xl p-5 mb-6">
        <div className="mono text-white/30 mb-3 text-xs">como funciona</div>
        <div className="flex flex-col gap-2">
          {[
            { badge: 'PM', color: '#7aaa4a',  text: 'ICE Score calibrado com o ICP e prioridades atuais' },
            { badge: 'B',  color: '#60a5fa',  text: 'PRDs com stack técnica e contexto de produto corretos' },
            { badge: 'P',  color: '#f59e0b',  text: 'Pipeline parse entende o modelo de negócio' },
            { badge: 'C',  color: '#34d399',  text: 'Carteira relaciona métricas com momento da empresa' },
            { badge: 'C',  color: '#a78bfa',  text: 'Posts com voz e posicionamento reais da Reveny' },
          ].map((a) => (
            <div key={a.badge + a.color} className="flex items-start gap-3">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-black flex-shrink-0 mt-0.5"
                style={{ background: a.color }}
              >
                {a.badge}
              </span>
              <span className="text-white/40 text-xs leading-relaxed">{a.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="mono text-white/30 text-xs">● dna.md</div>
          {dirty && <span className="mono text-amber-400/60 text-xs">● não salvo</span>}
        </div>

        {loading ? (
          <div className="p-5 text-white/20 text-sm">Carregando...</div>
        ) : (
          <textarea
            value={dna}
            onChange={e => setDna(e.target.value)}
            rows={28}
            spellCheck={false}
            className="w-full bg-transparent text-white/70 text-sm font-mono leading-relaxed p-5 focus:outline-none resize-none"
          />
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-white/20 text-xs">
          Alterações entram em vigor na próxima chamada de qualquer agente.
        </p>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-white hover:bg-white/90 disabled:opacity-30 text-black text-xs font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar →'}
        </button>
      </div>
    </div>
  );
}
