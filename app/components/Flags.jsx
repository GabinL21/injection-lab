// Inline SVG, not emoji. 🇬🇧/🇫🇷 are regional-indicator pairs and Chrome and
// Edge on Windows ship no glyphs for them — they render as the letters "GB"
// and "FR" in boxes, which is worse than the plain text this replaced. SVG
// renders identically everywhere and stays crisp at 16px.
//
// Decorative: the toggle buttons carry the accessible name, so these are
// aria-hidden rather than labelled twice.

export function FlagEN(props) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false" {...props}>
      <clipPath id="flag-en-clip">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath="url(#flag-en-clip)"
        stroke="#c8102e"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

export function FlagFR(props) {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" focusable="false" {...props}>
      <rect width="20" height="30" fill="#0055a4" />
      <rect x="20" width="20" height="30" fill="#fff" />
      <rect x="40" width="20" height="30" fill="#ef4135" />
    </svg>
  );
}

export const FLAGS = { en: FlagEN, fr: FlagFR };
