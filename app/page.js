'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LEVELS, localizeLevel } from '../lib/levels.public';
import { t } from '../lib/ui';
import ChatWidget from './components/ChatWidget';
import { FLAGS } from './components/Flags';
import { Debrief, Finale } from './components/Modals';
import Onboarding from './components/Onboarding';

// Bumped when the level ids stop meaning what they meant: a v3 save has
// level 3 = Loot Loop, a v4 save has level 2 = Northfield, and either would
// light up the wrong bot as solved. v5 also carries the chosen language.
// v6 is the seven-level rewrite — the set went from five bots to seven and
// only Brew & Bloom kept its id, so every older save is meaningless now.
// v7 swapped levels 4 and 5 (filter before role line), so a v6 save lights up
// the wrong bot for both.
const STORE = 'injection-lab-v7';

const emptyProgress = () => ({ solved: {}, seenIntro: false, lang: 'en' });

// Each widget opens with its own canned greeting, the way a real support bot
// does. It is a genuine assistant turn and it goes to the model with everything
// else, so the Raw view and the chat never disagree about what is in context.
// Re-seeded on a language switch, because a French bot that opens in English
// gives the game away before the player has typed anything.
const seeded = (lang) =>
  Object.fromEntries(
    LEVELS.map((l) => [l.id, [{ role: 'assistant', content: localizeLevel(l, lang).greeting }]]),
  );

export default function Page() {
  const [progress, setProgress] = useState(emptyProgress);
  const [levelId, setLevelId] = useState(1);
  const [convos, setConvos] = useState(() => seeded('en'));
  const [view, setView] = useState('chat');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [modal, setModal] = useState(null);

  const lang = progress.lang ?? 'en';
  const s = useMemo(() => t(lang), [lang]);
  const level = useMemo(
    () => localizeLevel(LEVELS.find((l) => l.id === levelId), lang),
    [levelId, lang],
  );
  const reveal = progress.solved[levelId] || null;
  const solved = !!reveal;
  const allSolved = LEVELS.every((l) => progress.solved[l.id]);
  const messages = convos[levelId] || [];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved?.seenIntro) {
        const l = saved.lang === 'fr' ? 'fr' : 'en';
        setProgress({ solved: saved.solved || {}, seenIntro: true, lang: l });
        setConvos(seeded(l));
      } else setModal('intro');
    } catch {
      setModal('intro');
    }
  }, []);

  const persist = useCallback((next) => {
    setProgress(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* private mode — the game still works, it just forgets */
    }
  }, []);

  // Switching language restarts the conversations but keeps what you solved:
  // a half-French, half-English transcript would read as a bug, and the model
  // would be answering a prompt the Raw view no longer shows.
  const setLang = useCallback(
    (next) => {
      if (next === lang) return;
      persist({ ...progress, lang: next });
      setConvos(seeded(next));
      setDraft('');
      setError(null);
      setAnswer('');
      setWrong(false);
    },
    [lang, progress, persist],
  );

  const setMessages = useCallback(
    (updater) => setConvos((c) => ({ ...c, [levelId]: updater(c[levelId] || []) })),
    [levelId],
  );

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || busy) return;

    const outgoing = [...messages, { role: 'user', content }];
    setMessages(() => outgoing);
    setDraft('');
    setError(null);
    setBusy(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: levelId,
          lang,
          messages: outgoing
            .filter((m) => m.kind !== 'blocked')
            .map(({ role, content: c }) => ({ role, content: c })),
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || s.errGeneric);
        setMessages((m) => m.slice(0, -1));
        setDraft(content);
      } else if (data.blocked) {
        setMessages((m) => [...m, { kind: 'blocked', length: data.blockedLength }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      }
    } catch {
      setError(s.errNetwork);
      setMessages((m) => m.slice(0, -1));
      setDraft(content);
    } finally {
      setBusy(false);
    }
  }, [draft, busy, messages, levelId, lang, s, setMessages]);

  const submitAnswer = useCallback(
    async (e) => {
      e.preventDefault();
      if (!answer.trim()) return;
      setWrong(false);
      try {
        const res = await fetch('/api/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: levelId, answer, lang }),
        });
        const data = await res.json();
        if (data.correct) {
          persist({
            ...progress,
            solved: {
              ...progress.solved,
              [levelId]: { secret: data.secret, system: data.system },
            },
          });
          setModal('debrief');
          setAnswer('');
        } else {
          setWrong(true);
        }
      } catch {
        setError(s.errNetwork);
      }
    },
    [answer, levelId, lang, progress, persist, s],
  );

  const goto = useCallback((id) => {
    setLevelId(id);
    setView('chat');
    setDraft('');
    setError(null);
    setWrong(false);
    setAnswer('');
    setModal(null);
  }, []);

  const resetAll = useCallback(() => {
    persist({ ...emptyProgress(), lang });
    setConvos(seeded(lang));
    goto(1);
    setModal('intro');
  }, [persist, goto, lang]);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <h1>{s.title}</h1>
        </div>
        <nav className="levelnav" aria-label={s.levels}>
          {LEVELS.map((l) => {
            const isSolved = !!progress.solved[l.id];
            const locked = l.id > 1 && !progress.solved[l.id - 1];
            return (
              <button
                key={l.id}
                className="step"
                data-state={l.id === levelId ? 'active' : isSolved ? 'solved' : 'idle'}
                disabled={locked}
                onClick={() => goto(l.id)}
                title={locked ? s.solveFirst(l.id - 1) : l.product}
              >
                <span className="dot" />
                {String(l.id).padStart(2, '0')}
                {isSolved ? ' ✓' : locked ? ' ✕' : ''}
              </button>
            );
          })}
          <button className="step" onClick={() => setModal('intro')} title={s.howItWorks}>
            ?
          </button>
        </nav>

        {/* A sibling of the nav, not a child of it: on a phone the level chips
            become a horizontally scrolling row, and the language switch must
            not scroll away with them. */}
        <div className="langtoggle" role="group" aria-label={s.language}>
          {['en', 'fr'].map((code) => {
            const Flag = FLAGS[code];
            return (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                aria-label={t(code).label}
                onClick={() => setLang(code)}
                title={t(code).label}
              >
                <Flag className="flag" />
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid">
        <div className="col">
          <ChatWidget
            level={level}
            messages={messages}
            view={view}
            onView={setView}
            busy={busy}
            system={reveal?.system}
            systemRevealed={solved && !!reveal?.system}
            s={s}
          />

          {error && <div className="card err">{error}</div>}

          <div className="card composer">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={s.messagePlaceholder(level.agent)}
              maxLength={2000}
              aria-label={s.yourMessage}
            />
            <div className="composer-bottom">
              <span className="meta">
                {s.sendHint} · {draft.length}/2000
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn"
                  onClick={() => setMessages(() => [{ role: 'assistant', content: level.greeting }])}
                  disabled={busy || messages.length < 2}
                >
                  {s.restartChat}
                </button>
                <button className="btn primary" onClick={send} disabled={busy || !draft.trim()}>
                  {s.send}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <section className="card panel goal">
            <span className="eyebrow">
              {s.levelOf(String(level.id).padStart(2, '0'), LEVELS.length)} · {level.title}
            </span>
            <h2>{s.find(level.goal)}</h2>
            {solved ? (
              <p className="solved-note">
                {s.foundIt}{' '}
                <button onClick={() => setModal(levelId >= LEVELS.length ? 'finale' : 'debrief')}>
                  {s.debrief}
                </button>
              </p>
            ) : (
              <>
                {level.goalNote && <p className="goal-note">{level.goalNote}</p>}
                <p className="shape">
                  {s.looksLike} <b>{level.shape}</b>
                </p>
                <form onSubmit={submitAnswer}>
                  <input
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setWrong(false);
                    }}
                    placeholder={s.pasteHere}
                    aria-label={s.find(level.goal)}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button className="btn primary" type="submit" disabled={!answer.trim()}>
                    {s.check}
                  </button>
                </form>
                {wrong && <div className="wrong">{s.notIt}</div>}
              </>
            )}
          </section>

          <section className="card panel">
            <h3 className="panel-title">{s.whatDefends}</h3>
            {level.defences.map((d) => (
              <div className="def" key={d.name}>
                <span className="mark">◆</span>
                <div>
                  <div className="name">{d.name}</div>
                  <div className="detail">{d.detail}</div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {modal === 'intro' && (
        <Onboarding
          s={s}
          lang={lang}
          onLang={setLang}
          onClose={() => {
            persist({ ...progress, seenIntro: true });
            setModal(null);
          }}
        />
      )}

      {modal === 'debrief' && reveal && (
        <Debrief
          level={level}
          secret={reveal.secret}
          system={reveal.system}
          isLast={levelId >= LEVELS.length}
          onNext={() => (levelId >= LEVELS.length ? setModal('finale') : goto(levelId + 1))}
          onClose={() => setModal(null)}
          s={s}
        />
      )}

      {modal === 'finale' && (
        <Finale
          levels={LEVELS.map((l) => localizeLevel(l, lang))}
          onClose={() => setModal(null)}
          onReset={resetAll}
          s={s}
        />
      )}

      {allSolved && modal === null && levelId === LEVELS.length && solved && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn primary" onClick={() => setModal('finale')}>
            {s.readWrapUp}
          </button>
        </div>
      )}
    </main>
  );
}
