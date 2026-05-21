import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";

export default function ActivityTimeline({ caseId, refreshKey }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/cases/${caseId}/activity`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to fetch activity");
        setActivity(data);
      } catch (err) {
        toast.error("Failed to load case activity.");
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [caseId, refreshKey]);

  // Assign a dot color per action type
  const getDotColor = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("close") || a.includes("closed")) return "#9a9485";
    if (a.includes("accept") || a.includes("progress")) return "#4a7c59";
    if (a.includes("assign")) return "#c4a158";
    if (a.includes("upload") || a.includes("document")) return "#3b7dd8";
    return "#1c2b3a";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500&family=Inter:wght@300;400;500;600&display=swap');

        .at-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 18px;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .at-header {
          padding: 20px 26px 14px;
          border-bottom: 1px solid #f0ece4;
        }

        .at-eyebrow {
          font-size: 10px; font-weight: 600;
          color: #c4a158; letter-spacing: 0.2em;
          text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 6px;
        }

        .at-title {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500;
          color: #1a1a1a; margin: 0 0 3px;
        }

        .at-sub {
          font-size: 12px; font-weight: 300; color: #9a9485;
        }

        .at-body {
          padding: 22px 26px;
        }

        /* Loading skeleton */
        .at-loading {
          display: flex; flex-direction: column; gap: 18px;
        }

        .at-skeleton-row {
          display: flex; align-items: flex-start; gap: 14px;
        }

        .at-skeleton-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #ede9e2; flex-shrink: 0; margin-top: 4px;
          animation: at-shimmer 1.4s ease-in-out infinite;
        }

        .at-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }

        .at-skeleton-line {
          height: 10px; border-radius: 5px; background: #ede9e2;
          animation: at-shimmer 1.4s ease-in-out infinite;
        }

        @keyframes at-shimmer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }

        /* Empty state */
        .at-empty {
          text-align: center; padding: 32px 0;
        }

        .at-empty-icon {
          margin: 0 auto 12px;
          width: 40px; height: 40px; border-radius: 50%;
          background: #f4f2ee;
          display: flex; align-items: center; justify-content: center;
        }

        .at-empty-text {
          font-size: 13px; font-weight: 300; color: #b8b2a8;
        }

        /* Timeline */
        .at-timeline {
          display: flex; flex-direction: column; gap: 0;
          position: relative;
        }

        .at-item {
          display: flex; gap: 16px;
          position: relative;
          padding-bottom: 22px;
        }

        .at-item:last-child { padding-bottom: 0; }

        .at-item-left {
          display: flex; flex-direction: column;
          align-items: center; flex-shrink: 0;
          width: 18px;
        }

        .at-dot {
          width: 10px; height: 10px; border-radius: 50%;
          flex-shrink: 0; margin-top: 4px;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1.5px currentColor;
          position: relative; z-index: 1;
        }

        .at-connector {
          flex: 1; width: 1px;
          background: #ede9e2;
          margin-top: 4px;
        }

        .at-item:last-child .at-connector { display: none; }

        .at-item-right { flex: 1; padding-top: 1px; }

        .at-action {
          font-size: 13px; font-weight: 600; color: #1a1a1a;
          margin-bottom: 3px; text-transform: capitalize;
        }

        .at-details {
          font-size: 12px; font-weight: 300; color: #6b6355;
          line-height: 1.55; margin-bottom: 5px;
        }

        .at-meta {
          font-size: 11px; font-weight: 400; color: #b8b2a8;
        }

        .at-meta span { color: #9a9485; font-weight: 500; }
      `}</style>

      <div className="at-card">
        <div className="at-header">
          <div className="at-eyebrow">
            <Clock size={11} /> Activity Log
          </div>
          <div className="at-title">Case Activity</div>
          <div className="at-sub">Chronological system activity for this case</div>
        </div>

        <div className="at-body">
          {loading ? (
            <div className="at-loading">
              {[1, 2, 3].map((i) => (
                <div className="at-skeleton-row" key={i}>
                  <div className="at-skeleton-dot" />
                  <div className="at-skeleton-lines">
                    <div className="at-skeleton-line" style={{ width: "60%" }} />
                    <div className="at-skeleton-line" style={{ width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="at-empty">
              <div className="at-empty-icon">
                <Clock size={18} color="#c8c2b8" />
              </div>
              <p className="at-empty-text">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="at-timeline">
              {activity.map((log) => {
                const dotColor = getDotColor(log.action);
                return (
                  <div className="at-item" key={log.id}>
                    <div className="at-item-left">
                      <div
                        className="at-dot"
                        style={{ color: dotColor, background: dotColor + "22" }}
                      />
                      <div className="at-connector" />
                    </div>
                    <div className="at-item-right">
                      <div className="at-action">
                        {log.action.replaceAll("_", " ")}
                      </div>
                      {log.details && (
                        <div className="at-details">{log.details}</div>
                      )}
                      <div className="at-meta">
                        By <span>{log.user?.name}</span>{" "}
                        ({log.user?.role}) ·{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
