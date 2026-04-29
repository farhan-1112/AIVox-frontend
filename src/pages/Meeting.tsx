import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Plus, Mic, MessageSquare, Trash2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { toast } from "sonner";

type Meeting = { _id: string; title: string; date: string; time: string };

const Meeting = () => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cmd, setCmd] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const fetchMeetings = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/meeting/list", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMeetings(data.data);
      }
    } catch (error) {
      toast.error("Failed to load meetings");
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const playVoice = async (text: string) => {
    try {
      const res = await fetch("http://localhost:5001/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        },
        body: JSON.stringify({ text })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = 0.9;
        audio.play();
      }
    } catch (error) {
      console.error("Failed to play voice", error);
    }
  };

  const save = async () => {
    if (!title || !date || !time) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/meeting/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        },
        body: JSON.stringify({ title, date, time }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Meeting scheduled!");
        setTitle(""); setDate(""); setTime("");
        fetchMeetings();
      } else {
        toast.error(data.error.message || "Failed to schedule meeting");
      }
    } catch (error) {
      toast.error("Failed to connect to backend");
    }
  };

  const handleCmd = async () => {
    if (!cmd.trim()) return;
    
    toast.info("Parsing command...");
    try {
      const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        },
        body: JSON.stringify({ message: cmd }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger voice response
        playVoice(data.data.response);

        if (data.data.intent === 'meeting') {
          toast.success("Meeting drafted and scheduled!");
          setCmd("");
          fetchMeetings();
        } else {
          toast.info(`AI Response: ${data.data.response}`);
          setCmd("");
        }
      } else {
        toast.error(data.error.message || "Failed to parse command");
      }
    } catch (error) {
      toast.error("Failed to connect to AI service");
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5001/api/meeting/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Meeting removed");
        fetchMeetings();
      } else {
        toast.error(data.error.message || "Failed to remove meeting");
      }
    } catch (error) {
      toast.error("Failed to connect to backend");
    }
  };

  const fmtTime = (t: string) => {
    if (!t) return "";
    const parts = t.split(":");
    if (parts.length < 2) return t;
    const [h, m] = parts.map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const fmtDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length < 3) return d;
    const [y, m, day] = parts;
    return `${parseInt(day)}/${parseInt(m)}/${y.slice(2)}`;
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold">Schedule <span className="gradient-text">Meeting</span></h1>
          <p className="text-muted-foreground mt-2">Plan your day — by form, chat, or voice.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="glass-strong rounded-3xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> New Meeting</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting with..." className="w-full mt-1 glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full mt-1 glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40" />
                </div>
              </div>
              <button onClick={save} className="w-full bg-gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold shadow-glow hover:scale-[1.02] transition-transform">
                Save Meeting
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Quick Schedule</h3>
              <div className="flex gap-2 glass rounded-2xl p-2">
                <input value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCmd()} placeholder='"Schedule meeting at 5pm tomorrow"' className="flex-1 bg-transparent outline-none px-2 text-sm placeholder:text-muted-foreground" />
                <button onClick={handleCmd} className="bg-gradient-primary text-primary-foreground rounded-lg px-3 text-xs font-medium">
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6">
            <h2 className="font-semibold mb-4">Scheduled Meetings</h2>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {meetings.map(m => (
                  <motion.div key={m._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass rounded-2xl p-4 flex items-center gap-3 group hover:shadow-glow transition-shadow">
                    <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground">{fmtTime(m.time)} • {fmtDate(m.date)}</div>
                    </div>
                    <button onClick={() => deleteMeeting(m._id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {meetings.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">No meetings scheduled yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Meeting;
