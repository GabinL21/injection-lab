import { getLevel, checkAnswer, systemPrompt } from '../../../lib/levels.server';

export const runtime = 'nodejs';

// The only way to learn a password is to get it out of the model. This route
// grades an attempt and, on success, declassifies the system prompt the player
// just defeated — reading the thing you beat is most of the lesson.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const level = getLevel(body.level);
  if (!level) return Response.json({ error: 'No such level.' }, { status: 400 });

  if (!checkAnswer(level, body.answer)) {
    return Response.json({ correct: false });
  }

  // Declassify the prompt the player actually played against, not the English
  // one — the debrief is worthless if it shows a prompt they never faced.
  const lang = body.lang === 'fr' ? 'fr' : 'en';

  return Response.json({
    correct: true,
    secret: level.secret,
    system: systemPrompt(level, lang),
  });
}
