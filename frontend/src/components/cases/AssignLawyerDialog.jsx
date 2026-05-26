import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCheck, Users } from "lucide-react";

export default function AssignLawyerDialog({
  open,
  onOpenChange,
  lawyers,
  selectedLawyer,
  setSelectedLawyer,
  onAssign,
  isAssigning,
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500&family=Inter:wght@300;400;500;600&display=swap');

        /* Overlay */
        [data-radix-dialog-overlay] {
          background: rgba(28, 43, 58, 0.45) !important;
          backdrop-filter: blur(3px) !important;
        }

        /* Dialog panel */
        .ald-content {
          font-family: 'Inter', sans-serif !important;
          background: #faf9f6 !important;
          border: 1px solid #e5e0d8 !important;
          border-radius: 20px !important;
          padding: 0 !important;
          max-width: 420px !important;
          width: 100% !important;
          box-shadow: 0 24px 60px rgba(0,0,0,0.14) !important;
          overflow: hidden !important;
        }

        /* Top accent bar */
        .ald-top-bar {
          height: 3px;
          background: linear-gradient(90deg, #c4a158, #e2c07a, #c4a158);
        }

        /* Header */
        .ald-header {
          padding: 24px 26px 18px;
          border-bottom: 1px solid #f0ece4;
          display: flex; align-items: flex-start; gap: 13px;
        }

        .ald-header-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: #1c2b3a;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .ald-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px;
        }

        .ald-title {
          font-family: 'Playfair Display', serif !important;
          font-size: 20px !important; font-weight: 500 !important;
          color: #1a1a1a !important; margin: 0 0 2px !important;
          letter-spacing: -0.01em !important;
        }

        .ald-desc {
          font-size: 12px !important; font-weight: 300 !important;
          color: #9a9485 !important; margin: 0 !important;
          line-height: 1.5 !important;
        }

        /* Body */
        .ald-body { padding: 22px 26px; }

        .ald-field-label {
          font-size: 11px; font-weight: 600; color: #5c5649;
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;
        }

        /* Select trigger */
        .ald-select-trigger {
          width: 100%; height: 50px !important;
          background: #fff !important; border: 1.5px solid #e5e0d8 !important;
          border-radius: 10px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 14px !important; font-weight: 400 !important;
          color: #1a1a1a !important;
          transition: border-color 0.18s, box-shadow 0.18s !important;
          padding: 0 14px !important;
          outline: none !important;
        }

        .ald-select-trigger:focus,
        .ald-select-trigger[data-state="open"] {
          border-color: #c4a158 !important;
          box-shadow: 0 0 0 3px rgba(196,161,88,0.12) !important;
        }

        /* Select content */
        .ald-select-content {
          background: #fff !important;
          border: 1px solid #e5e0d8 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 32px rgba(0,0,0,0.09) !important;
          padding: 6px !important;
          font-family: 'Inter', sans-serif !important;
        }

        .ald-select-item {
          display: flex !important; align-items: center !important; gap: 10px !important;
          padding: 10px 12px !important; border-radius: 8px !important;
          font-size: 13px !important; font-weight: 400 !important;
          color: #1a1a1a !important; cursor: pointer !important;
          transition: background 0.12s !important;
        }

        .ald-select-item:hover,
        .ald-select-item[data-highlighted] {
          background: #f4f2ee !important; outline: none !important;
        }

        .ald-select-item[data-state="checked"] {
          background: rgba(196,161,88,0.08) !important; color: #1a1a1a !important;
        }

        .ald-empty {
          padding: 20px; text-align: center;
          font-size: 13px; font-weight: 300; color: #b8b2a8;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }

        .ald-empty-icon {
          width: 36px; height: 36px; border-radius: 50%; background: #f4f2ee;
          display: flex; align-items: center; justify-content: center;
        }

        /* Footer */
        .ald-footer {
          padding: 16px 26px 22px;
          display: flex; justify-content: flex-end; gap: 10px;
          border-top: 1px solid #f0ece4;
        }

        .ald-cancel-btn {
          height: 44px; padding: 0 20px; border-radius: 10px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          background: #fff; color: #9a9485;
          border: 1.5px solid #e5e0d8; cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .ald-cancel-btn:hover { border-color: #c4a158; color: #1a1a1a; }

        .ald-confirm-btn {
          height: 44px; padding: 0 24px; border-radius: 10px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          background: #1c2b3a; color: #f0ede4;
          border: none; cursor: pointer;
          transition: background 0.15s;
          display: flex; align-items: center; gap: 7px;
        }
        .ald-confirm-btn:hover:not(:disabled) { background: #243547; }
        .ald-confirm-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="ald-content">
          {/* Top bar */}
          <div className="ald-top-bar" />

          {/* Header */}
          <div className="ald-header">
            <div className="ald-header-icon">
              <UserCheck size={18} color="#c4a158" />
            </div>
            <div>
              <div className="ald-eyebrow">Case Assignment</div>
              <DialogTitle className="ald-title">Assign Counsel</DialogTitle>
              <DialogDescription className="ald-desc">
                Select a lawyer to assign to this case.
              </DialogDescription>
            </div>
          </div>

          {/* Body */}
          <div className="ald-body">
            <div className="ald-field-label">Select Lawyer</div>
            <Select value={selectedLawyer} onValueChange={setSelectedLawyer}>
              <SelectTrigger className="ald-select-trigger">
                <SelectValue placeholder="Choose a lawyer…" />
              </SelectTrigger>
              <SelectContent className="ald-select-content">
                {lawyers.length > 0 ? (
                  lawyers.map((lawyer) => (
                    <SelectItem
                      key={lawyer.id}
                      value={String(lawyer.id)}
                      className="ald-select-item"
                    >
                      {lawyer.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="ald-empty">
                    <div className="ald-empty-icon">
                      <Users size={16} color="#c8c2b8" />
                    </div>
                    No lawyers available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Footer */}
          <DialogFooter className="ald-footer">
            <button className="ald-cancel-btn" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button className="ald-confirm-btn" onClick={onAssign} disabled={isAssigning}>
              {isAssigning
                ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Assigning…</>
                : <><UserCheck size={13} /> Confirm</>
              }
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
