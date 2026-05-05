// Manimo Studio — Chat panel
// Collapsible drawer. Closed by default — preview takes the room.
// When open, slides in over the workspace with full conversation.

function ChatMessage({ from, children, time, status, demo }) {
  const isAi = from === 'ai';
  return (
    <div className={`msg ${isAi ? 'msg-ai' : 'msg-user'}`}>
      <div className={`av ${isAi ? 'av-ai' : 'av-user'}`}>{isAi ? 'M' : 'Y'}</div>
      <div className="msg-body">
        <div className={`bubble ${isAi ? 'bubble-ai' : 'bubble-user'}`}>{children}</div>
        <div className="stamp">
          {isAi ? 'Manimo' : 'You'} · {time}
          {demo && <span className="status-pill stamp-demo">demo</span>}
          {status && <span className="status-pill"><span className="dot"/>{status}</span>}
        </div>
      </div>
    </div>
  );
}

function SuggestionRow({ items, onPick }) {
  return (
    <div className="suggest">
      {items.map((s, i) => (
        <button key={i} className="suggest-chip" onClick={() => onPick(s)}>{s}</button>
      ))}
    </div>
  );
}

function ChatComposer({ onSend, placeholder, autoFocus, onFocus }) {
  const [val, setVal] = React.useState('');
  const taRef = React.useRef(null);
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(140, ta.scrollHeight) + 'px';
  }, [val]);
  React.useEffect(() => {
    if (autoFocus && taRef.current) taRef.current.focus();
  }, [autoFocus]);
  const submit = () => {
    if (!val.trim()) return;
    onSend(val.trim());
    setVal('');
  };
  return (
    <div className="composer">
      <textarea
        ref={taRef}
        rows={1}
        placeholder={placeholder || 'Describe a change, or ask Manimo for an alternative…'}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onFocus={onFocus}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="composer-foot">
        <div className="composer-tools">
          <button className="tool-btn" title="Attach reference">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <button className="tool-btn" title="Insert component">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </button>
        </div>
        <button className="btn btn-primary btn-sm" onClick={submit} disabled={!val.trim()}>Send</button>
      </div>
    </div>
  );
}

function ChatPanel({ messages, onSend, onPickSuggest, onClose, onReset, open }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // ESC to close.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="chat-scrim" onClick={onClose} aria-hidden/>}
      <aside className={`chat-panel ${open ? 'open' : 'closed'}`} aria-hidden={!open}>
        <div className="chat-head">
          <div>
            <div className="text-eyebrow">Conversation</div>
            <div className="chat-head-sub">Manimo · scene editor (demo)</div>
          </div>
          <div className="chat-head-actions">
            <button className="tool-btn" title="Reset to seed conversation" onClick={onReset}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/></svg>
            </button>
            <button className="tool-btn" title="Close (Esc)" onClick={onClose}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="chat-scroll" ref={scrollRef}>
          {messages.map((m, i) => (
            <ChatMessage key={i} from={m.from} time={m.time} status={m.status} demo={m.demo}>
              {m.body}
              {m.suggestions && (
                <SuggestionRow items={m.suggestions} onPick={onPickSuggest}/>
              )}
            </ChatMessage>
          ))}
        </div>
        <ChatComposer onSend={onSend} autoFocus={open}/>
      </aside>
    </>
  );
}

window.ChatPanel = ChatPanel;
window.ChatMessage = ChatMessage;
window.ChatComposer = ChatComposer;
