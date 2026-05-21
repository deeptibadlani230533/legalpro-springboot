import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, User, ChevronRight, ShieldCheck } from "lucide-react";

export default function SelectRole() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();

  const email = params.get("email") || "";
  const name  = params.get("name")  || "";

  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const handleSubmit = async () => {
    if (!selectedRole) { setError("Please select a role to continue."); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google/complete`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, name, role: selectedRole }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      // Active user (already existed) — store token and go to dashboard
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role",  data.role);
        navigate(data.role === "lawyer" ? "/lawyer/dashboard" : "/dashboard");
        return;
      }

      // New pending user
      navigate("/pending-approval");

    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id:    "client",
      icon:  User,
      label: "Client",
      desc:  "I need legal representation or advice for my case.",
      bg:    "#f4f2ee",
      color: "#6b6355",
      border:"#d0cbc2",
      activeBg:     "#1c2b3a",
      activeColor:  "#f0ede4",
      activeBorder: "#1c2b3a",
    },
    {
      id:    "lawyer",
      icon:  Shield,
      label: "Lawyer",
      desc:  "I am a legal professional joining to manage cases.",
      bg:    "#eef4fd",
      color: "#2859a0",
      border:"#bdd3f5",
      activeBg:     "#2859a0",
      activeColor:  "#fff",
      activeBorder: "#2859a0",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .sr-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #f4f2ee;
          font-family: 'Inter', sans-serif;
          padding: 24px;
        }

        .sr-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 24px;
          overflow: hidden;
          max-width: 480px;
          width: 100%;
        }

        .sr-top-bar {
          height: 3px;
          background: linear-gradient(90deg, #c4a158, #e2c07a, #c4a158);
        }

        .sr-body { padding: 48px 44px 40px; }

        .sr-eyebrow {
          font-size: 10px; font-weight: 600;
          color: #c4a158; letter-spacing: 0.2em;
          text-transform: uppercase; margin-bottom: 10px;
        }

        .sr-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 500;
          color: #1a1a1a; margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .sr-title em { font-style: italic; color: #c4a158; }

        .sr-sub {
          font-size: 13px; font-weight: 300;
          color: #9a9485; margin-bottom: 8px; line-height: 1.6;
        }

        .sr-name {
          font-size: 13px; font-weight: 500;
          color: #1a1a1a; margin-bottom: 32px;
        }

        .sr-roles { display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px; }

        .sr-role-card {
          display: flex; align-items: center; gap: 16px;
          padding: 18px 20px;
          border: 2px solid; border-radius: 14px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          width: 100%;
          background: none;
          font-family: 'Inter', sans-serif;
        }

        .sr-role-icon {
          width: 44px; height: 44px;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .sr-role-info { flex: 1; }

        .sr-role-label {
          font-size: 14px; font-weight: 600;
          margin-bottom: 3px;
          transition: color 0.15s;
        }

        .sr-role-desc {
          font-size: 12px; font-weight: 300;
          line-height: 1.5;
          transition: color 0.15s;
        }

        .sr-role-check {
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 2px solid;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .sr-error {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px;
          background: #fdf4f3; border: 1px solid #f5c6c2;
          border-radius: 10px;
          font-size: 12px; color: #c0392b;
          margin-bottom: 16px;
        }

        .sr-submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; height: 48px;
          background: #1c2b3a; color: #f0ede4;
          border: none; border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
        }
        .sr-submit-btn:hover:not(:disabled) { background: #243547; }
        .sr-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .sr-submit-btn.sr-no-role {
          background: #e5e0d8; color: #b8b2a8; cursor: not-allowed;
        }

        .sr-footer {
          padding: 16px 24px;
          border-top: 1px solid #f0ece4;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .sr-footer-text {
          font-size: 11px; color: #c0b9ae; letter-spacing: 0.04em;
        }

        @keyframes sr-spin { to { transform: rotate(360deg); } }
        .sr-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(240,237,228,0.3);
          border-top-color: #f0ede4;
          animation: sr-spin 0.7s linear infinite;
        }
      `}</style>

      <div className="sr-root">
        <div className="sr-card">
          <div className="sr-top-bar" />
          <div className="sr-body">

            <div className="sr-eyebrow">Almost there</div>
            <h1 className="sr-title">Choose your <em>role</em></h1>
            <p className="sr-sub">Welcome to LegalPro,</p>
            <p className="sr-name">{name || email}</p>

            <div className="sr-roles">
              {roles.map((r) => {
                const isActive = selectedRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    className="sr-role-card"
                    onClick={() => { setSelectedRole(r.id); setError(""); }}
                    style={{
                      background:   isActive ? r.activeBg   : r.bg,
                      borderColor:  isActive ? r.activeBorder : r.border,
                    }}
                  >
                    <div
                      className="sr-role-icon"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.15)" : "#fff",
                      }}
                    >
                      <Icon size={20} color={isActive ? r.activeColor : r.color} />
                    </div>

                    <div className="sr-role-info">
                      <div
                        className="sr-role-label"
                        style={{ color: isActive ? r.activeColor : "#1a1a1a" }}
                      >
                        {r.label}
                      </div>
                      <div
                        className="sr-role-desc"
                        style={{ color: isActive ? "rgba(255,255,255,0.7)" : "#9a9485" }}
                      >
                        {r.desc}
                      </div>
                    </div>

                    <div
                      className="sr-role-check"
                      style={{
                        borderColor:  isActive ? r.activeColor : r.border,
                        background:   isActive ? r.activeColor : "transparent",
                      }}
                    >
                      {isActive && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke={r.activeBg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="sr-error">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#c0392b", flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              className={`sr-submit-btn${!selectedRole ? " sr-no-role" : ""}`}
              onClick={handleSubmit}
              disabled={loading || !selectedRole}
            >
              {loading ? (
                <><div className="sr-spinner" /> Setting up your account…</>
              ) : (
                <>Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.label : "…"} <ChevronRight size={14} /></>
              )}
            </button>

          </div>

          <div className="sr-footer">
            <ShieldCheck size={12} color="#c4a158" />
            <span className="sr-footer-text">AES-256 encrypted · © 2026 LegalPro Management Systems</span>
          </div>
        </div>
      </div>
    </>
  );
}