import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { toast } from "sonner";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("aivox_token", data.data.token);
        localStorage.setItem("aivox_user", JSON.stringify(data.data));
        toast.success(`Welcome to AIVox, ${data.data.name}!`);
        navigate("/");
      } else {
        toast.error(data.error.message || "Signup failed");
      }
    } catch (error) {
      toast.error("Could not connect to backend");
    }
  };

  return (
    <PageShell>
      <div className="max-w-md mx-auto pt-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-8 shadow-glow">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold gradient-text">Get Started</h1>
            <p className="text-muted-foreground text-sm mt-2">Create your AIVox account</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <User className="h-3 w-3" /> Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Mail className="h-3 w-3" /> Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Lock className="h-3 w-3" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-primary/40"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm shadow-glow hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> Sign Up
            </button>
          </form>

          <div className="text-center mt-6 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
