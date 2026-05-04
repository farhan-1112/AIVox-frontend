import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, MessageSquare, MicIcon } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { id: number; role: "user" | "ai"; text: string };

const Record = () => {
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<"mic" | "chat">("mic");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { id: 1, role: "ai", text: "Hi! I'm AIVox. Press the mic or type to get started." },
  ]);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleRecording = async () => {
    if (recording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        // DO NOT stop tracks here, it corrupts the final WebM chunk.
        // Tracks are now stopped inside the onstop callback.
      }
      setRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          if (audioBlob.size === 0) {
            toast.error("ERROR: Your microphone recorded 0 bytes! Please check Windows Privacy Settings or unmute your mic.");
            return;
          }
          
          setLastAudioUrl(URL.createObjectURL(audioBlob));
          await uploadAudio(audioBlob, mimeType);
          
          // Safely stop tracks after the file is finalized
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setRecording(true);
        toast.info("Recording started...");
      } catch (err) {
        toast.error("Microphone access denied or not available");
        console.error(err);
      }
    }
  };

  const playVoice = async (text: string) => {
    const toastId = toast.loading("Generating voice...");
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
        audio.playbackRate = 1;
        
        audio.oncanplaythrough = () => {
          toast.dismiss(toastId);
          audio.play().catch(e => {
            toast.error("Browser blocked audio autoplay. Please click anywhere on the screen first.");
            console.error("Autoplay blocked:", e);
          });
        };
        
        audio.onerror = () => {
          toast.dismiss(toastId);
          toast.error("Failed to decode audio playback.");
        };
      } else {
        toast.dismiss(toastId);
        toast.error("TTS generation failed on server");
        console.error("TTS failed with status", res.status);
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Network error while trying to generate voice");
      console.error("Failed to play voice response", error);
    }
  };

  const uploadAudio = async (blob: Blob, mimeType?: string) => {
    const formData = new FormData();
    const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', blob, `recording.${ext}`);

    toast.info("Transcribing audio...");
    try {
      // 1. Listen (STT)
      const res = await fetch("http://localhost:5001/api/record/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        const transcriptText = data.data.transcript;
        
        if (transcriptText === "[No speech detected]") {
          toast.warning("No speech detected. Please try again.");
          return;
        }

        toast.success("Audio transcribed!");
        setMessages(m => [...m, { id: Date.now(), role: "user", text: transcriptText }]);

        // 2. Think (LLM)
        toast.info("AI is thinking...");
        const chatRes = await fetch("http://localhost:5001/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
          },
          body: JSON.stringify({ message: transcriptText }),
        });

        const chatData = await chatRes.json();
        if (chatData.success) {
          const aiResponse = chatData.data.response;
          setMessages(m => [...m, { id: Date.now() + 1, role: "ai", text: aiResponse }]);
          
          // 3. Speak (TTS)
          playVoice(aiResponse);
        }
      } else {
        toast.error(data.error.message || "Transcription failed");
      }
    } catch (error) {
      toast.error("Failed to connect to backend");
    }
  };

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text: input };
    setMessages(m => [...m, userMsg]);
    setInput("");

    try {
      const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("aivox_token")}`
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      if (data.success) {
        const aiResponse = data.data.response;
        setMessages(m => [...m, { id: Date.now() + 1, role: "ai", text: aiResponse }]);
        
        // Speak (TTS)
        playVoice(aiResponse);
      } else {
        toast.error(data.error.message || "Failed to get response");
      }
    } catch (error) {
      toast.error("Could not connect to AI service");
    }
  };



  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="glass rounded-full p-1 flex">
            {[
              { k: "mic", label: "Mic Input", icon: MicIcon },
              { k: "chat", label: "Manual Chat", icon: MessageSquare },
            ].map(opt => (
              <button key={opt.k} onClick={() => setMode(opt.k as any)} className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
                mode === opt.k ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                {mode === opt.k && <motion.span layoutId="modepill" className="absolute inset-0 rounded-full bg-gradient-primary shadow-glow" />}
                <span className="relative z-10 flex items-center gap-2"><opt.icon className="h-3.5 w-3.5" />{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "mic" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-3xl p-10 flex flex-col items-center mb-6">
            <div className="relative h-44 w-44 flex items-center justify-center">
              {recording && (
                <>
                  <span className="absolute inset-0 rounded-full bg-gradient-primary opacity-30 animate-pulse-ring" />
                  <span className="absolute inset-4 rounded-full bg-gradient-primary opacity-40 animate-pulse-ring" style={{ animationDelay: "0.4s" }} />
                </>
              )}
              <button onClick={toggleRecording} className={cn(
                "relative h-32 w-32 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow hover:scale-105 transition-transform",
                recording && "scale-110"
              )}>
                <Mic className="h-12 w-12 text-primary-foreground" />
              </button>
            </div>
            <p className="mt-6 text-lg font-medium">{recording ? "Listening..." : "Press to Begin"}</p>
            {recording && (
              <div className="flex items-end gap-1 h-12 mt-4">
                {[...Array(24)].map((_, i) => (
                  <span key={i} className="w-1 bg-gradient-primary rounded-full animate-wave" style={{ animationDelay: `${i * 0.05}s`, height: "100%" }} />
                ))}
              </div>
            )}
            {!recording && lastAudioUrl && (
              <div className="mt-6 flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-2">Check if your mic actually recorded sound:</p>
                <audio src={lastAudioUrl} controls className="h-10 w-full max-w-[250px]" />
              </div>
            )}
          </motion.div>
        )}

        <div className="glass-strong rounded-3xl p-4 md:p-6">
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 mb-4">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "glass"
                  )}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2 items-center glass rounded-2xl p-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 bg-transparent outline-none px-3 py-2 text-sm placeholder:text-muted-foreground" />
            <button onClick={send} className="bg-gradient-primary text-primary-foreground rounded-xl p-2.5 hover:scale-105 transition-transform shadow-glow">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Record;
