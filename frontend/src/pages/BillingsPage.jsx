import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Receipt, Clock, Plus, Search, Filter, MoreHorizontal,
  CheckCircle, AlertCircle, XCircle, ChevronDown, Loader2,
  RefreshCw, X, FileText, Hourglass, Eye, Pencil,
  TrendingUp, TrendingDown, IndianRupee, Calendar, User,
  Hash, BadgeIndianRupee, Gavel,
} from "lucide-react";
import Header from "../components/Header.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtDate = (s) => s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const authHdr = () => ({ Authorization: "Bearer " + localStorage.getItem("token"), "Content-Type": "application/json" });
const getRole = () => localStorage.getItem("role") || "";
const getUserId = () => localStorage.getItem("userId") || "";

const STATUS_CFG = {
  paid:    { label: "Paid",    color: "#2e7d52", bg: "#edfaf2", dot: "#2e7d52", border: "#b6e8cc" },
  pending: { label: "Pending", color: "#b8902a", bg: "#fdf8ec", dot: "#c4a158", border: "#f0d98a" },
  partial: { label: "Partial", color: "#2859a0", bg: "#eef4fd", dot: "#2859a0", border: "#b9d4f5" },
  overdue: { label: "Overdue", color: "#c0392b", bg: "#fdf4f3", dot: "#c0392b", border: "#f5c0bb" },
};

// ─── Load Razorpay script helper ──────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(s);
  });

// ─── Reusable UI atoms ────────────────────────────────────────────────────

function StatusPill({ status, size = "sm" }) {
  const c = STATUS_CFG[status] || STATUS_CFG.pending;
  const lg = size === "lg";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: c.bg, color: c.color,
      border: "1px solid " + c.border,
      padding: lg ? "5px 14px" : "3px 10px",
      borderRadius: 99, fontSize: lg ? 12 : 10,
      fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap",
      fontFamily: "'Inter', sans-serif",
    }}>
      <span style={{ width: lg ? 8 : 6, height: lg ? 8 : 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function CollectionBar({ paid, amount }) {
  const pct = amount > 0 ? Math.min(100, Math.round((paid / amount) * 100)) : 0;
  const color = pct === 100 ? "#2e7d52" : pct > 50 ? "#2859a0" : "#c4a158";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#ede9e2", borderRadius: 99, overflow: "hidden", minWidth: 70 }}>
        <div style={{ width: pct + "%", height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 10, color: "#9a9485", minWidth: 28, textAlign: "right", fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, accent, Icon }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 16, padding: "20px 22px",
        border: "1px solid #e5e0d8",
        boxShadow: hov ? "0 8px 28px rgba(28,43,58,0.1)" : "0 1px 4px rgba(28,43,58,0.05)",
        transition: "box-shadow 0.2s, transform 0.2s",
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9a9485", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
          {label}
        </span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={accent} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#1a1a1a", lineHeight: 1, fontFamily: "'Playfair Display', serif", fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: 11, color: "#b8b2a8", marginTop: 5, fontFamily: "'Inter', sans-serif" }}>{sub}</div>}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, accent = "#9a9485" }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", borderBottom: "1px solid #f4f2ee" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: accent + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#b8b2a8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3, fontFamily: "'Inter', sans-serif" }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  VIEW / EDIT DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════════════
function ViewDetailsModal({ inv, role, onClose, onUpdated, onMarkPaid, onPayNow }) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: String(inv.amount || ""), paid: String(inv.paid || 0),
    status: inv.status || "pending", dueOn: inv.dueOn || "",
    issuedOn: inv.issuedOn || "", hours: String(inv.hours || 0),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const canEdit = role === "admin" || role === "lawyer";
  const caseName = inv.caseEntity?.caseTitle || inv.caseEntity?.category || "Case #" + inv.caseId;
  const clientName = inv.caseEntity?.clientName || "—";
  const pct = inv.amount > 0 ? Math.min(100, Math.round(((inv.paid || 0) / inv.amount) * 100)) : 0;
  const outstanding = (inv.amount || 0) - (inv.paid || 0);
  const sc = STATUS_CFG[inv.status] || STATUS_CFG.pending;

  const save = async () => {
    if (Number(form.paid) > Number(form.amount)) { toast.error("Paid cannot exceed total amount"); return; }
    if (!form.issuedOn || !form.dueOn) { toast.error("Both dates are required"); return; }
    setSaving(true);
    try {
      const res = await fetch(API + "/api/invoices/" + inv.id, {
        method: "PUT", headers: authHdr(),
        body: JSON.stringify({ amount: Number(form.amount), paid: Number(form.paid), status: form.status, dueOn: form.dueOn || null, issuedOn: form.issuedOn || null, hours: Number(form.hours) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      toast.success("Invoice updated successfully");
      onUpdated(data);
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #e5e0d8", padding: "0 13px", fontSize: 13, color: "#1a1a1a", outline: "none", background: "#fff", boxSizing: "border-box", fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s" };
  const lbl = { fontSize: 10, fontWeight: 700, color: "#5c5649", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6, fontFamily: "'Inter', sans-serif" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.5)", backdropFilter: "blur(4px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#faf9f6", borderRadius: 22, width: 600, maxWidth: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 28px 72px rgba(28,43,58,0.2)", display: "flex", flexDirection: "column", border: "1px solid #e5e0d8" }}>
        {/* Gold top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg,#c4a158,#e2c07a,#c4a158)", borderRadius: "22px 22px 0 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid #f0ece4", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#2859a0", background: "#eef4fd", padding: "2px 9px", borderRadius: 7, border: "1px solid #b9d4f5" }}>
                INV-{String(inv.id).slice(-8).toUpperCase()}
              </span>
              <StatusPill status={inv.status} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>{caseName}</div>
            <div style={{ fontSize: 12, color: "#9a9485", marginTop: 3, fontFamily: "'Inter', sans-serif" }}>Client: {clientName}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {canEdit && !editMode && (
              <button onClick={() => setEditMode(true)} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1.5px solid #e5e0d8", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#5c5649", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif" }}>
                <Pencil size={12} /> Edit
              </button>
            )}
            <button onClick={onClose} style={{ background: "#f0ece4", border: "none", borderRadius: 9, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#6b6355" />
            </button>
          </div>
        </div>

        <div style={{ padding: "22px 26px", flex: 1 }}>
          {/* Amount banner */}
          <div style={{ background: sc.bg, border: "1px solid " + sc.border, borderRadius: 14, padding: "18px 22px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: sc.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'Inter', sans-serif" }}>Total Billed</div>
              <div style={{ fontSize: 30, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>{fmt(inv.amount)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9a9485", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'Inter', sans-serif" }}>Collected</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2e7d52", fontFamily: "'Playfair Display', serif" }}>{fmt(inv.paid)}</div>
              <div style={{ height: 5, background: "#ede9e2", borderRadius: 99, marginTop: 7, overflow: "hidden", width: 110 }}>
                <div style={{ width: pct + "%", height: "100%", background: pct === 100 ? "#2e7d52" : "#c4a158", borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 10, color: "#9a9485", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>{pct}% collected</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9a9485", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'Inter', sans-serif" }}>Outstanding</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: outstanding > 0 ? "#c4a158" : "#2e7d52", fontFamily: "'Playfair Display', serif" }}>{fmt(outstanding)}</div>
            </div>
          </div>

          {/* VIEW mode */}
          {!editMode && (
            <>
              <InfoRow icon={Hash} label="Invoice ID" value={"INV-" + String(inv.id).slice(-8).toUpperCase()} accent="#2859a0" />
              <InfoRow icon={Gavel} label="Case" value={caseName} accent="#7c3aed" />
              <InfoRow icon={User} label="Client" value={clientName} accent="#0891b2" />
              <InfoRow icon={Calendar} label="Issued On" value={fmtDate(inv.issuedOn)} accent="#2e7d52" />
              <InfoRow icon={Calendar} label="Due Date" value={fmtDate(inv.dueOn)} accent={inv.status === "overdue" ? "#c0392b" : "#c4a158"} />
              <InfoRow icon={Clock} label="Billable Hours" value={(inv.hours || 0) + " hours"} accent="#9a9485" />
              <InfoRow icon={IndianRupee} label="Effective Rate" value={inv.hours > 0 ? fmt(Math.round(inv.amount / inv.hours)) + " / hr" : "—"} accent="#9a9485" />

              {canEdit && inv.status !== "paid" && (
                <button onClick={() => { onMarkPaid(inv.id); onClose(); }}
                  style={{ marginTop: 20, width: "100%", height: 46, borderRadius: 12, border: "none", background: "#1c2b3a", color: "#f0ede4", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
                  <CheckCircle size={15} /> Mark as Fully Paid
                </button>
              )}

              {role === "client" && inv.status !== "paid" && (
                <button onClick={() => { onClose(); onPayNow(inv); }}
                  style={{ marginTop: 14, width: "100%", height: 50, borderRadius: 12, border: "2px solid #c4a158", background: "linear-gradient(135deg,#c4a158,#e2c07a)", color: "#1a1a1a", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em", boxShadow: "0 4px 14px rgba(196,161,88,0.35)" }}>
                  <IndianRupee size={16} /> Pay {fmt(outstanding)} Now
                </button>
              )}
            </>
          )}

          {/* EDIT mode */}
          {editMode && canEdit && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#5c5649", marginBottom: 18, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>Edit Invoice Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                {[
                  { label: "Total Amount (₹)", key: "amount", type: "number" },
                  { label: "Paid So Far (₹)", key: "paid", type: "number" },
                  { label: "Billable Hours", key: "hours", type: "number" },
                  { label: "Status", key: "status", type: "select" },
                  { label: "Issued On", key: "issuedOn", type: "date" },
                  { label: "Due Date", key: "dueOn", type: "date" },
                ].map((f) => (
                  <div key={f.key} style={{ marginBottom: 16 }}>
                    <label style={lbl}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} style={{ ...inp, appearance: "none" }}>
                        {["pending", "partial", "paid", "overdue"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} min={f.type === "number" ? 0 : undefined} value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} style={inp} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#b8b2a8", marginBottom: 18, fontFamily: "'Inter', sans-serif" }}>💡 Status auto-updates based on paid amount when saved.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setEditMode(false)} style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "1.5px solid #e5e0d8", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5c5649", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: saving ? "#b8b2a8" : "#1c2b3a", color: "#f0ede4", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter', sans-serif" }}>
                  {saving && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  CREATE MODAL
// ═══════════════════════════════════════════════════════════════════════════
function CreateModal({ cases, onClose, onCreated }) {
  const [form, setForm] = useState({ caseId: "", amount: "", paid: "0", status: "pending", issuedOn: new Date().toISOString().slice(0, 10), dueOn: "", hours: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.caseId || !form.amount || !form.issuedOn || !form.dueOn) { toast.error("Fill all required fields"); return; }
    if (Number(form.amount) <= 0) { toast.error("Amount must be > 0"); return; }
    if (Number(form.paid) > Number(form.amount)) { toast.error("Paid cannot exceed amount"); return; }
    if (form.dueOn < form.issuedOn) { toast.error("Due date must be after issue date"); return; }
    setSaving(true);
    try {
      const res = await fetch(API + "/api/invoices", { method: "POST", headers: authHdr(), body: JSON.stringify({ caseId: Number(form.caseId), amount: Number(form.amount), paid: Number(form.paid) || 0, status: form.status, issuedOn: form.issuedOn, dueOn: form.dueOn, hours: Number(form.hours) || 0 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast.success("Invoice created");
      const creatorRole = getRole();
      if (creatorRole === "admin" || creatorRole === "lawyer") {
        toast.success("📱 WhatsApp receipt sent to client");
      }
      onCreated(data);
      onClose();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: "100%", height: 46, borderRadius: 10, border: "1.5px solid #e5e0d8", padding: "0 13px", fontSize: 13, color: "#1a1a1a", outline: "none", background: "#fff", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" };
  const lbl = { fontSize: 10, fontWeight: 700, color: "#5c5649", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6, fontFamily: "'Inter', sans-serif" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.5)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#faf9f6", borderRadius: 22, padding: 0, width: 520, maxWidth: "100%", boxShadow: "0 28px 72px rgba(28,43,58,0.2)", maxHeight: "90vh", overflowY: "auto", border: "1px solid #e5e0d8" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#c4a158,#e2c07a,#c4a158)", borderRadius: "22px 22px 0 0" }} />
        <div style={{ padding: "24px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#c4a158", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'Inter', sans-serif" }}>New Invoice</div>
              <div style={{ fontSize: 22, fontWeight: 500, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>Create Invoice</div>
            </div>
            <button onClick={onClose} style={{ background: "#f0ece4", border: "none", borderRadius: 9, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color="#6b6355" />
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Case *</label>
            <select value={form.caseId} onChange={(e) => set("caseId", e.target.value)} style={{ ...inp, appearance: "none" }}>
              <option value="">Select a case…</option>
              {cases.map((c) => <option key={c.id} value={c.id}>#{c.id} – {c.caseTitle || c.category || "Case"}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {[
              { label: "Total Amount (₹) *", key: "amount", type: "number", placeholder: "85000" },
              { label: "Already Paid (₹)", key: "paid", type: "number", placeholder: "0" },
              { label: "Billable Hours", key: "hours", type: "number", placeholder: "12.5" },
              { label: "Status", key: "status", type: "select" },
              { label: "Issued On *", key: "issuedOn", type: "date" },
              { label: "Due On *", key: "dueOn", type: "date" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={lbl}>{f.label}</label>
                {f.type === "select" ? (
                  <select value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} style={{ ...inp, appearance: "none" }}>
                    {["pending", "partial", "paid", "overdue"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                ) : (
                  <input type={f.type} min={f.type === "number" ? 0 : undefined} value={form[f.key]} placeholder={f.placeholder} onChange={(e) => set(f.key, e.target.value)} style={inp} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "8px 28px 24px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ height: 44, padding: "0 20px", borderRadius: 10, border: "1.5px solid #e5e0d8", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#5c5649", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ height: 44, padding: "0 26px", borderRadius: 10, border: "none", background: saving ? "#b8b2a8" : "#1c2b3a", color: "#f0ede4", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter', sans-serif" }}>
            {saving && <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />}
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  LAWYER ANALYTICS PANEL
// ═══════════════════════════════════════════════════════════════════════════
function LawyerAnalyticsPanel({ invoices }) {
  if (!invoices.length) return null;
  const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paid || 0), 0);
  const hours = invoices.reduce((s, i) => s + (i.hours || 0), 0);
  const avgInvoice = total / invoices.length;
  const hourlyRate = hours > 0 ? collected / hours : 0;
  const overdueAmt = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + ((i.amount || 0) - (i.paid || 0)), 0);
  const breakdown = ["paid", "pending", "partial", "overdue"].map((s) => ({
    status: s,
    count: invoices.filter((i) => i.status === s).length,
    amount: invoices.filter((i) => i.status === s).reduce((a, i) => a + (i.amount || 0), 0),
    pct: invoices.length > 0 ? Math.round((invoices.filter((i) => i.status === s).length / invoices.length) * 100) : 0,
  }));

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e0d8", borderRadius: 18, padding: "22px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Gavel size={14} color="#7c3aed" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>Lawyer Analytics</span>
        <span style={{ fontSize: 10, fontWeight: 700, background: "#f3e8ff", color: "#7c3aed", padding: "2px 9px", borderRadius: 99, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>Lawyer Only</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Avg Invoice Value", value: fmt(Math.round(avgInvoice)), icon: TrendingUp, color: "#2859a0" },
          { label: "Effective Hourly Rate", value: fmt(Math.round(hourlyRate)) + "/hr", icon: Clock, color: "#2e7d52" },
          { label: "Overdue Exposure", value: fmt(overdueAmt), icon: TrendingDown, color: "#c0392b" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: "#faf9f6", borderRadius: 12, padding: "14px 16px", border: "1px solid #f0ece4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
              <Icon size={12} color={color} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#9a9485", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>{label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#9a9485", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>Status Breakdown</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {breakdown.map(({ status, count, amount, pct }) => {
          const c = STATUS_CFG[status];
          return (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 56, fontSize: 11, fontWeight: 700, color: c.color, fontFamily: "'Inter', sans-serif" }}>{c.label}</span>
              <div style={{ flex: 1, height: 6, background: "#f0ece4", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: c.dot, borderRadius: 99, transition: "width 0.6s" }} />
              </div>
              <span style={{ fontSize: 11, color: "#9a9485", minWidth: 20, textAlign: "right", fontFamily: "'Inter', sans-serif" }}>{count}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", minWidth: 80, textAlign: "right", fontFamily: "'Inter', sans-serif" }}>{fmt(amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenu, setOpenMenu] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewInv, setViewInv] = useState(null);
  const [actionId, setActionId] = useState(null);

  const role = getRole();
  const isAdmin = role === "admin";
  const isLawyer = role === "lawyer";
  const isClient = role === "client";
  const canCreate = isAdmin || isLawyer;

  // ─── Fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const hdr = { Authorization: "Bearer " + localStorage.getItem("token") };
      if (isClient) {
        const res = await fetch(API + "/api/invoices/client", { headers: hdr });
        const data = await res.json();
        if (res.ok) setInvoices(Array.isArray(data) ? data : []);
        else toast.error("Could not load your invoices");
      } else {
        const [invRes, caseRes] = await Promise.all([
          fetch(API + "/api/invoices", { headers: hdr }),
          fetch(API + "/api/cases", { headers: hdr }),
        ]);
        const [invData, caseData] = await Promise.all([invRes.json(), caseRes.json()]);
        if (invRes.ok) setInvoices(Array.isArray(invData) ? invData : []);
        else toast.error("Could not load invoices");
        if (caseRes.ok) setCases(Array.isArray(caseData) ? caseData : []);
      }
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Actions ──────────────────────────────────────────────────────────
  const markPaid = async (id) => {
    setActionId(id);
    try {
      const res = await fetch(API + "/api/invoices/" + id + "/pay", { method: "PATCH", headers: authHdr() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)));
      toast.success("Invoice marked as paid");
      if (role === "admin" || role === "lawyer") {
        toast.success("📱 WhatsApp receipt sent to client");
      }
    } catch (e) { toast.error(e.message); }
    finally { setActionId(null); setOpenMenu(null); }
  };

  const voidInvoice = async (id) => {
    if (!confirm("Permanently void this invoice? This cannot be undone.")) return;
    setActionId(id);
    try {
      const res = await fetch(API + "/api/invoices/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + localStorage.getItem("token") } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed"); }
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice voided");
    } catch (e) { toast.error(e.message); }
    finally { setActionId(null); setOpenMenu(null); }
  };

  // ─── Razorpay Payment (fixed: load script first, then open) ───────────
  const handlePayNow = async (inv) => {
    try {
      // Load SDK before creating order — avoids race condition
      await loadRazorpay();

      const res = await fetch(API + "/api/payment/create-order", {
        method: "POST", headers: authHdr(), body: JSON.stringify({ invoiceId: inv.id }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.message || "Could not initiate payment");

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "LegalPro",
        description: "Payment for " + order.caseName,
        order_id: order.orderId,
        theme: { color: "#1c2b3a" },
        prefill: { name: localStorage.getItem("name") || "", email: localStorage.getItem("email") || "" },
        handler: async (response) => {
          try {
            const vRes = await fetch(API + "/api/payment/verify", {
              method: "POST", headers: authHdr(),
              body: JSON.stringify({ invoiceId: order.invoiceId, razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature }),
            });
            const vData = await vRes.json();
            if (!vRes.ok) throw new Error(vData.message || "Verification failed");
            toast.success("Payment successful! Invoice marked as paid.");
            setInvoices((prev) => prev.map((i) => i.id === inv.id ? { ...i, ...vData.invoice } : i));
          } catch (e) { toast.error(e.message); }
        },
        modal: { ondismiss: () => toast.info("Payment cancelled") },
      };

      new window.Razorpay(options).open();
    } catch (e) { toast.error(e.message); }
  };

  const handleUpdated = (updated) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? { ...inv, ...updated } : inv)));
  };

  // ─── Filtering ────────────────────────────────────────────────────────
  const filtered = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const matchSearch =
      String(inv.id || "").toLowerCase().includes(term) ||
      (inv.caseEntity?.caseTitle || "").toLowerCase().includes(term) ||
      (inv.caseEntity?.clientName || "").toLowerCase().includes(term) ||
      (inv.caseEntity?.category || "").toLowerCase().includes(term);
    return matchSearch && (statusFilter === "all" || inv.status === statusFilter);
  });

  const totalBilled = filtered.reduce((s, i) => s + (i.amount || 0), 0);
  const totalCollected = filtered.reduce((s, i) => s + (i.paid || 0), 0);
  const outstanding = totalBilled - totalCollected;
  const overdueCount = filtered.filter((i) => i.status === "overdue").length;
  const totalHours = filtered.reduce((s, i) => s + (i.hours || 0), 0);
  const collectionPct = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        * { box-sizing: border-box; }
        .bp-root { min-height:100vh; background:#f4f2ee; font-family:'Inter',sans-serif; }
        .bp-main { max-width:1300px; margin:0 auto; padding:32px 32px 70px; display:flex; flex-direction:column; gap:22px; animation:fadeUp .38s ease; }
        .bp-tbl { width:100%; border-collapse:collapse; }
        .bp-tbl thead th { padding:11px 18px; text-align:left; font-size:10px; font-weight:700; color:#9a9485; letter-spacing:.12em; text-transform:uppercase; background:#faf9f6; border-bottom:1px solid #e5e0d8; font-family:'Inter',sans-serif; }
        .bp-tbl thead th:last-child { text-align:center; }
        .bp-tbl tbody tr { border-bottom:1px solid #f0ece4; transition:background .12s; cursor:pointer; }
        .bp-tbl tbody tr:last-child { border-bottom:none; }
        .bp-tbl tbody tr:hover { background:#fdf9f2; }
        .bp-tbl tbody td { padding:14px 18px; font-size:13px; color:#3a3530; vertical-align:middle; font-family:'Inter',sans-serif; }
        .bp-menu { position:absolute; right:8px; top:calc(100% + 4px); background:#fff; border:1px solid #e5e0d8; border-radius:14px; padding:6px; box-shadow:0 14px 40px rgba(28,43,58,.14); z-index:100; min-width:180px; }
        .bp-mi { display:flex; align-items:center; gap:9px; padding:10px 13px; border-radius:9px; font-size:12px; color:#3a3530; cursor:pointer; border:none; background:none; width:100%; text-align:left; font-family:'Inter',sans-serif; font-weight:500; transition:background .1s; }
        .bp-mi:hover { background:#faf9f6; }
        .bp-mi.danger { color:#c0392b; }
        .bp-mi.danger:hover { background:#fdf4f3; }
        .bp-mi.pay-btn { color:#b8902a; font-weight:700; }
        .bp-mi.pay-btn:hover { background:#fdf8ec; }
        .bp-div { height:1px; background:#f0ece4; margin:4px 0; }
        .chip { display:inline-flex; align-items:center; gap:5px; background:#f0ece4; border-radius:7px; padding:3px 9px; font-size:11px; font-weight:600; color:#6b6355; font-family:'Inter',sans-serif; }
        .live-dot { width:7px; height:7px; border-radius:50%; background:#2e7d52; animation:pulse 2s ease-in-out infinite; }
        input:focus, select:focus { border-color:#c4a158!important; box-shadow:0 0 0 3px rgba(196,161,88,.15)!important; outline:none; }
        @media(max-width:900px) { .hide-md { display:none!important } }
        @media(max-width:640px) { .bp-main { padding:16px 14px } .hide-sm { display:none!important } }
      `}</style>

      <div className="bp-root" onClick={() => setOpenMenu(null)}>
        <Header />
        <main className="bp-main">

          {/* Page header */}
          <div style={{ paddingBottom: 24, borderBottom: "1px solid #e5e0d8", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#c4a158", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif" }}>
                <Receipt size={11} />
                {isClient ? "My Bills" : isLawyer ? "Lawyer View" : "Admin Portal"}
              </div>
              <h1 style={{ fontSize: "clamp(26px,3vw,36px)", fontWeight: 400, color: "#1a1a1a", margin: "0 0 6px", fontFamily: "'Playfair Display', serif", letterSpacing: "-0.01em" }}>
                {isClient ? "My " : ""}<em style={{ fontStyle: "italic", color: "#c4a158" }}>Invoices</em>
              </h1>
              <p style={{ fontSize: 13, color: "#9a9485", margin: 0, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
                {loading ? "Loading…" : isClient ? `${filtered.length} invoice${filtered.length !== 1 ? "s" : ""} for your cases` : `${filtered.length} invoices · ${totalHours.toFixed(1)}h billable`}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#b8b2a8", pointerEvents: "none" }} />
                <input placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ height: 42, background: "#fff", border: "1.5px solid #e5e0d8", borderRadius: 10, paddingLeft: 34, paddingRight: 14, fontSize: 13, color: "#1a1a1a", width: 210, outline: "none", fontFamily: "'Inter', sans-serif" }} />
              </div>
              <div style={{ position: "relative" }}>
                <Filter size={12} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#b8b2a8", pointerEvents: "none" }} />
                <ChevronDown size={10} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", color: "#b8b2a8", pointerEvents: "none" }} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ height: 42, background: "#fff", border: "1.5px solid #e5e0d8", borderRadius: 10, padding: "0 30px 0 32px", fontSize: 13, color: "#3a3530", appearance: "none", cursor: "pointer", outline: "none", fontFamily: "'Inter', sans-serif" }}>
                  <option value="all">All Status</option>
                  {["paid", "pending", "partial", "overdue"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <button onClick={fetchAll}
                style={{ height: 42, width: 42, background: "#fff", border: "1.5px solid #e5e0d8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9a9485" }}>
                <RefreshCw size={14} style={loading ? { animation: "spin 0.7s linear infinite" } : {}} />
              </button>
              {canCreate && (
                <button onClick={() => setShowCreate(true)}
                  style={{ height: 42, padding: "0 18px", background: "#1c2b3a", color: "#f0ede4", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "'Inter', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#243547"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#1c2b3a"}>
                  <Plus size={14} /> New Invoice
                </button>
              )}
            </div>
          </div>

          {/* Stat cards */}
          {isClient ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              <StatCard label="Total Billed" value={fmt(totalBilled)} sub={`${filtered.length} invoices`} accent="#2859a0" Icon={BadgeIndianRupee} />
              <StatCard label="Outstanding" value={fmt(outstanding)} sub={overdueCount ? `${overdueCount} overdue` : "All current"} accent={overdueCount ? "#c0392b" : "#2e7d52"} Icon={overdueCount ? AlertCircle : CheckCircle} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
              <StatCard label="Total Billed" value={fmt(totalBilled)} sub={`${filtered.length} invoices`} accent="#2859a0" Icon={BadgeIndianRupee} />
              <StatCard label="Collected" value={fmt(totalCollected)} sub={`${collectionPct}% collection rate`} accent="#2e7d52" Icon={CheckCircle} />
              <StatCard label="Outstanding" value={fmt(outstanding)} sub="Pending & partial" accent="#c4a158" Icon={Clock} />
              <StatCard label="Overdue" value={String(overdueCount)} sub={overdueCount ? "Requires follow-up" : "All on track"} accent="#c0392b" Icon={AlertCircle} />
            </div>
          )}

          {/* Collection progress */}
          {!loading && totalBilled > 0 && !isClient && (
            <div style={{ background: "#fff", border: "1px solid #e5e0d8", borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 13 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>Collection Progress</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: collectionPct >= 80 ? "#2e7d52" : "#c4a158", fontFamily: "'Playfair Display', serif" }}>{collectionPct}%</div>
              </div>
              <div style={{ height: 8, background: "#f0ece4", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: collectionPct + "%", height: "100%", borderRadius: 99, background: collectionPct === 100 ? "#2e7d52" : "linear-gradient(90deg,#1c2b3a,#c4a158)", transition: "width 0.8s cubic-bezier(.4,0,.2,1)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                {[["Collected", fmt(totalCollected), "#2e7d52", "left"], ["Total Billed", fmt(totalBilled), "#1a1a1a", "center"], ["Outstanding", fmt(outstanding), "#c4a158", "right"]].map(([lbl, val, col, align]) => (
                  <div key={lbl} style={{ textAlign: align }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#9a9485", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3, fontFamily: "'Inter', sans-serif" }}>{lbl}</div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: col, fontFamily: "'Playfair Display', serif" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lawyer analytics */}
          {isLawyer && !loading && invoices.length > 0 && <LawyerAnalyticsPanel invoices={filtered} />}

          {/* Invoice table */}
          <div style={{ background: "#fff", border: "1px solid #e5e0d8", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "15px 22px", borderBottom: "1px solid #f0ece4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>
                {isClient ? "Your Invoice History" : "Invoice Register"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div className="live-dot" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#2e7d52", letterSpacing: ".12em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>Live</span>
              </div>
            </div>

            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 20px", color: "#9a9485", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
                <Loader2 size={18} style={{ animation: "spin 0.7s linear infinite", color: "#c4a158" }} />
                Loading invoices…
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f4f2ee", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <FileText size={22} color="#c4a158" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>No invoices found</div>
                <p style={{ fontSize: 13, color: "#b8b2a8", margin: 0, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}>
                  {invoices.length === 0 ? (isClient ? "You have no invoices yet." : "Create your first invoice above.") : "No invoices match your filters."}
                </p>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="bp-tbl">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Case / Client</th>
                      <th>Amount</th>
                      <th className="hide-sm">Collection</th>
                      <th>Status</th>
                      <th className="hide-md">Issued</th>
                      <th className="hide-md">Due Date</th>
                      <th className="hide-sm">Hours</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => {
                      const caseName = inv.caseEntity?.caseTitle || inv.caseEntity?.category || "Case #" + inv.caseId;
                      const clientN = inv.caseEntity?.clientName || "—";
                      return (
                        <tr key={inv.id} onClick={() => setViewInv(inv)}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#2859a0", fontFamily: "monospace", fontSize: 12 }}>
                              INV-{String(inv.id).slice(-8).toUpperCase()}
                            </div>
                            <div style={{ fontSize: 10, color: "#b8b2a8", marginTop: 2 }}>{fmtDate(inv.issuedOn)}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "#1a1a1a", fontSize: 13, maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{caseName}</div>
                            {!isClient && <div style={{ fontSize: 11, color: "#b8b2a8", marginTop: 2 }}>{clientN}</div>}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a", fontFamily: "'Playfair Display', serif" }}>{fmt(inv.amount)}</div>
                            {inv.paid > 0 && inv.paid < inv.amount && <div style={{ fontSize: 10, color: "#b8b2a8", marginTop: 2 }}>Paid {fmt(inv.paid)}</div>}
                          </td>
                          <td className="hide-sm" style={{ minWidth: 120 }}>
                            <CollectionBar paid={inv.paid || 0} amount={inv.amount || 1} />
                          </td>
                          <td><StatusPill status={inv.status} /></td>
                          <td className="hide-md" style={{ fontSize: 12, color: "#9a9485" }}>{fmtDate(inv.issuedOn)}</td>
                          <td className="hide-md">
                            <span style={{ fontSize: 12, color: inv.status === "overdue" ? "#c0392b" : "#9a9485", fontWeight: inv.status === "overdue" ? 700 : 400 }}>{fmtDate(inv.dueOn)}</span>
                            {inv.status === "overdue" && <div style={{ fontSize: 10, color: "#c0392b", fontWeight: 700 }}>⚠ Overdue</div>}
                          </td>
                          <td className="hide-sm">
                            <span className="chip"><Hourglass size={10} />{(inv.hours || 0).toFixed(1)}h</span>
                          </td>
                          <td style={{ textAlign: "center", position: "relative" }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setOpenMenu(openMenu === inv.id ? null : inv.id)}
                              style={{ background: openMenu === inv.id ? "#f0ece4" : "none", border: "1.5px solid #e5e0d8", borderRadius: 9, width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9a9485" }}>
                              {actionId === inv.id ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} /> : <MoreHorizontal size={14} />}
                            </button>
                            {openMenu === inv.id && (
                              <div className="bp-menu">
                                <button className="bp-mi" onClick={() => { setViewInv(inv); setOpenMenu(null); }}>
                                  <Eye size={13} color="#9a9485" /> View Details
                                </button>
                                {canCreate && (
                                  <button className="bp-mi" onClick={() => { setViewInv(inv); setOpenMenu(null); }}>
                                    <Pencil size={13} color="#9a9485" /> Edit Invoice
                                  </button>
                                )}
                                <div className="bp-div" />
                                {isClient && inv.status !== "paid" && (
                                  <button className="bp-mi pay-btn" onClick={() => { handlePayNow(inv); setOpenMenu(null); }}>
                                    <IndianRupee size={13} color="#b8902a" /> Pay Now
                                  </button>
                                )}
                                {canCreate && inv.status !== "paid" && (
                                  <button className="bp-mi" onClick={() => markPaid(inv.id)}>
                                    <CheckCircle size={13} color="#2e7d52" /> Mark as Paid
                                  </button>
                                )}
                                {isAdmin && (
                                  <>
                                    <div className="bp-div" />
                                    <button className="bp-mi danger" onClick={() => voidInvoice(inv.id)}>
                                      <XCircle size={13} /> Void Invoice
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <footer style={{ textAlign: "center", fontSize: 11, color: "#c0b9ae", letterSpacing: "0.06em", borderTop: "1px solid #ede9e2", paddingTop: 22, fontFamily: "'Inter', sans-serif" }}>
            LegalPro Management Systems © 2026 &nbsp;·&nbsp; AES-256 Encrypted
          </footer>
        </main>
      </div>

      {showCreate && <CreateModal cases={cases} onClose={() => setShowCreate(false)} onCreated={(inv) => setInvoices((prev) => [inv, ...prev])} />}
      {viewInv && <ViewDetailsModal inv={viewInv} role={role} onClose={() => setViewInv(null)} onUpdated={(updated) => { handleUpdated(updated); setViewInv(null); }} onMarkPaid={markPaid} onPayNow={handlePayNow} />}
    </>
  );
}