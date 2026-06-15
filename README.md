# ForgeAI

ForgeAI is a local-first AI app builder. Describe an app in plain English, review a structured build plan, generate a working codebase, preview it in the browser, iterate through chat, save versions, and export the result as real runnable files.

It is built as a Next.js studio for creating Vite + React + TypeScript apps.

## Highlights

- Prompt-to-app workflow: turn a short idea into a build plan, app blueprint, generated files, and a live preview.
- Chat-based iteration: ask for design, page, content, feature, or integration changes and regenerate the project.
- Sandboxed preview: generated apps render in an isolated iframe with inline HTML, CSS, and JavaScript.
- Real code output: exports produce a Vite, React, TypeScript, and Tailwind CSS project you can run outside ForgeAI.
- Version history: every generation, manual save, and integration change can be snapshotted and restored.
- Local-first storage: projects, chat history, files, versions, console output, and integration settings persist in browser localStorage.
- Code workspace: inspect and edit generated files with a file explorer and Monaco editor.
- Provider abstraction: the app can use the deterministic mock engine or the local OpenAI Codex CLI provider.
- Integration surfaces: GitHub, Supabase, and deploy flows are present in the UI; GitHub and deploy are placeholders, while Supabase enablement writes a client file and `.env.example` into generated projects.

## How It Works

ForgeAI uses a typed blueprint as the contract between AI generation, preview rendering, code generation, versioning, and export.

1. A user prompt becomes a `BuildPlan`.
2. The plan becomes a typed `Blueprint`.
3. The blueprint renders to a sandboxed preview document.
4. The same blueprint generates a Vite + React + TypeScript project.
5. Chat changes mutate the blueprint, regenerate files, refresh preview, and snapshot versions.

This keeps the preview and exported code aligned while making it straightforward to swap AI providers.

## Current App Types

The built-in mock engine recognizes these archetypes:

- SaaS dashboards
- Landing pages
- CRMs
- Booking systems
- Personal finance trackers
- Client portals
- Todo and productivity apps

The Codex CLI provider can also generate free-form custom sections for apps that do not fit those templates, such as games, calculators, drawing tools, and other self-contained interactive experiences.

## Tech Stack

### ForgeAI Studio

- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives built on Radix UI
- Zustand with localStorage persistence
- Monaco Editor
- JSZip
- Lucide React icons

### Generated Projects

- Vite
- React
- TypeScript
- Tailwind CSS
- Optional generated Supabase client scaffold

### Optional Local AI Provider

- OpenAI Codex CLI, authenticated with your ChatGPT account
- No OpenAI API key is required for the Codex CLI path
- Optional `CODEX_MODEL` environment variable in `.env.local`

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

```bash
npm run dev        # start the Next.js development server
npm run build      # create a production build
npm run start      # run the production server
npm run lint       # run Next.js linting
npm run typecheck  # run TypeScript without emitting files
```

## Using the Codex CLI Provider

ForgeAI works out of the box with its deterministic mock engine. To enable the optional Codex CLI provider:

```bash
npm install -g @openai/codex
codex login
```

Then open ForgeAI, go to Settings, choose OpenAI Codex as the AI engine, and test the connection.

You can optionally pin a model in `.env.local`:

```bash
CODEX_MODEL=gpt-5.5-codex
```

If the CLI is unavailable or returns an error, ForgeAI falls back to the mock engine so the product remains usable.

## Project Structure

```text
app/                       Next.js routes and API bridge
  api/ai/route.ts          Codex CLI bridge
  dashboard/               Project list
  project/[id]/            Builder workspace
  settings/                AI provider and integration settings
components/
  landing/                 Landing page sections
  modals/                  GitHub, Supabase, and deploy dialogs
  ui/                      Reusable UI primitives
  workspace/               Builder panels and top-level workspace chrome
data/                      Example prompts
lib/
  ai/                      AI service interface, mock engine, Codex provider, orchestration
  export/                  Client-side zip export
  preview/                 Blueprint-to-preview renderer
  storage/                 Zustand project store
  templates/               Blueprint builders and generated app codegen
scripts/                   Windows launch and shortcut helpers
types/                     Shared domain types
```

## Security Notes

- Do not commit `.env`, `.env.*`, `.env.local`, API keys, tokens, or private keys.
- `.env.example` is safe to commit and should contain placeholders only.
- The Codex CLI provider uses local CLI authentication rather than storing an OpenAI API key in this app.
- Project data is stored in browser localStorage, so export anything important before clearing browser data.
- The preview is sandboxed and generated without external resources by default.

## MVP Limits

- GitHub sync and deploy dialogs are UI placeholders.
- Supabase enablement generates project files but does not provision a real backend.
- Manual Monaco edits persist and export, but blueprint-driven AI changes can regenerate files.
- Storage is local to the browser; there is no server-side project database yet.
