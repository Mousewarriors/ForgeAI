import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ForgeAI — Build apps by describing them",
  description:
    "ForgeAI turns plain-English ideas into working web apps. Describe it, preview it live, iterate through chat, and export real code.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${inter.className}`}>{children}</body>
    </html>
  );
}
