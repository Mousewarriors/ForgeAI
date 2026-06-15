"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  FileCode2,
  History,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useForgeStore } from "@/lib/storage/store";
import { useHydrated } from "@/lib/storage/use-hydrated";
import { renderPreviewHtml } from "@/lib/preview/render";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

export default function HistoryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useHydrated();
  const project = useForgeStore((s) => s.projects[params.id]);
  const restoreVersion = useForgeStore((s) => s.restoreVersion);
  const addConsole = useForgeStore((s) => s.addConsole);
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to projects</Button>
        </Link>
      </div>
    );
  }

  const previewVersion = project.versions.find((v) => v.id === previewId) ?? null;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link href={`/project/${project.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to workspace
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h1 className="font-semibold">{project.name} — version history</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
        {/* versions list */}
        <div className="space-y-2">
          {project.versions.length === 0 ? (
            <div className="glass flex flex-col items-center rounded-2xl px-6 py-16 text-center">
              <History className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No versions yet. Versions are created automatically with every
                generation and change.
              </p>
            </div>
          ) : (
            project.versions.map((v, i) => (
              <div
                key={v.id}
                className={`glass rounded-xl p-4 transition-all ${
                  previewId === v.id ? "border-primary/50" : "hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{v.label}</span>
                  {i === 0 && (
                    <Badge variant="success" className="text-[10px]">
                      current
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{timeAgo(v.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <FileCode2 className="h-3 w-3" />
                    {v.files.length} files
                  </span>
                  <span>{v.blueprint.pages.length} pages</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPreviewId(previewId === v.id ? null : v.id)}
                  >
                    <Eye className="h-3 w-3" />
                    {previewId === v.id ? "Hide preview" : "Preview"}
                  </Button>
                  {i !== 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        restoreVersion(project.id, v.id);
                        addConsole(project.id, "success", `Restored ${v.label}`);
                        router.push(`/project/${project.id}`);
                      }}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* version preview */}
        <div className="glass sticky top-20 hidden h-[calc(100vh-120px)] overflow-hidden rounded-2xl lg:block">
          {previewVersion ? (
            <iframe
              title={`Preview of ${previewVersion.label}`}
              sandbox="allow-scripts"
              srcDoc={renderPreviewHtml(previewVersion.blueprint)}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Eye className="h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Select <span className="text-foreground">Preview</span> on a version to see exactly how
                your app looked at that point.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
