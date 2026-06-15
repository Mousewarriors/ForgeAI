"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Database,
  Flame,
  Github,
  HardDriveDownload,
  Rocket,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForgeStore, selectProjects } from "@/lib/storage/store";
import { useHydrated } from "@/lib/storage/use-hydrated";
import { getAIProvider, setAIProvider, type AIProvider } from "@/lib/ai/service";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const hydrated = useHydrated();
  const projects = useForgeStore(selectProjects);
  const [provider, setProvider] = useState<AIProvider>("mock");
  const [codexStatus, setCodexStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (hydrated) setProvider(getAIProvider());
  }, [hydrated]);

  function chooseProvider(p: AIProvider) {
    setProvider(p);
    setAIProvider(p);
  }

  async function testCodex() {
    setChecking(true);
    setCodexStatus(null);
    try {
      const res = await fetch("/api/ai");
      const json = (await res.json()) as { ok: boolean; version?: string; error?: string };
      setCodexStatus(json.ok ? `✓ Codex CLI ready — ${json.version}` : `✗ ${json.error}`);
    } catch (err) {
      setCodexStatus(`✗ Bridge unreachable: ${String(err)}`);
    } finally {
      setChecking(false);
    }
  }

  function clearAll() {
    if (
      confirm(
        "Delete ALL projects and reset ForgeAI? This clears local storage and cannot be undone."
      )
    ) {
      localStorage.removeItem("forgeai-projects");
      window.location.href = "/dashboard";
    }
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="font-semibold">Settings & integrations</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        {/* AI provider */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">AI engine</h2>
              <p className="text-xs text-muted-foreground">
                The model that plans, generates and edits your apps
              </p>
            </div>
            <Badge className="ml-auto">
              {provider === "codex" ? "Codex — ChatGPT subscription" : "Mock AI — deterministic"}
            </Badge>
          </div>
          <div className="mt-5 space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => chooseProvider("mock")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  provider === "mock" ? "border-primary/60 bg-primary/10" : "border-border hover:border-white/20"
                )}
              >
                <p className="text-sm font-medium">Mock AI</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Deterministic template engine. Instant, free, offline. Supports
                  the 7 built-in app archetypes.
                </p>
              </button>
              <button
                onClick={() => chooseProvider("codex")}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  provider === "codex" ? "border-primary/60 bg-primary/10" : "border-border hover:border-white/20"
                )}
              >
                <p className="text-sm font-medium">OpenAI Codex (your subscription)</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Real LLM via the local Codex CLI, billed to your ChatGPT plan.
                  Builds anything — including games and custom tools.
                </p>
              </button>
            </div>

            {provider === "codex" && (
              <div className="space-y-3 rounded-lg bg-white/[0.03] p-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">One-time setup</span> (in any terminal):
                </p>
                <pre className="overflow-x-auto rounded-md bg-black/40 p-3 text-xs text-foreground/90">
{`npm install -g @openai/codex
codex login   # sign in with your ChatGPT account`}
                </pre>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Optionally set <code className="text-foreground/80">CODEX_MODEL=gpt-5.5-codex</code> in{" "}
                  <code className="text-foreground/80">.env.local</code> to pin the model. Generations take
                  20–90s. If Codex is unreachable, ForgeAI automatically falls back to the mock engine.
                </p>
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={testCodex} disabled={checking}>
                    {checking ? "Checking…" : "Test connection"}
                  </Button>
                  {codexStatus && (
                    <span
                      className={cn(
                        "text-xs",
                        codexStatus.startsWith("✓") ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {codexStatus}
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="rounded-lg bg-white/[0.03] p-3 text-xs leading-relaxed text-muted-foreground">
              Both providers implement the same{" "}
              <code className="text-foreground/80">AIService</code> interface in{" "}
              <code className="text-foreground/80">lib/ai/service.ts</code>. Adding
              Anthropic/Ollama/etc. means one new class and one switch case — the
              codegen, preview and versioning pipeline is provider-agnostic.
            </p>
          </div>
        </section>

        {/* integrations */}
        <section className="glass rounded-2xl p-6">
          <h2 className="font-semibold">Workspace integrations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Connections are managed per-project from the builder workspace. These
            are placeholders for the real services.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <Github className="h-5 w-5" />
              <h3 className="mt-3 text-sm font-medium">GitHub sync</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Push generated code to a repo. OAuth flow coming soon.
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <Database className="h-5 w-5 text-emerald-400" />
              <h3 className="mt-3 text-sm font-medium">Supabase</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Auth, database, storage and edge functions for generated apps.
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <Rocket className="h-5 w-5 text-sky-400" />
              <h3 className="mt-3 text-sm font-medium">Deploy</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                One-click deploys to Vercel, Netlify or Forge Cloud.
              </p>
            </div>
          </div>
        </section>

        {/* storage */}
        <section className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <HardDriveDownload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Storage</h2>
              <p className="text-xs text-muted-foreground">
                Projects are stored locally in your browser (localStorage)
              </p>
            </div>
            {hydrated && (
              <Badge variant="secondary" className="ml-auto">
                {projects.length} project{projects.length === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Reset workspace</p>
              <p className="text-xs text-muted-foreground">
                Delete all projects, versions and chat history
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear everything
            </Button>
          </div>
        </section>

        <p className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground/60">
          <Flame className="h-3.5 w-3.5" />
          ForgeAI v0.1 — local-first AI app builder
        </p>
      </div>
    </main>
  );
}
