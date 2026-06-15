"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the component is mounted on the client. Store-backed UI
 * renders only after this flips, avoiding SSR/localStorage hydration
 * mismatches.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
