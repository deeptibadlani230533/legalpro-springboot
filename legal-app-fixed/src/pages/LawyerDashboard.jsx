import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, Sparkles, Lightbulb, Briefcase,
  ShieldCheck, Zap, Scale, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import Header from "../components/Header";

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, in_progress: 0, closed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLawyerCases = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/lawyer/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        const fetched = Array.isArray(data.cases) ? data.cases : [];
        setCases(fetched);
        setStats({
          assigned:    fetched.filter((c) => c.status === "assigned").length,
          in_progress: fetched.filter((c) => c.status === "in_progress").length,
          closed:      fetched.filter((c) => c.status === "closed").length,
        });
      } catch (err) {
        console.error("Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyerCases();
  }, []);

  const activeCases = cases.filter((c) => c.status !== "closed");

  const formatStatus = (status) =>
    status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const statusConfig = {
    assigned:    { bg: "#edfaf2", color: "#2d7a4f", border: "#a8dfc0" },
    in_progress: { bg: "#fdf8ec", color: "#b8902a", border: "#e8d090" },
    closed:      { bg: "#f4f2ee", color: "#6b6355", border: "#d0cbc2" },
  };

  const statConfig = [
    { label: "Assigned",    value: stats.assigned,    accent: "#1c2b3a", icon: Briefcase },
    { label: "In Progress", value: stats.in_progress, accent: "#c4a158", icon: Clock     },
    { label: "Closed",      value: stats.closed,      accent: "#4a7c59", icon: Scale     },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .ld-root {
          min-height: 100vh; display: flex; flex-direction: column;
          background: #f4f2ee; font-family: 'Inter', sans-serif;
        }

        .ld-main {
          flex: 1; width: 100%; max-width: 1200px;
          margin: 0 auto; padding: 40px 32px 60px;
          display: flex; flex-direction: column; gap: 32px;
        }

        /* ── Hero ── */
        .ld-hero {
          background: #1c2b3a; border-radius: 20px;
          padding: 36px 40px; position: relative; overflow: hidden;
          display: flex; justify-content: space-between; align-items: flex-end;
          flex-wrap: wrap; gap: 20px;
        }

        .ld-hero-glow {
          position: absolute; top: -60px; right: -60px;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .ld-hero-bg {
          position: absolute; right: 28px; bottom: -16px;
          opacity: 0.05; pointer-events: none;
        }

        .ld-hero-tag {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(196,161,88,0.12);
          border: 1px solid rgba(196,161,88,0.25);
          border-radius: 999px; padding: 5px 13px; margin-bottom: 14px;
        }

        .ld-hero-tag-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #c4a158;
          animation: ld-pulse 2s ease-in-out infinite;
        }

        @keyframes ld-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }

        .ld-hero-tag-text {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase;
        }

        .ld-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3vw, 38px); font-weight: 400;
          color: #f0ede4; margin: 0 0 8px; letter-spacing: -0.01em;
        }
        .ld-hero-title em { font-style: italic; color: #c4a158; }

        .ld-hero-sub {
          font-size: 13px; font-weight: 300;
          color: rgba(240,237,228,0.5); max-width: 360px; line-height: 1.7;
        }

        .ld-secure-badge {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px 18px; flex-shrink: 0;
          position: relative; z-index: 1;
        }

        .ld-secure-text { font-size: 12px; font-weight: 500; color: rgba(240,237,228,0.6); }
        .ld-secure-text span { color: #4a9e6a; font-weight: 600; }

        /* ── Stat Cards ── */
        .ld-stats {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 16px;
        }
        @media (max-width: 700px) { .ld-stats { grid-template-columns: 1fr; } }

        .ld-stat {
          background: #fff; border: 1px solid #e5e0d8;
          border-radius: 16px; padding: 22px 24px;
          position: relative; overflow: hidden;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .ld-stat:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(0,0,0,0.06); }

        .ld-stat-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; }

        .ld-stat-top {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 14px;
        }

        .ld-stat-label {
          font-size: 11px; font-weight: 600; color: #9a9485;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .ld-stat-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }

        .ld-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 42px; font-weight: 400;
          color: #1a1a1a; line-height: 1;
        }

        .ld-stat-value.loading { color: #d0cbc2; font-size: 28px; }

        /* ── Main body grid ── */
        .ld-body {
          display: grid; grid-template-columns: 1fr 300px;
          gap: 20px; align-items: start;
        }
        @media (max-width: 900px) { .ld-body { grid-template-columns: 1fr; } }

        /* Case list */
        .ld-cases-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; overflow: hidden;
        }

        .ld-cases-head {
          padding: 18px 22px 14px; border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; justify-content: space-between;
        }

        .ld-cases-head-left {}

        .ld-cases-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px;
        }

        .ld-cases-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500; color: #1a1a1a;
        }

        .ld-view-all-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; color: #9a9485;
          background: none; border: none; cursor: pointer;
          transition: color 0.15s;
          letter-spacing: 0.04em;
        }
        .ld-view-all-btn:hover { color: #c4a158; }

        .ld-cases-body { padding: 12px; }

        /* Case row */
        .ld-case-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 14px; border-radius: 12px; cursor: pointer;
          border: 1px solid transparent;
          transition: background 0.12s, border-color 0.12s;
          margin-bottom: 6px;
        }
        .ld-case-row:last-child { margin-bottom: 0; }
        .ld-case-row:hover { background: #faf9f6; border-color: #e5e0d8; }

        .ld-case-left { display: flex; align-items: center; gap: 12px; }

        .ld-case-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: #f4f2ee;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: background 0.12s;
        }

        .ld-case-row:hover .ld-case-icon { background: rgba(196,161,88,0.10); }

        .ld-case-id {
          font-size: 10px; font-weight: 600; color: #b8b2a8;
          letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 2px;
        }

        .ld-case-title { font-size: 13px; font-weight: 600; color: #1a1a1a; }

        .ld-status-badge {
          font-size: 10px; font-weight: 600;
          padding: 4px 11px; border-radius: 999px;
          letter-spacing: 0.06em; text-transform: capitalize;
          border: 1px solid; flex-shrink: 0;
        }

        /* Empty state */
        .ld-empty {
          padding: 44px 20px; text-align: center;
        }

        .ld-empty-icon {
          width: 48px; height: 48px; border-radius: 50%;
          background: #f4f2ee;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }

        .ld-empty-text { font-size: 13px; font-weight: 300; color: #b8b2a8; font-style: italic; }

        /* Loading skeleton */
        .ld-skeleton {
          height: 62px; background: #f4f2ee; border-radius: 12px;
          animation: ld-shimmer 1.4s ease-in-out infinite; margin-bottom: 8px;
        }
        @keyframes ld-shimmer { 0%,100%{opacity:1} 50%{opacity:0.45} }

        /* Right sidebar */
        .ld-sidebar { display: flex; flex-direction: column; gap: 16px; }

        .ld-sidebar-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; overflow: hidden;
        }

        .ld-sidebar-head {
          padding: 16px 18px 12px; border-bottom: 1px solid #f0ece4;
          font-size: 10px; font-weight: 600; color: #9a9485;
          letter-spacing: 0.15em; text-transform: uppercase;
        }

        .ld-sidebar-body { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }

        /* Action buttons */
        .ld-action-btn {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border: 1.5px solid #e5e0d8;
          border-radius: 11px; background: #faf9f6; cursor: pointer; width: 100%;
          transition: border-color 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .ld-action-btn:hover { border-color: #c4a158; background: #fdf9f2; }

        .ld-action-btn-left { display: flex; align-items: center; gap: 10px; }

        .ld-action-btn-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .ld-action-btn-title { font-size: 12px; font-weight: 600; color: #1a1a1a; }

        /* Insight card */
        .ld-insight {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; padding: 20px;
        }

        .ld-insight-icon {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(196,161,88,0.10);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }

        .ld-insight-title {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 500; color: #1a1a1a; margin-bottom: 7px;
        }

        .ld-insight-text {
          font-size: 12px; font-weight: 300; color: #6b6355; line-height: 1.65;
        }

        .ld-insight-text strong { color: #c4a158; font-weight: 600; }

        .ld-footer {
          text-align: center; padding: 22px;
          font-size: 11px; color: #c0b9ae; letter-spacing: 0.06em;
          border-top: 1px solid #ede9e2;
        }
      `}</style>

      <div className="ld-root">
        <Header />

        <main className="ld-main">

          {/* ── Hero ── */}
          <div className="ld-hero">
            <div className="ld-hero-glow" />
            <div className="ld-hero-bg"><Briefcase size={200} color="#fff" /></div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="ld-hero-tag">
                <div className="ld-hero-tag-dot" />
                <span className="ld-hero-tag-text">Practice Overview</span>
              </div>
              <h1 className="ld-hero-title">Lawyer <em>Workspace</em></h1>
              <p className="ld-hero-sub">
                Managing {activeCases.length} active legal matter{activeCases.length !== 1 ? "s" : ""} today.
              </p>
            </div>
            <div className="ld-secure-badge">
              <ShieldCheck size={14} color="#4a9e6a" />
              <span className="ld-secure-text">Security: <span>Active Vault</span></span>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="ld-stats">
            {statConfig.map((s) => (
              <div className="ld-stat" key={s.label}>
                <div className="ld-stat-bar"
                  style={{ background: `linear-gradient(90deg,${s.accent},${s.accent}44)` }} />
                <div className="ld-stat-top">
                  <span className="ld-stat-label">{s.label}</span>
                  <div className="ld-stat-icon" style={{ background: s.accent + "12" }}>
                    <s.icon size={15} color={s.accent} />
                  </div>
                </div>
                <div className={`ld-stat-value${loading ? " loading" : ""}`}>
                  {loading ? "···" : <CountUp end={s.value} duration={1} />}
                </div>
              </div>
            ))}
          </div>

          {/* ── Body Grid ── */}
          <div className="ld-body">

            {/* Case List */}
            <div className="ld-cases-card">
              <div className="ld-cases-head">
                <div className="ld-cases-head-left">
                  <div className="ld-cases-eyebrow">Assignments</div>
                  <div className="ld-cases-title">Recent Matters</div>
                </div>
                <button className="ld-view-all-btn" onClick={() => navigate("/cases")}>
                  View All <ChevronRight size={13} />
                </button>
              </div>

              <div className="ld-cases-body">
                <AnimatePresence>
                  {loading ? (
                    [1, 2, 3].map((i) => <div key={i} className="ld-skeleton" />)
                  ) : activeCases.length > 0 ? (
                    activeCases.slice(0, 5).map((c) => {
                      const sc = statusConfig[c.status] || statusConfig.closed;
                      return (
                        <motion.div
                          key={c.id}
                          className="ld-case-row"
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          onClick={() => navigate(`/cases/${c.id}`)}
                        >
                          <div className="ld-case-left">
                            <div className="ld-case-icon">
                              <Zap size={16} color="#9a9485" />
                            </div>
                            <div>
                              <div className="ld-case-id">CASE-{c.id.toString().padStart(4, "0")}</div>
                              <div className="ld-case-title">{c.caseTitle || "Untitled Matter"}</div>
                            </div>
                          </div>
                          <div
                            className="ld-status-badge"
                            style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                          >
                            {formatStatus(c.status)}
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="ld-empty">
                      <div className="ld-empty-icon">
                        <Briefcase size={18} color="#c8c2b8" />
                      </div>
                      <p className="ld-empty-text">No active assignments currently in queue.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar */}
            <div className="ld-sidebar">

              {/* Quick Actions */}
              <div className="ld-sidebar-card">
                <div className="ld-sidebar-head">Quick Actions</div>
                <div className="ld-sidebar-body">
                  <button className="ld-action-btn" onClick={() => navigate("/cases")}>
                    <div className="ld-action-btn-left">
                      <div className="ld-action-btn-icon" style={{ background: "rgba(28,43,58,0.07)" }}>
                        <Briefcase size={13} color="#1c2b3a" />
                      </div>
                      <span className="ld-action-btn-title">Manage Portfolio</span>
                    </div>
                    <ChevronRight size={13} color="#b8b2a8" />
                  </button>

                  <button className="ld-action-btn">
                    <div className="ld-action-btn-left">
                      <div className="ld-action-btn-icon" style={{ background: "rgba(196,161,88,0.10)" }}>
                        <Sparkles size={13} color="#c4a158" />
                      </div>
                      <span className="ld-action-btn-title">Generate AI Summary</span>
                    </div>
                    <ChevronRight size={13} color="#b8b2a8" />
                  </button>
                </div>
              </div>

              {/* Practice Insight */}
              <div className="ld-insight">
                <div className="ld-insight-icon">
                  <Lightbulb size={16} color="#c4a158" />
                </div>
                <div className="ld-insight-title">Practice Insight</div>
                <p className="ld-insight-text">
                  Updating "In Progress" statuses daily increases client transparency ratings by{" "}
                  <strong>40%</strong> — improving satisfaction across all active matters.
                </p>
              </div>

            </div>
          </div>
        </main>

        <footer className="ld-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; Secure Lawyer Terminal &nbsp;·&nbsp; AES-256 Encrypted
        </footer>
      </div>
    </>
  );
}
