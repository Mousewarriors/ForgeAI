/**
 * ForgeAI project store — Zustand with localStorage persistence.
 *
 * Storage strategy: everything (projects, files, versions, chat history)
 * lives in the browser via `persist`. Swapping to server-side JSON storage
 * later only requires replacing the `storage` option with an API-backed
 * adapter.
 */

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppFile,
  Blueprint,
  ChatMessage,
  ConsoleLevel,
  Integrations,
  Project,
  ProjectStatus,
  Version,
} from "@/types";
import { DEFAULT_INTEGRATIONS } from "@/types";
import { uid } from "@/lib/utils";

interface ForgeState {
  projects: Record<string, Project>;
  projectOrder: string[];

  createProject: (prompt: string, name?: string) => string;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
  setBlueprint: (id: string, blueprint: Blueprint) => void;
  setFiles: (id: string, files: AppFile[]) => void;
  updateFile: (id: string, path: string, content: string) => void;
  addMessage: (id: string, msg: Omit<ChatMessage, "id" | "createdAt">) => string;
  addConsole: (id: string, level: ConsoleLevel, text: string) => void;
  clearConsole: (id: string) => void;
  snapshotVersion: (id: string, label: string) => void;
  restoreVersion: (id: string, versionId: string) => void;
  setIntegrations: (id: string, integrations: Partial<Integrations>) => void;
}

function touch(p: Project): Project {
  return { ...p, updatedAt: Date.now() };
}

export const useForgeStore = create<ForgeState>()(
  persist(
    (set, get) => ({
      projects: {},
      projectOrder: [],

      createProject: (prompt, name) => {
        const id = uid("proj");
        const project: Project = {
          id,
          name: name || "Untitled project",
          prompt,
          status: "new",
          blueprint: null,
          files: [],
          versions: [],
          messages: [],
          consoleLines: [],
          integrations: JSON.parse(JSON.stringify(DEFAULT_INTEGRATIONS)),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({
          projects: { ...s.projects, [id]: project },
          projectOrder: [id, ...s.projectOrder],
        }));
        return id;
      },

      deleteProject: (id) =>
        set((s) => {
          const projects = { ...s.projects };
          delete projects[id];
          return {
            projects,
            projectOrder: s.projectOrder.filter((x) => x !== id),
          };
        }),

      renameProject: (id, name) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return { ...s, projects: { ...s.projects, [id]: touch({ ...p, name }) } };
        }),

      setStatus: (id, status) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return { ...s, projects: { ...s.projects, [id]: touch({ ...p, status }) } };
        }),

      setBlueprint: (id, blueprint) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return {
            ...s,
            projects: {
              ...s.projects,
              [id]: touch({ ...p, blueprint, name: blueprint.name }),
            },
          };
        }),

      setFiles: (id, files) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return { ...s, projects: { ...s.projects, [id]: touch({ ...p, files }) } };
        }),

      updateFile: (id, path, content) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          const files = p.files.map((f) => (f.path === path ? { ...f, content } : f));
          return { ...s, projects: { ...s.projects, [id]: touch({ ...p, files }) } };
        }),

      addMessage: (id, msg) => {
        const msgId = uid("msg");
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          const message: ChatMessage = { ...msg, id: msgId, createdAt: Date.now() };
          return {
            ...s,
            projects: {
              ...s.projects,
              [id]: touch({ ...p, messages: [...p.messages, message] }),
            },
          };
        });
        return msgId;
      },

      addConsole: (id, level, text) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          const line = { id: uid("log"), ts: Date.now(), level, text };
          // Keep the console bounded
          const consoleLines = [...p.consoleLines, line].slice(-300);
          return { ...s, projects: { ...s.projects, [id]: { ...p, consoleLines } } };
        }),

      clearConsole: (id) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return { ...s, projects: { ...s.projects, [id]: { ...p, consoleLines: [] } } };
        }),

      snapshotVersion: (id, label) =>
        set((s) => {
          const p = s.projects[id];
          if (!p || !p.blueprint) return s;
          const version: Version = {
            id: uid("ver"),
            label,
            createdAt: Date.now(),
            files: JSON.parse(JSON.stringify(p.files)),
            blueprint: JSON.parse(JSON.stringify(p.blueprint)),
          };
          // Keep the last 25 versions
          const versions = [version, ...p.versions].slice(0, 25);
          return { ...s, projects: { ...s.projects, [id]: touch({ ...p, versions }) } };
        }),

      restoreVersion: (id, versionId) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          const v = p.versions.find((x) => x.id === versionId);
          if (!v) return s;
          return {
            ...s,
            projects: {
              ...s.projects,
              [id]: touch({
                ...p,
                files: JSON.parse(JSON.stringify(v.files)),
                blueprint: JSON.parse(JSON.stringify(v.blueprint)),
                name: v.blueprint.name,
              }),
            },
          };
        }),

      setIntegrations: (id, integrations) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return {
            ...s,
            projects: {
              ...s.projects,
              [id]: touch({
                ...p,
                integrations: { ...p.integrations, ...integrations },
              }),
            },
          };
        }),
    }),
    {
      name: "forgeai-projects",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Ordered projects helper (selector-friendly). */
export function selectProjects(s: ForgeState): Project[] {
  return s.projectOrder.map((id) => s.projects[id]).filter(Boolean);
}
