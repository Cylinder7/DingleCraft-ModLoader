"use client";

import { useDingle } from "@/lib/store";
import { Nav } from "@/components/dingle/nav";
import { BrowseView } from "@/components/dingle/browse";
import { ModDetailView } from "@/components/dingle/mod-detail";
import { LauncherView } from "@/components/dingle/launcher";
import { UploadView } from "@/components/dingle/upload";
import { ForgeView } from "@/components/dingle/forge";
import { Footer } from "@/components/dingle/footer";
import { motion, AnimatePresence } from "framer-motion";

export default function Page() {
  const view = useDingle((s) => s.view);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Nav />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.name + ("slug" in view ? view.slug : "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {view.name === "browse" && <BrowseView />}
            {view.name === "mod" && <ModDetailView slug={view.slug} />}
            {view.name === "launch" && <LauncherView />}
            {view.name === "upload" && <UploadView />}
            {view.name === "forge" && <ForgeView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
