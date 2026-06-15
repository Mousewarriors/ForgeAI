"use client";

import { useState } from "react";
import { Check, Cloud, ExternalLink, Globe, Loader2, Rocket, Triangle } from "lucide-react";
import type { Project } from "@/types";
import { useForgeStore } from "@/lib/storage/store";
import { slugify, sleep } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { id: "vercel", label: "Vercel", icon: Triangle, desc: "Zero-config, edge network" },
  { id: "netlify", label: "Netlify", icon: Globe, desc: "Git-based deploys" },
  { id: "forge-cloud", label: "Forge Cloud", icon: Cloud, desc: "One-click managed hosting" },
];

const STAGES = [
  "Queued",
  "Installing dependencies…",
  "Building production bundle…",
  "Optimizing assets…",
  "Uploading to edge network…",
  "Assigning domain…",
];

export function DeployModal({
  project,
  open,
  onOpenChange,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setIntegrations = useForgeStore((s) => s.setIntegrations);
  const addConsole = useForgeStore((s) => s.addConsole);
  const [provider, setProvider] = useState("vercel");
  const [deploying, setDeploying] = useState(false);
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const deployed = project.integrations.deploy.deployed;
  const url = `https://${slugify(project.name)}.forgeai.app`;

  async function deploy() {
    setDeploying(true);
    addConsole(project.id, "info", `Deploying to ${provider} (simulated)…`);
    // Fake but convincing deployment progress.
    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      setProgress(Math.round(((i + 0.5) / STAGES.length) * 100));
      addConsole(project.id, "info", `  ${STAGES[i]}`);
      await sleep(550 + Math.random() * 450);
    }
    setProgress(100);
    await sleep(350);
    setIntegrations(project.id, {
      deploy: { deployed: true, url, provider },
    });
    addConsole(project.id, "success", `Deployed: ${url} (placeholder)`);
    setDeploying(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !deploying && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy {project.name}
          </DialogTitle>
          <DialogDescription>
            Ship your app to the web. This is a simulated deployment — real
            provider hooks will be added later.
          </DialogDescription>
        </DialogHeader>

        {deployed && !deploying ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Check className="h-4 w-4" />
              Live on {project.integrations.deploy.provider}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-black/30 px-3 py-2">
              <code className="text-xs text-foreground/90">{project.integrations.deploy.url}</code>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={deploy}>
                <Rocket className="h-3.5 w-3.5" />
                Redeploy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIntegrations(project.id, { deploy: { deployed: false, url: "", provider: "" } });
                  addConsole(project.id, "info", "Deployment removed");
                }}
              >
                Take offline
              </Button>
            </div>
          </div>
        ) : deploying ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">{STAGES[stage]}</p>
                <p className="text-xs text-muted-foreground">
                  Deploying to {PROVIDERS.find((p) => p.id === provider)?.label}
                </p>
              </div>
            </div>
            <Progress value={progress} />
            <p className="text-center text-xs text-muted-foreground">{progress}%</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    provider === p.id
                      ? "border-primary/60 bg-primary/10"
                      : "border-border hover:border-white/20"
                  )}
                >
                  <p.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{p.label}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">{p.desc}</span>
                </button>
              ))}
            </div>
            <div className="rounded-lg bg-black/30 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">Your app will be live at</p>
              <code className="text-xs text-foreground/90">{url}</code>
            </div>
            <Button onClick={deploy} disabled={project.files.length === 0} className="w-full">
              <Rocket className="h-4 w-4" />
              Deploy now
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
