"use client";

import { useMemo, useState } from "react";
import { Loader2, Monitor, RefreshCw, Smartphone } from "lucide-react";
import type { Blueprint } from "@/types";
import { renderPreviewHtml, emptyPreviewHtml } from "@/lib/preview/render";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PreviewPanel({
  blueprint,
  generating,
}: {
  blueprint: Blueprint | null;
  generating: boolean;
}) {
  const [mobile, setMobile] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const html = useMemo(
    () => (blueprint ? renderPreviewHtml(blueprint) : emptyPreviewHtml()),
    [blueprint]
  );

  if (generating && !blueprint) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Forging your app…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-white/[0.02] px-2">
        <div className="ml-1 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-muted-foreground">
            {blueprint ? `${blueprint.name.toLowerCase().replace(/\s+/g, "")}.forgeai.app` : "preview"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", !mobile && "bg-white/[0.07]")}
            onClick={() => setMobile(false)}
            aria-label="Desktop preview"
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", mobile && "bg-white/[0.07]")}
            onClick={() => setMobile(true)}
            aria-label="Mobile preview"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Reload preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 bg-black/30">
        <div
          className={cn(
            "mx-auto h-full transition-all duration-300",
            mobile ? "max-w-[390px] border-x border-border" : "max-w-full"
          )}
        >
          <iframe
            key={reloadKey}
            title="App preview"
            sandbox="allow-scripts"
            srcDoc={html}
            className="h-full w-full border-0 bg-white"
          />
        </div>
        {generating && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="glass-strong flex items-center gap-3 rounded-2xl px-5 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Applying changes…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
