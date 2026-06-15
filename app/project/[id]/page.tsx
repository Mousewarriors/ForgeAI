"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye, FileCode2, Folders, Loader2, Terminal } from "lucide-react";
import { useForgeStore } from "@/lib/storage/store";
import { useHydrated } from "@/lib/storage/use-hydrated";
import { runInitialGeneration, runChatChange } from "@/lib/ai/run";
import { TopBar } from "@/components/workspace/TopBar";
import { Sidebar } from "@/components/workspace/Sidebar";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { CodePanel } from "@/components/workspace/CodePanel";
import { FileExplorer } from "@/components/workspace/FileExplorer";
import { ConsolePanel } from "@/components/workspace/ConsolePanel";
import { GitHubModal } from "@/components/modals/GitHubModal";
import { SupabaseModal } from "@/components/modals/SupabaseModal";
import { DeployModal } from "@/components/modals/DeployModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type ModalId = "github" | "supabase" | "deploy" | null;

export default function WorkspacePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const hydrated = useHydrated();

  const project = useForgeStore((s) => s.projects[projectId]);
  const updateFile = useForgeStore((s) => s.updateFile);
  const clearConsole = useForgeStore((s) => s.clearConsole);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState("preview");
  const [modal, setModal] = useState<ModalId>(null);

  // Kick off generation for freshly created projects.
  useEffect(() => {
    if (hydrated && project?.status === "new") {
      void runInitialGeneration(projectId);
    }
  }, [hydrated, project?.status, projectId]);

  // Auto-select the main file once generated.
  useEffect(() => {
    if (!selectedFile && project && project.files.length > 0) {
      const main =
        project.files.find((f) => f.path === "src/App.tsx") ?? project.files[0];
      setSelectedFile(main.path);
    }
  }, [project, selectedFile]);

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
        <p className="text-muted-foreground">This project does not exist (or was deleted).</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to projects</Button>
        </Link>
      </div>
    );
  }

  function openFile(path: string) {
    setSelectedFile(path);
    setRightTab("code");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar project={project} onOpenModal={setModal} />
      <div className="flex min-h-0 flex-1">
        {/* left sidebar */}
        <div className="hidden lg:flex">
          <Sidebar
            project={project}
            selectedFile={selectedFile}
            onSelectFile={openFile}
            onOpenModal={setModal}
          />
        </div>

        {/* middle: chat */}
        <div className="flex w-full min-w-0 max-w-md flex-col border-r border-border max-md:max-w-[44%]">
          <ChatPanel project={project} onSend={(msg) => void runChatChange(projectId, msg)} />
        </div>

        {/* right: tabs */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
              <TabsList className="h-8 bg-white/[0.04]">
                <TabsTrigger value="preview" className="h-6 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="h-6 text-xs">
                  <FileCode2 className="h-3.5 w-3.5" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="files" className="h-6 text-xs">
                  <Folders className="h-3.5 w-3.5" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="console" className="h-6 text-xs">
                  <Terminal className="h-3.5 w-3.5" />
                  Console
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="min-h-0 flex-1 data-[state=inactive]:hidden">
              <PreviewPanel blueprint={project.blueprint} generating={project.status === "generating"} />
            </TabsContent>
            <TabsContent value="code" className="min-h-0 flex-1 data-[state=inactive]:hidden">
              <CodePanel
                files={project.files}
                selected={selectedFile}
                onChange={(path, content) => updateFile(projectId, path, content)}
              />
            </TabsContent>
            <TabsContent value="files" className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden scrollbar-thin">
              <div className="p-2">
                <FileExplorer files={project.files} selected={selectedFile} onSelect={openFile} />
              </div>
            </TabsContent>
            <TabsContent value="console" className="min-h-0 flex-1 data-[state=inactive]:hidden">
              <ConsolePanel lines={project.consoleLines} onClear={() => clearConsole(projectId)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* modals */}
      <GitHubModal project={project} open={modal === "github"} onOpenChange={(v) => !v && setModal(null)} />
      <SupabaseModal project={project} open={modal === "supabase"} onOpenChange={(v) => !v && setModal(null)} />
      <DeployModal project={project} open={modal === "deploy"} onOpenChange={(v) => !v && setModal(null)} />
    </div>
  );
}
