import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DINGLELOADER — Mods, Modloader & Launcher for DINGLECRAFT",
  description:
    "The unofficial mod platform for DINGLECRAFT, the one-HTML-file voxel sandbox. Browse mods like throwable poop and Clifford the Big Red Dog, launch a modded game in your browser, publish your own mods, and generate AI prompts that teach any external AI the complete DingleMod format.",
  keywords: [
    "DINGLECRAFT",
    "modloader",
    "launcher",
    "mods",
    "dinglemod",
    "Modrinth",
    "voxel sandbox",
    "browser game mods",
  ],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💩</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
