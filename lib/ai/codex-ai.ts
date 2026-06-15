/**
 * CodexAIService — real LLM provider backed by the user's ChatGPT/Codex
 * subscription via the locally installed Codex CLI (see app/api/ai/route.ts).
 *
 * Every method calls the bridge route, validates/normalizes the structured
 * output, and falls back to the deterministic MockAIService if the CLI is
 * unavailable or returns something unusable — the product never breaks.
 */

import type { AppType, Blueprint, BuildPlan, Page, Section } from "@/types";
import { uid } from "@/lib/utils";
import { buildBlueprint } from "@/lib/templates/blueprints";
import { MockAIService } from "./mock-ai";
import type { AIService, ChangeResult } from "./service";

const APP_TYPES: AppType[] = [
  "saas-dashboard",
  "landing-page",
  "crm",
  "booking",
  "finance",
  "client-portal",
  "todo",
];

const SECTION_TYPES = new Set([
  "hero", "stats", "chart", "table", "cards", "pricing", "form",
  "todo", "booking", "testimonials", "cta", "login", "activity", "custom",
]);

const ICONS = new Set([
  "layout", "users", "zap", "settings", "home", "calendar", "list",
  "grid", "briefcase", "file", "message", "sun", "check", "target", "lock",
]);

async function callBridge<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; data?: T; error?: string };
  if (!json.ok || json.data === undefined) {
    throw new Error(json.error ?? `Bridge request failed (${res.status})`);
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Normalization — never trust model output blindly
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizePlan(raw: unknown, prompt: string): BuildPlan {
  if (!isRecord(raw)) throw new Error("Plan is not an object");
  const appType = APP_TYPES.includes(raw.appType as AppType)
    ? (raw.appType as AppType)
    : "landing-page";
  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .filter(isRecord)
        .map((s) => ({ title: String(s.title ?? "Step"), detail: String(s.detail ?? "") }))
    : [];
  if (steps.length === 0) throw new Error("Plan has no steps");
  return {
    summary: String(raw.summary ?? `I will build this app: ${prompt}`),
    appType,
    appName: String(raw.appName ?? "Generated App").slice(0, 40),
    stack: Array.isArray(raw.stack) ? raw.stack.map(String) : ["React 18", "TypeScript", "Vite", "Tailwind CSS"],
    pages: Array.isArray(raw.pages) ? raw.pages.map(String) : [],
    steps,
  };
}

function normalizeSection(raw: unknown): Section | null {
  if (!isRecord(raw) || !SECTION_TYPES.has(String(raw.type))) return null;
  // Spot-check the per-type required fields; drop malformed sections.
  const t = String(raw.type);
  const need = (cond: boolean) => (cond ? (raw as unknown as Section) : null);
  switch (t) {
    case "hero":
      return need(typeof raw.headline === "string" && typeof raw.sub === "string" && typeof raw.cta === "string");
    case "stats":
    case "todo":
    case "cards":
    case "testimonials":
    case "activity":
      return need(Array.isArray(raw.items));
    case "chart":
      return need(Array.isArray(raw.labels) && Array.isArray(raw.series));
    case "table":
      return need(Array.isArray(raw.columns) && Array.isArray(raw.rows));
    case "pricing":
      return need(Array.isArray(raw.tiers));
    case "form":
      return need(Array.isArray(raw.fields));
    case "booking":
      return need(Array.isArray(raw.days) && Array.isArray(raw.slots));
    case "cta":
      return need(typeof raw.headline === "string");
    case "login":
      return need(typeof raw.title === "string");
    case "custom":
      return need(typeof raw.html === "string" && (raw.html as string).length > 50);
    default:
      return null;
  }
}

export function normalizeBlueprint(raw: unknown): Blueprint {
  if (!isRecord(raw)) throw new Error("Blueprint is not an object");
  const appType = APP_TYPES.includes(raw.appType as AppType)
    ? (raw.appType as AppType)
    : "landing-page";

  // Start from a known-good template and overlay validated model output, so
  // missing theme/feature fields can never crash the renderer.
  const base = buildBlueprint(appType, { name: String(raw.name ?? "Generated App").slice(0, 40) });

  const theme = isRecord(raw.theme) ? raw.theme : {};
  base.tagline = String(raw.tagline ?? base.tagline);
  base.description = String(raw.description ?? base.description);
  base.theme = {
    mode: theme.mode === "light" ? "light" : "dark",
    accent: /^#[0-9a-fA-F]{6}$/.test(String(theme.accent)) ? String(theme.accent) : base.theme.accent,
    accentName: String(theme.accentName ?? base.theme.accentName),
    radius: typeof theme.radius === "number" ? Math.max(0, Math.min(24, theme.radius)) : base.theme.radius,
    font: theme.font === "serif" || theme.font === "mono" ? theme.font : "sans",
    premium: Boolean(theme.premium),
  };

  const features = isRecord(raw.features) ? raw.features : {};
  base.features.auth = Boolean(features.auth);

  const pages: Page[] = [];
  if (Array.isArray(raw.pages)) {
    for (const p of raw.pages) {
      if (!isRecord(p)) continue;
      const sections = Array.isArray(p.sections)
        ? (p.sections.map(normalizeSection).filter(Boolean) as Section[])
        : [];
      if (sections.length === 0) continue;
      pages.push({
        id: typeof p.id === "string" && p.id ? p.id : uid("page"),
        name: String(p.name ?? "Page").slice(0, 24),
        icon: ICONS.has(String(p.icon)) ? String(p.icon) : "grid",
        sections,
      });
    }
  }
  if (pages.length === 0) throw new Error("Blueprint has no valid pages");
  base.pages = pages;
  return base;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CodexAIService implements AIService {
  private fallback = new MockAIService();

  async generatePlan(prompt: string): Promise<BuildPlan> {
    try {
      const raw = await callBridge<unknown>({ task: "plan", prompt });
      return normalizePlan(raw, prompt);
    } catch (err) {
      console.warn("[ForgeAI] Codex plan failed, using mock fallback:", err);
      return this.fallback.generatePlan(prompt);
    }
  }

  async generateBlueprint(prompt: string, plan: BuildPlan): Promise<Blueprint> {
    try {
      const raw = await callBridge<unknown>({ task: "blueprint", prompt, plan });
      return normalizeBlueprint(raw);
    } catch (err) {
      console.warn("[ForgeAI] Codex blueprint failed, using mock fallback:", err);
      return this.fallback.generateBlueprint(prompt, plan);
    }
  }

  async applyChange(blueprint: Blueprint, instruction: string): Promise<ChangeResult> {
    try {
      const raw = await callBridge<unknown>({ task: "change", blueprint, instruction });
      if (!isRecord(raw)) throw new Error("Change result is not an object");
      const bp = normalizeBlueprint(raw.blueprint);
      return {
        blueprint: bp,
        message: String(raw.message ?? "Done — I applied your change."),
        changes: Array.isArray(raw.changes) && raw.changes.length > 0
          ? raw.changes.map(String)
          : ["Updated app"],
      };
    } catch (err) {
      console.warn("[ForgeAI] Codex change failed, using mock fallback:", err);
      const result = await this.fallback.applyChange(blueprint, instruction);
      return {
        ...result,
        message: `${result.message}\n\n_(Codex was unavailable for this request, so I applied a deterministic fallback — check that the Codex CLI is installed and logged in.)_`,
      };
    }
  }
}
