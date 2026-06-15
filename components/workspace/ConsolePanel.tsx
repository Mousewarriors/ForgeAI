"use client";

import { useEffect, useRef } from "react";
import { Ban, Terminal } from "lucide-react";
import type { ConsoleLine } from "@/types";
import { Button } from "@/components/ui/button";
import { cn, formatTime } from "@/lib/utils";

const LEVEL_COLORS: Record<ConsoleLine["level"], string> = {
  info: "text-muted-foreground",
  success: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-rose-400",
};

export function ConsolePanel({
  lines,
  onClear,
}: {
  lines: ConsoleLine[];
  onClear: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-white/[0.02] px-3">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          Build console
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClear}>
          <Ban className="h-3 w-3" />
          Clear
        </Button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-black/40 p-3 font-mono text-xs leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-muted-foreground/50">
            Console output from generations and changes will appear here.
          </p>
        ) : (
          lines.map((l) => (
            <div key={l.id} className="flex gap-3">
              <span className="shrink-0 text-muted-foreground/40">{formatTime(l.ts)}</span>
              <span className={cn(LEVEL_COLORS[l.level], "whitespace-pre-wrap break-all")}>
                {l.text}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
