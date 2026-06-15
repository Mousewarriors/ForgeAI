/** Example prompts surfaced on the landing page and dashboard. */

export interface ExamplePrompt {
  label: string;
  prompt: string;
}

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    label: "SaaS dashboard",
    prompt: "A SaaS analytics dashboard called PulseBoard with revenue metrics and customer tables",
  },
  {
    label: "Landing page",
    prompt: "A premium landing page for a productivity startup called Northwind with pricing",
  },
  {
    label: "CRM",
    prompt: "A CRM for a small sales team to track contacts, deals and pipeline",
  },
  {
    label: "Booking system",
    prompt: "A booking system for a hair salon with time slots and services",
  },
  {
    label: "Finance tracker",
    prompt: "A personal finance tracker with budgets, spending charts and transactions",
  },
  {
    label: "Client portal",
    prompt: "A client portal for a design agency with projects, documents and messages",
  },
  {
    label: "Todo app",
    prompt: "A beautiful todo and productivity app with daily streaks",
  },
];
