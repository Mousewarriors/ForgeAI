"use client";

import { useState } from "react";
import { Check, Database, HardDrive, KeyRound, Loader2, Zap } from "lucide-react";
import type { Project } from "@/types";
import { useForgeStore } from "@/lib/storage/store";
import { generateProjectFiles } from "@/lib/templates/codegen";
import { sleep } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const OPTIONS = [
  { key: "auth" as const, icon: KeyRound, label: "Auth", desc: "Email, OAuth and magic-link sign-in" },
  { key: "database" as const, icon: Database, label: "Database", desc: "Postgres with row-level security" },
  { key: "storage" as const, icon: HardDrive, label: "Storage", desc: "File uploads and CDN delivery" },
  { key: "edgeFunctions" as const, icon: Zap, label: "Edge Functions", desc: "Server-side logic at the edge" },
];

export function SupabaseModal({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setIntegrations = useForgeStore((s) => s.setIntegrations);
  const setBlueprint = useForgeStore((s) => s.setBlueprint);
  const setFiles = useForgeStore((s) => s.setFiles);
  const addConsole = useForgeStore((s) => s.addConsole);
  const snapshotVersion = useForgeStore((s) => s.snapshotVersion);

  const current = project.integrations.supabase;
  const [opts, setOpts] = useState({
    auth: current.connected ? current.auth : true,
    database: current.connected ? current.database : true,
    storage: current.storage,
    edgeFunctions: current.edgeFunctions,
  });
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    if (!project.blueprint) return;
    setConnecting(true);
    // Placeholder: real integration would create/link a Supabase project via
    // their management API and store the URL + anon key.
    await sleep(1100);
    setIntegrations(project.id, {
      supabase: { connected: true, ...opts },
    });

    // Generate the placeholder Supabase client file into the project.
    const bp = JSON.parse(JSON.stringify(project.blueprint)) as typeof project.blueprint;
    bp.features.supabase = { enabled: true, ...opts };
    if (opts.auth) bp.features.auth = true;
    setBlueprint(project.id, bp);
    setFiles(project.id, generateProjectFiles(bp));
    snapshotVersion(project.id, `v${project.versions.length + 1} — Supabase connected`);

    addConsole(project.id, "success", "Supabase connected (placeholder)");
    addConsole(project.id, "info", "  wrote src/lib/supabase.ts");
    addConsole(project.id, "info", "  wrote .env.example");
    setConnecting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            Connect Supabase
          </DialogTitle>
          <DialogDescription>
            Add a backend to your generated app. Enabling this writes a
            placeholder Supabase client into your project files — real project
            provisioning comes later.
          </DialogDescription>
        </DialogHeader>

        {current.connected ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Check className="h-4 w-4" />
              Supabase connected
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Enabled: {OPTIONS.filter((o) => current[o.key]).map((o) => o.label).join(", ") || "none"}.
              Your project now contains <code className="text-foreground/80">src/lib/supabase.ts</code>.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setIntegrations(project.id, {
                  supabase: { connected: false, auth: false, database: false, storage: false, edgeFunctions: false },
                });
                addConsole(project.id, "info", "Supabase disconnected");
              }}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {OPTIONS.map((o) => (
                <div key={o.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <o.icon className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium">{o.label}</p>
                      <p className="text-xs text-muted-foreground">{o.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={opts[o.key]}
                    onCheckedChange={(v) => setOpts((s) => ({ ...s, [o.key]: v }))}
                  />
                </div>
              ))}
            </div>
            <Button
              onClick={connect}
              disabled={connecting || !project.blueprint}
              className="w-full bg-emerald-600 hover:bg-emerald-600/90"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Provisioning…
                </>
              ) : (
                "Connect Supabase"
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/70">
              Placeholder only — generates a client file, no real backend is created.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
