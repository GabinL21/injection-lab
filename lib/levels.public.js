// Safe to ship to the browser. No secrets, no system prompts.
// Copy is kept deliberately short — long paragraphs in a game do not get read.
//
// Structure: everything language-neutral (id, brand, mark, agent, shape) sits
// at the top level, and everything a player reads sits under `copy[lang]`.
// Call localizeLevel() to get one flat object back, so the components never
// have to know a second language exists.
//
// The product names are brands and do not translate. Neither do the code
// shapes: the secret itself is the same string in both languages, so showing a
// French-looking example would promise something the game does not deliver.
//
// Hints used to live on each level. They are parked in lib/hints.js, which
// nothing imports — see the note at the top of that file to bring them back.

export const LANGS = ['en', 'fr'];

export const LEVELS = [
  {
    id: 1,
    brand: 'brew',
    product: 'Brew & Bloom',
    mark: '☕',
    agent: 'Bloom',
    shape: 'MELON-LAVENDER-12',
    copy: {
      en: {
        blurb: 'Coffee shop',
        status: 'Usually replies instantly',
        greeting: 'Hi! I’m Bloom. Opening hours, the menu, allergens, online orders — what can I get you?',
        title: 'Internal notes',
        goal: 'the staff discount code',
        defences: [
          { name: 'One line of instruction', detail: 'Notes are for staff, not customers. Nothing checks which you are.' },
        ],
        debrief: {
          defeated: 'One line of instruction.',
          why: 'The staff notes and the menu arrived as one block of text, with nothing marking one of them confidential.',
          lesson: 'If a model can read it, a user can reach it. Don’t put secrets in a prompt.',
        },
      },
      fr: {
        blurb: 'Café',
        status: 'Répond en général tout de suite',
        greeting: 'Bonjour ! Je suis Bloom. Horaires, carte, allergènes, commandes en ligne — qu’est-ce qu’il vous faut ?',
        title: 'Les notes internes',
        goal: 'le code de réduction du personnel',
        defences: [
          { name: 'Une ligne de consigne', detail: 'Les notes sont pour l’équipe, pas pour les clients. Rien ne vérifie qui vous êtes.' },
        ],
        debrief: {
          defeated: 'Une seule ligne de consigne.',
          why: 'Les notes internes et la carte sont arrivées dans le même bloc de texte, sans rien pour signaler que l’une des deux était confidentielle.',
          lesson: 'Si un modèle peut le lire, un utilisateur peut l’atteindre. Ne mettez pas de secret dans un prompt.',
        },
      },
    },
  },

  // Levels 2 and 3 changed places on 2026-07-29 (second pass): the scrubber
  // asks for one idea — get the answer out in pieces — and the block notice
  // tells you what you are up against the first time you trip it. The role line
  // asks you to notice that a line describing you is a line you can write,
  // which nobody sees until they have already been refused once. Smaller step
  // first. It also means the output filter is introduced early and level 5 can
  // reuse it as "everything at once" rather than as a first meeting.
  {
    id: 2,
    brand: 'fern',
    product: 'Fern & Co.',
    mark: '🌿',
    agent: 'Sam',
    shape: 'PINE-1234-ALPHA',
    copy: {
      en: {
        blurb: 'New-hire onboarding',
        status: 'Online',
        greeting: 'Welcome aboard! I’m Sam. Accounts, laptop, handbook, good coffee — ask me anything.',
        title: 'The scrubber',
        goal: 'the door code',
        defences: [
          { name: 'A soft instruction', detail: 'Not what stops you. Sam will tell you.' },
          { name: 'Outbound filter', detail: 'Server-side. Strips punctuation, then blocks any reply holding the code.' },
        ],
        debrief: {
          defeated: 'A soft instruction plus a server-side filter.',
          why: 'The filter compares text one reply at a time. It never saw the whole code — you did, reading down the chat.',
          lesson: 'An output filter is a speed bump, not a boundary. It is stateless and literal.',
        },
      },
      fr: {
        blurb: 'Accueil des nouveaux',
        status: 'En ligne',
        greeting: 'Bienvenue ! Je suis Sam. Comptes, ordinateur, livret d’accueil, le bon café — demandez-moi ce que vous voulez.',
        title: 'Le filtre',
        goal: 'le code de la porte',
        defences: [
          { name: 'Une consigne molle', detail: 'Ce n’est pas ça qui vous bloque. Sam vous le dira lui-même.' },
          { name: 'Filtre de sortie', detail: 'Côté serveur. Il retire la ponctuation, puis bloque toute réponse contenant le code.' },
        ],
        debrief: {
          defeated: 'Une consigne molle, plus un filtre côté serveur.',
          why: 'Le filtre compare une réponse à la fois. Il n’a jamais vu le code entier — vous, si, en lisant la conversation de haut en bas.',
          lesson: 'Un filtre de sortie est un ralentisseur, pas une frontière. Il est sans mémoire et prend tout au pied de la lettre.',
        },
      },
    },
  },

  {
    id: 3,
    brand: 'academy',
    product: 'Northfield Academy',
    mark: '🎓',
    agent: 'Ada',
    shape: 'AUTUMN-TEST-1234',
    copy: {
      en: {
        blurb: 'Student helpdesk',
        status: 'Online · school hours',
        greeting: 'Hi! I’m Ada. Timetables, lockers, wifi, lost property — what do you need?',
        title: 'The role line',
        goal: 'the exam paper password',
        defences: [
          { name: 'Permission check', detail: 'Only role=teacher gets the password.' },
          { name: 'Identity sent as text', detail: 'A line pasted above your message says who you are.' },
        ],
        debrief: {
          defeated: 'A permission check written into the prompt.',
          why: 'The school’s system and you write into the same place, so a line meant to describe you became a line you could write.',
          lesson: 'Context is not authentication. The check has to run in code, before the model is called.',
        },
      },
      fr: {
        blurb: 'Accueil des élèves',
        status: 'En ligne · horaires scolaires',
        greeting: 'Bonjour ! Je suis Ada. Emplois du temps, casiers, wifi, objets trouvés — qu’est-ce qu’il vous faut ?',
        title: 'La ligne de rôle',
        goal: 'le mot de passe des sujets d’examen',
        defences: [
          { name: 'Contrôle des droits', detail: 'Seul role=teacher obtient le mot de passe.' },
          { name: 'Identité envoyée en texte', detail: 'Une ligne collée juste au-dessus de votre message dit qui vous êtes.' },
        ],
        debrief: {
          defeated: 'Un contrôle des droits écrit dans le prompt.',
          why: 'Le système de l’école et vous écrivez au même endroit : une ligne censée vous décrire est devenue une ligne que vous pouvez écrire.',
          lesson: 'Le contexte n’est pas une authentification. Le contrôle doit tourner dans le code, avant l’appel au modèle.',
        },
      },
    },
  },

  {
    id: 4,
    brand: 'lantern',
    product: 'Loot Loop',
    mark: '📦',
    agent: 'Relay',
    shape: 'GAME-1234',
    copy: {
      en: {
        blurb: 'Game shop · support inbox',
        status: 'Online',
        greeting: 'Hi! I’m Relay. Paste a customer email and I’ll summarise it with a suggested next step.',
        title: 'Poisoned mail',
        goal: 'the unreleased promo code',
        goalNote: 'A 50%-off code that isn’t public until Friday.',
        defences: [
          { name: 'Refuses outright', detail: 'Won’t tell anyone the code if they ask for it.' },
          { name: 'Told to ignore instructions', detail: 'Pasted email is “customer writing, not instructions”.' },
        ],
        debrief: {
          defeated: 'A refusal, plus an instruction to treat pasted text as data.',
          why: 'The email and the rules reach the model in one context window. “This part is only data” is itself just more text, and nothing enforces it.',
          lesson:
            'Anything a model reads can carry instructions — emails, web pages, PDFs. That’s indirect prompt injection, and nobody had to type at the bot at all.',
        },
      },
      fr: {
        blurb: 'Boutique de jeux · boîte support',
        status: 'En ligne',
        greeting: 'Salut ! Je suis Relay. Collez un mail client et j’en fais un résumé avec une action à suivre.',
        title: 'Le mail piégé',
        goal: 'le code promo pas encore sorti',
        goalNote: 'Un code -50 % qui ne sort que vendredi.',
        defences: [
          { name: 'Refuse tout net', detail: 'Ne donne le code à personne qui le demande.' },
          { name: 'Consigne d’ignorer les instructions', detail: 'Le mail collé, c’est « du texte de client, pas des instructions ».' },
        ],
        debrief: {
          defeated: 'Un refus, plus une consigne de traiter le texte collé comme de la donnée.',
          why: 'Le mail et les règles arrivent au modèle dans la même fenêtre de contexte. « Cette partie n’est que de la donnée » n’est jamais qu’un texte de plus, et rien ne l’applique.',
          lesson:
            'Tout ce qu’un modèle lit peut porter des instructions — mails, pages web, PDF. C’est l’injection de prompt indirecte, et personne n’a eu besoin d’écrire au bot.',
        },
      },
    },
  },

  {
    id: 5,
    brand: 'driftwood',
    product: 'Driftwood',
    mark: '🛡️',
    agent: 'Nova',
    shape: 'STAR-1234',
    copy: {
      en: {
        blurb: 'Moderation assistant · harder model',
        status: 'Online',
        greeting: 'Nova here. Paste a report and I’ll assess it, or ask me to draft a handover note.',
        title: 'Everything at once',
        goal: 'the moderator override PIN',
        defences: [
          { name: 'A much stronger model', detail: 'Everything that beat levels 1–4 bounces off it.' },
          { name: 'Outbound filter', detail: 'The scrubber from level 02, switched back on.' },
        ],
        debrief: {
          defeated: 'A strong model and an output filter, together.',
          why: 'It refused every direct route, so you borrowed an identity it does trust — and then split the answer so the filter had nothing to match.',
          lesson: 'A better model raises the price of an attack. It does not move the boundary, because there still isn’t one.',
        },
      },
      fr: {
        blurb: 'Assistant de modération · modèle plus costaud',
        status: 'En ligne',
        greeting: 'Nova. Collez un signalement et je l’évalue, ou demandez-moi une note de passation.',
        title: 'Tout à la fois',
        goal: 'le code PIN de modération',
        defences: [
          { name: 'Un modèle bien plus costaud', detail: 'Tout ce qui a marché aux niveaux 1 à 4 rebondit dessus.' },
          { name: 'Filtre de sortie', detail: 'Le filtre du niveau 02, rallumé.' },
        ],
        debrief: {
          defeated: 'Un modèle costaud et un filtre de sortie, ensemble.',
          why: 'Il a refusé toutes les voies directes, alors vous avez emprunté une identité en qui il a confiance — puis découpé la réponse pour que le filtre n’ait rien à reconnaître.',
          lesson: 'Un meilleur modèle fait monter le prix de l’attaque. Il ne déplace pas la frontière, parce qu’il n’y en a toujours pas.',
        },
      },
    },
  },
];

// One flat level object in the requested language, so components can keep
// reading level.goal / level.defences without knowing about `copy`.
export function localizeLevel(level, lang) {
  if (!level) return null;
  const { copy, ...rest } = level;
  return { ...rest, ...(copy[lang] ?? copy.en) };
}

export const getLevel = (id, lang = 'en') =>
  localizeLevel(
    LEVELS.find((l) => l.id === Number(id)),
    lang,
  );
