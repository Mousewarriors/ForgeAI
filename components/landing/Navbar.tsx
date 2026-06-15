"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 shadow-lg shadow-primary/30">
            <Flame className="h-[18px] w-[18px] text-white" />
          </span>
          <span className="text-lg">ForgeAI</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Projects
          </Link>
          <Link href="/settings" className="transition-colors hover:text-foreground">
            Settings
          </Link>
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button size="sm" className="shadow-lg shadow-primary/25">
              Open studio
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
