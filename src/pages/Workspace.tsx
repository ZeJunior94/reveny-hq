import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type AgentId = 'pm' | 'arquiteto' | 'template';
type Status  = 'idle' | 'streaming' | 'done' | 'error';

const AGENTS: { id: AgentId; label: string; role: string; color: string }[] = [
  { id: 'pm',        label: 'PM',              role: 'Valida alinhamento estratégico',    color: '#7aaec7' },
  { id: 'arquiteto', label: 'Arquiteto',        role: 'Avalia viabilidade técnica',        color: '#f59e0b' },
  { id: 'template',  label: 'Template Builder', role: 'Gera o HTML completo',             color: '#7aaa4a' },
];

const jakarta: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 };
const dimLabel: React.CSSProperties = { fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' as const, letterSpacing: '0.18em' };

export default function Workspace() {
  const { token } = useAuth();

  const [idea, setIdea]     = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [active, setActive] = useState<AgentId | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [pmText,   setPmText]   = useState('');
  const [arquText, setArquText] = useState('');
  const [tmplText, setTmplText] = useState('');

  const abortRef = useRef<(() => void) | null>(null);

  async function handleRun() {
    if (!idea.trim() || status === 'streaming') return;

    setPmText(''); setArquText(''); setTmplText('');
    setError(null); setActive(null);
    setStatus('streaming');

    let aborted = false;
    const controller = new AbortController();
    abortRef.current = () => { aborted = true; controller.abort(); };

    try {
      const res = await fetch(`${PROXY}/api/hq/workspace/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ idea: idea.trim() }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || aborted) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.agent === 'done') { setStatus('done'); setActive(null); return; }
            if (ev.agent === 'error') throw new Error(ev.message);
            if (ev.agent === 'pm')        { setActive('pm');        setPmText(p => p + ev.chunk); }
            else if (ev.agent === 'arquiteto') { setActive('arquiteto'); setArquText(p => p + ev.chunk); }
            else if (ev.agent === 'template')  { setActive('template');  setTmplText(p => p + ev.chunk); }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e;
          }
        }
      }
      if (!aborted) setStatus('done');
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') { setStatus('idle'); return; }
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      setStatus('error');
    } finally {
      setActive(null);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.();
    setStatus('idle');
    setActive(null);
  }

  function handleCopy() {
    if (!tmplText) return;
    navigator.clipboard.writeText(tmplText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleReset() {
    setIdea(''); setPmText(''); setArquText(''); setTmplText('');
    setStatus('idle'); setError(null); setActive(null);
  }

  const GREEN  = '#7aaa4a';
  const ACCENT = '#4a7fa5';
  const isRunning = status === 'streaming';
  const isDone    = status === 'done';

  const textOf: Record<AgentId, string> = { pm: pmText, arquiteto: arquText, template: tmplText };

  return (
    <div className="p-4 md:p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-6">
        <h1 style={{ ...jakarta, fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
          Workspace
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-ter)', marginTop: '0.3rem' }}>
          Ideia → PM → Arquiteto → Template Builder via streaming
        </p>
      </div>

      {/* Input */}
      <div style={{ ...card, padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ ...dimLabel, marginBottom: '0.85rem' }}>● Ideia de template</div>
        <div style={{ borderBottom: '1px solid var(--border-inner)', marginBottom: '1rem' }} />
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun(); }}
          placeholder="Ex: template de carrinho abandonado com urgência e desconto progressivo..."
          rows={3}
          disabled={isRunning}
          className="w-full bg-transparent text-white/80 text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-inner)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-ter)' }}>⌘+Enter para rodar</span>
            {isDone && (
              <button onClick={handleReset} style={{ fontSize: '0.7rem', color: 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                nova ideia
              </button>
            )}
          </div>
          {isRunning ? (
            <button
              onClick={handleStop}
              style={{ background: 'rgba(239,68,68,.15)', color: '#f87171', border: '1px solid rgba(239,68,68,.25)', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, cursor: 'pointer' }}
            >
              Parar
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={!idea.trim() || isDone}
              style={{ background: GREEN, color: 'black', fontSize: '0.75rem', fontWeight: 700, padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: !idea.trim() || isDone ? 0.4 : 1 }}
            >
              Rodar agentes →
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)', borderRadius: 6, padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* Agent panels */}
      {(isRunning || isDone || !!pmText) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {AGENTS.map(agent => {
            const text      = textOf[agent.id];
            const isActive  = active === agent.id;
            const hasDone   = text.length > 0 && !isActive;
            const isWaiting = !text && isRunning && active !== agent.id;

            return (
              <div
                key={agent.id}
                style={{
                  ...card,
                  borderLeft: `2px solid ${text ? agent.color : 'transparent'}`,
                  padding: '1.25rem',
                  transition: 'border-color .3s',
                }}
              >
                {/* Panel header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: agent.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {agent.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-ter)' }}>
                      {agent.role}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isActive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: agent.color, fontSize: '0.65rem' }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: agent.color }} />
                        escrevendo
                      </div>
                    )}
                    {hasDone && !isActive && (
                      <span style={{ fontSize: '0.65rem', color: `${agent.color}90` }}>✓ pronto</span>
                    )}
                    {isWaiting && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-ter)' }}>aguardando...</span>
                    )}
                    {agent.id === 'template' && text && (
                      <button
                        onClick={handleCopy}
                        style={{ fontSize: '0.68rem', color: copied ? GREEN : 'var(--text-ter)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color .2s' }}
                        className="hover:text-white/60"
                      >
                        {copied ? '✓ copiado' : 'copiar HTML'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel content */}
                {text ? (
                  agent.id === 'template' ? (
                    <pre style={{
                      fontSize: '0.68rem', color: 'var(--text-sec)', lineHeight: 1.65,
                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      fontFamily: "'Courier New', monospace",
                      maxHeight: 400, overflowY: 'auto',
                      background: 'var(--bg-inner)', border: '1px solid var(--border-inner)',
                      borderRadius: 6, padding: '0.85rem',
                    }}>
                      {text}
                      {isActive && <span className="animate-pulse" style={{ color: agent.color }}>▌</span>}
                    </pre>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                      {text}
                      {isActive && <span className="animate-pulse" style={{ color: agent.color }}>▌</span>}
                    </p>
                  )
                ) : (
                  <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
                    {isWaiting && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--text-ter)', animationDelay: `${i * 180}ms` }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Done summary */}
      {isDone && tmplText && (
        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleCopy}
            style={{ background: ACCENT, color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem 1.5rem', borderRadius: 7, border: 'none', cursor: 'pointer' }}
          >
            {copied ? '✓ HTML copiado!' : 'Copiar template HTML →'}
          </button>
        </div>
      )}
    </div>
  );
}
