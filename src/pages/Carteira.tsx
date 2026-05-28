import { useState } from 'react';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

const SUGGESTIONS = [
  'Quais clientes não geraram email nos últimos 7 dias?',
  'Quem está em risco de churn esse mês?',
  'Me dá um resumo da carteira para a reunião de segunda',
  'Clientes que assinaram há mais de 30 dias e nunca geraram email',
  'Qual é o MRR atual e quantos clientes ativos temos?',
];

export default function Carteira() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleQuery(q?: string) {
    const text = q ?? query;
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setQuery('');
    setLoading(true);
    try {
      // TODO: chamar /api/hq/carteira/query com token real
      // O endpoint vai consultar Supabase (profiles + emails + brands) e Claude vai interpretar
      await new Promise((r) => setTimeout(r, 800));
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: '⚠️ API ainda não conectada. Quando estiver integrado, consultarei o Supabase da Reveny e responderei com dados reais da sua carteira.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Agente de Carteira</h1>
        <p className="mono text-white/30">base ativa — atividade, retenção e churn</p>
      </div>

      {/* Chat */}
      <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden mb-4">
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto p-5 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-white/20 text-sm text-center mt-12">
              Pergunte qualquer coisa sobre sua carteira de clientes.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
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
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
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
            className="text-left text-sm text-white/40 hover:text-white/70 py-2 px-3 rounded-lg hover:bg-white/4 transition-all border border-transparent hover:border-white/5"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
