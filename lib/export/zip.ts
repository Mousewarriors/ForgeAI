/**
 * Project export — bundles all generated files into a downloadable zip
 * using JSZip, entirely client-side.
 */

"use client";

import JSZip from "jszip";
import type { Project } from "@/types";
import { slugify } from "@/lib/utils";

export async function exportProjectZip(project: Project): Promise<void> {
  const zip = new JSZip();
  const root = slugify(project.name);
  const folder = zip.folder(root);
  if (!folder) throw new Error("Failed to create zip folder");

  for (const file of project.files) {
    folder.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${root}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
