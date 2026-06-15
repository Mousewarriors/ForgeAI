"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Database,
  Download,
  Github,
  Loader2,
  Rocket,
  Save,
} from "lucide-react";
import type { Project } from "@/types";
import { useForgeStore } from "@/lib/storage/store";
import { exportProjectZip } from "@/lib/export/zip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TopBar({
  project,
  onOpenModal,
}: {
  project: Project;
  onOpenModal: (modal: "github" | "supabase" | "deploy") => void;
}) {
  const renameProject = useForgeStore((s) => s.renameProject);
  const snapshotVersion = useForgeStore((s) => s.snapshotVersion);
  const addConsole = useForgeStore((s) => s.addConsole);
  const [name, setName] = useState(project.name);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editing, setEditing] = useState(false);

  // Keep local name in sync when the AI renames the project
  useEffect(() => {
    if (!editing) setName(project.name);
  }, [project.name, editing]);

  function handleSave() {
    if (!project.blueprint) return;
    snapshotVersion(project.id, `v${project.versions.length + 1} — Manual save`);
    addConsole(project.id, "success", "Version saved manually");
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function handleExport() {
    if (project.files.length === 0 || exporting) return;
    setExporting(true);
    addConsole(project.id, "info", "Bundling project into zip…");
    try {
      await exportProjectZip(project);
      addConsole(project.id, "success", `Exported ${project.files.length} files as zip`);
    } catch (err) {
      addConsole(project.id, "error", `Export failed: ${String(err)}`);
    } finally {
      setExporting(false);
    }
  }

  const ready = project.status === "ready" && project.files.length > 0;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-white/[0.015] px-3">
      <div className="flex min-w-0 items-center gap-2">
        <input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false);
            const n = name.trim();
            if (n && n !== project.name) renameProject(project.id, n);
            else setName(project.name);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="w-44 truncate rounded-md bg-transparent px-2 py-1 text-sm font-semibold focus:bg-white/[0.05] focus:outline-none focus:ring-1 focus:ring-primary/50 md:w-60"
          aria-label="Project name"
        />
        {project.status === "generating" ? (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            generating
          </Badge>
        ) : (
          <Badge variant="success" className="text-[10px]">
            ready
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={handleSave} disabled={!ready} className="hidden sm:inline-flex">
          {saved ? <Check className="h-4 w-4 text-emerald-400" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save"}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport} disabled={!ready}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <Button variant="outline" size="sm" onClick={() => onOpenModal("github")} className="hidden md:inline-flex">
          <Github className="h-4 w-4" />
          GitHub
        </Button>
        <Button variant="outline" size="sm" onClick={() => onOpenModal("supabase")} className="hidden md:inline-flex">
          <Database className="h-4 w-4 text-emerald-400" />
          Supabase
        </Button>
        <Button size="sm" onClick={() => onOpenModal("deploy")} disabled={!ready} className="shadow-md shadow-primary/25">
          <Rocket className="h-4 w-4" />
          Deploy
        </Button>
      </div>
    </header>
  );
}
