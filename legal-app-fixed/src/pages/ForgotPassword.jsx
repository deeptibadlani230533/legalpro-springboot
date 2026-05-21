import React, { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, KeyRound, Lock, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) { toast.error("Enter OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("OTP verified");
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) { toast.error("Enter new password"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepMeta = [
    { n: 1, title: "Reset Password",     subtitle: "Enter your registered email to receive a secure OTP." },
    { n: 2, title: "Verify OTP",         subtitle: `Enter the 6-digit code sent to ${email || "your email"}.` },
    { n: 3, title: "New Password",       subtitle: "Set a strong new password for your account." },
  ];

  const current = stepMeta[step - 1];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        .fp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #f4f2ee;
        }

        /* ── LEFT PANEL ── */
        .fp-left {
          flex: 1;
          background: #1c2b3a;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          overflow: hidden;
        }

        .fp-left-glow1 {
          position: absolute;
          top: -80px; left: -80px;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.13) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .fp-left-glow2 {
          position: absolute;
          bottom: -100px; right: -60px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,144,189,0.10) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .fp-left-inner {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          height: 100%; justify-content: space-between;
        }

        .fp-brand {
          display: flex; align-items: center;
          gap: 11px; cursor: pointer;
        }

        .fp-brand-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #c4a158, #e2c07a);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }

        .fp-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500;
          color: #f0ede4; letter-spacing: 0.02em;
        }

        .fp-brand-name b { color: #c4a158; font-weight: 600; }

        .fp-hero {
          flex: 1; display: flex;
          flex-direction: column; justify-content: center;
          padding: 60px 0 40px;
        }

        .fp-hero-tag {
          display: flex; align-items: center;
          gap: 10px; margin-bottom: 26px;
        }

        .fp-hero-tag-line { width: 28px; height: 1px; background: #c4a158; }

        .fp-hero-tag-text {
          font-size: 10px; font-weight: 600;
          color: #c4a158; letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .fp-hero-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 54px);
          font-weight: 400; color: #f0ede4;
          line-height: 1.18; margin: 0 0 22px;
          letter-spacing: -0.01em;
        }

        .fp-hero-heading em { font-style: italic; color: #c4a158; }

        .fp-hero-body {
          font-size: 14px; font-weight: 300;
          color: rgba(240,237,228,0.5);
          line-height: 1.8; max-width: 340px;
        }

        /* Security badges */
        .fp-badges {
          display: flex; flex-direction: column; gap: 12px;
        }

        .fp-badge {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }

        .fp-badge-icon {
          width: 32px; height: 32px;
          background: rgba(196,161,88,0.12);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .fp-badge-title {
          font-size: 13px; font-weight: 500;
          color: rgba(240,237,228,0.85);
          margin-bottom: 2px;
        }

        .fp-badge-desc {
          font-size: 11px; font-weight: 300;
          color: rgba(240,237,228,0.4);
        }

        /* ── RIGHT PANEL ── */
        .fp-right {
          width: 460px; flex-shrink: 0;
          background: #faf9f6;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 56px 48px;
          position: relative;
        }

        .fp-right-top-bar {
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #c4a158 0%, #e2c07a 50%, #c4a158 100%);
        }

        /* Progress steps */
        .fp-progress {
          display: flex; align-items: center;
          gap: 0; margin-bottom: 40px;
        }

        .fp-step-node {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          position: relative;
        }

        .fp-step-circle {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600;
          transition: all 0.25s ease;
          border: 2px solid #e5e0d8;
          color: #b8b2a8;
          background: #fff;
        }

        .fp-step-circle.done {
          background: #c4a158;
          border-color: #c4a158;
          color: #fff;
        }

        .fp-step-circle.active {
          background: #1c2b3a;
          border-color: #1c2b3a;
          color: #f0ede4;
        }

        .fp-step-label {
          font-size: 10px; font-weight: 500;
          color: #b8b2a8; letter-spacing: 0.08em;
          text-transform: uppercase; white-space: nowrap;
        }

        .fp-step-label.active { color: #1c2b3a; }
        .fp-step-label.done   { color: #c4a158; }

        .fp-step-connector {
          flex: 1; height: 2px;
          background: #e5e0d8;
          margin: 0 6px;
          margin-bottom: 22px;
          transition: background 0.25s;
        }

        .fp-step-connector.done { background: #c4a158; }

        /* Form header */
        .fp-form-header { margin-bottom: 32px; }

        .fp-form-eyebrow {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #c4a158; margin-bottom: 10px;
        }

        .fp-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 500;
          color: #1a1a1a; margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .fp-form-subtitle {
          font-size: 13px; font-weight: 400;
          color: #9a9485;
        }

        /* Fields */
        .fp-field { margin-bottom: 16px; }

        .fp-field-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #5c5649; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 7px;
        }

        .fp-input-wrap { position: relative; }

        .fp-input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #b8b2a8; pointer-events: none;
          display: flex; align-items: center;
        }

        .fp-input {
          width: 100%; height: 50px !important;
          background: #fff !important;
          border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          padding: 0 16px 0 42px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
          outline: none !important; box-shadow: none !important;
        }

        .fp-input:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .fp-input::placeholder {
          color: #c8c2b8 !important; font-weight: 300 !important;
        }

        /* OTP input special */
        .fp-otp-input {
          width: 100%; height: 64px !important;
          background: #fff !important;
          border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          padding: 0 20px !important;
          font-family: 'Playfair Display', serif !important;
          font-size: 28px !important; font-weight: 400 !important;
          color: #1c2b3a !important;
          letter-spacing: 0.35em !important;
          text-align: center !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
          outline: none !important; box-shadow: none !important;
        }

        .fp-otp-input:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .fp-otp-input::placeholder {
          color: #ddd8d0 !important;
          letter-spacing: 0.25em !important;
          font-size: 22px !important;
        }

        .fp-otp-hint {
          text-align: center; margin-top: 8px;
          font-size: 11px; font-weight: 400;
          color: #b8b2a8; letter-spacing: 0.04em;
        }

        /* Submit button */
        .fp-submit-btn {
          width: 100%; height: 50px !important;
          background: #1c2b3a !important; color: #f0ede4 !important;
          border: none !important; border-radius: 10px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 13px !important; font-weight: 600 !important;
          letter-spacing: 0.1em !important; text-transform: uppercase !important;
          cursor: pointer !important;
          transition: background 0.18s ease, transform 0.12s ease !important;
          display: flex !important; align-items: center !important;
          justify-content: center !important; gap: 8px !important;
          margin-top: 8px;
        }

        .fp-submit-btn:hover:not(:disabled) { background: #243547 !important; }
        .fp-submit-btn:active:not(:disabled) { transform: scale(0.99) !important; }
        .fp-submit-btn:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }

        .fp-back-row {
          text-align: center; margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #e8e4dc;
        }

        .fp-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 500;
          color: #9a9485; background: none; border: none;
          padding: 0; cursor: pointer;
          transition: color 0.15s;
        }

        .fp-back-btn:hover { color: #c4a158; }

        @media (max-width: 820px) {
          .fp-left { display: none; }
          .fp-right { width: 100%; }
        }
      `}</style>

      <div className="fp-root">
        {/* ── LEFT BRANDING PANEL ── */}
        <div className="fp-left">
          <div className="fp-left-glow1" />
          <div className="fp-left-glow2" />

          <div className="fp-left-inner">
            <div className="fp-brand" onClick={() => navigate("/login")}>
              <div className="fp-brand-icon">
                <svg viewBox="0 0 76 65" fill="#1c2b3a" width="16" height="16">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <span className="fp-brand-name">Legal<b>Pro</b></span>
            </div>

            <div className="fp-hero">
              <div className="fp-hero-tag">
                <div className="fp-hero-tag-line" />
                <span className="fp-hero-tag-text">Account Recovery</span>
              </div>
              <h1 className="fp-hero-heading">
                Secure access, <em>restored.</em>
              </h1>
              <p className="fp-hero-body">
                Your account security is our priority. Follow the guided steps to verify your identity and regain access.
              </p>
            </div>

            <div className="fp-badges">
              {[
                { icon: <Mail size={14} color="#c4a158" />, title: "Email Verification", desc: "OTP delivered to your registered address" },
                { icon: <KeyRound size={14} color="#c4a158" />, title: "Time-limited OTP", desc: "Code expires in 10 minutes for your safety" },
                { icon: <Lock size={14} color="#c4a158" />, title: "AES-256 Encrypted", desc: "New password stored with military-grade encryption" },
              ].map((b) => (
                <div className="fp-badge" key={b.title}>
                  <div className="fp-badge-icon">{b.icon}</div>
                  <div>
                    <div className="fp-badge-title">{b.title}</div>
                    <div className="fp-badge-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="fp-right">
          <div className="fp-right-top-bar" />

          {/* Progress Indicator */}
          <div className="fp-progress">
            {[
              { n: 1, label: "Email" },
              { n: 2, label: "Verify" },
              { n: 3, label: "Reset" },
            ].map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="fp-step-node">
                  <div className={`fp-step-circle ${step > s.n ? "done" : step === s.n ? "active" : ""}`}>
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span className={`fp-step-label ${step > s.n ? "done" : step === s.n ? "active" : ""}`}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`fp-step-connector ${step > s.n ? "done" : ""}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Header */}
          <div className="fp-form-header">
            <div className="fp-form-eyebrow">
              Step {step} of 3
            </div>
            <h2 className="fp-form-title">{current.title}</h2>
            <p className="fp-form-subtitle">{current.subtitle}</p>
          </div>

          {/* Step 1 — Email */}
          {step === 1 && (
            <>
              <div className="fp-field">
                <label className="fp-field-label">Email Address</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon"><Mail size={15} /></span>
                  <Input
                    type="email"
                    placeholder="you@lawfirm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="fp-input"
                  />
                </div>
              </div>
              <Button onClick={handleRequestOTP} disabled={loading} className="fp-submit-btn">
                {loading ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : "Send OTP"}
              </Button>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <>
              <div className="fp-field">
                <label className="fp-field-label">One-Time Passcode</label>
                <Input
                  type="text"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="fp-otp-input"
                />
                <p className="fp-otp-hint">Check your inbox · Code expires in 10 min</p>
              </div>
              <Button onClick={handleVerifyOTP} disabled={loading} className="fp-submit-btn">
                {loading ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : "Verify Code"}
              </Button>
            </>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
            <>
              <div className="fp-field">
                <label className="fp-field-label">New Password</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon"><Lock size={15} /></span>
                  <Input
                    type="password"
                    placeholder="Create a secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="fp-input"
                  />
                </div>
              </div>
              <Button onClick={handleResetPassword} disabled={loading} className="fp-submit-btn">
                {loading ? <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> : "Reset Password"}
              </Button>
            </>
          )}

          <div className="fp-back-row">
            <button className="fp-back-btn" onClick={() => navigate("/login")}>
              <ArrowLeft size={14} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
