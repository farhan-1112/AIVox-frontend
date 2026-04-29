import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, User, UserPlus, LogOut, ChevronDown, AudioLines } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/record", label: "Record" },
  { to: "/meeting", label: "Meeting" },
];

export const Navbar = () => {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleItemClick = (label: string) => {
    if (label === "Account") {
      navigate("/login");
    } else if (label === "New Account") {
      navigate("/signup");
    } else if (label === "Logout") {
      localStorage.removeItem("aivox_token");
      localStorage.removeItem("aivox_user");
      toast.success("Logged out successfully!");
      navigate("/login");
    }
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userStr = localStorage.getItem("aivox_user");
  let userName = "Login / Signup";
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.name) userName = parsed.name;
    } catch (e) {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <nav className="glass-strong mx-auto max-w-6xl rounded-2xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <AudioLines className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight gradient-text">AIVox</span>
        </Link>

        <div className="hidden md:flex items-center gap-1 glass rounded-full p-1">
          {tabs.map(t => (
            <NavLink key={t.to} to={t.to} end={t.to === "/"} className={({ isActive }) => cn(
              "relative px-5 py-1.5 rounded-full text-sm font-medium transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="navpill" className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label="Toggle theme" className="glass rounded-full p-2.5 hover:scale-105 transition-transform">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)} className="bg-gradient-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium flex items-center gap-1.5 shadow-glow hover:shadow-lg transition-all hover:scale-[1.03]">
              {userName} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-52 glass-strong rounded-2xl p-2 z-50">
                  {[
                    { icon: User, label: "Account" },
                    { icon: UserPlus, label: "New Account" },
                    { icon: LogOut, label: "Logout" },
                  ].map(item => (
                    <button key={item.label} onClick={() => handleItemClick(item.label)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors text-left">
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
};
