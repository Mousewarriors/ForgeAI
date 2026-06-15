/**
 * AI provider bridge — drives the locally installed OpenAI Codex CLI.
 *
 * Why a CLI and not an API key: ChatGPT subscriptions (incl. Codex models)
 * authenticate via OAuth that only Codex surfaces can use. The CLI is such a
 * surface — `codex login` once with your ChatGPT account, and this route
 * spawns `codex exec` non-interactively so usage bills to the subscription.
 *
 * Requirements (one-time, on this machine):
 *   npm install -g @openai/codex
 *   codex login
 *
 * Optional: set CODEX_MODEL in .env.local (e.g. gpt-5.5-codex) to override
 * your account's default model.
 *
 * POST { task: "plan" | "blueprint" | "change", ... } → { ok, data | error }
 * GET → health check ({ ok, version })
 */

import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 300;

const CODEX_TIMEOUT_MS = 240_000;

function quoted(p: string): string {
  return `"${p}"`;
}

/** Run a shell command string, return { code, stdout, stderr }. */
function run(
  command: string,
  opts: { stdin?: string; timeoutMs?: number } = {}
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Command timed out after ${opts.timeoutMs ?? CODEX_TIMEOUT_MS}ms`));
    }, opts.timeoutMs ?? CODEX_TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });

    if (opts.stdin !== undefined) {
      child.stdin.write(opts.stdin);
    }
    child.stdin.end();
  });
}

/** Invoke `codex exec` with the prompt on stdin; return the final agent message. */
async function runCodex(prompt: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), "forgeai-codex-"));
  const outFile = path.join(dir, "last-message.txt");
  try {
    let command =
      `codex exec --skip-git-repo-check --sandbox read-only ` +
      `--output-last-message ${quoted(outFile)}`;
    const model = process.env.CODEX_MODEL;
    if (model) command += ` -m ${quoted(model)}`;
    command += " -"; // read the prompt from stdin

    const { code, stderr } = await run(command, { stdin: prompt });
    if (code !== 0) {
      throw new Error(
        `codex exec exited with code ${code}. ` +
          `Is the Codex CLI installed (npm i -g @openai/codex) and logged in (codex login)? ` +
          `stderr: ${stderr.slice(-500)}`
      );
    }
    const message = await readFile(outFile, "utf8");
    if (!message.trim()) throw new Error("Codex returned an empty message");
    return message;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Extract the first top-level JSON object from a model response. */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in model output: ${text.slice(0, 200)}…`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

// ---------------------------------------------------------------------------
// Prompts — the model must emit JSON matching ForgeAI's schemas
// ---------------------------------------------------------------------------

const SCHEMA_DOC = `
A Blueprint is JSON with this exact shape:
{
  "appType": one of "saas-dashboard"|"landing-page"|"crm"|"booking"|"finance"|"client-portal"|"todo",
  "name": string (short app name),
  "tagline": string,
  "description": string (one sentence),
  "theme": { "mode": "dark"|"light", "accent": "#rrggbb", "accentName": string, "radius": number (0-24), "font": "sans"|"serif"|"mono", "premium": boolean },
  "pages": [ { "id": string (unique slug), "name": string, "icon": one of "layout"|"users"|"zap"|"settings"|"home"|"calendar"|"list"|"grid"|"briefcase"|"file"|"message"|"sun"|"check"|"target"|"lock", "sections": [Section, ...] } ],
  "features": { "auth": boolean, "responsive": true, "supabase": { "enabled": false, "auth": false, "database": false, "storage": false, "edgeFunctions": false } }
}

Section is one of (discriminated by "type"):
- {"type":"hero","headline":str,"sub":str,"cta":str,"secondaryCta"?:str}
- {"type":"stats","items":[{"label":str,"value":str,"delta"?:str}]}
- {"type":"chart","title":str,"kind":"bar"|"line"|"area","labels":[str],"series":[number]}
- {"type":"table","title":str,"columns":[str],"rows":[[str]]}
- {"type":"cards","title"?:str,"items":[{"icon":str,"title":str,"desc":str}]}
- {"type":"pricing","title":str,"tiers":[{"name":str,"price":str,"period":str,"features":[str],"highlight"?:bool}]}
- {"type":"form","title":str,"sub"?:str,"fields":[{"label":str,"inputType":str,"placeholder"?:str}],"submitLabel":str}
- {"type":"todo","title":str,"items":[{"text":str,"done":bool}]}
- {"type":"booking","title":str,"days":[str],"slots":[str]}
- {"type":"testimonials","title":str,"items":[{"quote":str,"author":str,"role":str}]}
- {"type":"cta","headline":str,"sub":str,"cta":str}
- {"type":"login","title":str,"sub":str}
- {"type":"activity","title":str,"items":[{"text":str,"time":str}]}
- {"type":"custom","title"?:str,"html":str,"height"?:number}

IMPORTANT — the "custom" section is the escape hatch: when the user's idea is an
interactive app that the structured sections cannot express (a game like chess or
snake, a drawing tool, a calculator, a simulator…), build it as ONE "custom"
section whose "html" is a COMPLETE self-contained HTML document (<!DOCTYPE html>
through </html>) with ALL CSS and JavaScript inline. No external resources, no
CDNs, no imports. Make it genuinely playable/usable, visually polished, and set
"height" appropriately (e.g. 640 for a chess board). Fill realistic content
everywhere; never use lorem ipsum. Respond with ONLY raw JSON — no markdown
fences, no commentary.`;

interface TaskBody {
  task: "plan" | "blueprint" | "change";
  prompt?: string;
  plan?: unknown;
  blueprint?: unknown;
  instruction?: string;
}

function buildPrompt(body: TaskBody): string {
  switch (body.task) {
    case "plan":
      return `You are the planning engine of ForgeAI, an AI app builder.
The user wants to build: """${body.prompt}"""

Produce a build plan as JSON with this exact shape (and nothing else):
{
  "summary": string (one sentence starting "I will build **<name>**, ..."),
  "appType": one of "saas-dashboard"|"landing-page"|"crm"|"booking"|"finance"|"client-portal"|"todo" (pick the closest fit; for games/tools pick "landing-page"),
  "appName": string,
  "stack": ["React 18","TypeScript","Vite","Tailwind CSS"],
  "pages": [string page names],
  "steps": [{"title":str,"detail":str}] (4-6 steps)
}
Respond with ONLY raw JSON.`;

    case "blueprint":
      return `You are the generation engine of ForgeAI, an AI app builder.
The user wants to build: """${body.prompt}"""
The agreed plan is: ${JSON.stringify(body.plan)}
${SCHEMA_DOC}

Generate the full Blueprint JSON for this app now.`;

    case "change":
      return `You are the editing engine of ForgeAI, an AI app builder.
Here is the current app Blueprint:
${JSON.stringify(body.blueprint)}
${SCHEMA_DOC}

The user asks: """${body.instruction}"""

Apply the change and respond with ONLY raw JSON of this shape:
{
  "blueprint": <the FULL updated Blueprint>,
  "message": string (friendly explanation of what you changed),
  "changes": [string] (short bullet list of individual changes)
}
Keep everything you were not asked to change identical.`;
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { code, stdout, stderr } = await run("codex --version", { timeoutMs: 15_000 });
    if (code !== 0) {
      return NextResponse.json({
        ok: false,
        error: `Codex CLI not available (exit ${code}): ${stderr.slice(0, 200)}`,
      });
    }
    return NextResponse.json({ ok: true, version: stdout.trim() });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: `Codex CLI not found. Install with: npm i -g @openai/codex, then run: codex login. (${String(err)})`,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TaskBody;
    if (!body.task || !["plan", "blueprint", "change"].includes(body.task)) {
      return NextResponse.json({ ok: false, error: "Invalid task" }, { status: 400 });
    }
    const output = await runCodex(buildPrompt(body));
    const data = extractJson(output);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
