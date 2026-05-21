import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Briefcase,
  Plus,
  Search,
  Layers,
  Clock,
  AlertCircle,
} from "lucide-react";

import Header from "../components/Header.jsx";
import CaseTable from "../components/cases/CaseTable.jsx";
import AssignLawyerDialog from "../components/cases/AssignLawyerDialog.jsx";
import ArchiveCaseDialog from "../components/cases/ArchiveCaseDialog.jsx";
import { Button } from "@/components/ui/button";

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [caseToAssign, setCaseToAssign] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [caseToArchive, setCaseToArchive] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCases();
    if (role === "admin") fetchLawyers();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const endpoint =
        role === "lawyer"
          ? `${import.meta.env.VITE_API_URL}/api/lawyer/cases`
          : `${import.meta.env.VITE_API_URL}/api/cases`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCases(role === "lawyer" ? data.cases : data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/lawyers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLawyers(data);
    } catch (err) {
      toast.error("Failed to load lawyers");
    }
  };

  const assignLawyer = async () => {
    if (!caseToAssign || !selectedLawyer) {
      toast.error("Please select a lawyer");
      return;
    }
    setIsAssigning(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cases/${caseToAssign.id}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lawyerId: selectedLawyer }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Counsel assigned successfully");
      toast.success("📱 WhatsApp sent to client & lawyer");
      setCases((prev) =>
        prev.map((c) => (c.id === caseToAssign.id ? { ...c, status: "assigned" } : c)),
      );
      setIsAssignDialogOpen(false);
      setSelectedLawyer("");
      setCaseToAssign(null);
    } catch (err) {
      toast.error(err.message || "Assignment failed");
    } finally {
      setIsAssigning(false);
    }
  };

  const archiveCase = async () => {
    if (!caseToArchive) return;
    setIsArchiving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cases/${caseToArchive.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Matter archived successfully");
      setCases((prev) => prev.filter((c) => c.id !== caseToArchive.id));
      setIsArchiveDialogOpen(false);
      setCaseToArchive(null);
    } catch (err) {
      toast.error(err.message || "Archive failed");
    } finally {
      setIsArchiving(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.caseTitle?.toLowerCase().includes(term) ||
      c.clientName?.toLowerCase().includes(term) ||
      c.status?.toLowerCase().includes(term)
    );
  });

 const stats = {
  total: cases.length,
  active: cases.filter((c) => c.status !== "closed").length,
  pending: cases.filter(
    (c) => !c.assignedLawyerId && c.status !== "closed"
  ).length,
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .cs-root {
          min-height: 100vh;
          display: flex; flex-direction: column;
          background: #f4f2ee;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        .cs-bg-glow1 {
          position: fixed; top: -100px; right: -100px;
          width: 460px; height: 460px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .cs-bg-glow2 {
          position: fixed; bottom: -100px; left: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(28,43,58,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .cs-main {
          flex: 1; width: 100%; max-width: 1200px;
          margin: 0 auto; padding: 40px 32px 60px;
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 32px;
        }

        /* ── Page Header ── */
        .cs-page-header {
          display: flex; justify-content: space-between;
          align-items: flex-end; gap: 20px; flex-wrap: wrap;
          padding-bottom: 28px;
          border-bottom: 1px solid #e5e0d8;
        }

        .cs-header-left {}

        .cs-header-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 10px;
        }

        .cs-header-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.5vw, 40px);
          font-weight: 400; color: #1a1a1a;
          line-height: 1.15; margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .cs-header-title em { font-style: italic; color: #c4a158; }

        .cs-header-sub {
          font-size: 13px; font-weight: 300; color: #9a9485;
        }

        .cs-header-right {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }

        /* Search input */
        .cs-search-wrap {
          position: relative;
        }

        .cs-search-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: #b8b2a8; pointer-events: none;
        }

        .cs-search-input {
          height: 44px;
          background: #fff;
          border: 1.5px solid #e5e0d8;
          border-radius: 10px;
          padding: 0 16px 0 40px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 400;
          color: #1a1a1a; width: 240px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .cs-search-input:focus {
          border-color: #c4a158;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12);
        }

        .cs-search-input::placeholder { color: #c8c2b8; }

        /* New Intake button */
        .cs-new-btn {
          height: 44px !important;
          background: #1c2b3a !important;
          color: #f0ede4 !important;
          border: none !important;
          border-radius: 10px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 12px !important; font-weight: 600 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          padding: 0 20px !important;
          display: flex !important; align-items: center !important;
          gap: 8px !important; cursor: pointer !important;
          transition: background 0.15s, transform 0.12s !important;
          white-space: nowrap;
        }

        .cs-new-btn:hover { background: #243547 !important; }
        .cs-new-btn:active { transform: scale(0.98) !important; }

        /* ── Stat Cards ── */
        .cs-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        @media (max-width: 640px) { .cs-stats-grid { grid-template-columns: 1fr; } }

        .cs-stat-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 16px;
          padding: 22px 24px;
          display: flex; align-items: center; gap: 16px;
          position: relative; overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .cs-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.06);
        }

        .cs-stat-card-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
        }

        .cs-stat-icon-box {
          width: 44px; height: 44px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .cs-stat-label {
          font-size: 10px; font-weight: 600; color: #9a9485;
          letter-spacing: 0.12em; text-transform: uppercase;
          margin-bottom: 4px;
        }

        .cs-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 400;
          color: #1a1a1a; line-height: 1;
        }

        /* ── Table Card ── */
        .cs-table-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 18px;
          overflow: hidden;
        }

        .cs-table-header {
          padding: 18px 24px;
          border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center;
          justify-content: space-between;
        }

        .cs-table-header-left {
          font-size: 10px; font-weight: 600;
          color: #9a9485; letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .cs-table-header-right {
          display: flex; align-items: center; gap: 8px;
        }

        .cs-live-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4a7c59;
          animation: cs-pulse 2s ease-in-out infinite;
        }

        @keyframes cs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.75); }
        }

        .cs-live-text {
          font-size: 10px; font-weight: 600;
          color: #4a7c59; letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .cs-footer {
          text-align: center; padding: 24px;
          font-size: 11px; font-weight: 400;
          color: #c0b9ae; letter-spacing: 0.06em;
          border-top: 1px solid #ede9e2;
          position: relative; z-index: 1;
        }
      `}</style>

      <div className="cs-root">
        <div className="cs-bg-glow1" />
        <div className="cs-bg-glow2" />

        <Header />

        <main className="cs-main">

          {/* ── Page Header ── */}
          <div className="cs-page-header">
            <div className="cs-header-left">
              <div className="cs-header-eyebrow">
                <Layers size={12} />
                Case Management
              </div>
              <h1 className="cs-header-title">
                Matter <em>Directory</em>
              </h1>
              <p className="cs-header-sub">
                Reviewing {stats.total} total legal records in the system.
              </p>
            </div>

            <div className="cs-header-right">
              <div className="cs-search-wrap">
                <Search size={15} className="cs-search-icon" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search matters..."
                  className="cs-search-input"
                />
              </div>

              {role === "client" && (
                <Button
                  onClick={() => navigate("/intake")}
                  className="cs-new-btn"
                >
                  <Plus size={15} />
                  New Intake
                </Button>
              )}
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="cs-stats-grid">
            <div className="cs-stat-card">
              <div className="cs-stat-card-bar"
                style={{ background: "linear-gradient(90deg, #1c2b3a, #1c2b3a88)" }} />
              <div className="cs-stat-icon-box" style={{ background: "rgba(28,43,58,0.07)" }}>
                <Briefcase size={18} color="#1c2b3a" />
              </div>
              <div>
                <div className="cs-stat-label">Total Matters</div>
                <div className="cs-stat-value">{stats.total}</div>
              </div>
            </div>

            <div className="cs-stat-card">
              <div className="cs-stat-card-bar"
                style={{ background: "linear-gradient(90deg, #4a7c59, #4a7c5988)" }} />
              <div className="cs-stat-icon-box" style={{ background: "rgba(74,124,89,0.08)" }}>
                <Clock size={18} color="#4a7c59" />
              </div>
              <div>
                <div className="cs-stat-label">Active Files</div>
                <div className="cs-stat-value">{stats.active}</div>
              </div>
            </div>

            <div className="cs-stat-card">
              <div className="cs-stat-card-bar"
                style={{ background: "linear-gradient(90deg, #c4a158, #c4a15888)" }} />
              <div className="cs-stat-icon-box" style={{ background: "rgba(196,161,88,0.10)" }}>
                <AlertCircle size={18} color="#c4a158" />
              </div>
              <div>
                <div className="cs-stat-label">Unassigned</div>
                <div className="cs-stat-value">{stats.pending}</div>
              </div>
            </div>
          </div>

          {/* ── Table Card ── */}
          <div className="cs-table-card">
            <div className="cs-table-header">
              <span className="cs-table-header-left">Database Records</span>
              <div className="cs-table-header-right">
                <div className="cs-live-dot" />
                <span className="cs-live-text">Live Sync</span>
              </div>
            </div>

            <CaseTable
              cases={filteredCases}
              loading={loading}
              role={role}
              onView={(id) => navigate(`/cases/${id}`)}
              onAssignClick={(item) => {
                setCaseToAssign(item);
                setIsAssignDialogOpen(true);
              }}
              onArchiveClick={(item) => {
                setCaseToArchive(item);
                setIsArchiveDialogOpen(true);
              }}
              onCreate={() => navigate("/intake")}
            />
          </div>
        </main>

        <footer className="cs-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; Tier III Security &nbsp;·&nbsp; AES-256 Encrypted
        </footer>

        {/* Dialogs — unchanged */}
        <AssignLawyerDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          lawyers={lawyers}
          selectedLawyer={selectedLawyer}
          setSelectedLawyer={setSelectedLawyer}
          onAssign={assignLawyer}
          isAssigning={isAssigning}
        />

        <ArchiveCaseDialog
          open={isArchiveDialogOpen}
          onOpenChange={setIsArchiveDialogOpen}
          caseTitle={caseToArchive?.caseTitle}
          onArchive={archiveCase}
          isArchiving={isArchiving}
        />
      </div>
    </>
  );
}
