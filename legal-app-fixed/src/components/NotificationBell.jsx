import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, FileText, UserCheck, AlertTriangle, X, RefreshCw } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TYPE_CONFIG = {
  NEW_CASE:            { icon: FileText,     color: "#c4a158", bg: "rgba(196,161,88,0.10)"  },
  CASE_ASSIGNED:       { icon: UserCheck,    color: "#4a7c59", bg: "rgba(74,124,89,0.10)"   },
  CASE_STATUS_UPDATED: { icon: CheckCircle2, color: "#5b7fa6", bg: "rgba(91,127,166,0.10)"  },
  DOCUMENT_UPLOADED:   { icon: FileText,     color: "#c4a158", bg: "rgba(196,161,88,0.10)"  },
  default:             { icon: AlertTriangle,color: "#9a9485", bg: "rgba(154,148,133,0.10)" },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return Math.floor(diff) + "s ago";
  if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [connected, setConnected]         = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let retryTimeout;
    const connect = () => {
      try {
        const es = new EventSource(API_BASE + "/api/notifications/stream?token=" + token);
        esRef.current = es;

        es.addEventListener("connected", () => setConnected(true));

        es.addEventListener("notification", (e) => {
          try {
            const data = JSON.parse(e.data);
            const n = { id: Date.now(), type: data.type || "default", text: data.message || "New notification", time: new Date().toISOString(), read: false };
            setNotifications(prev => [n, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
          } catch {}
        });

        es.onerror = () => {
          setConnected(false);
          es.close();
          retryTimeout = setTimeout(connect, 5000);
        };
      } catch {}
    };

    connect();
    return () => { esRef.current && esRef.current.close(); clearTimeout(retryTimeout); };
  }, []);

  const markAllRead = () => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setUnreadCount(0); setIsOpen(false); };
  const clearAll    = () => { setNotifications([]); setUnreadCount(0); };

  return (
    <>
      <style>{`
        .nb-bell-btn { position: relative; width: 36px; height: 36px; background: #fff; border: 1.5px solid #e5e0d8; border-radius: 9px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; flex-shrink: 0; }
        .nb-bell-btn:hover { border-color: #c4a158; background: #fdf9f2; }
        .nb-badge { position: absolute; top: -5px; right: -5px; min-width: 16px; height: 16px; border-radius: 999px; background: #b85450; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; padding: 0 3px; }
        .nb-ping { position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; border-radius: 50%; background: rgba(196,161,88,0.45); animation: nb-ping 1.8s ease-out infinite; }
        @keyframes nb-ping { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.4); opacity: 0; } }
        .nb-backdrop { position: fixed; inset: 0; z-index: 40; }
        .nb-dropdown { position: absolute; right: 0; top: calc(100% + 10px); width: 320px; background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.12); z-index: 50; overflow: hidden; font-family: 'Inter', sans-serif; animation: nb-appear 0.15s ease; }
        @keyframes nb-appear { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .nb-header { padding: 12px 14px 10px; border-bottom: 1px solid #f0ece4; background: #faf9f6; display: flex; align-items: center; justify-content: space-between; }
        .nb-header-left { display: flex; align-items: center; gap: 8px; }
        .nb-title { font-size: 11px; font-weight: 600; color: #1a1a1a; letter-spacing: 0.1em; text-transform: uppercase; }
        .nb-status-dot { width: 7px; height: 7px; border-radius: 50%; transition: background 0.3s; }
        .nb-header-right { display: flex; align-items: center; gap: 6px; }
        .nb-icon-btn { width: 26px; height: 26px; border-radius: 6px; background: transparent; border: 1px solid #e5e0d8; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9a9485; transition: all 0.15s; }
        .nb-icon-btn:hover { background: #f0ece4; color: #1a1a1a; }
        .nb-list { max-height: 280px; overflow-y: auto; }
        .nb-list::-webkit-scrollbar { width: 3px; }
        .nb-list::-webkit-scrollbar-thumb { background: #e5e0d8; border-radius: 3px; }
        .nb-item { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; border-bottom: 1px solid #f8f6f2; transition: background 0.12s; cursor: default; position: relative; }
        .nb-item:last-child { border-bottom: none; }
        .nb-item:hover { background: #faf9f6; }
        .nb-item.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #c4a158; border-radius: 0 3px 3px 0; }
        .nb-item-icon { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .nb-item-text { font-size: 12px; font-weight: 400; color: #1a1a1a; line-height: 1.5; margin-bottom: 3px; }
        .nb-item-time { font-size: 10px; font-weight: 400; color: #b8b2a8; }
        .nb-empty { padding: 36px 16px; text-align: center; font-size: 12px; color: #b8b2a8; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .nb-footer { padding: 9px 14px; border-top: 1px solid #f0ece4; background: #faf9f6; display: flex; justify-content: center; }
        .nb-footer-btn { font-size: 11px; font-weight: 600; color: #9a9485; letter-spacing: 0.08em; text-transform: uppercase; background: none; border: none; cursor: pointer; transition: color 0.15s; }
        .nb-footer-btn:hover { color: #c4a158; }
        @keyframes nb-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ position: "relative" }}>
        <button className="nb-bell-btn" onClick={() => setIsOpen(o => !o)} aria-label="Notifications">
          <Bell size={15} color="#6b6355" />
          {unreadCount > 0 && (
            <><div className="nb-ping" /><div className="nb-badge">{unreadCount > 9 ? "9+" : unreadCount}</div></>
          )}
        </button>

        {isOpen && (
          <>
            <div className="nb-backdrop" onClick={() => setIsOpen(false)} />
            <div className="nb-dropdown">
              <div className="nb-header">
                <div className="nb-header-left">
                  <div className="nb-status-dot" style={{ background: connected ? "#4a7c59" : "#b85450" }} title={connected ? "Live" : "Reconnecting…"} />
                  <span className="nb-title">Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#b85450", background: "rgba(184,84,80,0.1)", borderRadius: 99, padding: "2px 7px" }}>
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <div className="nb-header-right">
                  {notifications.length > 0 && (
                    <button className="nb-icon-btn" onClick={clearAll} title="Clear all"><X size={11} /></button>
                  )}
                  {!connected && (
                    <button className="nb-icon-btn" title="Reconnecting…">
                      <RefreshCw size={11} style={{ animation: "nb-spin 1.2s linear infinite" }} />
                    </button>
                  )}
                </div>
              </div>

              <div className="nb-list">
                {notifications.length === 0 ? (
                  <div className="nb-empty">
                    <Bell size={28} color="#d8d2c8" />
                    <span>No notifications yet.<br />Live updates will appear here.</span>
                  </div>
                ) : (
                  notifications.map(n => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                    const Icon = cfg.icon;
                    return (
                      <div className={"nb-item" + (!n.read ? " unread" : "")} key={n.id}>
                        <div className="nb-item-icon" style={{ background: cfg.bg }}>
                          <Icon size={14} color={cfg.color} />
                        </div>
                        <div>
                          <div className="nb-item-text">{n.text}</div>
                          <div className="nb-item-time">{timeAgo(n.time)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="nb-footer">
                  <button className="nb-footer-btn" onClick={markAllRead}>Mark all as read</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
