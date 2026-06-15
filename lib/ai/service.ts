/**
 * AI service abstraction.
 *
 * ForgeAI talks to "the AI" exclusively through this interface. Two
 * implementations ship today:
 *
 *  - MockAIService  — deterministic template engine, zero cost, offline
 *  - CodexAIService — real LLM via the locally installed OpenAI Codex CLI,
 *                     authenticated with your ChatGPT subscription OAuth
 *                     (see app/api/ai/route.ts for setup)
 *
 * The active provider is chosen in Settings and stored in localStorage.
 * Adding another provider (Anthropic API, Ollama, …) means implementing
 * `AIService` and adding a case to `getAIService()`. A real implementation
 * should return the same structured outputs (BuildPlan / Blueprint /
 * ChangeResult) so the codegen + preview pipeline needs zero changes.
 */

import type { Blueprint, BuildPlan } from "@/types";
import { MockAIService } from "./mock-ai";
import { CodexAIService } from "./codex-ai";

export interface ChangeResult {
  /** The mutated blueprint */
  blueprint: Blueprint;
  /** Assistant chat message explaining what changed */
  message: string;
  /** Human-readable list of individual changes */
  changes: string[];
}

export interface AIService {
  /** Step 1: turn a natural-language idea into a structured build plan. */
  generatePlan(prompt: string): Promise<BuildPlan>;

  /** Step 2: turn the plan + prompt into a full app blueprint. */
  generateBlueprint(prompt: string, plan: BuildPlan): Promise<Blueprint>;

  /** Step 3..n: apply a chat instruction to an existing blueprint. */
  applyChange(blueprint: Blueprint, instruction: string): Promise<ChangeResult>;
}

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

export type AIProvider = "mock" | "codex";

const PROVIDER_KEY = "forgeai-ai-provider";

export function getAIProvider(): AIProvider {
  if (typeof window === "undefined") return "mock";
  const v = localStorage.getItem(PROVIDER_KEY);
  return v === "codex" ? "codex" : "mock";
}

export function setAIProvider(provider: AIProvider): void {
  localStorage.setItem(PROVIDER_KEY, provider);
}

const instances: Partial<Record<AIProvider, AIService>> = {};

export function getAIService(): AIService {
  const provider = getAIProvider();
  if (!instances[provider]) {
    // TODO(LLM): add further providers here, e.g.:
    //   instance = new AnthropicAIService(...)  // direct API key
    //   instance = new OllamaAIService("http://localhost:11434")
    instances[provider] =
      provider === "codex" ? new CodexAIService() : new MockAIService();
  }
  return instances[provider]!;
}
