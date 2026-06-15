"use client";

import { useState } from "react";
import { Check, Github, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function GitHubModal({
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
  const [repo, setRepo] = useState(slugify(project.name));
  const [isPrivate, setIsPrivate] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const connected = project.integrations.github.connected;

  async function connect() {
    setConnecting(true);
    // Placeholder: a real implementation would run the GitHub OAuth device
    // flow here, then create the repo and push via the REST API.
    await sleep(1200);
    setIntegrations(project.id, {
      github: { connected: true, repo: `you/${repo || slugify(project.name)}` },
    });
    addConsole(project.id, "success", `GitHub linked: you/${repo} (placeholder)`);
    setConnecting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub sync
          </DialogTitle>
          <DialogDescription>
            Push this project to a GitHub repository and keep it in sync with
            every change. This is a placeholder — real OAuth and repo creation
            will be wired up later.
          </DialogDescription>
        </DialogHeader>

        {connected ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <Check className="h-4 w-4" />
              Connected to {project.integrations.github.repo}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Changes will sync automatically once real GitHub integration ships.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setIntegrations(project.id, { github: { connected: false, repo: "" } });
                addConsole(project.id, "info", "GitHub disconnected");
              }}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gh-repo">Repository name</Label>
              <Input
                id="gh-repo"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="my-app"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Private repository</p>
                <p className="text-xs text-muted-foreground">Only you can see this repo</p>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
            <Button onClick={connect} disabled={connecting} className="w-full">
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Github className="h-4 w-4" />
                  Connect GitHub
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/70">
              No real authentication happens — this is a demo placeholder.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
