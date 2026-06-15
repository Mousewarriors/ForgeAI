"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForgeStore } from "@/lib/storage/store";
import { EXAMPLE_PROMPTS } from "@/data/examples";

export function Hero() {
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const createProject = useForgeStore((s) => s.createProject);

  function submit(text: string) {
    const idea = text.trim();
    if (!idea || submitting) return;
    setSubmitting(true);
    const id = createProject(idea);
    router.push(`/project/${id}`);
  }

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-40">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] left-[8%] h-[380px] w-[480px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[6%] h-[320px] w-[420px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-7 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI app builder — idea to working app in seconds
        </div>

        <h1 className="animate-fade-in-up text-balance text-5xl font-extrabold tracking-tight md:text-6xl [animation-delay:80ms]">
          What do you want to <span className="text-gradient">build</span>?
        </h1>
        <p className="mx-auto mt-5 max-w-xl animate-fade-in-up text-pretty text-lg text-muted-foreground [animation-delay:160ms]">
          Describe your app in plain English. ForgeAI plans it, generates real
          code, and shows you a live preview you can iterate on through chat.
        </p>

        {/* prompt box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(prompt);
          }}
          className="glass-strong group relative mx-auto mt-10 animate-fade-in-up rounded-2xl p-2 shadow-2xl shadow-primary/10 transition-shadow focus-within:shadow-primary/25 [animation-delay:240ms]"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(prompt);
              }
            }}
            rows={3}
            placeholder="A booking system for my yoga studio with time slots and a services page…"
            className="w-full resize-none bg-transparent px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <div className="flex items-center justify-between px-3 pb-1.5">
            <span className="text-xs text-muted-foreground/60">
              Enter to build · Shift+Enter for newline
            </span>
            <Button
              type="submit"
              size="icon"
              disabled={!prompt.trim() || submitting}
              className="h-9 w-9 rounded-xl shadow-lg shadow-primary/30"
              aria-label="Build app"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* example chips */}
        <div className="mx-auto mt-7 flex max-w-2xl animate-fade-in-up flex-wrap justify-center gap-2 [animation-delay:320ms]">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex.label}
              onClick={() => submit(ex.prompt)}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
