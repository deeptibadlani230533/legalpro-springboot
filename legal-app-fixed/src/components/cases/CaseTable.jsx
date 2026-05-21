import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, UserPlus, Trash2, Briefcase } from "lucide-react";
import EmptyState from "./EmptyState";

const statusConfig = {
  open:        { bg: "#edfaf2", color: "#2d7a4f", border: "#a8dfc0", label: "Open"        },
  assigned:    { bg: "#fdf8ec", color: "#b8902a", border: "#e8d090", label: "Assigned"    },
  in_progress: { bg: "#eef4fd", color: "#2859a0", border: "#bdd3f5", label: "In Progress" },
  closed:      { bg: "#f4f2ee", color: "#6b6355", border: "#d0cbc2", label: "Closed"      },
};

export default function CaseTable({
  cases,
  loading,
  role,
  onView,
  onAssignClick,
  onArchiveClick,
  onCreate,
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

        .ct-table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; }

        /* Header */
        .ct-thead { background: #faf9f6; }

        .ct-th {
          padding: 11px 18px; text-align: left;
          font-size: 10px; font-weight: 600; color: #b8b2a8;
          letter-spacing: 0.12em; text-transform: uppercase;
          border-bottom: 1px solid #f0ece4;
        }
        .ct-th:last-child { text-align: right; }

        /* Rows */
        .ct-tr {
          border-bottom: 1px solid #f8f6f2;
          transition: background 0.1s;
        }
        .ct-tr:last-child { border-bottom: none; }
        .ct-tr:hover { background: #faf9f6; }

        .ct-td { padding: 13px 18px; vertical-align: middle; }
        .ct-td:last-child { text-align: right; }

        /* ID */
        .ct-id {
          font-size: 11px; font-weight: 500;
          color: #b8b2a8; font-variant-numeric: tabular-nums;
          letter-spacing: 0.04em;
        }

        /* Matter title */
        .ct-matter { font-size: 13px; font-weight: 600; color: #1a1a1a; }

        /* Status badge */
        .ct-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: capitalize; padding: 4px 11px;
          border-radius: 999px; border: 1px solid;
        }

        .ct-badge-dot { width: 5px; height: 5px; border-radius: 50%; }

        /* Date */
        .ct-date { font-size: 12px; font-weight: 400; color: #9a9485; }

        /* Action trigger */
        .ct-action-trigger {
          width: 30px; height: 30px; border-radius: 7px;
          background: none; border: 1.5px solid #e5e0d8;
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .ct-action-trigger:hover { border-color: #c4a158; background: #fdf9f2; }

        /* Dropdown */
        .ct-dropdown {
          width: 180px !important;
          background: #fff !important;
          border: 1px solid #e5e0d8 !important;
          border-radius: 13px !important;
          box-shadow: 0 10px 32px rgba(0,0,0,0.09) !important;
          padding: 6px !important;
          font-family: 'Inter', sans-serif;
        }

        .ct-dd-item {
          display: flex !important; align-items: center !important; gap: 9px !important;
          padding: 9px 11px !important; border-radius: 8px !important;
          font-size: 13px !important; font-weight: 400 !important;
          color: #5c5649 !important; cursor: pointer !important;
          transition: background 0.12s !important;
        }
        .ct-dd-item:hover { background: #f4f2ee !important; color: #1a1a1a !important; }

        .ct-dd-item-icon { color: #b8b2a8 !important; flex-shrink: 0; }

        .ct-dd-sep { height: 1px; background: #f0ece4; margin: 4px 0; }

        .ct-dd-danger { color: #c0392b !important; }
        .ct-dd-danger:hover { background: #fdf4f3 !important; color: #c0392b !important; }
        .ct-dd-danger .ct-dd-item-icon { color: #c0392b !important; }

        /* Loading skeleton */
        .ct-skeleton-row td { padding: 14px 18px; }

        .ct-skeleton-line {
          height: 10px; border-radius: 5px; background: #ede9e2;
          animation: ct-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes ct-shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* Empty */
        .ct-empty-cell { padding: 0 !important; }
      `}</style>

      <table className="ct-table">
        <thead className="ct-thead">
          <tr>
            <th className="ct-th">ID</th>
            <th className="ct-th">Matter</th>
            <th className="ct-th">Status</th>
            <th className="ct-th">Filed On</th>
            <th className="ct-th">Options</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            /* Skeleton rows */
            [1, 2, 3, 4].map((i) => (
              <tr key={i} className="ct-skeleton-row ct-tr">
                <td className="ct-td"><div className="ct-skeleton-line" style={{ width: 40 }} /></td>
                <td className="ct-td"><div className="ct-skeleton-line" style={{ width: "70%" }} /></td>
                <td className="ct-td"><div className="ct-skeleton-line" style={{ width: 70 }} /></td>
                <td className="ct-td"><div className="ct-skeleton-line" style={{ width: 80 }} /></td>
                <td className="ct-td" style={{ textAlign: "right" }}>
                  <div className="ct-skeleton-line" style={{ width: 30, marginLeft: "auto" }} />
                </td>
              </tr>
            ))
          ) : cases.length === 0 ? (
            <tr>
              <td colSpan={5} className="ct-empty-cell">
                <EmptyState role={role} onCreate={onCreate} />
              </td>
            </tr>
          ) : (
            cases.map((item) => {
              const sc = statusConfig[item.status] || statusConfig.closed;
              return (
                <tr key={item.id} className="ct-tr">

                  {/* ID */}
                  <td className="ct-td">
                    <span className="ct-id">#{String(item.id).padStart(4, "0")}</span>
                  </td>

                  {/* Matter */}
                  <td className="ct-td">
                    <span className="ct-matter">{item.caseTitle || "Untitled Matter"}</span>
                  </td>

                  {/* Status */}
                  <td className="ct-td">
                    <div
                      className="ct-badge"
                      style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                    >
                      <div className="ct-badge-dot" style={{ background: sc.color }} />
                      {sc.label}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="ct-td">
                    <span className="ct-date">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="ct-td">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ct-action-trigger">
                          <MoreHorizontal size={13} color="#9a9485" />
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="ct-dropdown">
                        <DropdownMenuItem
                          className="ct-dd-item"
                          onClick={() => onView(item.id)}
                        >
                          <Eye size={13} className="ct-dd-item-icon" />
                          View Matter
                        </DropdownMenuItem>

                        {role === "admin" && (
                          <>
                            <div className="ct-dd-sep" />
                            <DropdownMenuItem
                              className="ct-dd-item"
                              onClick={() => onAssignClick(item)}
                            >
                              <UserPlus size={13} className="ct-dd-item-icon" />
                              Assign Counsel
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="ct-dd-item ct-dd-danger"
                              onClick={() => onArchiveClick(item)}
                            >
                              <Trash2 size={13} className="ct-dd-item-icon" />
                              Archive Matter
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </>
  );
}
