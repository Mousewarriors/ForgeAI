import {
  Bot,
  Eye,
  FileCode2,
  GitBranch,
  History,
  PackageOpen,
} from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "Describe, don't code",
    desc: "Tell ForgeAI what you want in plain English. It plans the app, picks the architecture and writes every file.",
  },
  {
    icon: Eye,
    title: "Live preview",
    desc: "Watch your app render in a sandboxed preview the moment it is generated — and after every change.",
  },
  {
    icon: FileCode2,
    title: "Real code, yours to keep",
    desc: "Every project is a genuine Vite + React + TypeScript codebase with a file explorer and Monaco editor.",
  },
  {
    icon: History,
    title: "Version everything",
    desc: "Every generation and edit becomes a restorable version. Experiment fearlessly, roll back instantly.",
  },
  {
    icon: PackageOpen,
    title: "Export anywhere",
    desc: "Download a ready-to-run zip with install instructions — npm install, npm run dev, done.",
  },
  {
    icon: GitBranch,
    title: "Integrations ready",
    desc: "GitHub sync, Supabase backend and one-click deploy are wired into the workspace, ready to connect.",
  },
];

export function Features() {
  return (
    <section id="how" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          From sentence to shipped
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          A complete build loop: plan, generate, preview, iterate, version,
          export — all in one workspace.
        </p>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass group rounded-2xl p-6 transition-all hover:border-primary/30 hover:bg-white/[0.06]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
