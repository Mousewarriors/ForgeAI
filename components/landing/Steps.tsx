const STEPS = [
  {
    n: "01",
    title: "Describe your idea",
    desc: "“A booking system for my salon with services and time slots.” That is all it takes.",
  },
  {
    n: "02",
    title: "AI plans & generates",
    desc: "ForgeAI produces a structured build plan, then writes a complete typed React codebase.",
  },
  {
    n: "03",
    title: "Iterate through chat",
    desc: "“Make it darker. Add pricing. Add login.” Watch the live preview update with every message.",
  },
  {
    n: "04",
    title: "Export or deploy",
    desc: "Download the project as a zip, sync to GitHub, connect Supabase or deploy in one click.",
  },
];

export function Steps() {
  return (
    <section className="px-6 pb-8">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className="glass relative animate-fade-in-up rounded-2xl p-6"
            style={{ animationDelay: `${i * 90 + 400}ms` }}
          >
            <div className="text-xs font-bold tracking-widest text-primary/80">
              {s.n}
            </div>
            <h3 className="mt-2 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
