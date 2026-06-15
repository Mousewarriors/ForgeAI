/**
 * Generation orchestrator — drives the full "AI builds your app" flow:
 * plan → blueprint → files → version snapshot, with staged console output
 * so the workspace feels alive while the (mock) AI works.
 */

"use client";

import { getAIService, getAIProvider } from "@/lib/ai/service";
import { generateProjectFiles } from "@/lib/templates/codegen";
import { useForgeStore } from "@/lib/storage/store";
import { sleep } from "@/lib/utils";
import { APP_TYPE_LABELS } from "@/types";

const inFlight = new Set<string>();

/** Initial prompt → plan → app generation. */
export async function runInitialGeneration(projectId: string): Promise<void> {
  if (inFlight.has(projectId)) return;
  inFlight.add(projectId);

  const store = useForgeStore.getState();
  const project = store.projects[projectId];
  if (!project || project.status !== "new") {
    inFlight.delete(projectId);
    return;
  }

  const { addMessage, addConsole, setStatus, setBlueprint, setFiles, snapshotVersion } =
    useForgeStore.getState();

  try {
    setStatus(projectId, "generating");
    addMessage(projectId, { role: "user", kind: "text", content: project.prompt });
    addConsole(projectId, "info", `Received prompt: "${project.prompt}"`);
    addConsole(projectId, "info", `AI provider: ${getAIProvider() === "codex" ? "OpenAI Codex (subscription)" : "Mock AI (deterministic)"}`);
    addConsole(projectId, "info", "Analyzing idea and selecting app archetype…");

    const ai = getAIService();
    const plan = await ai.generatePlan(project.prompt);

    addConsole(projectId, "success", `Classified as: ${APP_TYPE_LABELS[plan.appType]}`);
    addMessage(projectId, {
      role: "assistant",
      kind: "plan",
      content: plan.summary,
      plan,
    });

    addConsole(projectId, "info", "Generating blueprint…");
    const blueprint = await ai.generateBlueprint(project.prompt, plan);
    setBlueprint(projectId, blueprint);
    addConsole(projectId, "success", `Blueprint ready: ${blueprint.pages.length} pages, ${blueprint.theme.mode} theme, ${blueprint.theme.accentName} accent`);

    addConsole(projectId, "info", "Generating project files…");
    await sleep(600);
    const files = generateProjectFiles(blueprint);
    setFiles(projectId, files);
    for (const f of files.slice(0, 6)) {
      addConsole(projectId, "info", `  wrote ${f.path}`);
    }
    if (files.length > 6) addConsole(projectId, "info", `  …and ${files.length - 6} more files`);
    addConsole(projectId, "success", `Generated ${files.length} files`);

    await sleep(400);
    addConsole(projectId, "info", "Compiling preview…");
    await sleep(500);
    addConsole(projectId, "success", "Preview ready ✓");

    snapshotVersion(projectId, "v1 — Initial generation");
    setStatus(projectId, "ready");

    addMessage(projectId, {
      role: "assistant",
      kind: "changes",
      content: `**${blueprint.name}** is live in the preview. I built ${blueprint.pages.length} pages (${blueprint.pages
        .map((p) => p.name)
        .join(", ")}) with a ${blueprint.theme.mode} ${blueprint.theme.accentName} theme and ${files.length} project files.\n\nKeep iterating — try "make it more premium", "add a pricing page", "add login", or "change the accent to teal".`,
      changes: [
        `${blueprint.pages.length} pages generated`,
        `${files.length} files written`,
        "Version v1 saved",
      ],
      files: files.map((f) => f.path),
    });
  } catch (err) {
    useForgeStore.getState().addConsole(projectId, "error", `Generation failed: ${String(err)}`);
    setStatus(projectId, "ready");
  } finally {
    inFlight.delete(projectId);
  }
}

/** Chat instruction → blueprint mutation → file regeneration → version. */
export async function runChatChange(projectId: string, instruction: string): Promise<void> {
  const store = useForgeStore.getState();
  const project = store.projects[projectId];
  if (!project || !project.blueprint || inFlight.has(projectId)) return;
  inFlight.add(projectId);

  const { addMessage, addConsole, setStatus, setBlueprint, setFiles, snapshotVersion } =
    useForgeStore.getState();

  try {
    setStatus(projectId, "generating");
    addMessage(projectId, { role: "user", kind: "text", content: instruction });
    addConsole(projectId, "info", `Instruction: "${instruction}"`);
    addConsole(projectId, "info", `AI provider: ${getAIProvider() === "codex" ? "OpenAI Codex (subscription)" : "Mock AI (deterministic)"}`);
    addConsole(projectId, "info", "Interpreting change request…");

    const ai = getAIService();
    const result = await ai.applyChange(project.blueprint, instruction);

    setBlueprint(projectId, result.blueprint);
    addConsole(projectId, "info", "Regenerating affected files…");
    await sleep(400);
    const files = generateProjectFiles(result.blueprint);
    setFiles(projectId, files);
    addConsole(projectId, "success", `Updated ${files.length} files`);
    addConsole(projectId, "success", "Preview refreshed ✓");

    const versionNumber = project.versions.length + 1;
    const label = `v${versionNumber} — ${result.changes[0] ?? instruction.slice(0, 40)}`;
    snapshotVersion(projectId, label);
    setStatus(projectId, "ready");

    addMessage(projectId, {
      role: "assistant",
      kind: "changes",
      content: result.message,
      changes: result.changes,
      files: files.map((f) => f.path),
    });
  } catch (err) {
    useForgeStore.getState().addConsole(projectId, "error", `Change failed: ${String(err)}`);
    setStatus(projectId, "ready");
  } finally {
    inFlight.delete(projectId);
  }
}
