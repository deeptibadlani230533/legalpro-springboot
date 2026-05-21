import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, FileText, Sparkles, ArrowLeft, CheckCircle } from "lucide-react";

export default function DocumentSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { document } = location.state || {};

  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState(document?.summary || null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const steps = [
    "Analyzing document structure…",
    "Extracting legal entities…",
    "Generating AI summary…",
    "Waiting for AI response…",
  ];

  useEffect(() => {
    if (!document) return;

    const stepInterval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1500);

    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/documents/case/${document.caseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await res.json();
        if (result.success) {
          const doc = result.data.find((d) => d.id === document.id);
          if (doc && doc.summary) {
            setSummary(doc.summary);
            setLoading(false);
            clearInterval(poll);
            clearInterval(stepInterval);
          }
        }
      } catch (err) {
        console.error("Polling failed");
      }
    }, 2000);

    return () => {
      clearInterval(poll);
      clearInterval(stepInterval);
    };
  }, [document]);

  if (!document) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');
          .ds-notfound {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            background: #f4f2ee; font-family: 'Inter', sans-serif;
          }
          .ds-notfound-inner { text-align: center; }
          .ds-notfound-icon {
            width: 52px; height: 52px; border-radius: 50%; background: #fff;
            border: 1px solid #e5e0d8; display: flex; align-items: center;
            justify-content: center; margin: 0 auto 14px;
          }
          .ds-notfound-text { font-size: 14px; font-weight: 300; color: #9a9485; }
        `}</style>
        <div className="ds-notfound">
          <div className="ds-notfound-inner">
            <div className="ds-notfound-icon"><FileText size={20} color="#c8c2b8" /></div>
            <p className="ds-notfound-text">Document not found.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .ds-root {
          min-height: 100vh; background: #f4f2ee;
          font-family: 'Inter', sans-serif; position: relative;
        }

        .ds-bg-glow1 {
          position: fixed; top: -100px; right: -100px;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(196,161,88,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .ds-bg-glow2 {
          position: fixed; bottom: -100px; left: -80px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(28,43,58,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .ds-main {
          max-width: 780px; margin: 0 auto;
          padding: 44px 24px 80px;
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 24px;
        }

        /* Back btn */
        .ds-back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600; color: #9a9485;
          background: #fff; border: 1.5px solid #e5e0d8; border-radius: 9px;
          padding: 7px 15px; cursor: pointer; width: fit-content;
          transition: border-color 0.15s, color 0.15s; letter-spacing: 0.04em;
          font-family: 'Inter', sans-serif;
        }
        .ds-back-btn:hover { border-color: #c4a158; color: #1a1a1a; }

        /* Page header */
        .ds-page-header { display: flex; align-items: center; gap: 14px; }

        .ds-header-icon {
          width: 44px; height: 44px; border-radius: 11px;
          background: #1c2b3a;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .ds-header-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 5px;
        }

        .ds-header-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px; font-weight: 500; color: #1a1a1a;
          margin: 0; letter-spacing: -0.01em;
        }

        .ds-header-title em { font-style: italic; color: #c4a158; }

        /* Document info card */
        .ds-doc-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 14px;
          padding: 18px 22px; display: flex; align-items: center; gap: 14px;
        }

        .ds-doc-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: rgba(196,161,88,0.10);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .ds-doc-label {
          font-size: 10px; font-weight: 600; color: #b8b2a8;
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;
        }

        .ds-doc-name { font-size: 14px; font-weight: 600; color: #1a1a1a; }

        /* Loading card */
        .ds-loading-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px;
          overflow: hidden;
        }

        .ds-loading-top-bar {
          height: 3px;
          background: linear-gradient(90deg, #1c2b3a, #c4a158, #4a7c59, #c4a158, #1c2b3a);
          background-size: 300% 100%;
          animation: ds-slide 2.5s linear infinite;
        }

        @keyframes ds-slide {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .ds-loading-body { padding: 28px 28px 24px; }

        .ds-loading-header {
          display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
        }

        .ds-loading-spin {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid #ede9e2; border-top-color: #c4a158;
          animation: ds-spin 0.9s linear infinite; flex-shrink: 0;
        }

        @keyframes ds-spin { to { transform: rotate(360deg); } }

        .ds-loading-headline {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500; color: #1a1a1a;
        }

        .ds-loading-sub { font-size: 12px; font-weight: 300; color: #9a9485; margin-top: 2px; }

        /* Step rows */
        .ds-steps { display: flex; flex-direction: column; gap: 10px; }

        .ds-step-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          background: #faf9f6; border: 1px solid #ede9e2;
        }

        .ds-step-row.active {
          background: rgba(196,161,88,0.07); border-color: rgba(196,161,88,0.25);
        }

        .ds-step-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #e0dbd2; flex-shrink: 0;
        }
        .ds-step-row.active .ds-step-dot {
          background: #c4a158;
          animation: ds-pulse 1.4s ease-in-out infinite;
        }

        @keyframes ds-pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.4; }
        }

        .ds-step-text {
          font-size: 13px; font-weight: 400; color: #9a9485;
        }

        .ds-step-row.active .ds-step-text { color: #1a1a1a; font-weight: 500; }

        /* Summary card */
        .ds-summary-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; overflow: hidden;
        }

        .ds-summary-top-bar { height: 3px; background: linear-gradient(90deg, #c4a158, #e2c07a, #c4a158); }

        .ds-summary-header {
          padding: 20px 26px 16px; border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; gap: 12px;
        }

        .ds-summary-header-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: rgba(196,161,88,0.10);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .ds-summary-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 3px;
        }

        .ds-summary-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500; color: #1a1a1a;
        }

        .ds-summary-done-badge {
          margin-left: auto; display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600; color: #4a7c59;
          background: rgba(74,124,89,0.08); border: 1px solid rgba(74,124,89,0.18);
          border-radius: 999px; padding: 4px 12px;
        }

        .ds-summary-body { padding: 24px 26px; }

        .ds-summary-text {
          font-size: 14px; font-weight: 300; color: #3a3530;
          line-height: 1.85; white-space: pre-line;
        }

        .ds-footer {
          text-align: center; padding: 24px;
          font-size: 11px; color: #c0b9ae; letter-spacing: 0.06em;
          border-top: 1px solid #ede9e2; position: relative; z-index: 1;
        }
      `}</style>

      <div className="ds-root">
        <div className="ds-bg-glow1" />
        <div className="ds-bg-glow2" />

        <main className="ds-main">

          {/* Back */}
          <button className="ds-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={13} /> Back
          </button>

          {/* Page Header */}
          <div className="ds-page-header">
            <div className="ds-header-icon">
              <Sparkles size={18} color="#c4a158" />
            </div>
            <div>
              <div className="ds-header-eyebrow">AI Intelligence</div>
              <h1 className="ds-header-title">Document <em>Summary</em></h1>
            </div>
          </div>

          {/* Document Info */}
          <div className="ds-doc-card">
            <div className="ds-doc-icon">
              <FileText size={16} color="#c4a158" />
            </div>
            <div>
              <div className="ds-doc-label">Source Document</div>
              <div className="ds-doc-name">{document.originalName}</div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="ds-loading-card">
              <div className="ds-loading-top-bar" />
              <div className="ds-loading-body">
                <div className="ds-loading-header">
                  <div className="ds-loading-spin" />
                  <div>
                    <div className="ds-loading-headline">AI is processing your document</div>
                    <div className="ds-loading-sub">This usually takes 10–30 seconds</div>
                  </div>
                </div>

                <div className="ds-steps">
                  {steps.map((s, i) => (
                    <div key={i} className={`ds-step-row${i === step ? " active" : ""}`}>
                      <div className="ds-step-dot" />
                      <span className="ds-step-text">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Summary Result */}
          {!loading && summary && (
            <div className="ds-summary-card">
              <div className="ds-summary-top-bar" />
              <div className="ds-summary-header">
                <div className="ds-summary-header-icon">
                  <Sparkles size={15} color="#c4a158" />
                </div>
                <div>
                  <div className="ds-summary-eyebrow">AI Generated</div>
                  <div className="ds-summary-title">Document Summary</div>
                </div>
                <div className="ds-summary-done-badge">
                  <CheckCircle size={12} />
                  Complete
                </div>
              </div>
              <div className="ds-summary-body">
                <p className="ds-summary-text">{summary}</p>
              </div>
            </div>
          )}

        </main>

        <footer className="ds-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; AI-Powered Intelligence &nbsp;·&nbsp; AES-256 Encrypted
        </footer>
      </div>
    </>
  );
}
