"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  CheckCircle2,
  FileCode2,
  ListChecks,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import type { ChatMessage, Project } from "@/types";
import { APP_TYPE_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Make it darker",
  "Make it more premium",
  "Add a pricing page",
  "Add login",
  "Add a dashboard chart",
  "Change the accent to teal",
];

/** Minimal markdown-ish renderer: handles **bold** only. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function PlanCard({ msg }: { msg: ChatMessage }) {
  const plan = msg.plan!;
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.06]">
      <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/10 px-4 py-2.5">
        <ListChecks className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Build plan — {plan.appName}</span>
        <Badge className="ml-auto text-[10px]">{APP_TYPE_LABELS[plan.appType]}</Badge>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {plan.stack.map((s) => (
            <span key={s} className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
        <ol className="space-y-2">
          {plan.steps.map((step, i) => (
            <li key={step.title} className="flex gap-3 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <span>
                <span className="font-medium">{step.title}</span>
                <span className="text-muted-foreground"> — {step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ChangesCard({ msg }: { msg: ChatMessage }) {
  return (
    <div className="mt-3 space-y-1.5">
      {msg.changes?.map((c) => (
        <div key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          {c}
        </div>
      ))}
      {msg.files && msg.files.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
          <FileCode2 className="h-3 w-3" />
          {msg.files.length} files in project
        </div>
      )}
    </div>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-white/[0.08]" : "bg-gradient-to-br from-primary to-fuchsia-500 shadow-md shadow-primary/30"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-white" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary/15 text-foreground"
            : "rounded-tl-sm border border-white/[0.06] bg-white/[0.03]"
        )}
      >
        <div className="whitespace-pre-wrap text-foreground/90">
          <RichText text={msg.content} />
        </div>
        {msg.kind === "plan" && msg.plan && <PlanCard msg={msg} />}
        {msg.kind === "changes" && <ChangesCard msg={msg} />}
      </div>
    </div>
  );
}

export function ChatPanel({
  project,
  onSend,
}: {
  project: Project;
  onSend: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const generating = project.status === "generating";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project.messages.length, generating]);

  function send(text: string) {
    const t = text.trim();
    if (!t || generating) return;
    setDraft("");
    onSend(t);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-4">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Builder
        </span>
      </div>

      {/* messages */}
      <div className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {project.messages.length === 0 && !generating && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Describe what you want to build and I will generate it.
            </p>
          </div>
        )}
        {project.messages.map((m) => (
          <Message key={m.id} msg={m} />
        ))}
        {generating && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Working on it…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* suggestions */}
      {project.status === "ready" && (
        <div className="scrollbar-thin flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="shrink-0 border-t border-border p-3"
      >
        <div className="glass flex items-end gap-2 rounded-xl p-1.5 focus-within:border-primary/40">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={2}
            disabled={generating}
            placeholder={generating ? "Generating…" : "Ask for changes — “make it darker”, “add a pricing page”…"}
            className="max-h-32 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!draft.trim() || generating}
            className="h-8 w-8 shrink-0 rounded-lg"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
