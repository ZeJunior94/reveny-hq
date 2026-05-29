import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

interface Message {
  role: 'user' | 'agent';
  text: string;
}

interface Resumo {
  totalClientes: number;
  ativos: number;
  emRisco: number;
  inativos: number;
  nuncaUsaram: number;
}

const SUGGESTIONS = [
  'Me dá um resumo da carteira',
  'Quais clientes não geraram email nos últimos 7 dias?',
  'Quem está em risco de churn esse mês?',
  'Clientes que nunca geraram nenhum email',
  'Qual cliente está mais ativo?',
];

export default function Carteira() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleQuery(q?: string) {
    const text = (q ?? query).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setQuery('');
    setLoading(true);

    try {
      const url = `${PROXY}/api/hq/carteira/query`;
      console.log('[carteira] chamando:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na consulta');

      if (data.resumo) setResumo(data.resumo);
      setMessages((prev) => [...prev, { role: 'agent', text: data.answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na consulta';
      console.error('[carteira] erro:', msg, '| proxy:', PROXY);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `Erro: ${msg}\n\n(URL: ${PROXY}/api/hq/carteira/query)`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Agente de Carteira</h1>
        <p className="mono text-white/30">base ativa — atividade, retenção e churn</p>
      </div>

      {/* Stats strip — aparece após primeira consulta */}
      {resumo && (
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { label: 'TOTAL',       value: resumo.totalClientes, color: '#e5e5e5' },
            { label: 'ATIVOS',      value: resumo.ativos,        color: '#34d399' },
            { label: 'EM RISCO',    value: resumo.emRisco,       color: '#f59e0b' },
            { label: 'INATIVOS',    value: resumo.inativos,      color: '#ef4444' },
            { label: 'NUNCA USOU',  value: resumo.nuncaUsaram,   color: '#6b7280' },
          ].map((s) => (
            <div key={s.label} className="bg-[#141414] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="mono text-white/25 text-[9px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden mb-4">
        <div className="min-h-[300px] max-h-[420px] overflow-y-auto p-5 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-white/20 text-sm text-center mt-12">
              Pergunte qualquer coisa sobre sua carteira de clientes.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#34d399]/15 text-white/80 border border-[#34d399]/20'
                    : 'bg-[#1a1a1a] text-white/70 border border-white/5'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="text-white/30 text-xs mr-2">consultando carteira</span>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-[#34d399]/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/5 p-4 flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuery(); }}
            placeholder="Pergunte sobre sua carteira..."
            className="flex-1 bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none"
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !query.trim()}
            className="bg-[#34d399] hover:bg-[#4ade80] disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Sugestões */}
      <div className="mono text-white/25 mb-3">sugestões</div>
      <div className="flex flex-col gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleQuery(s)}
            disabled={loading}
            className="text-left text-sm text-white/40 hover:text-white/70 py-2 px-3 rounded-lg hover:bg-white/4 transition-all border border-transparent hover:border-white/5 disabled:opacity-30"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
