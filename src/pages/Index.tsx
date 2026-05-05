import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mic, FileText, Bot, Calendar, ArrowRight, Activity, CheckCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-config";


type Meeting = { _id: string; title: string; date: string; time: string };
type Transcript = { _id: string; text: string; createdAt: string };

const features = [
  { to: "/record", icon: FileText, title: "Transcript", desc: "Real-time speech-to-text with smart summaries." },
  { to: "/record", icon: Bot, title: "Chatbot", desc: "Conversational AI to organize your day." },
  { to: "/meeting", icon: Calendar, title: "Meeting", desc: "Schedule and manage meetings effortlessly." },
];

const Index = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("aivox_token");
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch Meetings
      const meetRes = await fetch(`${API_URL}/api/meeting/list`, {

        headers: { "Authorization": `Bearer ${token}` }
      });
      const meetData = await meetRes.json();
      if (meetData.success) setMeetings(meetData.data);

      // Fetch Transcripts
      const transRes = await fetch(`${API_URL}/api/record/list`, {

        headers: { "Authorization": `Bearer ${token}` }
      });
      const transData = await transRes.json();
      if (transData.success) setTranscripts(transData.data);

    } catch (error) {
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAuthenticated = !!localStorage.getItem("aivox_token");

  return (
    <PageShell>
      <section className="relative max-w-5xl mx-auto text-center pt-8 md:pt-16 pb-12">
        <div className="absolute inset-0 -z-10 bg-gradient-hero blur-3xl rounded-full" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium mb-6">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          AIVox Engine Online
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
          Your AI <span className="gradient-text">Productivity</span><br />Assistant
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Capture ideas, transcribe meetings, and stay on top of your schedule — all in one beautifully fast workspace.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10">
          <Link to={isAuthenticated ? "/record" : "/login"} className="group inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-7 py-4 rounded-2xl font-semibold shadow-glow hover:shadow-2xl hover:scale-[1.03] transition-all">
            <Mic className="h-5 w-5" /> {isAuthenticated ? "Open Assistant" : "Get Started Now"}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5 pb-12">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
            <Link to={f.to} className="group block glass-strong rounded-2xl p-6 hover:scale-[1.03] hover:shadow-glow transition-all duration-300 h-full">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
              <div className="mt-4 inline-flex items-center text-sm text-primary font-medium gap-1 group-hover:gap-2 transition-all">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Dynamic Dashboard Section */}
      {isAuthenticated && (
        <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="max-w-6xl mx-auto pb-24">
          <div className="glass-strong rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Activity Dashboard</h2>
                <p className="text-sm text-muted-foreground">Your AI workspace at a glance.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Total Transcripts</span>
                  <p className="text-3xl font-bold mt-1">{transcripts.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/40" />
              </div>

              <div className="glass rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Scheduled Meetings</span>
                  <p className="text-3xl font-bold mt-1">{meetings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary/40" />
              </div>

              <div className="glass rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">System Status</span>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">Operational</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-emerald-400/40 animate-pulse" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Transcripts */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Recent Voice Notes
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {transcripts.map(t => (
                    <div key={t._id} className="glass-strong rounded-xl p-3 text-sm truncate">
                      {t.text}
                    </div>
                  ))}
                  {transcripts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No voice notes yet.</p>
                  )}
                </div>
              </div>

              {/* Upcoming Meetings */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Upcoming Meetings
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {meetings.map(m => (
                    <div key={m._id} className="glass-strong rounded-xl p-3 text-sm flex justify-between items-center">
                      <span className="font-medium truncate">{m.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{m.date}</span>
                    </div>
                  ))}
                  {meetings.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">No upcoming meetings.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <Footer />
    </PageShell>
  );
};

export default Index;
