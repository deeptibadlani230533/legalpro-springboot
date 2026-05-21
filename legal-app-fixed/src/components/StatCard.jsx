import { motion } from "framer-motion";
import { TrendingUp, Minus } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, trend, accent = "#1c2b3a" }) {
  const hasTrend = !!trend;
  const isFlat = trend === "Stable" || trend === "stable";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

        .sc-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 18px;
          padding: 24px 26px;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          cursor: default;
        }

        .sc-top-bar {
          position: absolute;
          top: 0; left: 0; right: 0; height: 3px;
          border-radius: 18px 18px 0 0;
        }

        .sc-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .sc-label {
          font-size: 11px; font-weight: 600;
          color: #9a9485; letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .sc-icon-wrap {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: #f4f2ee;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .sc-value {
          font-family: 'Playfair Display', serif;
          font-size: 40px; font-weight: 400;
          color: #1a1a1a; line-height: 1;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .sc-value.empty {
          /* decorative dash instead of value */
          font-size: 0;
        }

        .sc-dash {
          width: 40px; height: 2px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .sc-trend {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 500;
          padding: 3px 10px; border-radius: 999px;
        }

        .sc-trend.up   { background: rgba(74,124,89,0.08);   color: #4a7c59; }
        .sc-trend.flat { background: rgba(156,148,133,0.12); color: #9a9485; }
      `}</style>

      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <div className="sc-card">
          {/* Colored top accent bar */}
          <div
            className="sc-top-bar"
            style={{ background: `linear-gradient(90deg, ${accent}, ${accent}44)` }}
          />

          {/* Label + Icon row */}
          <div className="sc-top">
            <span className="sc-label">{title}</span>
            <div
              className="sc-icon-wrap"
              style={{ background: accent + "12" }}
            >
              {Icon && <Icon size={16} color={accent} />}
            </div>
          </div>

          {/* Value — show if provided, else decorative dash */}
          {value !== undefined && value !== null ? (
            <div className="sc-value">{value}</div>
          ) : (
            <div className="sc-dash" style={{ background: accent + "30" }} />
          )}

          {/* Trend pill */}
          {hasTrend && (
            <div className={`sc-trend ${isFlat ? "flat" : "up"}`}>
              {!isFlat && <TrendingUp size={11} />}
              {isFlat  && <Minus size={11} />}
              {trend}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
