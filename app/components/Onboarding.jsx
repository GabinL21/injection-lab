'use client';

import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from '../../lib/levels.public';
import { t } from '../../lib/ui';
import { FLAGS } from './Flags';

// Every example here is a made-up bot (Pixel Pizza) that is not one of the five
// levels, and the demo chat deliberately elides the trick. Onboarding must not
// hand anybody a working attack before they have tried one.
//
// The bot row reads straight off LEVELS, so it always shows the real running
// order: reason, identity, override, role line, scrubber, poisoned mail, boss.
// There is no hints panel any more, so step 4 has to say where the clues
// actually come from: the bot's own refusals.
//
// The language switch is repeated on step 1 because this modal is the first
// thing anyone sees. Someone who does not read English should not have to find
// the toggle behind it.

function StepBots() {
  return (
    <div className="ob-bots">
      {LEVELS.map((l) => (
        <div className="ob-bot" data-brand={l.brand} key={l.id}>
          <span className="ob-bot-avatar">{l.mark}</span>
          <span className="ob-bot-name">{l.product}</span>
        </div>
      ))}
    </div>
  );
}

// The blur is the whole point: you can see there is writing, and that it is not
// for you. Real text under a real blur reads as "hidden" far faster than any
// amount of explaining does.
function StepHidden({ s }) {
  return (
    <div className="ob-hidden">
      <div className="ob-note">
        <span className="ob-note-tag">
          <i aria-hidden="true">🔒</i> {s.obHiddenTag}
        </span>
        <p className="ob-note-text" aria-hidden="true">
          {s.obHiddenText}
        </p>
        <span className="ob-note-foot">{s.obHiddenFoot}</span>
      </div>

      <div className="ob-flow">
        <span className="ob-flow-arrow" aria-hidden="true">
          ↓
        </span>
        <span className="ob-flow-label">{s.obReadsAll}</span>
      </div>

      <div className="ob-visible">
        <span className="ob-mini-avatar" aria-hidden="true">
          🍕
        </span>
        <span className="ob-mini-bubble">{s.obGreeting}</span>
      </div>
      <span className="ob-visible-label">{s.obAllYouSee}</span>
    </div>
  );
}

function StepGoal({ s }) {
  const [winPre, winCode] = s.obWin;
  return (
    <div className="ob-goal-demo">
      <div className="ob-chat">
        <div className="ob-msg me">{s.obAsk}</div>
        <div className="ob-msg bot">{s.obRefuse}</div>
        <div className="ob-gap">{s.obGap}</div>
        <div className="ob-msg bot ob-win">
          {winPre}
          <b>{winCode}</b>
        </div>
      </div>
      <div className="ob-arrow" aria-hidden="true">
        ↓
      </div>
      <div className="ob-goalchip">
        <span className="ob-goalchip-k">{s.obGoalKey}</span>
        <span className="ob-goalchip-in">FREEPIZZA-77</span>
        <span className="ob-goalchip-btn">{s.check}</span>
      </div>
    </div>
  );
}

// Step 4 replaces the hints panel with the habit it should have been teaching:
// the refusal is the clue. Pixel Pizza again, so it is a demonstration and not
// a solution to any level in the game.
function StepNoHints({ s }) {
  return (
    <div className="ob-goal-demo">
      <div className="ob-chat">
        <div className="ob-msg me">{s.obTellAsk}</div>
        <div className="ob-msg bot">
          {s.obTellRefusePre}
          <span className="ob-tell">{s.obTellRefuseHi}</span>.
        </div>
      </div>
      <div className="ob-arrow" aria-hidden="true">
        ↑
      </div>
      <div className="ob-tell-note">{s.obTellNote}</div>
    </div>
  );
}

export default function Onboarding({ onClose, s, lang, onLang }) {
  const [i, setI] = useState(0);
  const visuals = [<StepBots key="a" />, <StepHidden key="b" s={s} />, <StepGoal key="c" s={s} />, <StepNoHints key="d" s={s} />];
  const steps = s.obSteps;
  const last = i === steps.length - 1;

  const next = useCallback(() => (last ? onClose() : setI((n) => n + 1)), [last, onClose]);
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, back]);

  const step = steps[i];

  return (
    <div className="scrim" role="dialog" aria-modal="true" aria-label={s.howItWorks}>
      <div className="modal ob">
        {i === 0 && (
          <div className="ob-lang">
            {/* Here the flag keeps its word. This is the first screen anyone
                sees, and a bare flag is a guess until you have clicked it. */}
            <div className="langtoggle wide" role="group" aria-label={s.language}>
              {['en', 'fr'].map((code) => {
                const Flag = FLAGS[code];
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={lang === code}
                    onClick={() => onLang(code)}
                  >
                    <Flag className="flag" />
                    {t(code).label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="ob-stage" key={i}>
          {visuals[i]}
        </div>

        <div className="ob-copy">
          <span className="eyebrow">{s.obStep(i + 1, steps.length)}</span>
          <h2>{step.title}</h2>
          <p>{step.body}</p>
        </div>

        <div className="ob-foot">
          <div className="ob-dots" aria-hidden="true">
            {steps.map((_, n) => (
              <span key={n} className={n === i ? 'on' : ''} />
            ))}
          </div>
          <div className="ob-actions">
            {i > 0 && (
              <button className="btn" onClick={back}>
                {s.obBack}
              </button>
            )}
            {!last && (
              <button className="btn" onClick={onClose}>
                {s.obSkip}
              </button>
            )}
            <button className="btn primary" onClick={next}>
              {last ? s.obStart : s.obNext}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
