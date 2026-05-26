import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const CHAT_KEY = `legalpro_chat_${localStorage.getItem("userId") || "guest"}`;

const INITIAL_MSG = {
  role: "assistant",
  content: "Good day. I'm your dedicated legal assistant — trained to help you navigate complex legal terrain.\n\nI can clarify legal processes, explain your rights, and help you understand what steps to take. Ask freely.\n\n⚖ Please note: I provide general legal information only, not legal advice. For your specific situation, consult a qualified attorney.",
};

const SUGGESTIONS = [
  "What should I do after a car accident?",
  "How does the divorce process work?",
  "What are my rights as a tenant?",
  "How do I file for bankruptcy?",
  "What is the difference between civil and criminal cases?",
  "How long do I have to file a personal injury claim?",
  "What documents do I need for a will?",
  "Can I sue my employer for wrongful termination?",
];

/* ─── Icons ─────────────────────────────────────────── */
const ScalesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 3v18M3 8l4 8H3M17 8l4 8h-4M3 16h8M13 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="3" r="1.5" fill="currentColor" />
  </svg>
);
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const MicIcon = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="12" rx="3" stroke={active ? "#c4a158" : "currentColor"} strokeWidth="2" />
    <path d="M5 10a7 7 0 0014 0" stroke={active ? "#c4a158" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke={active ? "#c4a158" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="22" x2="15" y2="22" stroke={active ? "#c4a158" : "currentColor"} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

function TypingDots() {
  return (
    <div className="lc-typing">
      {[0,1,2].map(i => <span key={i} className="lc-dot" style={{ animationDelay: i*0.18 + "s" }} />)}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={"lc-msg-row " + (isUser ? "lc-user-row" : "lc-bot-row")}>
      <div className={"lc-avatar " + (isUser ? "lc-avatar-user" : "lc-avatar-bot")}>
        {isUser ? <UserIcon /> : <ScalesIcon />}
      </div>
      <div className={"lc-bubble " + (isUser ? "lc-bubble-user" : "lc-bubble-bot")}>
        {msg.content === "TYPING" ? <TypingDots /> : msg.content}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const loadHistory = () => {
  return [INITIAL_MSG];
};

  const [messages,   setMessages]   = useState(loadHistory);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [isRecording,setIsRecording]= useState(false);
  const [micSupported,setMicSupported] = useState(false);
  const [transcript, setTranscript] = useState("");

  const bottomRef  = useRef(null);
  const textRef    = useRef(null);
  const recognitionRef = useRef(null);

  // Check mic/speech support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setMicSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous    = false;
      rec.interimResults= true;
      rec.lang          = "en-IN";

      rec.onresult = (e) => {
        let interim = "";
        let final   = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setTranscript(interim);
        if (final) {
          setInput(prev => (prev + " " + final).trim());
          setTranscript("");
        }
      };

      rec.onend = () => { setIsRecording(false); setTranscript(""); };
      rec.onerror = (e) => {
        console.warn("Speech error:", e.error);
        setIsRecording(false);
        setTranscript("");
        if (e.error === "not-allowed") setMicSupported(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {}
    }
  };

  const clearHistory = () => {
    sessionStorage.removeItem(CHAT_KEY);
    setMessages([INITIAL_MSG]);
    setError("");
  };

  const sendMessage = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    // Stop mic if recording
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); }

    setInput("");
    setError("");
    if (textRef.current) textRef.current.style.height = "auto";

    const userMsg  = { role: "user", content: userText };
    const withUser = [...messages.filter(m => m.content !== "TYPING"), userMsg];
    setMessages([...withUser, { role: "assistant", content: "TYPING" }]);
    setLoading(true);

    try {
      const res = await fetch(API_BASE + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
        body: JSON.stringify({ question: userText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      const reply = data.response || "I'm sorry, I couldn't retrieve a response. Please try again.";
      setMessages([...withUser, { role: "assistant", content: reply }]);
    } catch (e) {
      setError("Connection lost. Please check your network and try again.");
      setMessages(withUser);
    } finally {
      setLoading(false);
      textRef.current?.focus();
    }
  }, [input, loading, messages, isRecording]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const showSuggestions = messages.filter(m => m.content !== "TYPING").length <= 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes lc-bounce { 0%,80%,100% { transform:translateY(0); opacity:0.4; } 40% { transform:translateY(-7px); opacity:1; } }
        @keyframes lc-spin { to { transform:rotate(360deg); } }
        @keyframes lc-fadeup { to { opacity:1; transform:translateY(0); } }
        @keyframes lc-pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(0.78); opacity:0.55; } }
        @keyframes lc-mic-ring { 0%,100% { box-shadow:0 0 0 0 rgba(196,161,88,0.5); } 50% { box-shadow:0 0 0 8px rgba(196,161,88,0); } }

        .lc-root { display:flex; flex-direction:column; height:100vh; background:#f4f2ee; font-family:'Inter',sans-serif; position:relative; overflow:hidden; }
        .lc-glow1 { position:fixed; top:-120px; right:-120px; width:480px; height:480px; border-radius:50%; background:radial-gradient(circle, rgba(196,161,88,0.08) 0%, transparent 70%); pointer-events:none; z-index:0; }
        .lc-glow2 { position:fixed; bottom:-120px; left:-100px; width:440px; height:440px; border-radius:50%; background:radial-gradient(circle, rgba(28,43,58,0.07) 0%, transparent 70%); pointer-events:none; z-index:0; }

        .lc-header { background:#1c2b3a; padding:0 28px; height:66px; display:flex; align-items:center; gap:14px; position:relative; z-index:10; border-bottom:1px solid rgba(196,161,88,0.18); flex-shrink:0; }
        .lc-header-icon { width:40px; height:40px; border-radius:50%; background:rgba(196,161,88,0.15); border:1px solid rgba(196,161,88,0.3); color:#c4a158; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lc-header-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:400; color:#f0ede4; }
        .lc-header-title em { font-style:italic; color:#c4a158; }
        .lc-header-sub { font-size:11px; font-weight:300; color:rgba(240,237,228,0.45); margin-top:1px; }
        .lc-header-status { margin-left:auto; display:flex; align-items:center; gap:8px; }
        .lc-online-dot { width:8px; height:8px; border-radius:50%; background:#4a7c59; box-shadow:0 0 0 3px rgba(74,124,89,0.22); animation:lc-pulse 2.2s ease-in-out infinite; }
        .lc-online-label { font-size:10px; font-weight:600; color:#4a7c59; letter-spacing:0.14em; text-transform:uppercase; }
        .lc-clear-btn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:rgba(240,237,228,0.5); padding:6px 10px; cursor:pointer; display:flex; align-items:center; gap:5px; font-family:'Inter',sans-serif; font-size:11px; font-weight:500; transition:all 0.18s; margin-left:14px; }
        .lc-clear-btn:hover { background:rgba(196,161,88,0.12); border-color:rgba(196,161,88,0.3); color:#c4a158; }

        .lc-messages { flex:1; overflow-y:auto; padding:28px 20px 12px; scroll-behavior:smooth; position:relative; z-index:1; }
        .lc-messages-inner { max-width:780px; margin:0 auto; display:flex; flex-direction:column; gap:0; }
        .lc-messages::-webkit-scrollbar { width:4px; }
        .lc-messages::-webkit-scrollbar-thumb { background:#d8d2c8; border-radius:10px; }

        .lc-msg-row { display:flex; align-items:flex-start; gap:12px; margin-bottom:18px; opacity:0; transform:translateY(10px); animation:lc-fadeup 0.3s ease forwards; }
        .lc-user-row { flex-direction:row-reverse; }
        .lc-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .lc-avatar-user { background:#1c2b3a; color:#f0ede4; border:1px solid rgba(196,161,88,0.25); }
        .lc-avatar-bot { background:#fff; color:#c4a158; border:1px solid #e5e0d8; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .lc-bubble { max-width:68%; padding:13px 18px; font-size:14px; line-height:1.7; white-space:pre-wrap; word-break:break-word; border-radius:4px 18px 18px 18px; }
        .lc-bubble-user { background:#1c2b3a; color:#f0ede4; border-radius:18px 4px 18px 18px; box-shadow:0 4px 14px rgba(28,43,58,0.2); font-weight:300; }
        .lc-bubble-bot { background:#fff; color:#2a2520; border:1px solid #e5e0d8; box-shadow:0 2px 8px rgba(0,0,0,0.04); font-weight:300; }
        .lc-typing { display:flex; gap:5px; align-items:center; padding:3px 0; }
        .lc-dot { width:7px; height:7px; border-radius:50%; background:#c4a158; display:inline-block; animation:lc-bounce 1.3s infinite ease-in-out; }

        .lc-transcript-bar { background:rgba(196,161,88,0.08); border:1px solid rgba(196,161,88,0.2); border-radius:10px; padding:8px 16px; margin:0 20px 8px; max-width:780px; margin-left:auto; margin-right:auto; font-size:13px; color:#7a6835; font-style:italic; display:flex; align-items:center; gap:8px; }
        .lc-transcript-dot { width:8px; height:8px; border-radius:50%; background:#c4a158; animation:lc-pulse 1s ease-in-out infinite; flex-shrink:0; }

        .lc-suggestions { max-width:780px; margin:0 auto 8px; padding:0 20px; position:relative; z-index:1; }
        .lc-suggestions-label { font-size:9px; font-weight:600; color:#b8b0a4; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
        .lc-suggestions-label::after { content:''; flex:1; height:1px; background:#e5e0d8; }
        .lc-suggestions-grid { display:flex; flex-wrap:wrap; gap:7px; }
        .lc-suggest-chip { background:#fff; border:1.5px solid #e5e0d8; border-radius:20px; padding:7px 14px; font-family:'Inter',sans-serif; font-size:12px; font-weight:400; color:#5a5248; cursor:pointer; transition:all 0.18s; }
        .lc-suggest-chip:hover:not(:disabled) { background:#1c2b3a; color:#f0ede4; border-color:#1c2b3a; transform:translateY(-1px); box-shadow:0 4px 10px rgba(28,43,58,0.14); }
        .lc-suggest-chip:disabled { opacity:0.5; cursor:not-allowed; }

        .lc-input-area { border-top:1px solid #e5e0d8; background:#fff; padding:14px 20px 16px; flex-shrink:0; position:relative; z-index:2; }
        .lc-input-inner { max-width:780px; margin:0 auto; display:flex; gap:10px; align-items:flex-end; }
        .lc-textarea { flex:1; resize:none; border:1.5px solid #e5e0d8; border-radius:14px; padding:11px 16px; font-family:'Inter',sans-serif; font-size:14px; font-weight:300; color:#1a1a1a; line-height:1.55; background:#faf9f7; max-height:120px; overflow-y:auto; transition:border-color 0.18s, box-shadow 0.18s; outline:none; }
        .lc-textarea:focus { border-color:#c4a158; box-shadow:0 0 0 3px rgba(196,161,88,0.12); background:#fff; }
        .lc-textarea::placeholder { color:#c0b9ae; }

        .lc-btn-group { display:flex; flex-direction:column; gap:6px; }

        .lc-send-btn { width:46px; height:46px; border-radius:12px; background:#1c2b3a; color:#f0ede4; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s, transform 0.12s; box-shadow:0 4px 12px rgba(28,43,58,0.18); }
        .lc-send-btn:hover:not(:disabled) { background:#243547; }
        .lc-send-btn:active:not(:disabled) { transform:scale(0.95); }
        .lc-send-btn:disabled { background:#c8c2b8; cursor:not-allowed; box-shadow:none; }
        .lc-send-btn.lc-sending { background:#c4a158; }

        .lc-mic-btn { width:46px; height:46px; border-radius:12px; background:#fff; border:1.5px solid #e5e0d8; color:#9a9485; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
        .lc-mic-btn:hover:not(:disabled) { border-color:#c4a158; color:#c4a158; }
        .lc-mic-btn.active { background:rgba(196,161,88,0.1); border-color:#c4a158; color:#c4a158; animation:lc-mic-ring 1.5s ease-in-out infinite; }
        .lc-mic-btn:disabled { opacity:0.4; cursor:not-allowed; }

        .lc-error { max-width:780px; margin:0 auto 12px; padding:10px 16px; background:#fef9f0; border:1px solid rgba(196,161,88,0.3); border-radius:10px; font-size:12.5px; color:#7a6835; }
        .lc-footer-note { text-align:center; font-size:10.5px; color:#c0b9ae; letter-spacing:0.06em; margin-top:10px; }
      `}</style>

      <div className="lc-root">
        <div className="lc-glow1" /><div className="lc-glow2" />

        <header className="lc-header">
          <div className="lc-header-icon"><ScalesIcon /></div>
          <div>
            <div className="lc-header-title">Legal <em>Assistant</em></div>
            <div className="lc-header-sub">General legal guidance · Not legal advice</div>
          </div>
          <div className="lc-header-status">
            <div className="lc-online-dot" />
            <span className="lc-online-label">Online</span>
          </div>
          {micSupported && (
            <div style={{ marginLeft:12, fontSize:10, color:"rgba(240,237,228,0.4)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:isRecording ? "#c4a158" : "rgba(255,255,255,0.2)" }} />
              {isRecording ? "Listening…" : "Mic ready"}
            </div>
          )}
          <button className="lc-clear-btn" onClick={clearHistory}><TrashIcon /> Clear</button>
        </header>

        <div className="lc-messages">
          <div className="lc-messages-inner">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {error && <div className="lc-error">⚠ {error}</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Live transcript */}
        {isRecording && transcript && (
          <div className="lc-transcript-bar">
            <div className="lc-transcript-dot" />
            {transcript}
          </div>
        )}

        {showSuggestions && (
          <div className="lc-suggestions">
            <div className="lc-suggestions-label">Common questions</div>
            <div className="lc-suggestions-grid">
              {SUGGESTIONS.map((q, i) => (
                <button key={i} className="lc-suggest-chip" onClick={() => sendMessage(q)} disabled={loading}>{q}</button>
              ))}
            </div>
          </div>
        )}

        <div className="lc-input-area">
          <div className="lc-input-inner">
            <textarea
              ref={textRef}
              className="lc-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={isRecording ? "Listening… speak now" : "Ask a legal question… (Enter to send)"}
              rows={1}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            />
            <div className="lc-btn-group">
              <button
                className={"lc-send-btn" + (loading ? " lc-sending" : "")}
                onClick={() => sendMessage()}
                disabled={!input.trim() && !loading}
              >
                {loading
                  ? <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"lc-spin 0.7s linear infinite" }} />
                  : <SendIcon />}
              </button>
              {micSupported && (
                <button
                  className={"lc-mic-btn" + (isRecording ? " active" : "")}
                  onClick={toggleMic}
                  disabled={loading}
                  title={isRecording ? "Stop recording" : "Speak your question"}
                >
                  <MicIcon active={isRecording} />
                </button>
              )}
            </div>
          </div>
          <p className="lc-footer-note">
            LegalPro Intelligence · For informational purposes only · Not a substitute for qualified counsel
            {micSupported && " · 🎤 Voice input supported"}
          </p>
        </div>
      </div>
    </>
  );
}
