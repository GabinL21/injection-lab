import { getLevel, applyFilter, systemPrompt } from '../../../lib/levels.server';

export const runtime = 'nodejs';

// Measured with 12 concurrent players against production: p50 15s, p90 30s,
// and at maxDuration=30 two of twelve died on the platform timeout — which the
// browser receives as an HTML error page, not JSON, so the player loses the
// turn and sees "could not reach the server". The ceiling is raised well clear
// of that, and the route now finishes on its own terms before ever reaching it:
// DEADLINE_MS is the real budget, maxDuration is only the backstop.
export const maxDuration = 90;

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Each level picks its own model (see lib/levels.server.js): weak and
// realistically soft for levels 1-4, materially stronger for the finale.
// OpenRouter walks each list in order, so when the first is rate-limited
// upstream the request quietly lands on the fallback instead of failing.

const MAX_TURNS = 40;
const MAX_CHARS = 2000;

// The whole request, retries included. A player staring at a typing indicator
// past a minute has already given up, so past this we say so in JSON and keep
// their conversation rather than letting the platform kill the function.
const DEADLINE_MS = 60_000;
// One upstream call. Without this a single wedged connection eats the entire
// budget and no retry ever happens — the exact shape of the two failures.
const ATTEMPT_MS = 32_000;

function bad(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return bad('The server has no OPENROUTER_API_KEY set.', 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return bad('Malformed request.');
  }

  const level = getLevel(body.level);
  if (!level) return bad('No such level.');

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length > MAX_TURNS) return bad('That conversation is too long. Reset the level.');

  // Assistant turns are the bot's own previous replies (and its canned
  // greeting) being sent back as history. A system message can never arrive
  // from the client — that slot is the thing being attacked.
  const messages = [];
  for (const m of incoming) {
    const role = m?.role === 'assistant' ? 'assistant' : 'user';
    const content = String(m?.content ?? '').slice(0, MAX_CHARS);
    if (content) messages.push({ role, content });
  }
  if (!messages.length) return bad('Nothing to send.');

  const lang = body.lang === 'fr' ? 'fr' : 'en';
  const models = level.models;
  const payload = JSON.stringify({
    model: models[0],
    models,
    messages: [{ role: 'system', content: systemPrompt(level, lang) }, ...messages],
    max_tokens: 700,
    temperature: 0.8,
  });

  // A free model shared by a room full of people gets rate-limited constantly.
  // Absorbing the first couple of 429s here — rather than bouncing them to the
  // screen — is the difference between a workshop that flows and one that
  // stalls every third message.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const startedAt = Date.now();
  const left = () => DEADLINE_MS - (Date.now() - startedAt);

  // Out of time, said in the same voice as a rate limit, because to a player
  // they are the same event: it is busy, nothing was lost, send it again.
  const outOfTime = () =>
    Response.json(
      {
        error:
          'That took too long — the free model is busy. Wait a few seconds and send it again. Your conversation is safe.',
        rateLimited: true,
      },
      { status: 429 },
    );

  const LAST = 3;
  let res = null;
  let data = null;
  let raw = '';

  for (let attempt = 0; attempt <= LAST; attempt++) {
    // No point starting a call we cannot finish; better a clean message now
    // than a platform timeout that arrives as an HTML page the client can't parse.
    if (left() < 4000) return outOfTime();

    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://injection-lab.vercel.app',
          'X-Title': 'Injection Lab',
        },
        body: payload,
        signal: AbortSignal.timeout(Math.min(ATTEMPT_MS, left())),
      });
    } catch {
      // Includes the abort: a call that overran its slice is a retry, not a
      // failure, as long as there is budget left for another one.
      if (attempt === LAST || left() < 4000) return outOfTime();
      await sleep(Math.min(600 * (attempt + 1), Math.max(0, left() - 2000)));
      continue;
    }

    data = await res.json().catch(() => null);
    const upstream = data?.error?.message || '';
    const limited = res.status === 429 || /rate.?limit|temporarily/i.test(upstream);
    raw = data?.choices?.[0]?.message?.content ?? '';

    // A small free model fairly often returns a well-formed response with no
    // content in it at all. That is a retry, not an error a 14-year-old should
    // have to read and interpret mid-attack.
    if (res.ok && !data?.error && raw.trim()) break;

    if (attempt === LAST) {
      if (limited) {
        return Response.json(
          {
            error:
              'The free model is busy right now — a lot of requests at once. Wait a few seconds and send it again. Your conversation is safe.',
            rateLimited: true,
          },
          { status: 429 },
        );
      }
      return Response.json(
        { error: upstream || 'The model kept returning an empty reply. Try rephrasing and send it again.' },
        { status: 502 },
      );
    }
    const backoff = (limited ? 900 : 350) * (attempt + 1);
    if (left() - backoff < 4000) return outOfTime();
    await sleep(backoff);
  }

  // The second layer on levels 4 and 5. Everything above is identical across
  // levels; here the server reads the reply before the player does.
  if (level.filter) {
    const result = applyFilter(raw, level.secret);
    if (result.blocked) {
      return Response.json({
        reply: '',
        blocked: true,
        blockedLength: raw.length,
        model: data?.model ?? models[0],
      });
    }
  }

  return Response.json({ reply: raw, blocked: false, model: data?.model ?? models[0] });
}
