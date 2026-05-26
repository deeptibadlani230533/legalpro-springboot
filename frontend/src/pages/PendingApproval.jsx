import { useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, LogOut } from "lucide-react";

export default function PendingApproval() {
  const navigate = useNavigate();


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .pa-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f2ee;
          font-family: 'Inter', sans-serif;
          padding: 24px;
        }

        .pa-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 24px;
          overflow: hidden;
          max-width: 480px;
          width: 100%;
          text-align: center;
        }

        .pa-top-bar {
          height: 3px;
          background: linear-gradient(90deg, #c4a158, #e2c07a, #c4a158);
        }

        .pa-body { padding: 52px 48px; }

        .pa-icon-wrap {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: #fdf9f2;
          border: 2px solid #e5d9c0;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px;
        }

        .pa-eyebrow {
          font-size: 10px; font-weight: 600;
          color: #c4a158; letter-spacing: 0.2em;
          text-transform: uppercase; margin-bottom: 12px;
        }

        .pa-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px; font-weight: 500;
          color: #1a1a1a; margin: 0 0 14px;
          letter-spacing: -0.01em;
        }

        .pa-title em { font-style: italic; color: #c4a158; }

        .pa-desc {
          font-size: 14px; font-weight: 300;
          color: #9a9485; line-height: 1.7;
          margin-bottom: 36px;
        }

        .pa-steps {
          background: #faf9f6;
          border: 1px solid #ede9e2;
          border-radius: 14px;
          padding: 20px 24px;
          text-align: left;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pa-step {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pa-step-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #c4a158;
          flex-shrink: 0;
        }

        .pa-step-text {
          font-size: 13px;
          font-weight: 400;
          color: #5c5649;
        }

        .pa-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: 100%;
          height: 46px;
          background: none;
          border: 1.5px solid #e5e0d8;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #9a9485;
          cursor: pointer;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }

        .pa-logout-btn:hover {
          border-color: #c4a158;
          color: #1a1a1a;
          background: #fdf9f2;
        }

        .pa-footer {
          padding: 18px 24px;
          border-top: 1px solid #f0ece4;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .pa-footer-text {
          font-size: 11px;
          font-weight: 400;
          color: #c0b9ae;
          letter-spacing: 0.04em;
        }
      `}</style>

      <div className="pa-root">
        <div className="pa-card">
          <div className="pa-top-bar" />
          <div className="pa-body">
            <div className="pa-icon-wrap">
              <Clock size={28} color="#c4a158" />
            </div>

            <div className="pa-eyebrow">Access Pending</div>
            <h1 className="pa-title">Your request is <em>under review</em></h1>
            <p className="pa-desc">
              Thank you for registering with LegalPro. Your account has been created and is awaiting approval from our administrative team.
            </p>

            <div className="pa-steps">
              <div className="pa-step">
                <div className="pa-step-dot" style={{ background: "#22c55e" }} />
                <span className="pa-step-text">Account created successfully</span>
              </div>
              <div className="pa-step">
                <div className="pa-step-dot" />
                <span className="pa-step-text">Admin review in progress — usually within 24 hours</span>
              </div>
              <div className="pa-step">
                <div className="pa-step-dot" style={{ background: "#e5e0d8" }} />
                <span className="pa-step-text">You'll receive an email once approved</span>
              </div>
            </div>

            <button className="pa-logout-btn" onClick={handleLogout}>
              <LogOut size={13} /> Sign out
            </button>
          </div>

          <div className="pa-footer">
            <ShieldCheck size={12} color="#c4a158" />
            <span className="pa-footer-text">AES-256 encrypted · © 2026 LegalPro Management Systems</span>
          </div>
        </div>
      </div>
    </>
  );
}
