import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";

export default function CaseComments({ caseId }) {
  const [comments, setComments]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [sending,  setSending]    = useState(false);
  const [text,     setText]       = useState("");
  const bottomRef = useRef(null);

  const token   = localStorage.getItem("token");
  const role    = localStorage.getItem("role") || "user";
  // Derive initials from a stored name or fall back to role
  const userName = localStorage.getItem("userName") || role;
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const avatarColors = {
    admin:  "#1c2b3a",
    lawyer: "#2859a0",
    client: "#4a7c59",
    user:   "#9a9485",
  };
  const myColor = avatarColors[role] || avatarColors.user;

  // Fetch comments
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cases/${caseId}/comments`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok) setComments(Array.isArray(data) ? data : []);
      } catch { /* silently use empty state */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, [caseId]);

  // Scroll to bottom on new comment
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

const handleSend = async () => {
  if (!text.trim()) return;
  setSending(true);

  const optimistic = {
    id: Date.now(),
    text: text.trim(),
    author: { name: userName, role },
    createdAt: new Date().toISOString(),
    isMine: true,
  };

  // Optimistic UI
  setComments((prev) => [...prev, optimistic]);
  setText("");

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/cases/${caseId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: optimistic.text }),
      }
    );

    const data = await res.json();

    if (!res.ok) throw new Error();

    // ✅ REFETCH COMMENTS (IMPORTANT FIX)
    const refreshed = await fetch(
      `${import.meta.env.VITE_API_URL}/api/cases/${caseId}/comments`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const refreshedData = await refreshed.json();

    if (refreshed.ok) {
      setComments(Array.isArray(refreshedData) ? refreshedData : []);
    }

  } catch (err) {
    console.error(err);
    toast.error("Failed to send comment");
  } finally {
    setSending(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  };

  const roleLabel = { admin: "Admin", lawyer: "Lawyer", client: "Client", user: "User" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

        .cc-card {
          background: #fff; border: 1px solid #e5e0d8;
          border-radius: 18px; overflow: hidden;
          font-family: 'Inter', sans-serif;
          display: flex; flex-direction: column;
        }

        .cc-top-bar { height: 3px; background: linear-gradient(90deg,#1c2b3a,#4a7c59); }

        .cc-head {
          padding: 18px 22px 14px; border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; gap: 10px;
        }

        .cc-head-icon {
          width: 34px; height: 34px; border-radius: 9px; background: #1c2b3a;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .cc-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 2px;
        }

        .cc-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 500; color: #1a1a1a;
        }

        /* Message list */
        .cc-messages {
          flex: 1; overflow-y: auto;
          padding: 16px 20px;
          display: flex; flex-direction: column; gap: 14px;
          max-height: 360px; min-height: 200px;
          scrollbar-width: thin; scrollbar-color: #e5e0d8 transparent;
        }

        .cc-messages::-webkit-scrollbar { width: 4px; }
        .cc-messages::-webkit-scrollbar-thumb { background: #e5e0d8; border-radius: 4px; }

        /* Empty state */
        .cc-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; flex: 1; padding: 28px 0; text-align: center;
        }
        .cc-empty-icon {
          width: 44px; height: 44px; border-radius: 50%; background: #f4f2ee;
          display: flex; align-items: center; justify-content: center; margin-bottom: 10px;
        }
        .cc-empty-text { font-size: 12px; font-weight: 300; color: #b8b2a8; }

        /* Loading skeleton */
        .cc-skeleton { display: flex; flex-direction: column; gap: 12px; }
        .cc-skel-row { display: flex; align-items: flex-start; gap: 8px; }
        .cc-skel-avatar { width: 28px; height: 28px; border-radius: 7px; background: #ede9e2; flex-shrink: 0; animation: cc-shimmer 1.4s infinite; }
        .cc-skel-bubble { flex: 1; height: 48px; border-radius: 12px; background: #ede9e2; animation: cc-shimmer 1.4s infinite; }
        @keyframes cc-shimmer { 0%,100%{opacity:1} 50%{opacity:0.45} }

        /* Message row */
        .cc-msg-row {
          display: flex; align-items: flex-end; gap: 8px;
        }
        .cc-msg-row.mine { flex-direction: row-reverse; }

        .cc-avatar {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff;
          flex-shrink: 0; letter-spacing: 0.02em;
        }

        .cc-bubble-wrap { max-width: 75%; display: flex; flex-direction: column; gap: 3px; }
        .cc-msg-row.mine .cc-bubble-wrap { align-items: flex-end; }

        .cc-sender {
          font-size: 10px; font-weight: 600; color: #9a9485;
          letter-spacing: 0.04em; padding: 0 4px;
        }

        .cc-bubble {
          padding: 10px 14px; border-radius: 14px;
          font-size: 13px; font-weight: 400; line-height: 1.55;
          word-break: break-word;
        }

        /* Others' bubbles */
        .cc-bubble.other {
          background: #f4f2ee; color: #1a1a1a;
          border-bottom-left-radius: 4px;
        }

        /* Mine */
        .cc-bubble.mine {
          background: #1c2b3a; color: #f0ede4;
          border-bottom-right-radius: 4px;
        }

        .cc-timestamp {
          font-size: 9px; color: #c0b9ae; padding: 0 4px;
        }

        /* Role badge on bubble */
        .cc-role-badge {
          display: inline-block; font-size: 8px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 1px 6px; border-radius: 4px; margin-bottom: 4px;
        }

        /* Input area */
        .cc-input-area {
          border-top: 1px solid #f0ece4;
          padding: 14px 18px;
          display: flex; align-items: flex-end; gap: 10px;
        }

        .cc-my-avatar {
          width: 28px; height: 28px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0;
        }

        .cc-textarea {
          flex: 1; background: #faf9f6;
          border: 1.5px solid #e5e0d8; border-radius: 12px;
          padding: 10px 14px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 400;
          color: #1a1a1a; resize: none; outline: none; min-height: 42px; max-height: 100px;
          transition: border-color 0.15s, box-shadow 0.15s;
          line-height: 1.5;
        }
        .cc-textarea:focus {
          border-color: #c4a158; box-shadow: 0 0 0 3px rgba(196,161,88,0.10);
        }
        .cc-textarea::placeholder { color: #c8c2b8; }

        .cc-send-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: #1c2b3a; color: #f0ede4; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.15s, transform 0.12s;
        }
        .cc-send-btn:hover:not(:disabled) { background: #243547; }
        .cc-send-btn:active:not(:disabled) { transform: scale(0.95); }
        .cc-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cc-card">
        <div className="cc-top-bar" />

        {/* Header */}
        <div className="cc-head">
          <div className="cc-head-icon">
            <MessageSquare size={16} color="#c4a158" />
          </div>
          <div>
            <div className="cc-eyebrow">Collaboration</div>
            <div className="cc-title">Case Thread</div>
          </div>
        </div>

        {/* Messages */}
        <div className="cc-messages">
          {loading ? (
            <div className="cc-skeleton">
              {[1, 2, 3].map((i) => (
                <div className="cc-skel-row" key={i} style={{ flexDirection: i % 2 === 0 ? "row-reverse" : "row" }}>
                  <div className="cc-skel-avatar" />
                  <div className="cc-skel-bubble" style={{ width: `${50 + i * 15}%` }} />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="cc-empty">
              <div className="cc-empty-icon">
                <MessageSquare size={18} color="#c8c2b8" />
              </div>
              <p className="cc-empty-text">No messages yet. Start the conversation.</p>
            </div>
          ) : (
            comments.map((c) => {
              const isMine    = c.isMine || c.author?.role === role;
              const authorName = c.author?.name || c.author?.role || "User";
              const authorRole = c.author?.role || "user";
              const aColor    = avatarColors[authorRole] || avatarColors.user;
              const aInitials = authorName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const badgeStyle = isMine
                ? { background: "rgba(255,255,255,0.1)", color: "rgba(240,237,228,0.6)" }
                : { background: "#e5e0d8", color: "#6b6355" };

              return (
                <div key={c.id} className={`cc-msg-row${isMine ? " mine" : ""}`}>
                  <div className="cc-avatar" style={{ background: aColor }}>{aInitials}</div>
                  <div className="cc-bubble-wrap">
                    {!isMine && <span className="cc-sender">{authorName}</span>}
                    <div className={`cc-bubble ${isMine ? "mine" : "other"}`}>
                      <span className="cc-role-badge" style={badgeStyle}>
                        {roleLabel[authorRole] || "User"}
                      </span>
                      <br />
                      {c.text}
                    </div>
                    <span className="cc-timestamp">{formatTime(c.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="cc-input-area">
          <div className="cc-my-avatar" style={{ background: myColor }}>{initials}</div>
          <textarea
            className="cc-textarea"
            placeholder="Write a message… (Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="cc-send-btn"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            {sending
              ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
              : <Send size={15} />
            }
          </button>
        </div>
      </div>
    </>
  );
}
