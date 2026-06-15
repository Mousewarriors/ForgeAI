import Link from "next/link";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-fuchsia-500">
            <Flame className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="font-semibold text-foreground">ForgeAI</span>
          <span>· Build apps by describing them</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Projects
          </Link>
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
          <span className="text-muted-foreground/50">© 2026 ForgeAI</span>
        </div>
      </div>
    </footer>
  );
}
