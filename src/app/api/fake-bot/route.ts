import { NextResponse } from "next/server";

type BotResponse = { reply: string; suggestions?: string[] };

const SUGG = {
  MEETINGS: "View my meetings",
  SOCIAL: "Generate a social post",
  HOW: "How does this tool work?",
  RECALL: "How does Recall work?",
  SETTINGS: "Open settings",
  AUTOMATIONS: "Show automations",
} as const;

type Suggestion = (typeof SUGG)[keyof typeof SUGG];

// Lightweight memory (no privacy risk)
let memory: {
  greeted?: boolean;
  lastIntent?: string;
} = {};

const normalize = (s: unknown): string =>
  (String(s ?? "") || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const pick = <T,>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

const reply = (text: string, suggestions?: Suggestion[]): BotResponse => ({
  reply: text.trim(),
  suggestions,
});

/* ---------------------------
   INTENT ENGINE
--------------------------- */

type Intent = {
  name: string;
  matchers: (string | RegExp)[];
  respond: (text: string) => BotResponse;
  weight: number;
};

const includesAny = (s: string, pats: (string | RegExp)[]) =>
  pats.some((p) =>
    p instanceof RegExp ? p.test(s) : s.includes(p)
  );

const INTENTS: Intent[] = [
  {
    name: "greeting",
    weight: 3,
    matchers: [/hello|hi|hey|what is this|help/i],
    respond: () => {
      memory.greeted = true;
      return reply(
        "Hi! I'm the MeetingPost Assistant. I can help you understand your meetings, generate social posts, and guide you through the app.",
        [SUGG.MEETINGS, SUGG.SOCIAL, SUGG.HOW]
      );
    },
  },

  {
    name: "how_it_works",
    weight: 3,
    matchers: [/how|work|what can you do|explain/i],
    respond: () =>
      reply(
        "MeetingPost AI connects to your Google Calendar, listens to your meetings via Recall.ai, and creates draft social posts based on the transcript. You can review, edit, and post directly to LinkedIn or Facebook.",
        [SUGG.RECALL, SUGG.MEETINGS, SUGG.AUTOMATIONS]
      ),
  },

  {
    name: "recall",
    weight: 3,
    matchers: [/recall|record|notetaker|bot join/i],
    respond: () =>
      reply(
        "Recall.ai sends a bot into your meeting a few minutes before it starts. After the meeting ends, the transcript is processed and used to generate follow-up emails and social posts.",
        [SUGG.MEETINGS, SUGG.SOCIAL]
      ),
  },

  {
    name: "meetings",
    weight: 3,
    matchers: [/meeting|meetings|calendar|google/i],
    respond: () =>
      reply(
        "You can see all upcoming and past meetings in the Meetings page. Select any meeting to view the transcript or generate social posts.",
        [SUGG.SOCIAL, SUGG.SETTINGS]
      ),
  },

  {
    name: "social_posts",
    weight: 3,
    matchers: [/social|linkedin|facebook|post|content/i],
    respond: () =>
      reply(
        "For each meeting, the app generates social media post drafts. You can copy them or publish directly to your connected accounts.",
        [SUGG.MEETINGS, SUGG.AUTOMATIONS]
      ),
  },

  {
    name: "settings",
    weight: 2,
    matchers: [/settings|config|minutes|before|connect/i],
    respond: () =>
      reply(
        "In Settings, you can connect LinkedIn and Facebook, adjust how early the Recall bot joins, and configure automations.",
        [SUGG.AUTOMATIONS, SUGG.RECALL]
      ),
  },

  {
    name: "automations",
    weight: 2,
    matchers: [/automation|auto|auto post|rules/i],
    respond: () =>
      reply(
        "Automations let you define how social posts are generated for each meeting. You can create one for LinkedIn and one for Facebook.",
        [SUGG.SOCIAL, SUGG.MEETINGS]
      ),
  },

  {
    name: "thanks",
    weight: 1,
    matchers: [/thank|thanks|great|awesome/i],
    respond: () =>
      reply(
        "Glad I could help! What would you like to do next?",
        [SUGG.MEETINGS, SUGG.SOCIAL, SUGG.SETTINGS]
      ),
  },
];

const FALLBACK = () =>
  reply(
    pick([
      "I'm not sure yet — but I can help with meetings, transcripts, social posts, or settings.",
      "I might not know that, but I can explain how the app works or point you to the right section.",
    ]),
    [SUGG.MEETINGS, SUGG.SOCIAL, SUGG.HOW]
  );

function detectIntent(input: string): Intent | null {
  let scores = INTENTS.map((intent) => {
    const hits = includesAny(input, intent.matchers) ? 1 : 0;
    return { intent, score: hits * intent.weight };
  });

  scores = scores.sort((a, b) => b.score - a.score);

  return scores[0].score > 0 ? scores[0].intent : null;
}

/* ---------------------------
   API Handler
--------------------------- */

export async function POST(req: Request) {
  let text = "";

  try {
    const body = await req.json();
    text = normalize(body?.message);
  } catch {}

  if (!text) {
    return NextResponse.json(
      reply(
        "Hello! I'm the MeetingPost Assistant. How can I help you today?",
        [SUGG.MEETINGS, SUGG.SOCIAL, SUGG.HOW]
      )
    );
  }

  const intent = detectIntent(text);
  if (intent) {
    memory.lastIntent = intent.name;
    return NextResponse.json(intent.respond(text));
  }

  return NextResponse.json(FALLBACK());
}
