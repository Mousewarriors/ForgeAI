"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { AppFile } from "@/types";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFile: boolean;
}

function buildTree(files: AppFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [], isFile: false };
  for (const file of files) {
    const parts = file.path.split("/");
    let node = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i];
      const isFile = i === parts.length - 1;
      let child = node.children.find((c) => c.name === parts[i] && c.isFile === isFile);
      if (!child) {
        child = { name: parts[i], path: acc, children: [], isFile };
        node.children.push(child);
      }
      node = child;
    }
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) =>
      a.isFile === b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1
    );
    nodes.forEach((n) => sort(n.children));
  };
  sort(root.children);
  return root.children;
}

function FileIcon({ name }: { name: string }) {
  if (name.endsWith(".json")) return <FileJson className="h-3.5 w-3.5 text-amber-400/80" />;
  if (name.endsWith(".md")) return <FileText className="h-3.5 w-3.5 text-sky-400/80" />;
  if (name.endsWith(".css") || name.endsWith(".html"))
    return <FileCode2 className="h-3.5 w-3.5 text-rose-400/80" />;
  return <FileCode2 className="h-3.5 w-3.5 text-primary/80" />;
}

function TreeRow({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.isFile) {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-xs transition-colors",
          selected === node.path
            ? "bg-primary/15 text-foreground"
            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 14 + 24}px` }}
      >
        <FileIcon name={node.name} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open ? (
          <FolderOpen className="h-3.5 w-3.5 text-amber-300/70" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-amber-300/70" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open &&
        node.children.map((c) => (
          <TreeRow key={c.path + (c.isFile ? ":f" : ":d")} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
        ))}
    </div>
  );
}

export function FileExplorer({
  files,
  selected,
  onSelect,
}: {
  files: AppFile[];
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = useMemo(() => buildTree(files), [files]);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <Folder className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-xs text-muted-foreground">
          No files yet — they will appear here once your app is generated.
        </p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {tree.map((n) => (
        <TreeRow key={n.path + (n.isFile ? ":f" : ":d")} node={n} depth={0} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}
