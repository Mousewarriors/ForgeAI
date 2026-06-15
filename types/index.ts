/**
 * Core domain types for ForgeAI.
 *
 * The `Blueprint` is the single source of truth for a generated app:
 *  - the live preview renderer turns it into a self-contained HTML document
 *  - the code generator turns it into a real, runnable Vite + React project
 *  - the AI layer mutates it in response to chat instructions
 */

// ---------------------------------------------------------------------------
// App types
// ---------------------------------------------------------------------------

export type AppType =
  | "saas-dashboard"
  | "landing-page"
  | "crm"
  | "booking"
  | "finance"
  | "client-portal"
  | "todo";

export const APP_TYPE_LABELS: Record<AppType, string> = {
  "saas-dashboard": "SaaS Dashboard",
  "landing-page": "Landing Page",
  crm: "CRM",
  booking: "Booking System",
  finance: "Finance Tracker",
  "client-portal": "Client Portal",
  todo: "Todo / Productivity",
};

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export type ThemeMode = "dark" | "light";
export type FontChoice = "sans" | "serif" | "mono";

export interface Theme {
  mode: ThemeMode;
  /** Accent color as a hex string, e.g. "#8b5cf6" */
  accent: string;
  accentName: string;
  /** Corner radius in px applied across the generated app */
  radius: number;
  font: FontChoice;
  /** Premium = gradients, glassmorphism, richer shadows */
  premium: boolean;
}

// ---------------------------------------------------------------------------
// Sections — the building blocks of generated pages
// ---------------------------------------------------------------------------

export interface HeroSection {
  type: "hero";
  headline: string;
  sub: string;
  cta: string;
  secondaryCta?: string;
}

export interface StatsSection {
  type: "stats";
  items: { label: string; value: string; delta?: string }[];
}

export interface ChartSection {
  type: "chart";
  title: string;
  kind: "bar" | "line" | "area";
  labels: string[];
  series: number[];
}

export interface TableSection {
  type: "table";
  title: string;
  columns: string[];
  rows: string[][];
}

export interface CardsSection {
  type: "cards";
  title?: string;
  items: { icon: string; title: string; desc: string }[];
}

export interface PricingSection {
  type: "pricing";
  title: string;
  tiers: {
    name: string;
    price: string;
    period: string;
    features: string[];
    highlight?: boolean;
  }[];
}

export interface FormSection {
  type: "form";
  title: string;
  sub?: string;
  fields: { label: string; inputType: string; placeholder?: string }[];
  submitLabel: string;
}

export interface TodoSection {
  type: "todo";
  title: string;
  items: { text: string; done: boolean }[];
}

export interface BookingSection {
  type: "booking";
  title: string;
  days: string[];
  slots: string[];
}

export interface TestimonialsSection {
  type: "testimonials";
  title: string;
  items: { quote: string; author: string; role: string }[];
}

export interface CtaSection {
  type: "cta";
  headline: string;
  sub: string;
  cta: string;
}

export interface LoginSection {
  type: "login";
  title: string;
  sub: string;
}

export interface ActivitySection {
  type: "activity";
  title: string;
  items: { text: string; time: string }[];
}

/**
 * Escape hatch for app ideas that don't fit the structured sections
 * (games, canvas tools, calculators…). Holds a complete self-contained
 * HTML document (inline CSS/JS) rendered in its own sandboxed iframe.
 * Only real LLM providers emit this; the mock never does.
 */
export interface CustomSection {
  type: "custom";
  title?: string;
  html: string;
  height?: number;
}

export type Section =
  | HeroSection
  | StatsSection
  | ChartSection
  | TableSection
  | CardsSection
  | PricingSection
  | FormSection
  | TodoSection
  | BookingSection
  | TestimonialsSection
  | CtaSection
  | LoginSection
  | ActivitySection
  | CustomSection;

export type SectionType = Section["type"];

// ---------------------------------------------------------------------------
// Pages + blueprint
// ---------------------------------------------------------------------------

export interface Page {
  id: string;
  name: string;
  /** lucide-ish icon hint used by the preview shell nav */
  icon: string;
  sections: Section[];
}

export interface Features {
  auth: boolean;
  responsive: boolean;
  supabase: {
    enabled: boolean;
    auth: boolean;
    database: boolean;
    storage: boolean;
    edgeFunctions: boolean;
  };
}

export interface Blueprint {
  appType: AppType;
  name: string;
  tagline: string;
  description: string;
  theme: Theme;
  pages: Page[];
  features: Features;
}

// ---------------------------------------------------------------------------
// Files, versions, chat, console
// ---------------------------------------------------------------------------

export interface AppFile {
  path: string;
  content: string;
}

export interface Version {
  id: string;
  label: string;
  createdAt: number;
  files: AppFile[];
  blueprint: Blueprint;
}

export interface BuildPlanStep {
  title: string;
  detail: string;
}

export interface BuildPlan {
  summary: string;
  appType: AppType;
  appName: string;
  stack: string[];
  pages: string[];
  steps: BuildPlanStep[];
}

export type MessageKind = "text" | "plan" | "changes";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  kind: MessageKind;
  content: string;
  plan?: BuildPlan;
  /** Human-readable list of changes applied (for kind === "changes") */
  changes?: string[];
  /** Files touched by this message */
  files?: string[];
  createdAt: number;
}

export type ConsoleLevel = "info" | "success" | "warn" | "error";

export interface ConsoleLine {
  id: string;
  ts: number;
  level: ConsoleLevel;
  text: string;
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export interface Integrations {
  github: { connected: boolean; repo: string };
  supabase: {
    connected: boolean;
    auth: boolean;
    database: boolean;
    storage: boolean;
    edgeFunctions: boolean;
  };
  deploy: { deployed: boolean; url: string; provider: string };
}

export const DEFAULT_INTEGRATIONS: Integrations = {
  github: { connected: false, repo: "" },
  supabase: {
    connected: false,
    auth: false,
    database: false,
    storage: false,
    edgeFunctions: false,
  },
  deploy: { deployed: false, url: "", provider: "" },
};

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export type ProjectStatus = "new" | "generating" | "ready";

export interface Project {
  id: string;
  name: string;
  prompt: string;
  status: ProjectStatus;
  blueprint: Blueprint | null;
  files: AppFile[];
  versions: Version[];
  messages: ChatMessage[];
  consoleLines: ConsoleLine[];
  integrations: Integrations;
  createdAt: number;
  updatedAt: number;
}
