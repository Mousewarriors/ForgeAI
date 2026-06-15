/**
 * Blueprint builders — deterministic "AI" output for each supported app type.
 *
 * A blueprint is the structured representation of a generated app. Both the
 * live preview renderer and the code generator consume blueprints, so a
 * single mutation (e.g. "make it darker") flows through everything.
 */

import type { AppType, Blueprint, Page, Theme } from "@/types";
import { uid } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Accent palette
// ---------------------------------------------------------------------------

export const ACCENTS: Record<string, string> = {
  violet: "#8b5cf6",
  purple: "#a855f7",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  green: "#22c55e",
  emerald: "#10b981",
  lime: "#84cc16",
  yellow: "#eab308",
  amber: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  rose: "#f43f5e",
  pink: "#ec4899",
  gold: "#d4af37",
  indigo: "#6366f1",
};

const DEFAULT_ACCENT: Record<AppType, { name: string; hex: string }> = {
  "saas-dashboard": { name: "violet", hex: ACCENTS.violet },
  "landing-page": { name: "indigo", hex: ACCENTS.indigo },
  crm: { name: "blue", hex: ACCENTS.blue },
  booking: { name: "teal", hex: ACCENTS.teal },
  finance: { name: "emerald", hex: ACCENTS.emerald },
  "client-portal": { name: "sky", hex: ACCENTS.sky },
  todo: { name: "amber", hex: ACCENTS.amber },
};

const DEFAULT_NAMES: Record<AppType, string> = {
  "saas-dashboard": "PulseBoard",
  "landing-page": "Northwind",
  crm: "RelayCRM",
  booking: "BookWell",
  finance: "Centsible",
  "client-portal": "ClientHub",
  todo: "TaskFlow",
};

const TAGLINES: Record<AppType, string> = {
  "saas-dashboard": "Analytics that move as fast as you do",
  "landing-page": "Launch something people remember",
  crm: "Every relationship, beautifully organized",
  booking: "Scheduling without the back-and-forth",
  finance: "Know exactly where every penny goes",
  "client-portal": "One calm place for all your client work",
  todo: "Plan less. Finish more.",
};

function baseTheme(appType: AppType): Theme {
  const accent = DEFAULT_ACCENT[appType];
  return {
    mode: "dark",
    accent: accent.hex,
    accentName: accent.name,
    radius: 12,
    font: "sans",
    premium: false,
  };
}

function page(name: string, icon: string, sections: Page["sections"]): Page {
  return { id: uid("page"), name, icon, sections };
}

// ---------------------------------------------------------------------------
// Per-type builders
// ---------------------------------------------------------------------------

function saasDashboard(name: string): Page[] {
  return [
    page("Dashboard", "layout", [
      {
        type: "stats",
        items: [
          { label: "Monthly Revenue", value: "$48,290", delta: "+12.4%" },
          { label: "Active Users", value: "8,431", delta: "+5.1%" },
          { label: "Churn Rate", value: "1.8%", delta: "-0.3%" },
          { label: "Avg. Session", value: "6m 12s", delta: "+0.9%" },
        ],
      },
      {
        type: "chart",
        title: "Revenue (last 8 months)",
        kind: "area",
        labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [21, 26, 24, 31, 36, 34, 42, 48],
      },
      {
        type: "table",
        title: "Recent Signups",
        columns: ["Customer", "Plan", "MRR", "Status"],
        rows: [
          ["Acme Corp", "Scale", "$499", "Active"],
          ["Lumen Labs", "Growth", "$199", "Active"],
          ["Northstar", "Growth", "$199", "Trialing"],
          ["Hooli Inc", "Starter", "$49", "Active"],
          ["Vandelay", "Scale", "$499", "Past due"],
        ],
      },
    ]),
    page("Customers", "users", [
      {
        type: "table",
        title: "All Customers",
        columns: ["Name", "Email", "Plan", "Joined"],
        rows: [
          ["Ada Lovelace", "ada@acme.com", "Scale", "Jan 12"],
          ["Grace Hopper", "grace@lumen.io", "Growth", "Feb 03"],
          ["Alan Turing", "alan@northstar.dev", "Growth", "Feb 19"],
          ["Katherine Johnson", "kj@hooli.com", "Starter", "Mar 27"],
          ["Margaret Hamilton", "mh@vandelay.com", "Scale", "Apr 08"],
          ["Linus Pauling", "lp@helix.bio", "Starter", "May 30"],
        ],
      },
    ]),
    page("Activity", "zap", [
      {
        type: "activity",
        title: "Latest Events",
        items: [
          { text: "Acme Corp upgraded to Scale", time: "2m ago" },
          { text: "New signup: helix.bio", time: "18m ago" },
          { text: "Invoice #2041 paid — $499", time: "1h ago" },
          { text: "Churn alert: Vandelay payment failed", time: "3h ago" },
          { text: "Weekly report generated", time: "6h ago" },
        ],
      },
    ]),
    page("Settings", "settings", [
      {
        type: "form",
        title: "Workspace Settings",
        sub: "Manage how your workspace behaves.",
        fields: [
          { label: "Workspace name", inputType: "text", placeholder: name },
          { label: "Billing email", inputType: "email", placeholder: "billing@company.com" },
          { label: "Webhook URL", inputType: "url", placeholder: "https://" },
        ],
        submitLabel: "Save changes",
      },
    ]),
  ];
}

function landingPage(name: string): Page[] {
  return [
    page("Home", "home", [
      {
        type: "hero",
        headline: `Meet ${name} — the smarter way to work`,
        sub: "Everything your team needs to plan, build and ship, in one beautifully simple workspace.",
        cta: "Get started free",
        secondaryCta: "Watch demo",
      },
      {
        type: "cards",
        title: "Why teams choose us",
        items: [
          { icon: "zap", title: "Blazing fast", desc: "Optimistic UI and edge rendering keep every interaction under 100ms." },
          { icon: "shield", title: "Secure by default", desc: "SOC 2 ready with SSO, audit logs and granular permissions." },
          { icon: "sparkles", title: "AI-assisted", desc: "Drafts, summaries and suggestions exactly where you need them." },
          { icon: "layers", title: "Plays well with others", desc: "Native integrations with the tools your team already loves." },
          { icon: "globe", title: "Global edge", desc: "Deployed to 30+ regions so it is fast for everyone, everywhere." },
          { icon: "heart", title: "Loved by users", desc: "4.9/5 average rating across 2,000+ verified reviews." },
        ],
      },
      {
        type: "testimonials",
        title: "Loved by modern teams",
        items: [
          { quote: "We replaced four tools the first week. The team actually enjoys using it.", author: "Maya Chen", role: "VP Engineering, Lumen" },
          { quote: "Setup took minutes. It quietly became the backbone of our entire workflow.", author: "Dev Patel", role: "Founder, Northstar" },
          { quote: "The polish is unreal. It feels like software from five years in the future.", author: "Sofia Reyes", role: "Design Lead, Acme" },
        ],
      },
      {
        type: "pricing",
        title: "Simple, honest pricing",
        tiers: [
          { name: "Starter", price: "$0", period: "forever", features: ["Up to 3 projects", "Community support", "Basic analytics"] },
          { name: "Pro", price: "$19", period: "per user / month", features: ["Unlimited projects", "Priority support", "Advanced analytics", "Custom domains"], highlight: true },
          { name: "Enterprise", price: "Custom", period: "annual billing", features: ["SSO & SAML", "Dedicated success manager", "99.99% SLA", "Custom contracts"] },
        ],
      },
      {
        type: "cta",
        headline: "Ready to ship faster?",
        sub: "Join 12,000+ teams already building with us. Free forever for small teams.",
        cta: "Start building",
      },
    ]),
  ];
}

function crm(name: string): Page[] {
  return [
    page("Overview", "layout", [
      {
        type: "stats",
        items: [
          { label: "Open Deals", value: "37", delta: "+4" },
          { label: "Pipeline Value", value: "$312k", delta: "+8.2%" },
          { label: "Win Rate", value: "31%", delta: "+2.1%" },
          { label: "New Leads (wk)", value: "58", delta: "+12" },
        ],
      },
      {
        type: "chart",
        title: "Deals closed per month",
        kind: "bar",
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [8, 11, 9, 14, 17, 21],
      },
    ]),
    page("Contacts", "users", [
      {
        type: "table",
        title: "Contacts",
        columns: ["Name", "Company", "Email", "Stage"],
        rows: [
          ["Maya Chen", "Lumen Labs", "maya@lumen.io", "Qualified"],
          ["Dev Patel", "Northstar", "dev@northstar.dev", "Negotiation"],
          ["Sofia Reyes", "Acme Corp", "sofia@acme.com", "Won"],
          ["James Okafor", "Hooli", "james@hooli.com", "New"],
          ["Elena Petrova", "Vandelay", "elena@vandelay.com", "Qualified"],
          ["Tom Maguire", "Helix Bio", "tom@helix.bio", "Lost"],
        ],
      },
    ]),
    page("Deals", "briefcase", [
      {
        type: "table",
        title: "Active Deals",
        columns: ["Deal", "Value", "Stage", "Close Date"],
        rows: [
          ["Lumen — Annual Scale", "$48,000", "Negotiation", "Jul 15"],
          ["Northstar — Growth", "$12,400", "Proposal", "Jul 28"],
          ["Hooli — Pilot", "$6,000", "Discovery", "Aug 02"],
          ["Vandelay — Renewal", "$22,000", "Negotiation", "Aug 11"],
          ["Helix — Expansion", "$31,500", "Qualified", "Sep 01"],
        ],
      },
    ]),
    page("Activity", "zap", [
      {
        type: "activity",
        title: "Recent Activity",
        items: [
          { text: "Call logged with Maya Chen (22 min)", time: "10m ago" },
          { text: "Proposal sent to Northstar", time: "1h ago" },
          { text: "Deal won: Acme Corp — $18,000", time: "4h ago" },
          { text: "New lead from website: Helix Bio", time: "Yesterday" },
        ],
      },
    ]),
    page("Settings", "settings", [
      {
        type: "form",
        title: "CRM Settings",
        sub: "Configure pipelines and notifications.",
        fields: [
          { label: "Team name", inputType: "text", placeholder: name },
          { label: "Notification email", inputType: "email", placeholder: "sales@company.com" },
          { label: "Default currency", inputType: "text", placeholder: "USD" },
        ],
        submitLabel: "Save settings",
      },
    ]),
  ];
}

function booking(name: string): Page[] {
  return [
    page("Book", "calendar", [
      {
        type: "hero",
        headline: `Book your appointment with ${name}`,
        sub: "Pick a day and time that works for you. Confirmation is instant.",
        cta: "View availability",
      },
      {
        type: "booking",
        title: "Choose a time",
        days: ["Mon 15", "Tue 16", "Wed 17", "Thu 18", "Fri 19"],
        slots: ["09:00", "09:45", "10:30", "11:15", "13:00", "13:45", "14:30", "15:15", "16:00"],
      },
    ]),
    page("Appointments", "list", [
      {
        type: "table",
        title: "Upcoming Appointments",
        columns: ["Client", "Service", "Date", "Status"],
        rows: [
          ["Maya Chen", "Consultation", "Mon 15, 09:45", "Confirmed"],
          ["Dev Patel", "Follow-up", "Mon 15, 13:00", "Confirmed"],
          ["Sofia Reyes", "Consultation", "Tue 16, 10:30", "Pending"],
          ["James Okafor", "Full session", "Wed 17, 14:30", "Confirmed"],
        ],
      },
    ]),
    page("Services", "grid", [
      {
        type: "cards",
        title: "Services",
        items: [
          { icon: "clock", title: "Consultation — 30 min", desc: "A focused intro session to understand your needs. $45." },
          { icon: "star", title: "Full session — 60 min", desc: "Deep-dive session with a complete written summary. $90." },
          { icon: "repeat", title: "Follow-up — 20 min", desc: "Quick check-in for existing clients. $25." },
        ],
      },
    ]),
    page("Settings", "settings", [
      {
        type: "form",
        title: "Availability Settings",
        sub: "Control when clients can book you.",
        fields: [
          { label: "Business name", inputType: "text", placeholder: name },
          { label: "Working hours", inputType: "text", placeholder: "09:00 – 17:00" },
          { label: "Buffer between bookings (min)", inputType: "number", placeholder: "15" },
        ],
        submitLabel: "Update availability",
      },
    ]),
  ];
}

function finance(name: string): Page[] {
  return [
    page("Overview", "layout", [
      {
        type: "stats",
        items: [
          { label: "Net Worth", value: "$84,210", delta: "+3.2%" },
          { label: "Spent (Jun)", value: "$2,418", delta: "-6.4%" },
          { label: "Saved (Jun)", value: "$1,150", delta: "+18%" },
          { label: "Subscriptions", value: "$86/mo", delta: "+$12" },
        ],
      },
      {
        type: "chart",
        title: "Spending — last 6 months",
        kind: "area",
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [2900, 2600, 3100, 2750, 2580, 2418],
      },
      {
        type: "table",
        title: "Recent Transactions",
        columns: ["Merchant", "Category", "Date", "Amount"],
        rows: [
          ["Waitrose", "Groceries", "Jun 10", "-$84.20"],
          ["Spotify", "Subscriptions", "Jun 09", "-$11.99"],
          ["Salary", "Income", "Jun 08", "+$4,200.00"],
          ["TfL Travel", "Transport", "Jun 08", "-$6.80"],
          ["Rent", "Housing", "Jun 01", "-$1,450.00"],
        ],
      },
    ]),
    page("Budgets", "target", [
      {
        type: "cards",
        title: "Monthly Budgets",
        items: [
          { icon: "cart", title: "Groceries — $310 / $400", desc: "78% used. On track for the month." },
          { icon: "home", title: "Housing — $1,450 / $1,450", desc: "100% used. Fixed monthly cost." },
          { icon: "film", title: "Entertainment — $92 / $150", desc: "61% used. $58 remaining." },
          { icon: "bus", title: "Transport — $74 / $120", desc: "62% used. $46 remaining." },
        ],
      },
      {
        type: "chart",
        title: "Budget vs actual",
        kind: "bar",
        labels: ["Groceries", "Housing", "Fun", "Transport", "Other"],
        series: [310, 1450, 92, 74, 188],
      },
    ]),
    page("Transactions", "list", [
      {
        type: "table",
        title: "All Transactions",
        columns: ["Merchant", "Category", "Date", "Amount"],
        rows: [
          ["Waitrose", "Groceries", "Jun 10", "-$84.20"],
          ["Spotify", "Subscriptions", "Jun 09", "-$11.99"],
          ["Salary", "Income", "Jun 08", "+$4,200.00"],
          ["TfL Travel", "Transport", "Jun 08", "-$6.80"],
          ["Netflix", "Subscriptions", "Jun 05", "-$15.99"],
          ["Pret a Manger", "Eating out", "Jun 04", "-$9.45"],
          ["Rent", "Housing", "Jun 01", "-$1,450.00"],
          ["Gym", "Health", "Jun 01", "-$42.00"],
        ],
      },
    ]),
    page("Settings", "settings", [
      {
        type: "form",
        title: "Preferences",
        sub: "Currency, accounts and alerts.",
        fields: [
          { label: "Display currency", inputType: "text", placeholder: "GBP" },
          { label: "Monthly savings goal", inputType: "number", placeholder: "1000" },
          { label: "Alert email", inputType: "email", placeholder: "you@email.com" },
        ],
        submitLabel: "Save preferences",
      },
    ]),
  ];
}

function clientPortal(name: string): Page[] {
  return [
    page("Home", "home", [
      {
        type: "hero",
        headline: `Welcome back to ${name}`,
        sub: "Track project progress, review documents and message the team — all in one place.",
        cta: "View latest update",
      },
      {
        type: "stats",
        items: [
          { label: "Active Projects", value: "3" },
          { label: "Open Tasks", value: "14", delta: "-2" },
          { label: "Pending Approvals", value: "2" },
          { label: "Next Milestone", value: "Jun 24" },
        ],
      },
    ]),
    page("Projects", "briefcase", [
      {
        type: "table",
        title: "Your Projects",
        columns: ["Project", "Phase", "Progress", "Due"],
        rows: [
          ["Website Redesign", "Build", "72%", "Jul 04"],
          ["Brand Refresh", "Review", "90%", "Jun 20"],
          ["Mobile App MVP", "Discovery", "25%", "Sep 12"],
        ],
      },
    ]),
    page("Documents", "file", [
      {
        type: "table",
        title: "Shared Documents",
        columns: ["Document", "Type", "Updated", "Status"],
        rows: [
          ["Proposal v3.pdf", "Proposal", "Jun 09", "Approved"],
          ["Brand Guidelines.pdf", "Deliverable", "Jun 07", "In review"],
          ["Contract 2026.pdf", "Legal", "May 28", "Signed"],
          ["Sitemap.fig", "Design", "May 21", "Approved"],
        ],
      },
    ]),
    page("Messages", "message", [
      {
        type: "activity",
        title: "Recent Messages",
        items: [
          { text: "Sarah: Homepage build is live on staging — link inside.", time: "1h ago" },
          { text: "You approved Brand Guidelines v2.", time: "Yesterday" },
          { text: "Milo: Uploaded the revised sitemap.", time: "2d ago" },
          { text: "Invoice #108 was paid. Thank you!", time: "4d ago" },
        ],
      },
    ]),
    page("Settings", "settings", [
      {
        type: "form",
        title: "Account",
        sub: "Your contact details and notifications.",
        fields: [
          { label: "Full name", inputType: "text", placeholder: "Jane Smith" },
          { label: "Email", inputType: "email", placeholder: "jane@company.com" },
          { label: "Company", inputType: "text", placeholder: "Smith & Co" },
        ],
        submitLabel: "Save account",
      },
    ]),
  ];
}

function todo(name: string): Page[] {
  return [
    page("Today", "sun", [
      {
        type: "stats",
        items: [
          { label: "Due Today", value: "6" },
          { label: "Completed", value: "3", delta: "+3" },
          { label: "Streak", value: "9 days" },
        ],
      },
      {
        type: "todo",
        title: "Today",
        items: [
          { text: "Review pull request #214", done: true },
          { text: "Write launch announcement draft", done: true },
          { text: "30 minutes of reading", done: true },
          { text: "Prepare slides for Friday demo", done: false },
          { text: "Book dentist appointment", done: false },
          { text: "Reply to Anna about the offsite", done: false },
        ],
      },
    ]),
    page("Upcoming", "calendar", [
      {
        type: "todo",
        title: "This Week",
        items: [
          { text: "Quarterly planning doc — first pass", done: false },
          { text: "Ship dark mode toggle", done: false },
          { text: "1:1 prep notes for Wednesday", done: false },
          { text: "Renew domain names", done: false },
        ],
      },
    ]),
    page("Completed", "check", [
      {
        type: "table",
        title: "Recently Completed",
        columns: ["Task", "List", "Completed"],
        rows: [
          ["Fix onboarding email typo", "Work", "Today"],
          ["Submit expense report", "Admin", "Yesterday"],
          ["Plan sprint 24", "Work", "Yesterday"],
          ["Order new keyboard", "Personal", "2 days ago"],
        ],
      },
    ]),
    page("Settings", "settings", [
      {
        type: "form",
        title: "Preferences",
        sub: "Make it yours.",
        fields: [
          { label: "Display name", inputType: "text", placeholder: name },
          { label: "Daily reminder time", inputType: "time", placeholder: "08:30" },
          { label: "Week starts on", inputType: "text", placeholder: "Monday" },
        ],
        submitLabel: "Save preferences",
      },
    ]),
  ];
}

const BUILDERS: Record<AppType, (name: string) => Page[]> = {
  "saas-dashboard": saasDashboard,
  "landing-page": landingPage,
  crm,
  booking,
  finance,
  "client-portal": clientPortal,
  todo,
};

const DESCRIPTIONS: Record<AppType, string> = {
  "saas-dashboard":
    "A SaaS analytics dashboard with revenue metrics, customer tables and an activity feed.",
  "landing-page":
    "A polished marketing landing page with hero, features, testimonials, pricing and CTA sections.",
  crm: "A CRM with pipeline overview, contacts, deals and an activity timeline.",
  booking:
    "A booking system with an interactive time-slot picker, appointments list and services.",
  finance:
    "A personal finance tracker with spending charts, budgets and transactions.",
  "client-portal":
    "A client portal with project status, shared documents and message history.",
  todo: "A productivity app with daily tasks, upcoming lists and completion history.",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getDefaultName(appType: AppType): string {
  return DEFAULT_NAMES[appType];
}

export function buildBlueprint(
  appType: AppType,
  opts: { name?: string; accentName?: string; mode?: "dark" | "light" } = {}
): Blueprint {
  const name = opts.name || DEFAULT_NAMES[appType];
  const theme = baseTheme(appType);
  if (opts.accentName && ACCENTS[opts.accentName]) {
    theme.accent = ACCENTS[opts.accentName];
    theme.accentName = opts.accentName;
  }
  if (opts.mode) theme.mode = opts.mode;

  return {
    appType,
    name,
    tagline: TAGLINES[appType],
    description: DESCRIPTIONS[appType],
    theme,
    pages: BUILDERS[appType](name),
    features: {
      auth: false,
      responsive: true,
      supabase: {
        enabled: false,
        auth: false,
        database: false,
        storage: false,
        edgeFunctions: false,
      },
    },
  };
}
