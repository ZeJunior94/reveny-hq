import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const PROXY = (
  (import.meta.env.VITE_PROXY_BASE as string | undefined)
  || 'https://mailflow-seu-email-inteligente-production.up.railway.app'
).trim();

type AgentType = 'hq' | 'template';

interface Msg {
  id: string;
  role: 'user' | 'agent';
  content: string;
  agent?: AgentType;
  streaming?: boolean;
}

const AGENT: Record<AgentType, { label: string; color: string }> = {
  hq:       { label: 'HQ',               color: '#7aaec7' },
  template: { label: 'Template Builder', color: '#7aaa4a' },
};

const WELCOME: Msg = {
  id: 'welcome',
  role: 'agent',
  agent: 'hq',
  content: 'Olá! Pode falar sobre features, bugs, ideias ou qualquer coisa do produto. Quando quiser um template HTML, é só dizer **"cria o template"**.',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      style={{
        fontSize: '0.68rem', color: copied ? '#7aaa4a' : 'var(--text-ter)',
        background: 'none', border: 'none', cursor: 'pointer', transition: 'color .2s',
      }}
    >
      {copied ? '✓ copiado' : 'copiar HTML'}
    </button>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  const meta   = msg.agent ? AGENT[msg.agent] : AGENT.hq;
  const isTemplate = msg.agent === 'template' && !msg.streaming && msg.content.trim().startsWith('<');

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '72%',
          background: 'rgba(74,127,165,.15)',
          border: '1px solid rgba(74,127,165,.2)',
          borderRadius: '12px 12px 3px 12px',
          padding: '0.65rem 0.9rem',
          fontSize: '0.83rem', color: 'var(--text-pri)', lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '85%' }}>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: meta.color, letterSpacing: '0.08em', paddingLeft: 2 }}>
        {meta.label}
      </span>

      {isTemplate ? (
        <div style={{
          background: 'var(--bg-card)', border: `1px solid ${AGENT.template.color}22`,
          borderLeft: `2px solid ${AGENT.template.color}`,
          borderRadius: '3px 12px 12px 12px', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border-inner)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-ter)' }}>HTML gerado</span>
            <CopyButton text={msg.content} />
          </div>
          <pre style={{
            fontSize: '0.67rem', color: 'var(--text-sec)', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            fontFamily: "'Courier New', monospace",
            maxHeight: 360, overflowY: 'auto',
            padding: '0.85rem',
            margin: 0,
          }}>
            {msg.content}
          </pre>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-card)',
          borderRadius: '3px 12px 12px 12px',
          padding: '0.65rem 0.9rem',
          fontSize: '0.83rem', color: 'var(--text-sec)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content || (
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <span key={i} className="animate-pulse inline-block w-1 h-1 rounded-full" style={{ background: meta.color, animationDelay: `${i * 160}ms` }} />
              ))}
            </span>
          )}
          {msg.streaming && msg.content && (
            <span className="animate-pulse" style={{ color: meta.color, marginLeft: 1 }}>▌</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Workspace() {
  const { token } = useAuth();
  const [msgs, setMsgs]       = useState<Msg[]>([WELCOME]);
  const [input, setInput]     = useState('');
  const [streaming, setStream] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  async function send() {
    if (!input.trim() || streaming) return;

    const text   = input.trim();
    const userId  = `u-${Date.now()}`;
    const agentId = `a-${Date.now()}`;
    setInput('');

    setMsgs(prev => [
      ...prev,
      { id: userId,  role: 'user',  content: text },
      { id: agentId, role: 'agent', agent: 'hq', content: '', streaming: true },
    ]);
    setStream(true);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    try {
      const history = msgs
        .filter(m => m.content)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const res = await fetch(`${PROXY}/api/hq/workspace/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history, message: text }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'agent') {
              setMsgs(prev => prev.map(m => m.id === agentId ? { ...m, agent: ev.agent } : m));
            } else if (ev.type === 'chunk') {
              setMsgs(prev => prev.map(m => m.id === agentId ? { ...m, content: m.content + ev.text } : m));
            } else if (ev.type === 'done') {
              setMsgs(prev => prev.map(m => m.id === agentId ? { ...m, streaming: false } : m));
              setStream(false);
              return;
            } else if (ev.type === 'error') {
              throw new Error(ev.message);
            }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name === 'AbortError') { setStream(false); return; }
      const errText = e instanceof Error ? e.message : 'Erro desconhecido';
      setMsgs(prev => prev.map(m =>
        m.id === agentId ? { ...m, content: `Erro: ${errText}`, streaming: false } : m
      ));
    } finally {
      setStream(false);
      abortRef.current = null;
      setMsgs(prev => prev.map(m => m.id === agentId ? { ...m, streaming: false } : m));
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 820, margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div style={{ padding: '1.5rem 1.5rem 0.75rem', flexShrink: 0 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.04em', color: 'var(--text-pri)', lineHeight: 1.1 }}>
          Workspace
        </h1>
        <p style={{ fontSize: '0.73rem', color: 'var(--text-ter)', marginTop: '0.2rem' }}>
          Features · Bugs · Templates — diga <span style={{ color: '#7aaa4a' }}>"cria o template"</span> para gerar HTML
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {msgs.map(m => <Bubble key={m.id} msg={m} />)}
        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem 1.5rem 1.25rem', flexShrink: 0 }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-card)',
          borderRadius: 10, padding: '0.75rem 0.85rem',
          display: 'flex', gap: 10, alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Fale sobre uma feature, bug ou ideia..."
            rows={2}
            disabled={streaming}
            className="flex-1 bg-transparent text-sm placeholder-white/20 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
            style={{ color: 'var(--text-pri)', minHeight: 40 }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            style={{
              background: '#4a7fa5', color: 'white',
              fontSize: '0.75rem', fontWeight: 700,
              padding: '0.45rem 0.9rem', borderRadius: 7,
              border: 'none', cursor: 'pointer', flexShrink: 0,
              opacity: !input.trim() || streaming ? 0.35 : 1,
              transition: 'opacity .15s',
            }}
          >
            {streaming ? '...' : 'Enviar →'}
          </button>
        </div>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-ter)', marginTop: '0.35rem', paddingLeft: '0.2rem' }}>
          Enter envia · Shift+Enter quebra linha
        </p>
      </div>
    </div>
  );
}
