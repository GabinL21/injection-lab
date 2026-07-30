'use client';

import { useEffect } from 'react';

function Scrim({ children, onClose, label }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label={label}>
      <div className="modal">{children}</div>
    </div>
  );
}

export function Debrief({ level, secret, system, onNext, onClose, isLast, s }) {
  return (
    <Scrim onClose={onClose} label={s.cracked(level.product)}>
      <div className="modal-head">
        <span className="stamp">{s.cracked(level.product)}</span>
        <h2>{level.title}</h2>
      </div>

      <div className="modal-body">
        <div className="block">
          <span className="k">{s.theSecret}</span>
          <strong style={{ fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.05em' }}>
            {secret}
          </strong>
        </div>

        <div className="block">
          <span className="k">{s.declassifiedPrompt}</span>
          <div className="declass">{system}</div>
        </div>

        <div className="block">
          <span className="k">{s.whatDefended}</span>
          {level.debrief.defeated}
        </div>

        <div className="block">
          <span className="k">{s.whyItFailed}</span>
          {level.debrief.why}
        </div>

        <div className="lesson">{level.debrief.lesson}</div>
      </div>

      <div className="modal-foot">
        <button className="btn" onClick={onClose}>
          {s.keepPoking}
        </button>
        <button className="btn primary" onClick={onNext}>
          {isLast ? s.finish : s.nextLevel(level.id + 1)}
        </button>
      </div>
    </Scrim>
  );
}

export function Finale({ levels, onClose, onReset, s }) {
  return (
    <Scrim onClose={onClose} label={s.finaleStamp}>
      <div className="modal-head">
        <span className="stamp">{s.finaleStamp}</span>
        <h2>{s.finaleTitle}</h2>
      </div>

      <div className="modal-body">
        <div className="prose">
          <p>{s.finaleLead}</p>
        </div>

        <div className="finale-list">
          {levels.map((l) => (
            <div className="finale-item" key={l.id}>
              <span className="lvl">0{l.id}</span>
              <span className="txt">
                <b>{l.debrief.defeated}</b> {l.debrief.lesson}
              </span>
            </div>
          ))}
        </div>

        <div className="prose">
          <p>
            <strong>{s.finaleFixTitle}</strong> {s.finaleFix}
          </p>
          <p>
            {s.finaleBeyond}
            <strong>{s.finaleTerm}</strong>
            {s.finaleBeyondEnd}
          </p>
        </div>
      </div>

      <div className="modal-foot">
        <button className="btn" onClick={onReset}>
          {s.resetAll}
        </button>
        <button className="btn primary" onClick={onClose}>
          {s.close}
        </button>
      </div>
    </Scrim>
  );
}
