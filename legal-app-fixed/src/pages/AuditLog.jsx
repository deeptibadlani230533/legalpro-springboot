import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, Search, Filter, ChevronDown, Loader2, RefreshCw, FileText, UserCheck, Edit, Trash2, Plus, LogIn, Activity } from "lucide-react";
import Header from "../components/Header.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ACTION_CONFIG = {
  CASE_CREATED:         { label: "Case Created",          icon: Plus,       color: "#4a7c59", bg: "rgba(74,124,89,0.10)"   },
  CASE_ASSIGNED:        { label: "Case Assigned",         icon: UserCheck,  color: "#5b7fa6", bg: "rgba(91,127,166,0.10)"  },
  CASE_STATUS_UPDATED:  { label: "Status Updated",        icon: Edit,       color: "#c4a158", bg: "rgba(196,161,88,0.10)"  },
  CASE_CLOSED:          { label: "Case Closed",           icon: ShieldCheck,color: "#4a7c59", bg: "rgba(74,124,89,0.10)"   },
  CASE_ACCEPTED:        { label: "Case Accepted",         icon: UserCheck,  color: "#4a7c59", bg: "rgba(74,124,89,0.10)"   },
  CASE_DELETED:         { label: "Case Deleted",          icon: Trash2,     color: "#b85450", bg: "rgba(184,84,80,0.10)"   },
  DOCUMENT_UPLOADED:    { label: "Document Uploaded",     icon: FileText,   color: "#c4a158", bg: "rgba(196,161,88,0.10)"  },
  USER_LOGIN:           { label: "User Login",            icon: LogIn,      color: "#9a9485", bg: "rgba(154,148,133,0.10)" },
  default:              { label: "System Event",          icon: Activity,   color: "#9a9485", bg: "rgba(154,148,133,0.10)" },
};

const ENTITY_COLORS = {
  CASE:     { color: "#1c2b3a", bg: "rgba(28,43,58,0.07)" },
  DOCUMENT: { color: "#c4a158", bg: "rgba(196,161,88,0.10)" },
  USER:     { color: "#4a7c59", bg: "rgba(74,124,89,0.10)"  },
  default:  { color: "#9a9485", bg: "rgba(154,148,133,0.10)" },
};

function timeAgo(date) {
  if (!date) return "—";
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return Math.floor(diff) + "s ago";
  if (diff < 3600)  return Math.floor(diff/60) + "m ago";
  if (diff < 86400) return Math.floor(diff/3600) + "h ago";
  return new Date(date).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

export default function AuditLog() {
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API + "/api/activity", { headers: { Authorization: "Bearer " + token } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load audit logs");
      // data might be formatted or raw AuditLog array
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const uniqueEntities = [...new Set(logs.map(l => l.entityType).filter(Boolean))];
  const uniqueActions  = [...new Set(logs.map(l => l.action).filter(Boolean))];

  const filtered = logs.filter(log => {
    const term = search.toLowerCase();
    const matchSearch = (log.action || log.message || "").toLowerCase().includes(term) ||
      (log.entityType || "").toLowerCase().includes(term) ||
      (log.user?.name || "").toLowerCase().includes(term);
    const matchEntity = entityFilter === "all" || log.entityType === entityFilter;
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    return matchSearch && matchEntity && matchAction;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes al-spin { to { transform: rotate(360deg); } }
        @keyframes al-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .al-root { min-height:100vh; display:flex; flex-direction:column; background:#f4f2ee; font-family:'Inter',sans-serif; }
        .al-glow1 { position:fixed; top:-120px; right:-120px; width:480px; height:480px; border-radius:50%; background:radial-gradient(circle, rgba(28,43,58,0.06) 0%, transparent 70%); pointer-events:none; z-index:0; }
        .al-glow2 { position:fixed; bottom:-100px; left:-80px; width:420px; height:420px; border-radius:50%; background:radial-gradient(circle, rgba(196,161,88,0.05) 0%, transparent 70%); pointer-events:none; z-index:0; }
        .al-main { flex:1; width:100%; max-width:1100px; margin:0 auto; padding:40px 32px 60px; position:relative; z-index:1; display:flex; flex-direction:column; gap:28px; }
        .al-page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-wrap:wrap; padding-bottom:24px; border-bottom:1px solid #e5e0d8; }
        .al-eyebrow { display:inline-flex; align-items:center; gap:7px; font-size:10px; font-weight:600; color:#1c2b3a; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:10px; }
        .al-title { font-family:'Playfair Display',serif; font-size:clamp(26px,3.5vw,38px); font-weight:400; color:#1a1a1a; line-height:1.15; margin:0 0 6px; }
        .al-title em { font-style:italic; color:#c4a158; }
        .al-sub { font-size:13px; font-weight:300; color:#9a9485; }
        .al-header-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .al-search-wrap { position:relative; }
        .al-search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#b8b2a8; pointer-events:none; }
        .al-search { height:42px; background:#fff; border:1.5px solid #e5e0d8; border-radius:10px; padding:0 16px 0 40px; font-size:13px; color:#1a1a1a; width:210px; outline:none; transition:border-color 0.18s; }
        .al-search:focus { border-color:#c4a158; box-shadow:0 0 0 3px rgba(196,161,88,0.10); }
        .al-select-wrap { position:relative; }
        .al-select-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#b8b2a8; pointer-events:none; }
        .al-select-arrow { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#b8b2a8; pointer-events:none; }
        .al-select { height:42px; background:#fff; border:1.5px solid #e5e0d8; border-radius:10px; padding:0 32px 0 34px; font-size:12px; color:#5a5248; appearance:none; outline:none; cursor:pointer; }
        .al-refresh-btn { height:42px; width:42px; background:#fff; border:1.5px solid #e5e0d8; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#9a9485; transition:all 0.15s; }
        .al-refresh-btn:hover { border-color:#c4a158; color:#c4a158; }

        /* Summary cards */
        .al-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        @media(max-width:640px) { .al-summary { grid-template-columns:1fr; } }
        .al-sum-card { background:#fff; border:1px solid #e5e0d8; border-radius:14px; padding:18px 20px; display:flex; align-items:center; gap:14px; }
        .al-sum-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .al-sum-label { font-size:9px; font-weight:600; color:#9a9485; letter-spacing:0.14em; text-transform:uppercase; margin-bottom:3px; }
        .al-sum-val { font-family:'Playfair Display',serif; font-size:22px; font-weight:400; color:#1a1a1a; }

        /* Timeline */
        .al-timeline-card { background:#fff; border:1px solid #e5e0d8; border-radius:18px; overflow:hidden; }
        .al-timeline-header { padding:16px 24px; border-bottom:1px solid #f0ece4; display:flex; align-items:center; justify-content:space-between; }
        .al-timeline-title { font-size:10px; font-weight:600; color:#9a9485; letter-spacing:0.15em; text-transform:uppercase; }
        .al-timeline-count { font-size:10px; font-weight:600; color:#c4a158; background:rgba(196,161,88,0.1); border-radius:99px; padding:2px 10px; letter-spacing:0.06em; }
        .al-timeline-body { max-height:600px; overflow-y:auto; }
        .al-timeline-body::-webkit-scrollbar { width:4px; }
        .al-timeline-body::-webkit-scrollbar-thumb { background:#e5e0d8; border-radius:4px; }

        .al-log-row { display:flex; align-items:flex-start; gap:14px; padding:16px 24px; border-bottom:1px solid #f7f4f0; transition:background 0.12s; animation:al-fadein 0.3s ease; }
        .al-log-row:last-child { border-bottom:none; }
        .al-log-row:hover { background:#faf9f7; }

        .al-log-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
        .al-log-content { flex:1; min-width:0; }
        .al-log-action { font-size:13px; font-weight:500; color:#1a1a1a; margin-bottom:3px; }
        .al-log-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .al-log-user { font-size:11px; font-weight:400; color:#5a5248; }
        .al-log-entity { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:600; border-radius:5px; padding:2px 8px; letter-spacing:0.06em; text-transform:uppercase; }
        .al-log-time { font-size:10px; font-weight:300; color:#b8b2a8; letter-spacing:0.04em; }
        .al-log-id { font-size:10px; color:#c8c2b8; font-family:'Playfair Display',serif; }

        .al-empty { text-align:center; padding:60px 20px; }
        .al-loading-row { display:flex; align-items:center; justify-content:center; gap:10px; padding:48px; color:#9a9485; font-size:13px; }

        @media(max-width:768px) { .al-main { padding:24px 16px; } }
      `}</style>

      <div className="al-root">
        <div className="al-glow1" /><div className="al-glow2" />
        <Header />
        <main className="al-main">

          <div className="al-page-header">
            <div>
              <div className="al-eyebrow"><ShieldCheck size={12} /> Security & Compliance</div>
              <h1 className="al-title">Audit <em>Log</em></h1>
              <p className="al-sub">
                {loading ? "Loading…" : `${filtered.length} events · Full system activity trail`}
              </p>
            </div>
            <div className="al-header-right">
              <div className="al-search-wrap">
                <Search size={15} className="al-search-icon" />
                <input className="al-search" placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {uniqueEntities.length > 0 && (
                <div className="al-select-wrap">
                  <Filter size={12} className="al-select-icon" />
                  <ChevronDown size={11} className="al-select-arrow" />
                  <select className="al-select" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
                    <option value="all">All Entities</option>
                    {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}
              {uniqueActions.length > 0 && (
                <div className="al-select-wrap">
                  <Activity size={12} className="al-select-icon" />
                  <ChevronDown size={11} className="al-select-arrow" />
                  <select className="al-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                    <option value="all">All Actions</option>
                    {uniqueActions.map(a => <option key={a} value={a}>{a.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              )}
              <button className="al-refresh-btn" onClick={fetchLogs} title="Refresh">
                <RefreshCw size={14} style={loading ? { animation:"al-spin 0.7s linear infinite" } : {}} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="al-summary">
            {[
              { label:"Total Events",    val:logs.length,                                      iconBg:"rgba(28,43,58,0.07)",   iconColor:"#1c2b3a", Icon:Activity   },
              { label:"Case Events",     val:logs.filter(l => l.entityType==="CASE").length,    iconBg:"rgba(196,161,88,0.10)", iconColor:"#c4a158", Icon:FileText   },
              { label:"User Actions",    val:logs.filter(l => l.entityType==="USER").length,    iconBg:"rgba(74,124,89,0.10)",  iconColor:"#4a7c59", Icon:UserCheck  },
            ].map(({ label,val,iconBg,iconColor,Icon }) => (
              <div className="al-sum-card" key={label}>
                <div className="al-sum-icon" style={{ background:iconBg }}><Icon size={16} color={iconColor} /></div>
                <div>
                  <div className="al-sum-label">{label}</div>
                  <div className="al-sum-val">{val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="al-timeline-card">
            <div className="al-timeline-header">
              <span className="al-timeline-title">Activity Timeline</span>
              <span className="al-timeline-count">{filtered.length} events</span>
            </div>
            <div className="al-timeline-body">
              {loading ? (
                <div className="al-loading-row">
                  <Loader2 size={18} style={{ animation:"al-spin 0.7s linear infinite", color:"#c4a158" }} />
                  Loading audit events…
                </div>
              ) : filtered.length === 0 ? (
                <div className="al-empty">
                  <ShieldCheck size={36} color="#c4a158" style={{ marginBottom:12 }} />
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:6 }}>No events found</div>
                  <p style={{ fontSize:13, color:"#9a9485" }}>
                    {logs.length === 0 ? "Audit events will appear here as users interact with the system." : "Try adjusting your filters."}
                  </p>
                </div>
              ) : (
                filtered.map((log, i) => {
                  // Support both raw AuditLog and formatted { message, createdAt }
                  const action   = log.action || "EVENT";
                  const cfg      = ACTION_CONFIG[action] || ACTION_CONFIG.default;
                  const Icon     = cfg.icon;
                  const entity   = log.entityType;
                  const eCfg     = ENTITY_COLORS[entity] || ENTITY_COLORS.default;
                  const userName = log.user?.name || log.message?.split(" ")[0] || "System";
                  const message  = log.message || cfg.label;

                  return (
                    <div className="al-log-row" key={log.id || i}>
                      <div className="al-log-icon" style={{ background:cfg.bg }}><Icon size={15} color={cfg.color} /></div>
                      <div className="al-log-content">
                        <div className="al-log-action">{message || cfg.label}</div>
                        <div className="al-log-meta">
                          <span className="al-log-user">by {userName}</span>
                          {entity && (
                            <span className="al-log-entity" style={{ color:eCfg.color, background:eCfg.bg }}>{entity}</span>
                          )}
                          {log.entityId && (
                            <span className="al-log-id">#{log.entityId}</span>
                          )}
                          <span className="al-log-time">{timeAgo(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
