"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Clock,
  FileCode2,
  Flame,
  FolderOpen,
  History,
  Plus,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForgeStore, selectProjects } from "@/lib/storage/store";
import { useHydrated } from "@/lib/storage/use-hydrated";
import { timeAgo } from "@/lib/utils";
import { APP_TYPE_LABELS } from "@/types";
import { EXAMPLE_PROMPTS } from "@/data/examples";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const projects = useForgeStore(selectProjects);
  const createProject = useForgeStore((s) => s.createProject);
  const deleteProject = useForgeStore((s) => s.deleteProject);
  const [prompt, setPrompt] = useState("");

  function submit(text: string) {
    const idea = text.trim();
    if (!idea) return;
    const id = createProject(idea);
    router.push(`/project/${id}`);
  }

  return (
    <main className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500">
              <Flame className="h-4 w-4 text-white" />
            </span>
            ForgeAI
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Your projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start something new or pick up where you left off.
        </p>

        {/* new project prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(prompt);
          }}
          className="glass-strong mt-6 flex items-center gap-2 rounded-2xl p-2 shadow-xl shadow-primary/5"
        >
          <Sparkles className="ml-3 h-4 w-4 shrink-0 text-primary" />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a new app to build…"
            className="h-10 flex-1 bg-transparent text-sm focus:outline-none"
          />
          <Button type="submit" size="icon" disabled={!prompt.trim()} className="h-9 w-9 rounded-xl" aria-label="Create project">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>

        {/* projects grid */}
        {!hydrated ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass h-44 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass mt-10 flex flex-col items-center rounded-3xl px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
              <FolderOpen className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">No projects yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Describe an app above, or try one of these starters:
            </p>
            <div className="mt-5 flex max-w-lg flex-wrap justify-center gap-2">
              {EXAMPLE_PROMPTS.slice(0, 4).map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => submit(ex.prompt)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="glass group relative flex flex-col rounded-2xl p-5 transition-all hover:border-primary/30 hover:bg-white/[0.06]"
              >
                <Link href={`/project/${p.id}`} className="absolute inset-0 z-0" aria-label={`Open ${p.name}`} />
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <FileCode2 className="h-5 w-5" />
                  </div>
                  {p.blueprint && (
                    <Badge variant="secondary" className="text-[10px]">
                      {APP_TYPE_LABELS[p.blueprint.appType]}
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 font-semibold">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {p.prompt}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {timeAgo(p.updatedAt)}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <History className="h-3 w-3" />
                      {p.versions.length} versions
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
                          deleteProject(p.id);
                        }
                      }}
                      className="relative z-10 rounded p-1 text-muted-foreground/60 opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
