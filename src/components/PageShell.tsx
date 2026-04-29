import { motion } from "framer-motion";
import { Navbar } from "./Navbar";

export const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <motion.main initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex-1 px-4 py-8 md:py-12">
      {children}
    </motion.main>
  </div>
);
