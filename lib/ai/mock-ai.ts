/**
 * MockAIService — a deterministic, rule-based "AI".
 *
 * It classifies prompts into app types, extracts names/colors, produces a
 * structured BuildPlan, builds Blueprints from templates, and interprets
 * chat instructions as blueprint mutations.
 *
 * TODO(LLM): To use a real model instead, implement `AIService` with API
 * calls (Anthropic / OpenAI / local). The prompts would ask the model to
 * emit the same structured JSON these methods return, so the rest of the
 * pipeline (codegen, preview, versioning) needs zero changes.
 */

import type {
  AppType,
  Blueprint,
  BuildPlan,
  Page,
  Section,
} from "@/types";
import { APP_TYPE_LABELS } from "@/types";
import { uid, sleep } from "@/lib/utils";
import { ACCENTS, buildBlueprint, getDefaultName } from "@/lib/templates/blueprints";
import type { AIService, ChangeResult } from "./service";

// ---------------------------------------------------------------------------
// Prompt classification
// ---------------------------------------------------------------------------

const TYPE_KEYWORDS: { type: AppType; words: string[] }[] = [
  { type: "crm", words: ["crm", "sales pipeline", "leads", "deals", "sales tracker", "customer relationship"] },
  { type: "booking", words: ["booking", "appointment", "schedule", "scheduling", "reservation", "calendar app", "salon", "barber", "clinic", "doctor"] },
  { type: "finance", words: ["finance", "budget", "expense", "spending", "money", "transactions", "personal finance", "savings"] },
  { type: "client-portal", words: ["client portal", "portal", "agency client", "client dashboard", "freelance client"] },
  { type: "todo", words: ["todo", "to-do", "task", "productivity", "habit", "checklist", "kanban"] },
  { type: "landing-page", words: ["landing", "marketing site", "marketing page", "homepage for", "waitlist", "launch page", "promo"] },
  { type: "saas-dashboard", words: ["dashboard", "analytics", "saas", "metrics", "admin panel", "stats"] },
];

export function classifyPrompt(prompt: string): AppType {
  const p = prompt.toLowerCase();
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.some((w) => p.includes(w))) return type;
  }
  // Sensible default: a SaaS dashboard shows off the most surface area.
  return "saas-dashboard";
}

function extractName(prompt: string, appType: AppType): string {
  // "called X", "named X", or a "Quoted Name"
  const quoted = prompt.match(/["“”']([A-Za-z0-9 ]{2,24})["“”']/);
  if (quoted) return quoted[1].trim();
  const called = prompt.match(/(?:called|named)\s+([A-Za-z0-9]{2,24})/i);
  if (called) return called[1].trim();
  return getDefaultName(appType);
}

function extractAccent(prompt: string): string | undefined {
  const p = prompt.toLowerCase();
  for (const name of Object.keys(ACCENTS)) {
    if (p.includes(name)) return name;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Plan generation
// ---------------------------------------------------------------------------

function makePlan(prompt: string): BuildPlan {
  const appType = classifyPrompt(prompt);
  const appName = extractName(prompt, appType);
  const bp = buildBlueprint(appType, { name: appName });

  return {
    summary: `I will build **${appName}**, a ${APP_TYPE_LABELS[appType].toLowerCase()} based on your idea. Here is the plan:`,
    appType,
    appName,
    stack: ["React 18", "TypeScript", "Vite", "Tailwind CSS"],
    pages: bp.pages.map((p) => p.name),
    steps: [
      { title: "Scaffold project", detail: "Vite + React + TypeScript with Tailwind configured" },
      { title: "Design system", detail: `Dark-first theme, ${bp.theme.accentName} accent, ${bp.theme.radius}px radius` },
      { title: "Build pages", detail: bp.pages.map((p) => p.name).join(", ") },
      { title: "Wire up data", detail: "Typed blueprint + realistic mock data" },
      { title: "Polish & preview", detail: "Responsive layout, interactions, live preview" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Change interpretation (chat iteration)
// ---------------------------------------------------------------------------

interface Rule {
  match: (msg: string) => boolean;
  apply: (bp: Blueprint, msg: string) => { message: string; changes: string[] };
}

function findOrCreatePage(bp: Blueprint, name: string, icon: string): Page {
  const existing = bp.pages.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  const page: Page = { id: uid("page"), name, icon, sections: [] };
  // keep Settings last if present
  const settingsIdx = bp.pages.findIndex((p) => p.name === "Settings");
  if (settingsIdx >= 0) bp.pages.splice(settingsIdx, 0, page);
  else bp.pages.push(page);
  return page;
}

const PRICING_SECTION: Section = {
  type: "pricing",
  title: "Simple, honest pricing",
  tiers: [
    { name: "Starter", price: "$0", period: "forever", features: ["Core features", "Community support", "1 user"] },
    { name: "Pro", price: "$19", period: "per user / month", features: ["Everything in Starter", "Priority support", "Advanced features", "Unlimited users"], highlight: true },
    { name: "Enterprise", price: "Custom", period: "annual billing", features: ["SSO & SAML", "Dedicated support", "99.99% SLA"] },
  ],
};

const RULES: Rule[] = [
  // ---- theme: dark / light -------------------------------------------------
  {
    match: (m) => /(darker|dark mode|dark theme|make it dark|night)/.test(m),
    apply: (bp) => {
      const already = bp.theme.mode === "dark";
      bp.theme.mode = "dark";
      if (already) bp.theme.premium = true; // "even darker" → richer dark
      return {
        message: already
          ? "It was already dark, so I pushed it further — deeper background tones with richer gradients and glass surfaces."
          : "Switched the whole app to a dark theme — backgrounds, surfaces, borders and text colors all updated.",
        changes: already
          ? ["Deepened dark palette", "Enabled premium gradients + glass surfaces"]
          : ["Theme mode: light → dark", "Recolored all surfaces and text"],
      };
    },
  },
  {
    match: (m) => /(lighter|light mode|light theme|make it light|bright)/.test(m),
    apply: (bp) => {
      bp.theme.mode = "light";
      return {
        message: "Switched to a clean light theme with soft shadows and crisp borders.",
        changes: ["Theme mode: dark → light", "Recolored all surfaces and text"],
      };
    },
  },

  // ---- premium -------------------------------------------------------------
  {
    match: (m) => /(premium|luxur|high.end|polish|fancy|elegant|expensive|sleek|sophisticat)/.test(m),
    apply: (bp) => {
      bp.theme.premium = true;
      bp.theme.radius = Math.max(bp.theme.radius, 14);
      return {
        message:
          "Gave it a premium feel: subtle glassmorphism on cards and navigation, ambient accent gradients, gradient headline text, softer corners and richer shadows.",
        changes: [
          "Enabled glassmorphism surfaces",
          "Added ambient accent gradients",
          "Gradient hero headline",
          `Radius increased to ${bp.theme.radius}px`,
        ],
      };
    },
  },

  // ---- accent colors ---------------------------------------------------------
  {
    match: (m) => Object.keys(ACCENTS).some((c) => m.includes(c)),
    apply: (bp, m) => {
      const color = Object.keys(ACCENTS).find((c) => m.includes(c))!;
      bp.theme.accent = ACCENTS[color];
      bp.theme.accentName = color;
      return {
        message: `Recolored the app with a ${color} accent — buttons, charts, highlights and active states all updated.`,
        changes: [`Accent color → ${color} (${ACCENTS[color]})`],
      };
    },
  },

  // ---- pricing ---------------------------------------------------------------
  {
    match: (m) => /pricing/.test(m),
    apply: (bp) => {
      if (bp.appType === "landing-page") {
        const home = bp.pages[0];
        if (!home.sections.some((s) => s.type === "pricing")) {
          const ctaIdx = home.sections.findIndex((s) => s.type === "cta");
          if (ctaIdx >= 0) home.sections.splice(ctaIdx, 0, PRICING_SECTION);
          else home.sections.push(PRICING_SECTION);
        }
        return {
          message: "Added a three-tier pricing section (Starter / Pro / Enterprise) with a highlighted Pro plan.",
          changes: ["New pricing section on Home", "3 tiers with feature lists"],
        };
      }
      const page = findOrCreatePage(bp, "Pricing", "target");
      if (!page.sections.some((s) => s.type === "pricing")) page.sections.push(PRICING_SECTION);
      return {
        message: "Added a new Pricing page with three tiers (Starter / Pro / Enterprise) and a highlighted Pro plan.",
        changes: ["New page: Pricing", "3 pricing tiers with feature lists"],
      };
    },
  },

  // ---- auth / login ----------------------------------------------------------
  {
    match: (m) => /(login|log in|sign in|signin|auth|account)/.test(m),
    apply: (bp) => {
      bp.features.auth = true;
      return {
        message:
          "Added authentication: a sign-in screen with email + password, and a Sign in entry point in the navigation. When you connect Supabase, this wires to real auth.",
        changes: ["New sign-in screen", "Sign in link in navigation", "Auth feature flag enabled"],
      };
    },
  },

  // ---- charts ----------------------------------------------------------------
  {
    match: (m) => /(chart|graph|analytics|visuali)/.test(m),
    apply: (bp) => {
      const target = bp.pages[0];
      const kinds: ("bar" | "line" | "area")[] = ["bar", "line", "area"];
      const existing = target.sections.filter((s) => s.type === "chart").length;
      const kind = kinds[existing % kinds.length];
      const section: Section = {
        type: "chart",
        title:
          existing === 0
            ? "Performance overview"
            : existing === 1
              ? "Weekly trend"
              : `Metric breakdown ${existing}`,
        kind,
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        series: [12, 19, 14, 23, 18, 27, 31].map((v) => v + existing * 3),
      };
      target.sections.splice(Math.min(1, target.sections.length), 0, section);
      return {
        message: `Added a new ${kind} chart ("${section.title}") to the ${target.name} page, rendered as a crisp inline SVG that follows your accent color.`,
        changes: [`New ${kind} chart on ${target.name}`, "7-day data series wired to mock data"],
      };
    },
  },

  // ---- responsive ------------------------------------------------------------
  {
    match: (m) => /(mobile|responsive|phone|tablet|small screen)/.test(m),
    apply: (bp) => {
      bp.features.responsive = true;
      return {
        message:
          "Tuned mobile responsiveness: the sidebar collapses into a hamburger drawer under 780px, grids reflow to single columns, the hero scales down, and touch targets got bigger.",
        changes: [
          "Collapsible sidebar drawer on mobile",
          "Single-column grid reflow",
          "Scaled typography for small screens",
        ],
      };
    },
  },

  // ---- testimonials ------------------------------------------------------------
  {
    match: (m) => /(testimonial|review|social proof)/.test(m),
    apply: (bp) => {
      const home = bp.pages[0];
      if (!home.sections.some((s) => s.type === "testimonials")) {
        home.sections.push({
          type: "testimonials",
          title: "What people are saying",
          items: [
            { quote: "This changed how our whole team works. Genuinely indispensable.", author: "Maya Chen", role: "VP Engineering" },
            { quote: "Beautiful, fast, and it just works. What more could you want?", author: "Dev Patel", role: "Founder" },
            { quote: "The best tool in its category by a wide margin.", author: "Sofia Reyes", role: "Design Lead" },
          ],
        });
      }
      return {
        message: `Added a testimonials section with three quotes to the ${home.name} page.`,
        changes: [`Testimonials section on ${home.name}`],
      };
    },
  },

  // ---- contact form ------------------------------------------------------------
  {
    match: (m) => /(contact|get in touch|enquiry|inquiry)/.test(m),
    apply: (bp) => {
      const page = findOrCreatePage(bp, "Contact", "message");
      if (!page.sections.some((s) => s.type === "form")) {
        page.sections.push({
          type: "form",
          title: "Get in touch",
          sub: "We usually reply within one business day.",
          fields: [
            { label: "Name", inputType: "text", placeholder: "Your name" },
            { label: "Email", inputType: "email", placeholder: "you@example.com" },
            { label: "Message", inputType: "text", placeholder: "How can we help?" },
          ],
          submitLabel: "Send message",
        });
      }
      return {
        message: "Added a Contact page with a styled contact form (name, email, message).",
        changes: ["New page: Contact", "Contact form with 3 fields"],
      };
    },
  },

  // ---- rounded / sharp ----------------------------------------------------------
  {
    match: (m) => /(rounder|rounded|round corners|softer)/.test(m),
    apply: (bp) => {
      bp.theme.radius = Math.min(bp.theme.radius + 6, 24);
      return {
        message: `Softened the corners — radius is now ${bp.theme.radius}px across cards, buttons and inputs.`,
        changes: [`Border radius → ${bp.theme.radius}px`],
      };
    },
  },
  {
    match: (m) => /(sharper|sharp corners|square|less rounded|boxy)/.test(m),
    apply: (bp) => {
      bp.theme.radius = Math.max(bp.theme.radius - 8, 0);
      return {
        message: `Sharpened the corners — radius is now ${bp.theme.radius}px for a crisper, more editorial look.`,
        changes: [`Border radius → ${bp.theme.radius}px`],
      };
    },
  },

  // ---- fonts ------------------------------------------------------------------
  {
    match: (m) => /(serif|editorial font)/.test(m),
    apply: (bp) => {
      bp.theme.font = "serif";
      return { message: "Switched typography to an elegant serif for an editorial feel.", changes: ["Font → serif"] };
    },
  },
  {
    match: (m) => /(mono|monospace|terminal font|code font)/.test(m),
    apply: (bp) => {
      bp.theme.font = "mono";
      return { message: "Switched typography to monospace for a technical, terminal-inspired look.", changes: ["Font → monospace"] };
    },
  },

  // ---- rename -------------------------------------------------------------------
  {
    match: (m) => /(rename|call it|name it)/.test(m),
    apply: (bp, m) => {
      const match =
        m.match(/(?:rename(?:\s+it)?\s+(?:to\s+)?|call it\s+|name it\s+)["“']?([a-z0-9 ]{2,24})["”']?/i);
      const newName = match ? match[1].trim() : bp.name;
      const old = bp.name;
      // Title-case it
      bp.name = newName.replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        message: `Renamed the app from ${old} to ${bp.name} — navigation, titles and copy updated.`,
        changes: [`App name: ${old} → ${bp.name}`],
      };
    },
  },

  // ---- generic "add a X page" ----------------------------------------------------
  {
    match: (m) => /add (a |an )?[a-z ]{2,24} page/.test(m),
    apply: (bp, m) => {
      const match = m.match(/add (?:a |an )?([a-z ]{2,24}) page/);
      const raw = (match ? match[1] : "new").trim();
      const name = raw.replace(/\b\w/g, (c) => c.toUpperCase());
      const page = findOrCreatePage(bp, name, "file");
      if (page.sections.length === 0) {
        page.sections.push({
          type: "cards",
          title: name,
          items: [
            { icon: "zap", title: `${name} highlights`, desc: `Key information about ${raw} lives here.` },
            { icon: "star", title: "Curated content", desc: "Replace this with real content via chat or the code editor." },
            { icon: "layers", title: "Fully editable", desc: "Ask me to add tables, charts or forms to this page." },
          ],
        });
      }
      return {
        message: `Added a new ${name} page with a starter content grid. Ask me to add tables, charts or forms to it.`,
        changes: [`New page: ${name}`],
      };
    },
  },

  // ---- add table -------------------------------------------------------------------
  {
    match: (m) => /(table|list of|data grid)/.test(m),
    apply: (bp) => {
      const target = bp.pages[0];
      target.sections.push({
        type: "table",
        title: "Records",
        columns: ["Name", "Category", "Updated", "Status"],
        rows: [
          ["Alpha record", "General", "Today", "Active"],
          ["Beta record", "General", "Yesterday", "Draft"],
          ["Gamma record", "Archive", "Jun 02", "Active"],
        ],
      });
      return {
        message: `Added a data table to the ${target.name} page with sortable-style columns and status pills.`,
        changes: [`New table on ${target.name}`],
      };
    },
  },
];

function applyFallback(bp: Blueprint, instruction: string): { message: string; changes: string[] } {
  // Deterministic catch-all: still make a visible refinement so the user
  // always sees the preview respond.
  bp.theme.premium = true;
  return {
    message:
      `I was not fully sure how to interpret "${instruction}", so I applied a general visual refinement pass: ` +
      "richer surfaces, improved spacing and stronger accent treatment. " +
      "Try being specific — e.g. \"add a pricing page\", \"make it darker\", \"add a chart\", or \"change the accent to teal\".",
    changes: ["Visual refinement pass (surfaces, spacing, accents)"],
  };
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class MockAIService implements AIService {
  async generatePlan(prompt: string): Promise<BuildPlan> {
    // TODO(LLM): replace with a real call, e.g.
    //   const res = await anthropic.messages.create({
    //     model: "claude-sonnet-4-6",
    //     tools: [buildPlanTool],
    //     messages: [{ role: "user", content: PLAN_PROMPT + prompt }],
    //   });
    await sleep(700); // simulate model latency
    return makePlan(prompt);
  }

  async generateBlueprint(prompt: string, plan: BuildPlan): Promise<Blueprint> {
    // TODO(LLM): replace with a real structured-output call that emits a
    // Blueprint JSON document validated against the schema in types/index.ts.
    await sleep(900);
    return buildBlueprint(plan.appType, {
      name: plan.appName,
      accentName: extractAccent(prompt),
    });
  }

  async applyChange(blueprint: Blueprint, instruction: string): Promise<ChangeResult> {
    // TODO(LLM): replace with a real call that receives the current blueprint
    // and the instruction, and returns a mutated blueprint + change summary.
    await sleep(800);
    const bp: Blueprint = JSON.parse(JSON.stringify(blueprint));
    const msg = instruction.toLowerCase();

    const applied: { message: string; changes: string[] }[] = [];
    for (const rule of RULES) {
      if (rule.match(msg)) {
        applied.push(rule.apply(bp, msg));
        // Apply at most two rules per instruction so combined requests like
        // "make it darker and add a chart" work, but we do not over-trigger.
        if (applied.length >= 2) break;
      }
    }
    if (applied.length === 0) applied.push(applyFallback(bp, instruction));

    return {
      blueprint: bp,
      message: applied.map((a) => a.message).join("\n\n"),
      changes: applied.flatMap((a) => a.changes),
    };
  }
}
