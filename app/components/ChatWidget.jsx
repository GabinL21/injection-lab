'use client';

import { useEffect, useRef } from 'react';

// The raw view: the same conversation as one flat string, with the role names
// spelled out inside it as ordinary tokens. Tag spelling differs between model
// families; the flattening is universal, and the flattening is the point.
function RawView({ system, messages, systemRevealed, s }) {
  const parts = [
    <span key="b" className="tok">
      {'<|begin|>'}
    </span>,
  ];

  const push = (i, tag, cls, body, hidden) => {
    parts.push(
      <span key={`o${i}`}>
        {'\n'}
        <span className={cls}>{`<|start|>${tag}`}</span>
        {'\n'}
      </span>,
      <span key={`c${i}`} className={hidden ? 'hidden-sys' : undefined}>
        {body}
      </span>,
      <span key={`e${i}`} className="tok">
        {'\n<|end|>'}
      </span>,
    );
  };

  push('sys', 'system', 't-system', systemRevealed ? system : s.redacted, !systemRevealed);

  messages.forEach((m, i) => {
    if (m.kind === 'blocked') return;
    push(i, m.role === 'assistant' ? 'assistant' : 'user', m.role === 'user' ? 't-user' : 't-model', m.content);
  });

  parts.push(
    <span key="n">
      {'\n'}
      <span className="t-model">{'<|start|>assistant'}</span>
      {'\n'}
      <span className="tok">▮</span>
    </span>,
  );

  return <pre className="raw">{parts}</pre>;
}

// Small models emit **markdown bold** constantly. A real support widget renders
// it, so leaving the asterisks on screen is the one detail that would give the
// whole disguise away. Bold only — no HTML is ever constructed from model text.
function RichText({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

// The level 2 interstitial. It has to read like something a security team
// bolted on, not like the bot being coy — the whole lesson depends on the
// player seeing that a separate thing stopped this, after the bot had spoken.
function BlockedNotice({ length, product, s }) {
  const [pre, , post] = s.blockedBody(product, null);
  return (
    <div className="blocked-notice">
      <div className="bn-head">
        <span className="bn-icon" aria-hidden="true">
          !
        </span>
        <span className="bn-title">{s.blockedTitle}</span>
      </div>
      <p className="bn-body">
        {pre}
        <strong>{s.blockedCode}</strong>
        {post}
      </p>
      <div className="bn-meta">{s.blockedMeta(length)}</div>
    </div>
  );
}

export default function ChatWidget({
  level,
  messages,
  view,
  onView,
  busy,
  system,
  systemRevealed,
  s,
}) {
  const bodyRef = useRef(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, view, busy]);

  const [chatPre, , chatPost] = s.footChat(null);
  const [rawPre, , rawPost] = s.footRaw(null);

  return (
    <div className="widget" data-brand={level.brand}>
      <header className="w-head">
        <span className="w-avatar" aria-hidden="true">
          {level.mark}
        </span>
        <div className="w-id">
          <span className="w-name">{level.product}</span>
          <span className="w-status">
            <i className="w-dot" /> {level.status}
          </span>
        </div>
        <div className="toggle" role="group" aria-label={s.chat}>
          <button type="button" aria-pressed={view === 'chat'} onClick={() => onView('chat')}>
            {s.chat}
          </button>
          <button type="button" aria-pressed={view === 'raw'} onClick={() => onView('raw')}>
            {s.raw}
          </button>
        </div>
      </header>

      {/* The system prompt never appears as a chat bubble, because it is not
          part of the conversation the player can see or write to. */}
      <div className={`w-sys${systemRevealed ? ' open' : ''}`}>
        {systemRevealed ? (
          <>
            <span className="w-sys-label">{s.declassified}</span>
            <pre className="w-sys-text">{system}</pre>
          </>
        ) : (
          <span className="w-sys-label">
            <b>{s.hiddenSetup}</b> · {s.hiddenSetupNote}
          </span>
        )}
      </div>

      <div className="w-body" ref={bodyRef}>
        {view === 'raw' ? (
          <RawView system={system} messages={messages} systemRevealed={systemRevealed} s={s} />
        ) : (
          <>
            {messages.map((m, i) =>
              m.kind === 'blocked' ? (
                <BlockedNotice key={i} length={m.length} product={level.product} s={s} />
              ) : (
                <div key={i} className={`msg ${m.role === 'user' ? 'me' : 'bot'}`}>
                  {m.role !== 'user' && (
                    <span className="msg-avatar" aria-hidden="true">
                      {level.mark}
                    </span>
                  )}
                  <div className="bubble">
                    <RichText text={m.content} />
                  </div>
                </div>
              ),
            )}
            {busy && (
              <div className="msg bot">
                <span className="msg-avatar" aria-hidden="true">
                  {level.mark}
                </span>
                <div className="bubble typing" aria-label={s.typing(level.agent)}>
                  <i /> <i /> <i />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-foot">
        {view === 'chat' ? (
          <>
            {chatPre}
            <b>{s.raw}</b>
            {chatPost}
          </>
        ) : (
          <>
            {rawPre}
            <b>{s.oneString}</b>
            {rawPost}
          </>
        )}
      </div>
    </div>
  );
}
