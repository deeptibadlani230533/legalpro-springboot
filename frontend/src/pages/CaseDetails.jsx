import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, User, Mail, Phone, MapPin,
  Briefcase, Scale, AlertCircle, Clock,
  Shield, ShieldCheck, FileText, Download, Building2, Gavel, StickyNote, Lock
} from "lucide-react";

import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiFetch } from "@/lib/api";

import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import DocumentManager from "../components/DocumentManager";
import ActivityTimeline from "../components/ActivityTimeline";
import CaseComments from "../components/CaseComments";   // ✅ FIXED: was ../pages/CaseComments

const statusConfig = {
  open:        { label: "Open",        bg: "#edfaf2", color: "#2d7a4f", bar: "#2d7a4f" },
  assigned:    { label: "Assigned",    bg: "#fdf8ec", color: "#b8902a", bar: "#c4a158" },
  in_progress: { label: "In Progress", bg: "#eef4fd", color: "#2859a0", bar: "#3b7dd8" },
  closed:      { label: "Closed",      bg: "#f4f2ee", color: "#6b6355", bar: "#9a9485" },
};

// ══════════════════════════════════════════════════════
//  PROFESSIONAL PDF GENERATOR  (unchanged)
// ══════════════════════════════════════════════════════
function generateProfessionalReport(caseData, id) {
  const doc  = new jsPDF({ unit: "mm", format: "a4" });
  const W    = doc.internal.pageSize.getWidth();
  const H    = doc.internal.pageSize.getHeight();

  const NAVY   = [28,  43,  58 ];
  const GOLD   = [196, 161, 88 ];
  const GOLD_L = [240, 228, 188];
  const WARM   = [244, 242, 238];
  const MUTED  = [154, 148, 133];
  const DARK   = [26,  26,  26 ];
  const WHITE  = [255, 255, 255];
  const RED_S  = [192, 57,  43 ];
  const GRN_S  = [74,  124, 89 ];
  const BLU_S  = [40,  89,  160];

  const setFill = (c) => doc.setFillColor(...c);
  const setDraw = (c) => doc.setDrawColor(...c);
  const setTxt  = (c) => doc.setTextColor(...c);
  const font    = (style = "normal", size = 10) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
  };

  const statusBadgeColor = {
    open: GRN_S, assigned: [184,144,42], in_progress: BLU_S, closed: MUTED,
  }[caseData.status] || MUTED;

  const priorityColor = {
    high: RED_S, medium: [184,144,42], low: GRN_S,
  }[(caseData.priority || "").toLowerCase()] || MUTED;

  const genDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const pill = (label, color, x, y) => {
    const tw = doc.getTextWidth(label);
    setFill(color);
    doc.roundedRect(x, y - 4.5, tw + 8, 6.5, 1.5, 1.5, "F");
    font("bold", 7);
    setTxt(WHITE);
    doc.text(label, x + 4, y + 0.3);
    return x + tw + 13;
  };

  const COL1 = 14, COL2 = W / 2 + 4, CW = W / 2 - 22;
  const infoBlock = (label, value, x, y) => {
    font("bold", 7);
    setTxt(MUTED);
    doc.text(label.toUpperCase(), x, y);
    font("normal", 9);
    setTxt(DARK);
    const lines = doc.splitTextToSize(String(value || "—"), CW);
    doc.text(lines, x, y + 5);
    return y + 5 + lines.length * 4.5 + 5;
  };

  setFill(NAVY); doc.rect(0, 0, W, 40, "F");
  setFill(GOLD); doc.triangle(14, 28, 23, 28, 18.5, 18, "F");
  font("bold", 18); setTxt(WHITE); doc.text("LegalPro", 28, 24);
  font("normal", 7.5); setTxt(GOLD_L); doc.text("MANAGEMENT SYSTEMS", 28, 30);
  font("normal", 7.5); setTxt([190, 205, 220]);
  doc.text("CONFIDENTIAL CASE REPORT", W - 14, 16, { align: "right" });
  font("bold", 10); setTxt(GOLD_L);
  doc.text(`Case #${String(id).padStart(4, "0")}`, W - 14, 24, { align: "right" });
  font("normal", 7.5); setTxt([190, 205, 220]);
  doc.text(`Generated: ${genDate}`, W - 14, 31, { align: "right" });
  setFill(GOLD); doc.rect(0, 40, W, 2, "F");

  let y = 52;
  font("bold", 18); setTxt(NAVY);
  const titleLines = doc.splitTextToSize(caseData.caseTitle, W - 28);
  doc.text(titleLines, 14, y);
  y += titleLines.length * 8 + 3;

  const statusLabel   = (caseData.status || "open").replace("_", " ").toUpperCase();
  const priorityLabel = `${(caseData.priority || "MEDIUM").toUpperCase()} PRIORITY`;
  let px = 14;
  px = pill(statusLabel, statusBadgeColor, px, y);
       pill(priorityLabel, priorityColor, px, y);
  y += 11;

  font("normal", 9); setTxt(MUTED);
  const openDate = new Date(caseData.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" });
  doc.text(`Filed on ${openDate}`, 14, y);
  y += 9;

  setDraw([220, 215, 205]); doc.setLineWidth(0.3);
  doc.line(14, y, W - 14, y); y += 8;

  font("bold", 10); setTxt(NAVY); doc.text("CASE NARRATIVE", 14, y);
  setFill(GOLD); doc.rect(14, y + 1.5, 30, 0.8, "F"); y += 8;
  const descLines = doc.splitTextToSize(caseData.description || "No description provided.", W - 30);
  setFill(WARM); doc.roundedRect(14, y - 3, W - 28, descLines.length * 5.3 + 8, 2, 2, "F");
  font("italic", 9); setTxt([92, 86, 73]); doc.text(descLines, 19, y + 2);
  y += descLines.length * 5.3 + 13;

  font("bold", 10); setTxt(NAVY); doc.text("CLIENT INFORMATION", 14, y);
  setFill(GOLD); doc.rect(14, y + 1.5, 38, 0.8, "F"); y += 9;
  const y1a = infoBlock("Full Name", caseData.clientName, COL1, y);
  const y1b = infoBlock("Email",     caseData.clientEmail, COL2, y);
  y = Math.max(y1a, y1b);
  const y2a = infoBlock("Phone",   caseData.clientPhone,   COL1, y);
  const y2b = infoBlock("Address", caseData.clientAddress, COL2, y);
  y = Math.max(y2a, y2b);

  doc.setLineWidth(0.3); setDraw([220, 215, 205]);
  doc.line(14, y, W - 14, y); y += 8;

  font("bold", 10); setTxt(NAVY); doc.text("LEGAL PARAMETERS", 14, y);
  setFill(GOLD); doc.rect(14, y + 1.5, 34, 0.8, "F"); y += 9;
  const y3a = infoBlock("Legal Category", caseData.category,     COL1, y);
  const y3b = infoBlock("Incident Date",  caseData.incidentDate, COL2, y);
  y = Math.max(y3a, y3b);
  const y4a = infoBlock("Opposing Party", caseData.opponentName, COL1, y);
  const y4b = infoBlock("Case Status",    (caseData.status || "").replace("_", " "), COL2, y);
  y = Math.max(y4a, y4b) + 4;

  setFill(NAVY); doc.roundedRect(14, y, W - 28, 24, 3, 3, "F");
  font("bold", 8); setTxt(GOLD_L); doc.text("TOTAL CLAIM VALUATION", 22, y + 8);
  font("bold", 16); setTxt(WHITE);
  doc.text(`INR ${Number(caseData.claimAmount).toLocaleString("en-IN")}`, 22, y + 18);
  font("normal", 7.5); setTxt([170, 190, 210]);
  doc.text("Subject to legal audit and court determination", W - 16, y + 18, { align: "right" });

  doc.addPage();
  setFill(NAVY); doc.rect(0, 0, W, 17, "F");
  font("bold", 9); setTxt(WHITE); doc.text("LegalPro — Case Report (Continued)", 14, 11);
  font("normal", 7.5); setTxt(GOLD_L);
  doc.text(`Case #${String(id).padStart(4, "0")}  ·  ${caseData.caseTitle}`, W - 14, 11, { align: "right" });
  setFill(GOLD); doc.rect(0, 17, W, 1.5, "F");

  y = 28;
  font("bold", 10); setTxt(NAVY); doc.text("COMPLETE CASE RECORD", 14, y);
  setFill(GOLD); doc.rect(14, y + 1.5, 42, 0.8, "F"); y += 8;

  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 },
    head: [["Field", "Details"]],
    body: [
      ["Case Title",       caseData.caseTitle],
      ["Case ID",          `#${String(id).padStart(4, "0")}`],
      ["Current Status",   (caseData.status || "").replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())],
      ["Priority Level",   (caseData.priority || "").toUpperCase()],
      ["Legal Category",   caseData.category],
      ["Date Filed",       new Date(caseData.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })],
      ["Incident Date",    caseData.incidentDate],
      ["Claim Amount",     `INR ${Number(caseData.claimAmount).toLocaleString("en-IN")}`],
      ["Assigned Lawyer",  caseData.assignedLawyer?.name || "Not assigned"],
      ["— CLIENT", ""],
      ["Client Name",      caseData.clientName],
      ["Client Email",     caseData.clientEmail],
      ["Client Phone",     caseData.clientPhone],
      ["Client Address",   caseData.clientAddress],
      ["— OPPOSING PARTY", ""],
      ["Opponent Name",    caseData.opponentName],
      ["— DESCRIPTION", ""],
      ["Case Narrative",   caseData.description || "No description provided."],
    ],
    theme: "plain",
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: "bold", fontSize: 9, halign: "left", cellPadding: { top: 5, bottom: 5, left: 6, right: 6 } },
    bodyStyles: { fontSize: 9, textColor: [51, 51, 51], cellPadding: { top: 4, bottom: 4, left: 6, right: 6 }, lineColor: [230, 225, 215], lineWidth: 0.3 },
    columnStyles: { 0: { fontStyle: "bold", textColor: NAVY, fillColor: WARM, cellWidth: 52 }, 1: { cellWidth: "auto" } },
    didParseCell(data) {
      const v = String(data.cell.raw || "");
      if (v.startsWith("—")) {
        data.cell.styles.fillColor = NAVY; data.cell.styles.textColor = GOLD_L;
        data.cell.styles.fontStyle = "bold"; data.cell.styles.fontSize = 8;
        data.cell.text = [v.replace("— ", "")];
      }
    },
  });

  y = doc.lastAutoTable.finalY + 14;
  setFill(WARM); doc.roundedRect(14, y, W - 28, 22, 2, 2, "F");
  setDraw(GOLD); doc.setLineWidth(0.5); doc.roundedRect(14, y, W - 28, 22, 2, 2, "S");
  font("bold", 8); setTxt(NAVY); doc.text("LEGAL DISCLAIMER", 19, y + 7);
  font("normal", 7.5); setTxt([92, 86, 73]);
  doc.text(doc.splitTextToSize("This document is generated by the LegalPro Case Management System and is strictly confidential. It is intended solely for authorized personnel. Unauthorized distribution or reproduction is strictly prohibited under applicable laws.", W - 40), 19, y + 13);

  y += 30;
  if (y < H - 50) {
    font("bold", 9); setTxt(NAVY); doc.text("AUTHORIZED SIGNATURES", 14, y);
    setFill(GOLD); doc.rect(14, y + 1.5, 44, 0.7, "F"); y += 10;
    doc.setLineWidth(0.3); setDraw([180, 175, 165]);
    doc.line(14, y, 80, y); doc.line(W - 80, y, W - 14, y);
    font("normal", 8); setTxt(MUTED);
    doc.text("Lawyer / Counsel Signature", 14, y + 5);
    doc.text("Authorizing Partner / Admin", W - 14, y + 5, { align: "right" });
    y += 14; font("normal", 7.5);
    doc.text(`Date: ${genDate}`, 14, y);
    doc.text(`Report ID: LP-${String(id).padStart(6, "0")}-${Date.now().toString().slice(-5)}`, W - 14, y, { align: "right" });
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setFill(NAVY); doc.rect(0, H - 12, W, 12, "F");
    font("normal", 7); setTxt([170, 185, 200]);
    doc.text("LegalPro Management Systems  ·  AES-256 Encrypted  ·  Tier III Security  ·  CONFIDENTIAL", W / 2, H - 5, { align: "center" });
    font("bold", 7); setTxt(GOLD_L);
    doc.text(`${i} / ${totalPages}`, W - 7, H - 5, { align: "right" });
  }

  doc.save(`LegalPro_Report_${caseData.caseTitle.replace(/\s+/g, "_")}_${String(id).padStart(4, "0")}.pdf`);
}

// ══════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════
export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData]               = useState(null);
  const [role, setRole]                       = useState(null);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [internalNote, setInternalNote]       = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    const savedNote = localStorage.getItem(`note_case_${id}`);
    if (savedNote) setInternalNote(savedNote);

    const fetchCase = async () => {
      try {
        const token = localStorage.getItem("token");
        const res   = await apiFetch(`/api/cases/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setCaseData(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch case details.");
      }
    };
    fetchCase();
  }, [id]);

  const saveInternalNote = () => {
    localStorage.setItem(`note_case_${id}`, internalNote);
    toast.success("Internal strategy note saved locally.");
  };

  const handleAcceptCase = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await apiFetch(`/api/cases/${id}/accept`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setCaseData((p) => ({ ...p, status: "in_progress" }));
      setActivityRefresh((p) => p + 1);
      toast.success("Case accepted successfully");
    } catch { toast.error("Failed to accept case"); }
  };

  const handleCloseCase = async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await apiFetch(`/api/cases/${id}/close`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setCaseData((p) => ({ ...p, status: "closed" }));
      setActivityRefresh((p) => p + 1);
      toast.success("Case closed successfully");
    } catch { toast.error("Failed to close case"); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res   = await apiFetch(`/api/cases/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setCaseData((p) => ({ ...p, status: newStatus }));
      setActivityRefresh((p) => p + 1);
      toast.success("Status updated");
    } catch { toast.error("Failed to update status"); }
  };

  const handleGenerateReport = () => {
    if (!caseData) return;
    generateProfessionalReport(caseData, id);
  };

  if (!caseData) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f4f2ee", fontFamily:"'Inter',sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #e5e0d8", borderTopColor:"#c4a158", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }} />
          <p style={{ color:"#9a9485", fontSize:14 }}>Loading case details…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sc = statusConfig[caseData.status] || statusConfig.open;
  const assignedLawyer = caseData.assignedLawyer || null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .cd-root { min-height:100vh; display:flex; flex-direction:column; background:#f4f2ee; font-family:'Inter',sans-serif; position:relative; }
        .cd-bg-glow1 { position:fixed; top:-100px; right:-100px; width:460px; height:460px; border-radius:50%; background:radial-gradient(circle,rgba(196,161,88,0.07) 0%,transparent 70%); pointer-events:none; z-index:0; }
        .cd-bg-glow2 { position:fixed; bottom:-100px; left:-80px; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(28,43,58,0.06) 0%,transparent 70%); pointer-events:none; z-index:0; }
        .cd-main { flex:1; width:100%; max-width:1200px; margin:0 auto; padding:36px 32px 60px; position:relative; z-index:1; }
        .cd-back-row { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
        .cd-back-btn { display:inline-flex; align-items:center; gap:8px; font-family:'Inter',sans-serif; font-size:12px; font-weight:600; color:#6b6355; background:#fff; border:1.5px solid #e5e0d8; border-radius:9px; padding:8px 16px; cursor:pointer; transition:border-color 0.15s,color 0.15s; letter-spacing:0.04em; }
        .cd-back-btn:hover { border-color:#c4a158; color:#1a1a1a; }
        .cd-grid { display:grid; grid-template-columns:1fr 300px; gap:24px; align-items:start; }
        @media (max-width:900px) { .cd-grid { grid-template-columns:1fr; } }
        .cd-left,.cd-right { display:flex; flex-direction:column; gap:20px; }
        .cd-card { background:#fff; border:1px solid #e5e0d8; border-radius:18px; overflow:hidden; }
        .cd-card-top-bar { height:3px; width:100%; }
        .cd-card-header { padding:22px 26px 14px; border-bottom:1px solid #f0ece4; }
        .cd-card-eyebrow { font-size:10px; font-weight:600; color:#c4a158; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
        .cd-card-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:500; color:#1a1a1a; margin:0 0 6px; }
        .cd-card-meta { font-size:12px; font-weight:300; color:#9a9485; display:flex; align-items:center; gap:6px; }
        .cd-card-body { padding:22px 26px; }
        .cd-status-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 13px; border-radius:999px; font-size:11px; font-weight:600; letter-spacing:0.06em; text-transform:capitalize; border:1px solid; }
        .cd-status-dot { width:6px; height:6px; border-radius:50%; }
        .cd-desc-block { background:#faf9f6; border:1px solid #ede9e2; border-radius:12px; padding:18px 20px; }
        .cd-desc-label { font-size:10px; font-weight:600; color:#c4a158; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
        .cd-desc-text { font-size:13px; font-weight:300; color:#5c5649; line-height:1.75; font-style:italic; }
        .cd-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        @media (max-width:600px) { .cd-info-grid { grid-template-columns:1fr; } }
        .cd-info-label { font-size:10px; font-weight:600; color:#b8b2a8; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px; }
        .cd-info-value { font-size:13px; font-weight:500; color:#1a1a1a; display:flex; align-items:flex-start; gap:7px; line-height:1.5; }
        .cd-info-value-icon { color:#b8b2a8; flex-shrink:0; margin-top:1px; }
        .cd-claim-card { background:#1c2b3a; border-radius:18px; padding:26px; position:relative; overflow:hidden; }
        .cd-claim-bg-icon { position:absolute; right:-20px; top:-20px; opacity:0.06; transform:rotate(15deg); }
        .cd-claim-eyebrow { font-size:10px; font-weight:600; color:rgba(196,161,88,0.8); letter-spacing:0.2em; text-transform:uppercase; margin-bottom:8px; }
        .cd-claim-amount { font-family:'Playfair Display',serif; font-size:36px; font-weight:400; color:#f0ede4; letter-spacing:-0.01em; margin-bottom:14px; }
        .cd-claim-secure { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:5px 10px; font-size:10px; font-weight:500; color:rgba(240,237,228,0.6); }
        .cd-sidebar-card { background:#fff; border:1px solid #e5e0d8; border-radius:18px; overflow:hidden; }
        .cd-sidebar-card-header { padding:16px 20px; border-bottom:1px solid #f0ece4; font-size:10px; font-weight:600; color:#9a9485; letter-spacing:0.15em; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
        .cd-sidebar-card-body { padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
        .cd-notes-card { background:#fffdf5; border:1px solid #ede0b8; border-radius:18px; overflow:hidden; }
        .cd-notes-header { padding:14px 20px; border-bottom:1px solid #ede0b8; display:flex; align-items:center; justify-content:space-between; }
        .cd-notes-title { font-size:10px; font-weight:600; color:#8a6f1e; letter-spacing:0.15em; text-transform:uppercase; display:flex; align-items:center; gap:7px; }
        .cd-notes-badge { font-size:9px; font-weight:600; color:#a07820; background:#fef3c7; border:1px solid #f0d060; border-radius:6px; padding:2px 8px; display:flex; align-items:center; gap:4px; }
        .cd-notes-body { padding:16px 20px; display:flex; flex-direction:column; gap:10px; }
        .cd-notes-textarea { width:100%; min-height:110px; background:#fff !important; border:1.5px solid #ede0b8 !important; border-radius:9px !important; padding:12px !important; font-family:'Inter',sans-serif !important; font-size:13px !important; font-weight:300 !important; color:#1a1a1a !important; resize:vertical; outline:none; transition:border-color 0.15s !important; }
        .cd-notes-textarea:focus { border-color:#c4a158 !important; }
        .cd-btn-primary { width:100%; height:46px !important; background:#1c2b3a !important; color:#f0ede4 !important; border:none !important; border-radius:10px !important; font-family:'Inter',sans-serif !important; font-size:12px !important; font-weight:600 !important; letter-spacing:0.1em !important; text-transform:uppercase !important; cursor:pointer !important; transition:background 0.15s !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:8px !important; }
        .cd-btn-primary:hover { background:#243547 !important; }
        .cd-btn-outline { width:100%; height:46px !important; background:#fff !important; color:#1c2b3a !important; border:1.5px solid #1c2b3a !important; border-radius:10px !important; font-family:'Inter',sans-serif !important; font-size:12px !important; font-weight:600 !important; letter-spacing:0.1em !important; text-transform:uppercase !important; cursor:pointer !important; transition:background 0.15s !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:8px !important; }
        .cd-btn-outline:hover { background:#f4f2ee !important; }
        .cd-btn-notes-save { width:100%; height:42px !important; background:#8a6f1e !important; color:#fff !important; border:none !important; border-radius:9px !important; font-family:'Inter',sans-serif !important; font-size:11px !important; font-weight:600 !important; letter-spacing:0.1em !important; text-transform:uppercase !important; cursor:pointer !important; transition:background 0.15s !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:7px !important; }
        .cd-btn-notes-save:hover { background:#7a5f0e !important; }
        .cd-select-trigger { width:100%; height:46px !important; background:#fff !important; border:1.5px solid #e5e0d8 !important; border-radius:10px !important; font-family:'Inter',sans-serif !important; font-size:13px !important; color:#1a1a1a !important; transition:border-color 0.15s !important; }
        .cd-select-trigger:focus { border-color:#c4a158 !important; }
        .cd-select-label { font-size:10px; font-weight:600; color:#9a9485; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }

        /* ── Assigned Lawyer card ── */
        .cd-lawyer-card { background:#fff; border:1px solid #e5e0d8; border-radius:18px; overflow:hidden; }
        .cd-lawyer-head { padding:14px 20px; border-bottom:1px solid #f0ece4; display:flex; align-items:center; gap:8px; }
        .cd-lawyer-eyebrow { font-size:10px; font-weight:600; color:#c4a158; letter-spacing:0.15em; text-transform:uppercase; }
        .cd-lawyer-body { padding:16px 20px; display:flex; align-items:center; gap:14px; }
        .cd-lawyer-avatar { width:44px; height:44px; border-radius:12px; background:#1c2b3a; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .cd-lawyer-avatar-initials { font-size:15px; font-weight:700; color:#f0ede4; letter-spacing:0.04em; }
        .cd-lawyer-name { font-family:'Playfair Display',serif; font-size:16px; font-weight:500; color:#1a1a1a; margin-bottom:3px; }
        .cd-lawyer-role-badge { display:inline-flex; align-items:center; gap:4px; font-size:9px; font-weight:600; color:#2859a0; background:#eef4fd; border:1px solid #bdd3f5; border-radius:5px; padding:2px 8px; letter-spacing:0.06em; text-transform:uppercase; }
        .cd-lawyer-email { font-size:11px; font-weight:300; color:#9a9485; margin-top:4px; }
        .cd-lawyer-unassigned { padding:16px 20px; display:flex; align-items:center; gap:10px; }
        .cd-lawyer-unassigned-icon { width:36px; height:36px; border-radius:9px; background:#f4f2ee; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .cd-lawyer-unassigned-text { font-size:12px; font-weight:400; color:#b8b2a8; }

        .cd-footer { text-align:center; padding:24px; font-size:11px; font-weight:400; color:#c0b9ae; letter-spacing:0.06em; border-top:1px solid #ede9e2; position:relative; z-index:1; }
      `}</style>

      <div className="cd-root">
        <div className="cd-bg-glow1" /><div className="cd-bg-glow2" />
        <Header />

        <main className="cd-main">
          <div className="cd-back-row">
            <button className="cd-back-btn" onClick={() => navigate("/cases")}>
              <ArrowLeft size={13} /> Back to Directory
            </button>
          </div>

          <div className="cd-grid">

            {/* ── LEFT COLUMN ── */}
            <div className="cd-left">

              {/* Overview */}
              <div className="cd-card">
                <div className="cd-card-top-bar" style={{ background:`linear-gradient(90deg,${sc.bar},${sc.bar}66)` }} />
                <div className="cd-card-header">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                    <div>
                      <div className="cd-card-eyebrow"><Briefcase size={11}/> Case Overview</div>
                      <div className="cd-card-title">{caseData.caseTitle}</div>
                      <div className="cd-card-meta">
                        <Calendar size={12}/>
                        Opened {new Date(caseData.createdAt).toLocaleDateString(undefined, { dateStyle:"long" })}
                      </div>
                    </div>
                    <div className="cd-status-badge" style={{ background:sc.bg, color:sc.color, borderColor:sc.color+"44" }}>
                      <div className="cd-status-dot" style={{ background:sc.color }} />
                      {caseData.status.replace("_"," ")}
                    </div>
                  </div>
                </div>
                <div className="cd-card-body">
                  <div className="cd-desc-block">
                    <div className="cd-desc-label"><FileText size={11}/> Case Narrative & Facts</div>
                    <p className="cd-desc-text">"{caseData.description}"</p>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <div className="cd-card-eyebrow"><User size={11}/> Client Profile</div>
                  <div className="cd-card-title" style={{ fontSize:18 }}>Client Information</div>
                </div>
                <div className="cd-card-body">
                  <div className="cd-info-grid">
                    {[
                      ["Full Name",           <User size={13} className="cd-info-value-icon"/>,   caseData.clientName],
                      ["Email Address",       <Mail size={13} className="cd-info-value-icon"/>,   caseData.clientEmail],
                      ["Phone Number",        <Phone size={13} className="cd-info-value-icon"/>,  caseData.clientPhone],
                      ["Residential Address", <MapPin size={13} className="cd-info-value-icon"/>, caseData.clientAddress],
                    ].map(([lbl,icon,val]) => (
                      <div key={lbl}>
                        <div className="cd-info-label">{lbl}</div>
                        <div className="cd-info-value">{icon}<span style={{ wordBreak:"break-all" }}>{val}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legal Parameters */}
              <div className="cd-card">
                <div className="cd-card-header">
                  <div className="cd-card-eyebrow"><Scale size={11}/> Legal Details</div>
                  <div className="cd-card-title" style={{ fontSize:18 }}>Legal Parameters</div>
                </div>
                <div className="cd-card-body">
                  <div className="cd-info-grid">
                    <div>
                      <div className="cd-info-label">Category</div>
                      <div className="cd-info-value"><Building2 size={13} className="cd-info-value-icon"/>{caseData.category}</div>
                    </div>
                    <div>
                      <div className="cd-info-label">Priority Level</div>
                      <div className="cd-info-value">
                        <AlertCircle size={13} style={{ color:caseData.priority==="high"?"#c0392b":"#b8b2a8", flexShrink:0, marginTop:1 }}/>
                        <span style={{ textTransform:"capitalize" }}>{caseData.priority}</span>
                      </div>
                    </div>
                    <div>
                      <div className="cd-info-label">Incident Date</div>
                      <div className="cd-info-value"><Clock size={13} className="cd-info-value-icon"/>{caseData.incidentDate}</div>
                    </div>
                    <div>
                      <div className="cd-info-label">Opposing Party</div>
                      <div className="cd-info-value"><Gavel size={13} className="cd-info-value-icon"/>{caseData.opponentName}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <ActivityTimeline caseId={id} refreshKey={activityRefresh} />

              {/* Case Comments — ✅ correct import path now */}
              <CaseComments caseId={id} />

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="cd-right">

              {/* Claim Valuation */}
              <div className="cd-claim-card">
                <div className="cd-claim-bg-icon"><Scale size={130} color="#fff"/></div>
                <div className="cd-claim-eyebrow">Claim Valuation</div>
                <div className="cd-claim-amount">₹{Number(caseData.claimAmount).toLocaleString("en-IN")}</div>
                <div className="cd-claim-secure"><ShieldCheck size={12} color="#4a7c59"/> Secure Legal Audit</div>
              </div>

              {/* ── Assigned Lawyer Card ── always visible */}
              <div className="cd-lawyer-card">
                <div className="cd-lawyer-head">
                  <Gavel size={12} color="#c4a158" />
                  <span className="cd-lawyer-eyebrow">Assigned Counsel</span>
                </div>

                {assignedLawyer ? (
                  <div className="cd-lawyer-body">
                    <div className="cd-lawyer-avatar">
                      <span className="cd-lawyer-avatar-initials">
                        {assignedLawyer.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "L"}
                      </span>
                    </div>
                    <div>
                      <div className="cd-lawyer-name">{assignedLawyer.name}</div>
                      <div className="cd-lawyer-role-badge">
                        <Shield size={9} /> Lawyer
                      </div>
                      {assignedLawyer.email && (
                        <div className="cd-lawyer-email">{assignedLawyer.email}</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="cd-lawyer-unassigned">
                    <div className="cd-lawyer-unassigned-icon">
                      <User size={16} color="#c8c2b8" />
                    </div>
                    <span className="cd-lawyer-unassigned-text">
                      No lawyer assigned yet
                    </span>
                  </div>
                )}
              </div>

              {/* Strategy Notes (lawyer/admin only) */}
              {(role==="lawyer"||role==="admin") && (
                <div className="cd-notes-card">
                  <div className="cd-notes-header">
                    <div className="cd-notes-title"><StickyNote size={13}/> Strategy Notes</div>
                    <div className="cd-notes-badge"><Lock size={9}/> Internal Only</div>
                  </div>
                  <div className="cd-notes-body">
                    <textarea
                      className="cd-notes-textarea"
                      placeholder="Type private case strategy or lawyer notes here…"
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                    />
                    <Button className="cd-btn-notes-save" onClick={saveInternalNote}>
                      <StickyNote size={12}/> Save Note
                    </Button>
                  </div>
                </div>
              )}

              {/* Document Manager */}
              <DocumentManager caseId={id} role={role}/>

              {/* Lawyer Controls */}
              {role==="lawyer" && (
                <div className="cd-sidebar-card">
                  <div className="cd-sidebar-card-header"><Gavel size={12}/> Lawyer Controls</div>
                  <div className="cd-sidebar-card-body">
                    {caseData.status==="assigned"    && <Button className="cd-btn-primary" onClick={handleAcceptCase}>Accept Case</Button>}
                    {caseData.status==="in_progress" && <Button className="cd-btn-outline" onClick={handleCloseCase}>Close Case</Button>}
                  </div>
                </div>
              )}

              {/* Admin Controls */}
              {role==="admin" && (
                <div className="cd-sidebar-card">
                  <div className="cd-sidebar-card-header"><Shield size={12}/> Administration</div>
                  <div className="cd-sidebar-card-body">
                    <div>
                      <div className="cd-select-label">Global Status</div>
                      <Select value={caseData.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="cd-select-trigger"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="cd-btn-outline" onClick={handleGenerateReport}>
                      <Download size={14}/> Export Case Report
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>

        <footer className="cd-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; Tier III Security &nbsp;·&nbsp; AES-256 Encrypted
        </footer>
      </div>
    </>
  );
}
