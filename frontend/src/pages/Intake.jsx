import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Briefcase,
  IndianRupee,
  Loader2,
} from "lucide-react";

import Header from "../components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function Intake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    caseTitle: "",
    description: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    category: "",
    incidentDate: "",
    opponentName: "",
    claimAmount: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^\+91[6-9]\d{9}$/.test(phone.trim());

  const validateStep = () => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.clientName.trim())
        newErrors.clientName = "Full legal name is required";
      if (!formData.clientEmail.trim())
        newErrors.clientEmail = "Email address is required";
      else if (!validateEmail(formData.clientEmail))
        newErrors.clientEmail = "Enter a valid email address";
      if (!formData.clientPhone.trim())
        newErrors.clientPhone = "Phone number is required";
      else if (!validatePhone(formData.clientPhone))
        newErrors.clientPhone =
          "Must start with +91 followed by 10 digits (e.g. +919876543210)";

      if (!formData.clientAddress.trim())
        newErrors.clientAddress = "Address is required";
    }
    if (step === 2) {
      if (!formData.caseTitle.trim())
        newErrors.caseTitle = "Matter title is required";
      if (!formData.category.trim())
        newErrors.category = "Please select a legal category";
      if (!formData.incidentDate)
        newErrors.incidentDate = "Date of incident is required";
    }
    if (step === 3) {
      if (!formData.opponentName.trim())
        newErrors.opponentName = "Opposing party name is required";
      if (!formData.claimAmount)
        newErrors.claimAmount = "Claim amount is required";
      if (!formData.description.trim())
        newErrors.description = "Case narrative is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((p) => p + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep() || loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to create case.");
        return;
      }
      toast.success("Case file created successfully");
      setTimeout(() => navigate("/cases"), 800);
    } catch {
      toast.error("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const stepMeta = [
    { n: 1, label: "Client", icon: ShieldCheck },
    { n: 2, label: "Case", icon: Briefcase },
    { n: 3, label: "Finance", icon: IndianRupee },
  ];

  const stepTitles = [
    {
      title: "Client Verification",
      sub: "Verify the client's personal and contact details.",
    },
    {
      title: "Case Classification",
      sub: "Describe and categorize the legal matter.",
    },
    {
      title: "Financial & Summary",
      sub: "Provide claim details and a case narrative.",
    },
  ];

  const ErrorMsg = ({ field }) =>
    errors[field] ? (
      <p
        style={{
          color: "#c0392b",
          fontSize: 11,
          marginTop: 5,
          fontWeight: 400,
        }}
      >
        {errors[field]}
      </p>
    ) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .it-root {
          min-height: 100vh; display: flex; flex-direction: column;
          background: #f4f2ee; font-family: 'Inter', sans-serif; position: relative;
        }

        .it-bg-glow1 {
          position: fixed; top: -100px; right: -100px;
          width: 460px; height: 460px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .it-bg-glow2 {
          position: fixed; bottom: -100px; left: -80px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(28,43,58,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .it-main {
          flex: 1; padding: 44px 24px 64px;
          position: relative; z-index: 1;
        }

        .it-container {
          max-width: 680px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 28px;
        }

        /* ── Page Header ── */
        .it-page-header {
          display: flex; justify-content: space-between; align-items: flex-end;
        }

        .it-page-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }

        .it-page-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px; font-weight: 400;
          color: #1a1a1a; margin: 0 0 6px; letter-spacing: -0.01em;
        }

        .it-page-title em { font-style: italic; color: #c4a158; }

        .it-page-sub {
          font-size: 13px; font-weight: 300; color: #9a9485;
        }

        .it-step-counter {
          font-size: 11px; font-weight: 600; color: #9a9485;
          letter-spacing: 0.1em; text-transform: uppercase;
          flex-shrink: 0;
        }

        /* ── Step Progress ── */
        .it-progress-row {
          display: flex; align-items: center; gap: 0;
        }

        .it-step-node {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }

        .it-step-circle {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600;
          transition: all 0.25s ease;
          border: 2px solid #e5e0d8; color: #b8b2a8; background: #fff;
        }

        .it-step-circle.done   { background: #c4a158; border-color: #c4a158; color: #fff; }
        .it-step-circle.active { background: #1c2b3a; border-color: #1c2b3a; color: #f0ede4; }

        .it-step-label {
          font-size: 10px; font-weight: 600; color: #b8b2a8;
          letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;
        }
        .it-step-label.active { color: #1c2b3a; }
        .it-step-label.done   { color: #c4a158; }

        .it-step-connector {
          flex: 1; height: 2px; background: #e5e0d8;
          margin: 0 6px; margin-bottom: 22px; transition: background 0.25s;
        }
        .it-step-connector.done { background: #c4a158; }

        /* ── Form Card ── */
        .it-card {
          background: #fff; border: 1px solid #e5e0d8;
          border-radius: 20px; overflow: hidden;
        }

        .it-card-top-bar { height: 3px; background: linear-gradient(90deg, #c4a158, #e2c07a, #c4a158); }

        .it-card-header {
          padding: 26px 32px 18px;
          border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; gap: 14px;
        }

        .it-card-header-icon {
          width: 42px; height: 42px; border-radius: 11px;
          background: #1c2b3a;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .it-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500; color: #1a1a1a; margin-bottom: 3px;
        }

        .it-card-sub { font-size: 12px; font-weight: 300; color: #9a9485; }

        .it-card-body { padding: 28px 32px; }

        /* Fields */
        .it-field { margin-bottom: 20px; }

        .it-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #5c5649; letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 7px;
        }

        .it-input {
          width: 100%; height: 50px !important;
          background: #fff !important; border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important; padding: 0 16px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          outline: none !important; box-shadow: none !important;
        }

        .it-input:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .it-input::placeholder { color: #c8c2b8 !important; font-weight: 300 !important; }

        .it-input.error { border-color: #e74c3c !important; }
        .it-input.error:focus { box-shadow: 0 0 0 3px rgba(231,76,60,0.10) !important; }

        .it-textarea {
          width: 100% !important;
          min-height: 110px !important;
          background: #fff !important; border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important; padding: 12px 16px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important;
          color: #1a1a1a !important; resize: vertical;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          outline: none !important; box-shadow: none !important;
          line-height: 1.6 !important;
        }

        .it-textarea:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .it-textarea::placeholder { color: #c8c2b8 !important; font-weight: 300 !important; }
        .it-textarea.error { border-color: #e74c3c !important; }

        .it-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        @media (max-width: 560px) { .it-grid-2 { grid-template-columns: 1fr; } }

        /* Select */
        .it-select-trigger {
          width: 100%; height: 50px !important;
          background: #fff !important; border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          padding: 0 14px !important;
        }

        .it-select-trigger:focus, .it-select-trigger[data-state="open"] {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .it-select-trigger.error { border-color: #e74c3c !important; }

        /* Divider */
        .it-divider { height: 1px; background: #f0ece4; margin: 8px 0 24px; }

        /* Navigation buttons */
        .it-nav-row {
          display: flex; justify-content: space-between; align-items: center;
        }

        .it-btn-prev {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600; color: #9a9485;
          background: none; border: 1.5px solid #e5e0d8; border-radius: 9px;
          padding: 0 18px; height: 44px; cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        .it-btn-prev:hover:not(:disabled) {
          border-color: #c4a158; color: #1a1a1a; background: #fdf9f2;
        }

        .it-btn-prev:disabled { opacity: 0.35; cursor: not-allowed; }

        .it-btn-next {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600; color: #f0ede4;
          background: #1c2b3a; border: none; border-radius: 9px;
          padding: 0 22px; height: 44px; cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        .it-btn-next:hover { background: #243547; }
        .it-btn-next:active { transform: scale(0.98); }

        .it-btn-submit {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600; color: #fff;
          background: #c4a158; border: none; border-radius: 9px;
          padding: 0 24px; height: 44px; cursor: pointer;
          transition: background 0.15s, transform 0.12s;
          letter-spacing: 0.06em; text-transform: uppercase;
        }

        .it-btn-submit:hover:not(:disabled) { background: #b8902a; }
        .it-btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .it-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .it-footer {
          text-align: center; padding: 24px;
          font-size: 11px; font-weight: 400; color: #c0b9ae;
          letter-spacing: 0.06em; border-top: 1px solid #ede9e2;
          position: relative; z-index: 1;
        }
      `}</style>

      <div className="it-root">
        <div className="it-bg-glow1" />
        <div className="it-bg-glow2" />

        <Header title="Case Intake" />

        <main className="it-main">
          <div className="it-container">
            {/* Page Header */}
            <div className="it-page-header">
              <div>
                <div className="it-page-eyebrow">
                  <Briefcase size={11} /> New Matter Entry
                </div>
                <h1 className="it-page-title">
                  Case <em>Intake</em> Form
                </h1>
                <p className="it-page-sub">
                  Complete the required information carefully.
                </p>
              </div>
              <span className="it-step-counter">Step {step} / 3</span>
            </div>

            {/* Step Progress */}
            <div className="it-progress-row">
              {stepMeta.map((s, i) => (
                <div key={s.n} style={{ display: "contents" }}>
                  <div className="it-step-node">
                    <div
                      className={`it-step-circle ${step > s.n ? "done" : step === s.n ? "active" : ""}`}
                    >
                      {step > s.n ? "✓" : s.n}
                    </div>
                    <span
                      className={`it-step-label ${step > s.n ? "done" : step === s.n ? "active" : ""}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < stepMeta.length - 1 && (
                    <div
                      className={`it-step-connector ${step > s.n ? "done" : ""}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Card */}
            <div className="it-card">
              <div className="it-card-top-bar" />

              <div className="it-card-header">
                <div className="it-card-header-icon">
                  {step === 1 && <ShieldCheck size={18} color="#f0ede4" />}
                  {step === 2 && <Briefcase size={18} color="#f0ede4" />}
                  {step === 3 && <IndianRupee size={18} color="#f0ede4" />}
                </div>
                <div>
                  <div className="it-card-title">
                    {stepTitles[step - 1].title}
                  </div>
                  <div className="it-card-sub">{stepTitles[step - 1].sub}</div>
                </div>
              </div>

              <div className="it-card-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.22 }}
                  >
                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                      <>
                        <div className="it-field">
                          <label className="it-label">Full Legal Name</label>
                          <Input
                            name="clientName"
                            value={formData.clientName}
                            onChange={handleChange}
                            placeholder="e.g. Rajesh Kumar"
                            className={`it-input${errors.clientName ? " error" : ""}`}
                          />
                          <ErrorMsg field="clientName" />
                        </div>

                        <div className="it-grid-2">
                          <div className="it-field">
                            <label className="it-label">Contact Email</label>
                            <Input
                              name="clientEmail"
                              value={formData.clientEmail}
                              onChange={handleChange}
                              placeholder="you@example.com"
                              className={`it-input${errors.clientEmail ? " error" : ""}`}
                            />
                            <ErrorMsg field="clientEmail" />
                          </div>
                          <div className="it-field">
                            <label className="it-label">Phone Number</label>
                            
                            <Input
                              name="clientPhone"
                              value={formData.clientPhone}
                              onChange={handleChange}
                              placeholder="+91XXXXXXXXXX"
                              className={`it-input${errors.clientPhone ? " error" : ""}`}
                            />
                            <ErrorMsg field="clientPhone" />
                          </div>
                        </div>

                        <div className="it-field">
                          <label className="it-label">Permanent Address</label>
                          <Textarea
                            name="clientAddress"
                            value={formData.clientAddress}
                            onChange={handleChange}
                            placeholder="Full residential address…"
                            className={`it-textarea${errors.clientAddress ? " error" : ""}`}
                          />
                          <ErrorMsg field="clientAddress" />
                        </div>
                      </>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                      <>
                        <div className="it-field">
                          <label className="it-label">Matter Title</label>
                          <Input
                            name="caseTitle"
                            value={formData.caseTitle}
                            onChange={handleChange}
                            placeholder="Brief descriptive title of the case"
                            className={`it-input${errors.caseTitle ? " error" : ""}`}
                          />
                          <ErrorMsg field="caseTitle" />
                        </div>

                        <div className="it-grid-2">
                          <div className="it-field">
                            <label className="it-label">Legal Category</label>
                            <Select
                              value={formData.category}
                              onValueChange={(v) => {
                                setFormData({ ...formData, category: v });
                                setErrors({ ...errors, category: "" });
                              }}
                            >
                              <SelectTrigger
                                className={`it-select-trigger${errors.category ? " error" : ""}`}
                              >
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Criminal Defense">
                                  Criminal Defense
                                </SelectItem>
                                <SelectItem value="Civil Litigation">
                                  Civil Litigation
                                </SelectItem>
                                <SelectItem value="Corporate Law">
                                  Corporate Law
                                </SelectItem>
                                <SelectItem value="Property Law">
                                  Property Law
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <ErrorMsg field="category" />
                          </div>
                          <div className="it-field">
                            <label className="it-label">Date of Incident</label>
                            <Input
                              type="date"
                              name="incidentDate"
                              value={formData.incidentDate}
                              onChange={handleChange}
                              className={`it-input${errors.incidentDate ? " error" : ""}`}
                            />
                            <ErrorMsg field="incidentDate" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* ── STEP 3 ── */}
                    {step === 3 && (
                      <>
                        <div className="it-field">
                          <label className="it-label">
                            Opposing Party Name
                          </label>
                          <Input
                            name="opponentName"
                            value={formData.opponentName}
                            onChange={handleChange}
                            placeholder="Full name of opposing party"
                            className={`it-input${errors.opponentName ? " error" : ""}`}
                          />
                          <ErrorMsg field="opponentName" />
                        </div>

                        <div className="it-field">
                          <label className="it-label">Claim Amount (₹)</label>
                          <Input
                            type="number"
                            name="claimAmount"
                            value={formData.claimAmount}
                            onChange={handleChange}
                            placeholder="e.g. 500000"
                            className={`it-input${errors.claimAmount ? " error" : ""}`}
                          />
                          <ErrorMsg field="claimAmount" />
                        </div>

                        <div className="it-field">
                          <label className="it-label">Case Narrative</label>
                          <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the facts, incident, and grounds for the case in detail…"
                            className={`it-textarea${errors.description ? " error" : ""}`}
                            style={{ minHeight: 130 }}
                          />
                          <ErrorMsg field="description" />
                        </div>
                      </>
                    )}

                    {/* Navigation */}
                    <div className="it-divider" />
                    <div className="it-nav-row">
                      <button
                        className="it-btn-prev"
                        onClick={() => setStep(step - 1)}
                        disabled={step === 1}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>

                      {step < 3 ? (
                        <button className="it-btn-next" onClick={handleNext}>
                          Next <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          className="it-btn-submit"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2
                                size={14}
                                style={{
                                  animation: "spin 0.8s linear infinite",
                                }}
                              />{" "}
                              Processing…
                            </>
                          ) : (
                            "Create Case File"
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>

        <footer className="it-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; AES-256
          Encrypted
        </footer>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
