"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Database,
  FileCode2,
  Flame,
  FolderKanban,
  Folders,
  Github,
  History,
  Plug,
  Plus,
  Rocket,
  RotateCcw,
} from "lucide-react";
import type { Project } from "@/types";
import { useForgeStore, selectProjects } from "@/lib/storage/store";
import { FileExplorer } from "@/components/workspace/FileExplorer";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";

type SidebarTab = "projects" | "files" | "versions" | "integrations";

const TABS: { id: SidebarTab; icon: typeof Folders; label: string }[] = [
  { id: "projects", icon: Folders, label: "Projects" },
  { id: "files", icon: FileCode2, label: "Files" },
  { id: "versions", icon: History, label: "Versions" },
  { id: "integrations", icon: Plug, label: "Integrations" },
];

export function Sidebar({
  project,
  selectedFile,
  onSelectFile,
  onOpenModal,
}: {
  project: Project;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onOpenModal: (modal: "github" | "supabase" | "deploy") => void;
}) {
  const [tab, setTab] = useState<SidebarTab>("files");
  const projects = useForgeStore(selectProjects);
  const restoreVersion = useForgeStore((s) => s.restoreVersion);
  const addConsole = useForgeStore((s) => s.addConsole);

  const integrations = project.integrations;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-white/[0.015]">
      {/* logo */}
      <Link
        href="/dashboard"
        className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 font-bold"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-fuchsia-500">
          <Flame className="h-3.5 w-3.5 text-white" />
        </span>
        <span className="text-sm">ForgeAI</span>
      </Link>

      {/* tab strip */}
      <div className="flex shrink-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            title={t.label}
            className={cn(
              "flex flex-1 items-center justify-center py-2.5 transition-colors",
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {/* PROJECTS */}
        {tab === "projects" && (
          <div className="p-2">
            <Link
              href="/dashboard"
              className="mb-2 flex items-center gap-2 rounded-lg border border-dashed border-white/[0.12] px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </Link>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/project/${p.id}`}
                className={cn(
                  "mb-1 flex items-start gap-2.5 rounded-lg px-3 py-2 transition-colors",
                  p.id === project.id
                    ? "bg-primary/15"
                    : "hover:bg-white/[0.04]"
                )}
              >
                <FolderKanban
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    p.id === project.id ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{p.name}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {timeAgo(p.updatedAt)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* FILES */}
        {tab === "files" && (
          <FileExplorer files={project.files} selected={selectedFile} onSelect={onSelectFile} />
        )}

        {/* VERSIONS */}
        {tab === "versions" && (
          <div className="p-2">
            {project.versions.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-10 text-center">
                <History className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Versions are created automatically with each generation and change.
                </p>
              </div>
            ) : (
              <>
                <Link
                  href={`/project/${project.id}/history`}
                  className="mb-2 block rounded-lg border border-white/[0.08] px-3 py-2 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  View full history →
                </Link>
                {project.versions.map((v, i) => (
                  <div
                    key={v.id}
                    className="group mb-1 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-white/[0.08] hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-medium">{v.label}</span>
                      {i === 0 && (
                        <Badge variant="success" className="ml-2 shrink-0 px-1.5 text-[9px]">
                          latest
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(v.createdAt)} · {v.files.length} files
                      </span>
                      {i !== 0 && (
                        <button
                          onClick={() => {
                            restoreVersion(project.id, v.id);
                            addConsole(project.id, "success", `Restored ${v.label}`);
                          }}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-all hover:text-primary group-hover:opacity-100"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* INTEGRATIONS */}
        {tab === "integrations" && (
          <div className="space-y-2 p-2">
            <button
              onClick={() => onOpenModal("github")}
              className="flex w-full items-center gap-3 rounded-lg border border-white/[0.08] px-3 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <Github className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium">GitHub</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {integrations.github.connected
                    ? integrations.github.repo
                    : "Sync your code to a repo"}
                </span>
              </span>
              {integrations.github.connected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => onOpenModal("supabase")}
              className="flex w-full items-center gap-3 rounded-lg border border-white/[0.08] px-3 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <Database className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium">Supabase</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {integrations.supabase.connected
                    ? "Connected — backend enabled"
                    : "Auth, database & storage"}
                </span>
              </span>
              {integrations.supabase.connected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => onOpenModal("deploy")}
              className="flex w-full items-center gap-3 rounded-lg border border-white/[0.08] px-3 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <Rocket className="h-4 w-4 shrink-0 text-sky-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium">Deploy</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {integrations.deploy.deployed
                    ? integrations.deploy.url.replace("https://", "")
                    : "Ship to the web in one click"}
                </span>
              </span>
              {integrations.deploy.deployed && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
