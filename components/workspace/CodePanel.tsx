"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { FileCode2, Loader2 } from "lucide-react";
import type { AppFile } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading editor…
    </div>
  ),
});

function languageFor(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "javascript";
  return "plaintext";
}

export function CodePanel({
  files,
  selected,
  onChange,
}: {
  files: AppFile[];
  selected: string | null;
  onChange: (path: string, content: string) => void;
}) {
  const file = useMemo(
    () => files.find((f) => f.path === selected) ?? null,
    [files, selected]
  );

  if (!file) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <FileCode2 className="h-9 w-9 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          Select a file from the explorer to view and edit its code.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b border-border bg-white/[0.02] px-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileCode2 className="h-3.5 w-3.5 text-primary/80" />
          {file.path}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <MonacoEditor
          key={file.path}
          height="100%"
          language={languageFor(file.path)}
          theme="vs-dark"
          value={file.content}
          onChange={(value) => onChange(file.path, value ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 12 },
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
