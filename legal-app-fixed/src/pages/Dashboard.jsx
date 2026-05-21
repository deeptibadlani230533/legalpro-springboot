import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, Users, FileText, TrendingUp,
  Clock, CheckCircle2, AlertCircle, PlusCircle,
  ArrowUpRight, Scale, Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function timeAgo(date) {
  if (!date) return "";
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)    return Math.floor(diff) + "s ago";
  if (diff < 3600)  return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const PIE_COLORS = ["#4a7c59", "#c4a158", "#1c2b3a", "#9a9485"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e0d8",
      borderRadius: 10, padding: "8px 14px",
      fontFamily: "Inter, sans-serif",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    }}>
      <div style={{ fontSize: 11, color: "#9a9485", marginBottom: 2 }}>{payload[0]?.name}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>{payload[0]?.value} cases</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const role  = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [cases, setCases]       = useState([]);
  const [activity, setActivity] = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const headers = { Authorization: "Bearer " + token };

    Promise.all([
      fetch(API + "/api/cases",    { headers }).then(r => r.json()).catch(() => []),
      fetch(API + "/api/activity", { headers }).then(r => r.json()).catch(() => []),
      role === "admin"
        ? fetch(API + "/api/users", { headers }).then(r => r.json()).catch(() => [])
        : Promise.resolve([]),
    ]).then(([casesData, activityData, usersData]) => {
      setCases(Array.isArray(casesData) ? casesData : []);
      setActivity(Array.isArray(activityData) ? activityData.slice(0, 6) : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLoading(false);
    });
  }, []);

  // Stats
  const total      = cases.length;
  const open       = cases.filter(c => c.status === "open").length;
  const inProgress = cases.filter(c => c.status === "in_progress").length;
  const closed     = cases.filter(c => c.status === "closed").length;
  const pending    = users.filter(u => u.status === "pending").length;

  // Pie data
  const pieData = [
    { name: "Open",        value: open       },
    { name: "In Progress", value: inProgress },
    { name: "Closed",      value: closed     },
  ].filter(d => d.value > 0);

  // Monthly bar chart — group cases by month
  const monthlyData = (() => {
    const months = {};
    cases.forEach(c => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);
      const key = d.toLocaleDateString("en-IN", { month: "short" });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([name, value]) => ({ name, value }));
  })();

  const statCards = [
    { label: "Total Cases",  value: total,      icon: Briefcase,    accent: "#1c2b3a", sub: "All matters"      },
    { label: "Open",         value: open,       icon: AlertCircle,  accent: "#c4a158", sub: "Awaiting action"  },
    { label: "In Progress",  value: inProgress, icon: Clock,        accent: "#2859a0", sub: "Active work"      },
    { label: "Closed",       value: closed,     icon: CheckCircle2, accent: "#4a7c59", sub: "Resolved matters" },
    ...(role === "admin" ? [{ label: "Pending Users", value: pending, icon: Users, accent: "#7c4a6a", sub: "Awaiting approval" }] : []),
  ];

  const recentCases = cases.slice(0, 5);

  const statusConfig = {
    open:        { bg: "#fffbea", color: "#b45309", border: "#fcd34d", label: "Open"        },
    in_progress: { bg: "#eef4fd", color: "#2859a0", border: "#bdd3f5", label: "In Progress" },
    closed:      { bg: "#f0faf4", color: "#1e7e44", border: "#a8dbb9", label: "Closed"      },
    assigned:    { bg: "#eef4fd", color: "#2859a0", border: "#bdd3f5", label: "Assigned"    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .dash-root {
          min-height: 100vh;
          background: #f4f2ee;
          font-family: 'Inter', sans-serif;
          padding: 32px 32px 60px;
          display: flex; flex-direction: column; gap: 24px;
        }

        /* ── Page header ── */
        .dash-top {
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: 16px;
          flex-wrap: wrap;
        }

        .dash-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 6px; display: flex; align-items: center; gap: 6px;
        }

        .dash-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 2.5vw, 34px); font-weight: 400;
          color: #1a1a1a; margin: 0; letter-spacing: -0.01em;
        }
        .dash-title em { font-style: italic; color: #c4a158; }

        .dash-date {
          font-size: 12px; font-weight: 300; color: #9a9485; margin-top: 4px;
        }

        /* ── Stat cards ── */
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 14px;
        }

        .dash-stat {
          background: #fff; border: 1px solid #e5e0d8;
          border-radius: 16px; padding: 20px;
          position: relative; overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: default;
        }
        .dash-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
        }

        .dash-stat-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
        }

        .dash-stat-top {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 14px;
        }

        .dash-stat-label {
          font-size: 10px; font-weight: 600; color: #9a9485;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .dash-stat-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .dash-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 400; color: #1a1a1a; line-height: 1;
          margin-bottom: 4px;
        }

        .dash-stat-sub {
          font-size: 11px; font-weight: 300; color: #b8b2a8;
        }

        /* Skeleton */
        .dash-skel {
          height: 36px; background: #f0ece4; border-radius: 8px;
          animation: dash-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes dash-shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ── Main grid ── */
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px; align-items: start;
        }
        @media (max-width: 960px) { .dash-grid { grid-template-columns: 1fr; } }

        .dash-left  { display: flex; flex-direction: column; gap: 20px; }
        .dash-right { display: flex; flex-direction: column; gap: 20px; }

        /* Cards */
        .dash-card {
          background: #fff; border: 1px solid #e5e0d8;
          border-radius: 18px; overflow: hidden;
        }

        .dash-card-head {
          padding: 18px 22px 14px; border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; justify-content: space-between;
        }

        .dash-card-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 3px;
        }

        .dash-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px; font-weight: 500; color: #1a1a1a;
        }

        .dash-card-body { padding: 20px 22px; }

        .dash-view-all {
          font-size: 11px; font-weight: 600; color: #9a9485;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
          transition: color 0.15s; padding: 0;
          font-family: 'Inter', sans-serif;
        }
        .dash-view-all:hover { color: #c4a158; }

        /* ── Recent Cases table ── */
        .dash-cases { display: flex; flex-direction: column; gap: 8px; }

        .dash-case-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 14px; border-radius: 11px;
          border: 1px solid transparent;
          cursor: pointer; transition: background 0.12s, border-color 0.12s;
        }
        .dash-case-row:hover { background: #faf9f6; border-color: #e5e0d8; }

        .dash-case-left { display: flex; align-items: center; gap: 10px; }

        .dash-case-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        .dash-case-id {
          font-size: 10px; font-weight: 600; color: #b8b2a8;
          letter-spacing: 0.1em; margin-bottom: 2px;
        }

        .dash-case-title {
          font-size: 13px; font-weight: 500; color: #1a1a1a;
        }

        .dash-status-badge {
          font-size: 10px; font-weight: 600;
          padding: 3px 10px; border-radius: 999px;
          border: 1px solid; white-space: nowrap;
        }

        .dash-empty {
          padding: 32px 0; text-align: center;
          font-size: 13px; font-weight: 300; color: #b8b2a8;
          font-style: italic;
        }

        /* ── Activity feed ── */
        .dash-activity { display: flex; flex-direction: column; gap: 14px; }

        .dash-act-row { display: flex; align-items: flex-start; gap: 10px; }

        .dash-act-dot {
          width: 7px; height: 7px; border-radius: 50%;
          flex-shrink: 0; margin-top: 5px;
        }

        .dash-act-txt {
          font-size: 12px; font-weight: 400; color: #1a1a1a; line-height: 1.5;
        }

        .dash-act-time {
          font-size: 10px; color: #b8b2a8; margin-top: 2px;
        }

        /* ── Quick actions ── */
        .dash-actions { display: flex; flex-direction: column; gap: 8px; }

        .dash-action-btn {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-radius: 11px;
          border: 1.5px solid #e5e0d8; background: #faf9f6;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif; width: 100%;
        }
        .dash-action-btn:hover { border-color: #c4a158; background: #fdf9f2; }

        .dash-action-left { display: flex; align-items: center; gap: 10px; }

        .dash-action-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .dash-action-title { font-size: 12px; font-weight: 600; color: #1a1a1a; }
        .dash-action-desc  { font-size: 11px; font-weight: 300; color: #9a9485; }

        /* Pending users alert */
        .dash-pending-alert {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px; background: #fffbea;
          border: 1px solid #fcd34d; border-radius: 12px;
          cursor: pointer; transition: background 0.15s;
        }
        .dash-pending-alert:hover { background: #fff8d6; }

        .dash-pending-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #f59e0b; flex-shrink: 0;
          animation: dash-pulse 1.5s infinite;
        }
        @keyframes dash-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .dash-footer {
          text-align: center; padding-top: 16px;
          font-size: 11px; color: #c0b9ae; letter-spacing: 0.06em;
          border-top: 1px solid #ede9e2;
        }
      `}</style>

      <div className="dash-root">

        {/* Page header */}
        <div className="dash-top">
          <div>
            <div className="dash-eyebrow">
              <Activity size={11} /> Live Overview
            </div>
            <h1 className="dash-title">Legal <em>Dashboard</em></h1>
            <p className="dash-date">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {role === "client" && (
            <button
              onClick={() => navigate("/intake")}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                height: 40, background: "#1c2b3a", color: "#f0ede4",
                border: "none", borderRadius: 10, padding: "0 18px",
                fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <PlusCircle size={13} /> New Case
            </button>
          )}
        </div>

        {/* Pending users banner for admin */}
        {role === "admin" && !loading && pending > 0 && (
          <div className="dash-pending-alert" onClick={() => navigate("/team")}>
            <div className="dash-pending-dot" />
            <span style={{ fontSize: 13, color: "#92400e" }}>
              <strong>{pending} user{pending > 1 ? "s" : ""} pending approval</strong> — review in Team Directory
            </span>
            <ArrowUpRight size={14} color="#b45309" style={{ marginLeft: "auto" }} />
          </div>
        )}

        {/* Stat cards */}
        <div className="dash-stats">
          {statCards.map((s) => (
            <div className="dash-stat" key={s.label}>
              <div className="dash-stat-bar" style={{ background: `linear-gradient(90deg,${s.accent},${s.accent}44)` }} />
              <div className="dash-stat-top">
                <span className="dash-stat-label">{s.label}</span>
                <div className="dash-stat-icon" style={{ background: s.accent + "12" }}>
                  <s.icon size={14} color={s.accent} />
                </div>
              </div>
              {loading
                ? <div className="dash-skel" />
                : <div className="dash-stat-value">{s.value}</div>
              }
              <div className="dash-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="dash-grid">

          {/* LEFT */}
          <div className="dash-left">

            {/* Recent Cases */}
            <div className="dash-card">
              <div className="dash-card-head">
                <div>
                  <div className="dash-card-eyebrow">Matters</div>
                  <div className="dash-card-title">Recent Cases</div>
                </div>
                <button className="dash-view-all" onClick={() => navigate("/cases")}>
                  View All <ArrowUpRight size={12} />
                </button>
              </div>
              <div className="dash-card-body">
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[1,2,3].map(i => <div key={i} className="dash-skel" />)}
                  </div>
                ) : recentCases.length === 0 ? (
                  <div className="dash-empty">No cases yet.</div>
                ) : (
                  <div className="dash-cases">
                    {recentCases.map((c) => {
                      const sc = statusConfig[c.status] || statusConfig.open;
                      return (
                        <div
                          key={c.id}
                          className="dash-case-row"
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          <div className="dash-case-left">
                            <div className="dash-case-dot" style={{ background: sc.color }} />
                            <div>
                              <div className="dash-case-id">CASE-{String(c.id).padStart(4,"0")}</div>
                              <div className="dash-case-title">{c.caseTitle || c.title || "Untitled Matter"}</div>
                            </div>
                          </div>
                          <div
                            className="dash-status-badge"
                            style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                          >
                            {sc.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Intake Chart */}
            {!loading && monthlyData.length > 0 && (
              <div className="dash-card">
                <div className="dash-card-head">
                  <div>
                    <div className="dash-card-eyebrow">Trends</div>
                    <div className="dash-card-title">Monthly Intake</div>
                  </div>
                  <button className="dash-view-all" onClick={() => navigate("/reports")}>
                    Full Report <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="dash-card-body" style={{ paddingTop: 8 }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyData} barCategoryGap="38%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece4" />
                      <XAxis
                        dataKey="name" axisLine={false} tickLine={false}
                        tick={{ fill: "#b8b2a8", fontSize: 11, fontFamily: "Inter" }}
                      />
                      <YAxis
                        axisLine={false} tickLine={false}
                        tick={{ fill: "#b8b2a8", fontSize: 11, fontFamily: "Inter" }}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f2ee" }} />
                      <Bar dataKey="value" fill="#1c2b3a" radius={[5, 5, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT */}
          <div className="dash-right">

            {/* Case Distribution Donut */}
            {!loading && pieData.length > 0 && (
              <div className="dash-card">
                <div className="dash-card-head">
                  <div>
                    <div className="dash-card-eyebrow">Distribution</div>
                    <div className="dash-card-title">Status Ratio</div>
                  </div>
                </div>
                <div className="dash-card-body">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={pieData} innerRadius={48} outerRadius={68}
                        paddingAngle={4} dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {pieData.map((d, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i] }} />
                          <span style={{ fontSize: 12, color: "#6b6355" }}>{d.name}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Feed */}
            <div className="dash-card">
              <div className="dash-card-head">
                <div>
                  <div className="dash-card-eyebrow">Live</div>
                  <div className="dash-card-title">Recent Activity</div>
                </div>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#4a7c59",
                  animation: "dash-pulse 2s infinite",
                }} />
              </div>
              <div className="dash-card-body">
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[1,2,3].map(i => <div key={i} className="dash-skel" style={{ height: 24 }} />)}
                  </div>
                ) : activity.length === 0 ? (
                  <div className="dash-empty">No recent activity.</div>
                ) : (
                  <div className="dash-activity">
                    {activity.map((item, i) => (
                      <div key={i} className="dash-act-row">
                        <div className="dash-act-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <div>
                          <div className="dash-act-txt">{item.message || item.action || "System event"}</div>
                          <div className="dash-act-time">{timeAgo(item.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dash-card">
              <div className="dash-card-head">
                <div>
                  <div className="dash-card-eyebrow">Shortcuts</div>
                  <div className="dash-card-title">Quick Actions</div>
                </div>
              </div>
              <div className="dash-card-body">
                <div className="dash-actions">
                  {[
                    { title: "Case Directory",  desc: "Browse all matters",      icon: Briefcase,   accent: "#1c2b3a", path: "/cases"   },
                    { title: "Reports",         desc: "Full analytics view",     icon: TrendingUp,  accent: "#c4a158", path: "/reports" },
                    { title: "Documents",       desc: "Files & AI summaries",    icon: FileText,    accent: "#4a7c59", path: "/cases"   },
                    ...(role === "admin" ? [{ title: "Team Directory", desc: "Manage personnel", icon: Users, accent: "#7c4a6a", path: "/team" }] : []),
                  ].map((a) => (
                    <button key={a.title} className="dash-action-btn" onClick={() => navigate(a.path)}>
                      <div className="dash-action-left">
                        <div className="dash-action-icon" style={{ background: a.accent + "14" }}>
                          <a.icon size={14} color={a.accent} />
                        </div>
                        <div>
                          <div className="dash-action-title">{a.title}</div>
                          <div className="dash-action-desc">{a.desc}</div>
                        </div>
                      </div>
                      <ArrowUpRight size={13} color="#b8b2a8" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        <footer className="dash-footer">
          LegalPro Management Systems © 2026 · Tier III Security · AES-256 Encrypted
        </footer>
      </div>
    </>
  );
}