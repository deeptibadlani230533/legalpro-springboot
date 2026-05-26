import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ShieldCheck, UserPlus, Mail, Lock, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client",
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        .sp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #f4f2ee;
        }

        /* ── LEFT PANEL ── */
        .sp-left {
          flex: 1;
          background: #1c2b3a;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          overflow: hidden;
        }

        .sp-left-glow1 {
          position: absolute;
          top: -80px; right: -80px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.13) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .sp-left-glow2 {
          position: absolute;
          bottom: -100px; left: -60px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,144,189,0.10) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .sp-left-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        .sp-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          cursor: pointer;
        }

        .sp-brand-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #c4a158, #e2c07a);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sp-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 500;
          color: #f0ede4;
          letter-spacing: 0.02em;
        }

        .sp-brand-name b { color: #c4a158; font-weight: 600; }

        .sp-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 0 40px;
        }

        .sp-hero-tag {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        }

        .sp-hero-tag-line { width: 28px; height: 1px; background: #c4a158; }

        .sp-hero-tag-text {
          font-size: 10px;
          font-weight: 600;
          color: #c4a158;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .sp-hero-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 54px);
          font-weight: 400;
          color: #f0ede4;
          line-height: 1.18;
          margin: 0 0 22px;
          letter-spacing: -0.01em;
        }

        .sp-hero-heading em { font-style: italic; color: #c4a158; }

        .sp-hero-body {
          font-size: 14px;
          font-weight: 300;
          color: rgba(240,237,228,0.5);
          line-height: 1.8;
          max-width: 340px;
        }

        /* Steps list */
        .sp-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sp-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .sp-step-num {
          width: 26px; height: 26px;
          border-radius: 50%;
          border: 1px solid rgba(196,161,88,0.4);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 600;
          color: #c4a158;
          margin-top: 1px;
        }

        .sp-step-text {
          font-size: 13px;
          font-weight: 300;
          color: rgba(240,237,228,0.55);
          line-height: 1.6;
        }

        .sp-step-text strong {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(240,237,228,0.85);
          margin-bottom: 2px;
        }

        /* ── RIGHT PANEL ── */
        .sp-right {
          width: 480px;
          flex-shrink: 0;
          background: #faf9f6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 52px 48px;
          position: relative;
          overflow-y: auto;
        }

        .sp-right-top-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #c4a158 0%, #e2c07a 50%, #c4a158 100%);
        }

        .sp-form-header { margin-bottom: 32px; }

        .sp-form-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c4a158;
          margin-bottom: 10px;
        }

        .sp-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px;
          font-weight: 500;
          color: #1a1a1a;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .sp-form-subtitle {
          font-size: 13px;
          font-weight: 400;
          color: #9a9485;
        }

        /* Fields */
        .sp-field { margin-bottom: 16px; }

        .sp-field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #5c5649;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .sp-input-wrap { position: relative; }

        .sp-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #b8b2a8;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .sp-input {
          width: 100%;
          height: 50px !important;
          background: #fff !important;
          border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          padding: 0 16px 0 42px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .sp-input:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .sp-input::placeholder {
          color: #c8c2b8 !important;
          font-weight: 300 !important;
        }

        /* Select override */
        .sp-select-trigger {
          width: 100%;
          height: 50px !important;
          background: #fff !important;
          border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          padding: 0 16px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important;
          font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .sp-select-trigger:focus, .sp-select-trigger[data-state="open"] {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        /* Role cards */
        .sp-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .sp-role-card {
          padding: 14px 16px;
          border: 1.5px solid #e5e0d8;
          border-radius: 10px;
          background: #fff;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sp-role-card:hover {
          border-color: #c4a158;
          background: #fdf9f2;
        }

        .sp-role-card.active {
          border-color: #c4a158;
          background: #fdf9f2;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.10);
        }

        .sp-role-title {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .sp-role-desc {
          font-size: 11px;
          font-weight: 300;
          color: #9a9485;
        }

        .sp-role-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          border: 1.5px solid #c8c2b8;
          margin-bottom: 6px;
          transition: border-color 0.15s, background 0.15s;
        }

        .sp-role-card.active .sp-role-dot {
          background: #c4a158;
          border-color: #c4a158;
        }

        /* Submit */
        .sp-submit-btn {
          width: 100%;
          height: 50px !important;
          background: #1c2b3a !important;
          color: #f0ede4 !important;
          border: none !important;
          border-radius: 10px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          letter-spacing: 0.1em !important;
          text-transform: uppercase !important;
          cursor: pointer !important;
          transition: background 0.18s ease, transform 0.12s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          margin-top: 8px;
        }

        .sp-submit-btn:hover:not(:disabled) { background: #243547 !important; }
        .sp-submit-btn:active:not(:disabled) { transform: scale(0.99) !important; }
        .sp-submit-btn:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }

        .sp-login-row {
          text-align: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e8e4dc;
        }

        .sp-login-text { font-size: 13px; font-weight: 400; color: #9a9485; }

        .sp-login-link {
          font-size: 13px;
          font-weight: 600;
          color: #1c2b3a;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: underline;
          text-decoration-color: #c4a158;
          text-underline-offset: 3px;
          transition: color 0.15s;
        }

        .sp-login-link:hover { color: #c4a158; }

        .sp-secure-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
        }

        .sp-secure-text {
          font-size: 11px;
          font-weight: 400;
          color: #c0b9ae;
          letter-spacing: 0.04em;
        }

        @media (max-width: 820px) {
          .sp-left { display: none; }
          .sp-right { width: 100%; }
        }
      `}</style>

      <div className="sp-root">
        {/* ── LEFT BRANDING PANEL ── */}
        <div className="sp-left">
          <div className="sp-left-glow1" />
          <div className="sp-left-glow2" />

          <div className="sp-left-inner">
            <div className="sp-brand" onClick={() => navigate("/login")}>
              <div className="sp-brand-icon">
                <svg viewBox="0 0 76 65" fill="#1c2b3a" width="16" height="16">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <span className="sp-brand-name">Legal<b>Pro</b></span>
            </div>

            <div className="sp-hero">
              <div className="sp-hero-tag">
                <div className="sp-hero-tag-line" />
                <span className="sp-hero-tag-text">New Member Registration</span>
              </div>
              <h1 className="sp-hero-heading">
                Your legal journey starts <em>here.</em>
              </h1>
              <p className="sp-hero-body">
                Join thousands of clients and legal professionals managing their cases with confidence on LegalPro.
              </p>
            </div>

            <div className="sp-steps">
              {[
                { n: "01", title: "Create your account", desc: "Secure registration in under 2 minutes." },
                { n: "02", title: "Complete your profile", desc: "Add your details and case information." },
                { n: "03", title: "Connect with counsel", desc: "Get matched with the right legal expert." },
              ].map((s) => (
                <div className="sp-step" key={s.n}>
                  <div className="sp-step-num">{s.n}</div>
                  <div className="sp-step-text">
                    <strong>{s.title}</strong>
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="sp-right">
          <div className="sp-right-top-bar" />

          <div className="sp-form-header">
            <div className="sp-form-eyebrow">Create Account</div>
            <h2 className="sp-form-title">Request access</h2>
            <p className="sp-form-subtitle">Join LegalPro to manage your cases securely</p>
          </div>

          <form onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="sp-field">
              <label className="sp-field-label">Full Legal Name</label>
              <div className="sp-input-wrap">
                <span className="sp-input-icon">
                  <User size={15} />
                </span>
                <Input
                  placeholder="John Doe"
                  className="sp-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="sp-field">
              <label className="sp-field-label">Email Address</label>
              <div className="sp-input-wrap">
                <span className="sp-input-icon">
                  <Mail size={15} />
                </span>
                <Input
                  type="email"
                  placeholder="you@lawfirm.com"
                  className="sp-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="sp-field">
              <label className="sp-field-label">Password</label>
              <div className="sp-input-wrap">
                <span className="sp-input-icon">
                  <Lock size={15} />
                </span>
                <Input
                  type="password"
                  placeholder="Create a secure password"
                  className="sp-input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Account Type */}
            <div className="sp-field">
              <label className="sp-field-label">Account Type</label>
              <div className="sp-role-grid">
                <div
                  className={`sp-role-card ${form.role === "client" ? "active" : ""}`}
                  onClick={() => setForm({ ...form, role: "client" })}
                >
                  <div className="sp-role-dot" />
                  <div className="sp-role-title">Client</div>
                  <div className="sp-role-desc">Seeking legal representation</div>
                </div>
                <div
                  className={`sp-role-card ${form.role === "lawyer" ? "active" : ""}`}
                  onClick={() => setForm({ ...form, role: "lawyer" })}
                >
                  <div className="sp-role-dot" />
                  <div className="sp-role-title">Lawyer</div>
                  <div className="sp-role-desc">Legal professional / counsel</div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="sp-submit-btn">
              {loading ? (
                <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
              ) : (
                <>
                  <UserPlus size={15} />
                  Complete Registration
                </>
              )}
            </Button>
          </form>

          <div className="sp-login-row">
            <span className="sp-login-text">Already have an account? </span>
            <button className="sp-login-link" onClick={() => navigate("/login")}>
              Sign In
            </button>
          </div>

          <div className="sp-secure-row">
            <ShieldCheck style={{ width: 13, height: 13, color: "#c4a158" }} />
            <span className="sp-secure-text">AES-256 encrypted · © 2026 LegalPro</span>
          </div>
        </div>
      </div>
    </>
  );
}
