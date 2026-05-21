import React, { useState } from "react";
import { User, Shield, Trash2, Save, Lock, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import Header from "../components/Header";

export default function Settings() {
  const role = localStorage.getItem("role");
  const [twoFA, setTwoFA] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .st-root {
          min-height: 100vh; display: flex; flex-direction: column;
          background: #f4f2ee; font-family: 'Inter', sans-serif; position: relative;
        }

        .st-bg-glow1 {
          position: fixed; top: -100px; right: -100px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .st-bg-glow2 {
          position: fixed; bottom: -100px; left: -80px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(28,43,58,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .st-main {
          flex: 1; width: 100%; max-width: 860px;
          margin: 0 auto; padding: 44px 32px 80px;
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 32px;
        }

        /* ── Page header ── */
        .st-page-header {
          padding-bottom: 24px; border-bottom: 1px solid #e5e0d8;
        }

        .st-page-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }

        .st-page-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3vw, 36px); font-weight: 400;
          color: #1a1a1a; margin: 0 0 6px; letter-spacing: -0.01em;
        }
        .st-page-title em { font-style: italic; color: #c4a158; }

        .st-page-sub { font-size: 13px; font-weight: 300; color: #9a9485; }

        /* ── Section ── */
        .st-section {
          display: grid; grid-template-columns: 220px 1fr; gap: 32px;
          align-items: start;
        }
        @media (max-width: 680px) { .st-section { grid-template-columns: 1fr; } }

        .st-section-divider { height: 1px; background: #e5e0d8; }

        .st-section-label-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 6px;
          display: flex; align-items: center; gap: 6px;
        }

        .st-section-label-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 500; color: #1a1a1a; margin-bottom: 5px;
        }

        .st-section-label-sub { font-size: 12px; font-weight: 300; color: #9a9485; line-height: 1.6; }

        /* ── Card ── */
        .st-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; overflow: hidden;
        }

        .st-card-top-bar { height: 3px; }

        .st-card-body { padding: 24px 26px; display: flex; flex-direction: column; gap: 20px; }

        /* Fields */
        .st-field { display: flex; flex-direction: column; gap: 7px; }

        .st-label {
          font-size: 11px; font-weight: 600; color: #5c5649;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .st-input {
          height: 48px !important; background: #fff !important;
          border: 1.5px solid #e5e0d8 !important; border-radius: 10px !important;
          padding: 0 16px !important; font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important; color: #1a1a1a !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          outline: none !important; box-shadow: none !important;
        }
        .st-input:focus {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }
        .st-input::placeholder { color: #c8c2b8 !important; font-weight: 300 !important; }
        .st-input:disabled {
          background: #faf9f6 !important; color: #9a9485 !important; cursor: default !important;
        }

        .st-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 540px) { .st-grid-2 { grid-template-columns: 1fr; } }

        /* Save button */
        .st-save-btn {
          display: inline-flex; align-items: center; gap: 7px;
          height: 44px; background: #1c2b3a; color: #f0ede4;
          border: none; border-radius: 10px; padding: 0 22px;
          font-family: 'Inter', sans-serif; font-size: 12px;
          font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: background 0.15s; align-self: flex-start;
        }
        .st-save-btn:hover { background: #243547; }

        /* Toggle row */
        .st-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px; border: 1.5px solid #e5e0d8;
          border-radius: 12px; background: #faf9f6;
          gap: 20px;
        }

        .st-toggle-title { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 3px; }
        .st-toggle-sub   { font-size: 11px; font-weight: 300; color: #9a9485; }

        /* Update button */
        .st-outline-btn {
          display: inline-flex; align-items: center; gap: 7px;
          height: 36px; background: #fff; color: #1c2b3a;
          border: 1.5px solid #e5e0d8; border-radius: 9px; padding: 0 16px;
          font-family: 'Inter', sans-serif; font-size: 12px;
          font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer; transition: border-color 0.15s, background 0.15s; flex-shrink: 0;
        }
        .st-outline-btn:hover { border-color: #c4a158; background: #fdf9f2; }

        /* Danger zone */
        .st-danger-card {
          background: #fffbfb; border: 1.5px solid #f5c6c2; border-radius: 16px;
          padding: 22px 24px; display: flex; align-items: center;
          justify-content: space-between; gap: 20px; flex-wrap: wrap;
        }

        .st-danger-title { font-size: 13px; font-weight: 600; color: #c0392b; margin-bottom: 4px; }
        .st-danger-sub   { font-size: 11px; font-weight: 300; color: "#a93226"; }

        .st-danger-btn {
          display: inline-flex; align-items: center; gap: 7px;
          height: 40px; background: #c0392b; color: #fff;
          border: none; border-radius: 9px; padding: 0 18px;
          font-family: 'Inter', sans-serif; font-size: 12px;
          font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer; transition: background 0.15s; flex-shrink: 0;
        }
        .st-danger-btn:hover { background: #a93226; }

        /* Section label */
        .st-section-label-danger { color: #c0392b; }

        .st-footer {
          text-align: center; padding: 24px;
          font-size: 11px; color: #c0b9ae; letter-spacing: 0.06em;
          border-top: 1px solid #ede9e2; position: relative; z-index: 1;
        }
      `}</style>

      <div className="st-root">
        <div className="st-bg-glow1" />
        <div className="st-bg-glow2" />

        <Header title="Settings" />

        <main className="st-main">

          {/* Page header */}
          <div className="st-page-header">
            <div className="st-page-eyebrow"><User size={11} /> Account Settings</div>
            <h1 className="st-page-title">Manage <em>Preferences</em></h1>
            <p className="st-page-sub">Control your firm account, security, and notification settings.</p>
          </div>

          {/* ── Section: General ── */}
          <div className="st-section">
            <div>
              <div className="st-section-label-eyebrow"><User size={11} /> General</div>
              <div className="st-section-label-title">Profile</div>
              <div className="st-section-label-sub">Your basic identity and firm role within the system.</div>
            </div>

            <div className="st-card">
              <div className="st-card-top-bar"
                style={{ background: "linear-gradient(90deg,#1c2b3a,#1c2b3a55)" }} />
              <div className="st-card-body">
                <div className="st-grid-2">
                  <div className="st-field">
                    <label className="st-label">Account Role</label>
                    <Input
                      value={role || "User"} disabled
                      className="st-input"
                      style={{ textTransform: "capitalize" }}
                    />
                  </div>
                  <div className="st-field">
                    <label className="st-label">Timezone</label>
                    <Input
                      value="Asia/Kolkata (GMT+5:30)" disabled
                      className="st-input"
                    />
                  </div>
                </div>
                <div className="st-field">
                  <label className="st-label">Display Name</label>
                  <Input placeholder="Enter your display name" className="st-input" />
                </div>
                <button className="st-save-btn">
                  <Save size={13} /> Save Changes
                </button>
              </div>
            </div>
          </div>

          <div className="st-section-divider" />

          {/* ── Section: Security ── */}
          <div className="st-section">
            <div>
              <div className="st-section-label-eyebrow"><Shield size={11} /> Security</div>
              <div className="st-section-label-title">Protection</div>
              <div className="st-section-label-sub">Protect your account with modern security standards.</div>
            </div>

            <div className="st-card">
              <div className="st-card-top-bar"
                style={{ background: "linear-gradient(90deg,#c4a158,#c4a15855)" }} />
              <div className="st-card-body">
                <div className="st-toggle-row">
                  <div>
                    <div className="st-toggle-title">Two-factor Authentication</div>
                    <div className="st-toggle-sub">Add an extra layer of protection to your account.</div>
                  </div>
                  <Switch
                    checked={twoFA}
                    onCheckedChange={setTwoFA}
                    style={{
                      background: twoFA ? "#c4a158" : "#e5e0d8",
                    }}
                  />
                </div>

                <div className="st-toggle-row">
                  <div>
                    <div className="st-toggle-title">Password</div>
                    <div className="st-toggle-sub">Last changed 4 months ago. Keep it up to date.</div>
                  </div>
                  <button className="st-outline-btn">
                    <Lock size={12} /> Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="st-section-divider" />

          {/* ── Section: Danger Zone ── */}
          <div className="st-section">
            <div>
              <div className="st-section-label-eyebrow st-section-label-danger">
                <Trash2 size={11} /> Danger Zone
              </div>
              <div className="st-section-label-title">Irreversible</div>
              <div className="st-section-label-sub">These actions permanently affect your account and cannot be undone.</div>
            </div>

            <div className="st-danger-card">
              <div>
                <div className="st-danger-title">Delete Account</div>
                <div className="st-danger-sub" style={{ color: "#a93226" }}>
                  Permanently remove all your cases, documents, and access.
                </div>
              </div>
              <button className="st-danger-btn">
                <Trash2 size={12} /> Delete Account
              </button>
            </div>
          </div>

        </main>

        <footer className="st-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; AES-256 Encrypted
        </footer>
      </div>
    </>
  );
}
