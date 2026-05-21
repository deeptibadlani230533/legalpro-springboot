import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Chrome, Apple } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");

      // Block pending/rejected users
      if (data.status === "pending") {
        navigate("/pending-approval");
        return;
      }
      if (data.status === "rejected") {
        toast.error("Your access request was declined. Please contact the firm.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      toast.success("Login successful!");

      const path = data.role === "lawyer" ? "/lawyer/dashboard" : "/dashboard";
      navigate(path);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ──
  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #f4f2ee;
        }

        .lp-left {
          flex: 1;
          background: #1c2b3a;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          overflow: hidden;
        }

        .lp-left-glow1 {
          position: absolute; top: -80px; left: -80px;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.14) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .lp-left-glow2 {
          position: absolute; bottom: -100px; right: -60px;
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,144,189,0.10) 0%, transparent 70%);
          z-index: 0; pointer-events: none;
        }

        .lp-left-inner {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          height: 100%; justify-content: space-between;
        }

        .lp-brand { display: flex; align-items: center; gap: 11px; }

        .lp-brand-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #c4a158, #e2c07a);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .lp-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500;
          color: #f0ede4; letter-spacing: 0.02em;
        }

        .lp-brand-name b { color: #c4a158; font-weight: 600; }

        .lp-hero {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; padding: 60px 0 40px;
        }

        .lp-hero-tag {
          display: flex; align-items: center;
          gap: 10px; margin-bottom: 26px;
        }

        .lp-hero-tag-line { width: 28px; height: 1px; background: #c4a158; }

        .lp-hero-tag-text {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase;
        }

        .lp-hero-heading {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 4vw, 54px); font-weight: 400;
          color: #f0ede4; line-height: 1.18;
          margin: 0 0 22px; letter-spacing: -0.01em;
        }

        .lp-hero-heading em { font-style: italic; color: #c4a158; }

        .lp-hero-body {
          font-size: 14px; font-weight: 300;
          color: rgba(240,237,228,0.5);
          line-height: 1.8; max-width: 340px;
        }

        .lp-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .lp-stat { padding: 20px 18px; background: rgba(255,255,255,0.03); }

        .lp-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 500;
          color: #c4a158; line-height: 1; margin-bottom: 5px;
        }

        .lp-stat-label {
          font-size: 10px; font-weight: 400;
          color: rgba(240,237,228,0.4);
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        .lp-right {
          width: 460px; flex-shrink: 0;
          background: #faf9f6;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 56px 48px; position: relative;
        }

        .lp-right-top-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #c4a158 0%, #e2c07a 50%, #c4a158 100%);
        }

        .lp-form-header { margin-bottom: 36px; }

        .lp-form-eyebrow {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #c4a158; margin-bottom: 10px;
        }

        .lp-form-title {
          font-family: 'Playfair Display', serif;
          font-size: 34px; font-weight: 500;
          color: #1a1a1a; margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .lp-form-subtitle { font-size: 13px; font-weight: 400; color: #9a9485; }

        .lp-field { margin-bottom: 16px; }

        .lp-field-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #5c5649; letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 7px;
        }

        .lp-input {
          width: 100%; height: 50px !important;
          background: #fff !important; border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important; padding: 0 16px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease !important;
          outline: none !important; box-shadow: none !important;
        }

        .lp-input:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        .lp-input::placeholder { color: #c8c2b8 !important; font-weight: 300 !important; }

        .lp-forgot-row {
          text-align: right; margin-top: 4px; margin-bottom: 24px;
        }

        .lp-forgot-btn {
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 500; color: #9a9485;
          background: none; border: none; padding: 0;
          cursor: pointer; transition: color 0.15s;
        }

        .lp-forgot-btn:hover { color: #c4a158; }

        .lp-submit-btn {
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
        }

        .lp-submit-btn:hover:not(:disabled) { background: #243547 !important; }
        .lp-submit-btn:active:not(:disabled) { transform: scale(0.99) !important; }
        .lp-submit-btn:disabled { opacity: 0.55 !important; cursor: not-allowed !important; }

        .lp-divider {
          display: flex; align-items: center;
          gap: 12px; margin: 24px 0;
        }

        .lp-divider-line { flex: 1; height: 1px; background: #e5e0d8; }

        .lp-divider-text {
          font-size: 10px; font-weight: 600; color: #c0b9ae;
          letter-spacing: 0.18em; text-transform: uppercase;
        }

        /* 2-column grid for Google + Apple */
        .lp-social-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .lp-social-btn {
          height: 46px !important;
          background: #fff !important;
          border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          display: flex !important; align-items: center !important;
          justify-content: center !important; gap: 8px !important;
          cursor: pointer !important; color: #5c5649 !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 12px !important; font-weight: 600 !important;
          transition: border-color 0.15s, background 0.15s, transform 0.12s !important;
        }

        .lp-social-btn:hover:not(:disabled) {
          border-color: #c4a158 !important;
          background: #fdf9f2 !important;
          transform: translateY(-1px) !important;
        }

        .lp-social-btn:active:not(:disabled) { transform: scale(0.97) !important; }

        .lp-social-btn:disabled {
          opacity: 0.38 !important;
          cursor: not-allowed !important;
        }

        .lp-signup-row { text-align: center; margin-top: 28px; }

        .lp-signup-text { font-size: 13px; font-weight: 400; color: #9a9485; }

        .lp-signup-link {
          font-size: 13px; font-weight: 600; color: #1c2b3a;
          background: none; border: none; padding: 0;
          cursor: pointer;
          text-decoration: underline; text-decoration-color: #c4a158;
          text-underline-offset: 3px; transition: color 0.15s;
        }

        .lp-signup-link:hover { color: #c4a158; }

        .lp-secure-row {
          display: flex; align-items: center; gap: 8px;
          margin-top: 32px; padding-top: 22px;
          border-top: 1px solid #e8e4dc;
        }

        .lp-secure-text {
          font-size: 11px; font-weight: 400;
          color: #b8b2a8; line-height: 1.5;
        }

        @media (max-width: 820px) {
          .lp-left { display: none; }
          .lp-right { width: 100%; }
        }
      `}</style>

      <div className="lp-root">
        {/* LEFT BRANDING PANEL */}
        <div className="lp-left">
          <div className="lp-left-glow1" />
          <div className="lp-left-glow2" />

          <div className="lp-left-inner">
            <div className="lp-brand">
              <div className="lp-brand-icon">
                <svg viewBox="0 0 76 65" fill="#1c2b3a" width="16" height="16">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <span className="lp-brand-name">Legal<b>Pro</b></span>
            </div>

            <div className="lp-hero">
              <div className="lp-hero-tag">
                <div className="lp-hero-tag-line" />
                <span className="lp-hero-tag-text">Legal Management Platform</span>
              </div>
              <h1 className="lp-hero-heading">
                Justice begins with <em>clarity</em> and precision.
              </h1>
              <p className="lp-hero-body">
                Manage your entire legal practice — from client intake to case
                resolution — in one secure, intelligent platform.
              </p>
            </div>

            <div className="lp-stats">
              <div className="lp-stat">
                <div className="lp-stat-num">12k+</div>
                <div className="lp-stat-label">Cases Filed</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">98%</div>
                <div className="lp-stat-label">Uptime SLA</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat-num">256‑bit</div>
                <div className="lp-stat-label">Encryption</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="lp-right">
          <div className="lp-right-top-bar" />

          <div className="lp-form-header">
            <div className="lp-form-eyebrow">Secure Portal</div>
            <h2 className="lp-form-title">Welcome back</h2>
            <p className="lp-form-subtitle">Sign in to access your legal dashboard</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="lp-field">
              <label className="lp-field-label">Email Address</label>
              <Input
                type="email"
                placeholder="you@lawfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lp-input"
              />
            </div>

            <div className="lp-field">
              <label className="lp-field-label">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="lp-input"
              />
            </div>

            <div className="lp-forgot-row">
              <button
                type="button"
                className="lp-forgot-btn"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" disabled={loading} className="lp-submit-btn">
              {loading ? (
                <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
              ) : (
                "Sign In to LegalPro"
              )}
            </Button>
          </form>

          <div className="lp-divider">
            <div className="lp-divider-line" />
            <span className="lp-divider-text">or continue with</span>
            <div className="lp-divider-line" />
          </div>

          {/* Google + Apple — 2 columns, no GitHub */}
          <div className="lp-social-grid">
            <Button
              type="button"
              variant="outline"
              className="lp-social-btn"
              onClick={loginWithGoogle}
            >
              {/* Google SVG icon (accurate colors) */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="lp-social-btn"
              disabled
              title="Apple Sign-In coming soon"
            >
              <Apple style={{ width: 18, height: 18 }} />
              Apple
            </Button>
          </div>

          <div className="lp-signup-row">
            <span className="lp-signup-text">New to the firm? </span>
            <button className="lp-signup-link" onClick={() => navigate("/signup")}>
              Request Access
            </button>
          </div>

          <div className="lp-secure-row">
            <ShieldCheck style={{ width: 15, height: 15, color: "#c4a158", flexShrink: 0 }} />
            <span className="lp-secure-text">
              AES-256 encrypted · SOC 2 compliant · © 2026 LegalPro Management Systems
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
