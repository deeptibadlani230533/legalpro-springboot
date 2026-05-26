import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, UploadCloud, Download, File, Loader2, Trash2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

/* ── File icon helper ── */
function getFileIcon(fileType, fileName) {
  const ext = fileName?.split(".").pop().toLowerCase();
  if (fileType?.includes("pdf") || ext === "pdf")
    return <FileText size={14} style={{ color: "#c0392b" }} />;
  if (ext === "doc" || ext === "docx")
    return <FileText size={14} style={{ color: "#2859a0" }} />;
  if (["jpg", "jpeg", "png"].includes(ext))
    return <File size={14} style={{ color: "#4a7c59" }} />;
  return <File size={14} style={{ color: "#9a9485" }} />;
}

export default function DocumentManager({ caseId, role }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => { fetchDocuments(); }, [caseId]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/case/${caseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.success) setDocuments(result.data);
    } catch { toast.error("Could not load documents."); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("caseId", caseId);
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (result.success) { toast.success("Document uploaded successfully"); fetchDocuments(); }
      else toast.error(result.message || "Upload failed");
    } catch { toast.error("Upload failed."); }
    finally { setUploading(false); }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/${docId}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error("Download failed."); }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/${selectedDoc.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      toast.success("Document deleted successfully");
      setConfirmDelete(false); setSelectedDoc(null); fetchDocuments();
    } catch { toast.error("Delete failed."); }
  };

  const openSummaryPage = (doc) => {
    navigate(`/documents/${doc.id}/summary`, { state: { document: doc } });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500&family=Inter:wght@300;400;500;600&display=swap');

        .dm-card {
          background: #fff;
          border: 1px solid #e5e0d8;
          border-radius: 18px;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .dm-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; justify-content: space-between;
          background: #faf9f6;
        }

        .dm-header-left {
          display: flex; align-items: center; gap: 8px;
        }

        .dm-header-icon {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(196,161,88,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .dm-header-title {
          font-size: 12px; font-weight: 600; color: #1a1a1a;
          letter-spacing: 0.02em;
        }

        .dm-upload-label {
          cursor: pointer;
          flex-shrink: 0;
        }

        .dm-upload-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600; color: #1c2b3a;
          background: #fff; border: 1.5px solid #e5e0d8;
          border-radius: 8px; padding: 6px 12px;
          transition: border-color 0.15s, background 0.15s;
          letter-spacing: 0.06em; text-transform: uppercase;
          white-space: nowrap;
        }

        .dm-upload-btn:hover { border-color: #c4a158; background: #fdf9f2; }

        /* List */
        .dm-list-wrap {
          max-height: 280px;
          overflow-y: auto;
          padding: 10px;
        }

        .dm-list-wrap::-webkit-scrollbar { width: 4px; }
        .dm-list-wrap::-webkit-scrollbar-track { background: transparent; }
        .dm-list-wrap::-webkit-scrollbar-thumb { background: #e5e0d8; border-radius: 4px; }

        .dm-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 36px 0; text-align: center;
        }

        .dm-empty-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: #f4f2ee;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
        }

        .dm-empty-text {
          font-size: 12px; font-weight: 300; color: #b8b2a8;
        }

        .dm-loading {
          display: flex; flex-direction: column; gap: 10px;
          padding: 14px 6px;
        }

        .dm-skeleton {
          display: flex; align-items: center; gap: 10px;
        }

        .dm-skeleton-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: #ede9e2;
          animation: dm-shimmer 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        .dm-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; }

        .dm-skeleton-line {
          height: 9px; border-radius: 4px; background: #ede9e2;
          animation: dm-shimmer 1.4s ease-in-out infinite;
        }

        @keyframes dm-shimmer {
          0%, 100% { opacity: 1; } 50% { opacity: 0.45; }
        }

        .dm-doc-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 10px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.12s;
          border: 1px solid transparent;
        }

        .dm-doc-row:hover {
          background: #faf9f6;
          border-color: #ede9e2;
        }

        .dm-doc-left { display: flex; align-items: center; gap: 10px; min-width: 0; }

        .dm-doc-icon-box {
          width: 34px; height: 34px; border-radius: 8px;
          background: #f4f2ee;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .dm-doc-info { min-width: 0; flex: 1; }

        .dm-doc-name {
          font-size: 12px; font-weight: 600; color: #1a1a1a;
          overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
          margin-bottom: 2px;
        }

        .dm-doc-meta {
          font-size: 10px; font-weight: 400; color: #b8b2a8;
          letter-spacing: 0.04em;
        }

        .dm-doc-download {
          color: #c8c2b8; transition: color 0.12s;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; padding: 4px;
          border-radius: 6px; flex-shrink: 0; margin-left: 6px;
        }

        .dm-doc-download:hover { color: #c4a158; }

        /* ── Modal filename display ── */
        .dm-modal-filename {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 500;
          color: #1a1a1a;
          line-height: 1.4;
          /* Allow wrapping for long names */
          word-break: break-all;
          overflow-wrap: anywhere;
          margin-top: 2px;
        }

        .dm-modal-filename-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f4f2ee;
          border: 1px solid #e5e0d8;
          border-radius: 8px;
          padding: 6px 10px;
          margin-top: 8px;
          max-width: 100%;
        }

        .dm-modal-filename-chip-text {
          font-size: 11px;
          font-weight: 500;
          color: #3a3530;
          word-break: break-all;
          overflow-wrap: anywhere;
          line-height: 1.4;
        }

        /* Dialog */
        .dm-modal-meta-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0ece4;
          gap: 12px;
        }

        .dm-modal-meta-label {
          font-size: 11px; font-weight: 500; color: #9a9485;
          letter-spacing: 0.06em; text-transform: uppercase;
          flex-shrink: 0;
        }

        .dm-modal-meta-value {
          font-size: 12px; font-weight: 500; color: #1a1a1a;
          text-align: right;
          word-break: break-all;
        }

        .dm-modal-btn {
          width: 100%; height: 44px;
          border-radius: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s, border-color 0.15s;
          border: none;
        }

        .dm-modal-btn-primary {
          background: #1c2b3a; color: #f0ede4;
        }
        .dm-modal-btn-primary:hover { background: #243547; }

        .dm-modal-btn-outline {
          background: #fff; color: #1c2b3a;
          border: 1.5px solid #e5e0d8 !important;
        }
        .dm-modal-btn-outline:hover { background: #f4f2ee; border-color: #c4a158 !important; }

        .dm-modal-btn-danger {
          background: #fff; color: #c0392b;
          border: 1.5px solid #f5c6c2 !important;
        }
        .dm-modal-btn-danger:hover { background: #fdf4f3; }

        .dm-modal-btn-confirm-danger {
          background: #c0392b; color: #fff;
        }
        .dm-modal-btn-confirm-danger:hover { background: #a93226; }

        .dm-confirm-text {
          font-size: 13px; font-weight: 300; color: #6b6355;
          line-height: 1.6; margin-bottom: 16px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dm-card">
        {/* Header */}
        <div className="dm-header">
          <div className="dm-header-left">
            <div className="dm-header-icon">
              <FileText size={13} color="#c4a158" />
            </div>
            <span className="dm-header-title">Case Documents</span>
          </div>

          <label className="dm-upload-label">
            <input type="file" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
            <div className="dm-upload-btn">
              {uploading
                ? <><Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Uploading…</>
                : <><UploadCloud size={12} /> Upload</>}
            </div>
          </label>
        </div>

        {/* List */}
        <div className="dm-list-wrap">
          {loading ? (
            <div className="dm-loading">
              {[1, 2, 3].map((i) => (
                <div className="dm-skeleton" key={i}>
                  <div className="dm-skeleton-icon" />
                  <div className="dm-skeleton-lines">
                    <div className="dm-skeleton-line" style={{ width: "65%" }} />
                    <div className="dm-skeleton-line" style={{ width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="dm-empty">
              <div className="dm-empty-icon">
                <File size={18} color="#c8c2b8" />
              </div>
              <p className="dm-empty-text">No documents attached yet.</p>
            </div>
          ) : (
            <div>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="dm-doc-row"
                  onClick={() => { setSelectedDoc(doc); setConfirmDelete(false); }}
                >
                  <div className="dm-doc-left">
                    <div className="dm-doc-icon-box">
                      {getFileIcon(doc.fileType, doc.originalName)}
                    </div>
                    <div className="dm-doc-info">
                      <div className="dm-doc-name">{doc.originalName}</div>
                      <div className="dm-doc-meta">
                        v{doc.version || 1} · {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    className="dm-doc-download"
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc.id, doc.originalName); }}
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      <Dialog
        open={!!selectedDoc}
        onOpenChange={() => { setSelectedDoc(null); setConfirmDelete(false); }}
      >
        {selectedDoc && (
          <DialogContent
            style={{
              fontFamily: "'Inter', sans-serif",
              maxWidth: 420,
              width: "calc(100vw - 32px)",
              borderRadius: 18,
              border: "1px solid #e5e0d8",
              overflow: "hidden",
            }}
          >
            <DialogHeader>
              {/* Eyebrow label */}
              <div style={{
                fontSize: 10, fontWeight: 600, color: "#c4a158",
                letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8,
              }}>
                {confirmDelete ? "Confirm Action" : "Document Details"}
              </div>

              {confirmDelete ? (
                /* Delete confirm: just show short heading */
                <DialogTitle style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 500, color: "#1a1a1a",
                }}>
                  Delete Document?
                </DialogTitle>
              ) : (
                /* Normal: file icon chip + wrappable name */
                <div>
                  {/* File type chip with icon */}
                  <div className="dm-modal-filename-chip">
                    <div style={{ flexShrink: 0 }}>
                      {getFileIcon(selectedDoc.fileType, selectedDoc.originalName)}
                    </div>
                    <span className="dm-modal-filename-chip-text">
                      {selectedDoc.originalName}
                    </span>
                  </div>
                </div>
              )}
            </DialogHeader>

            {!confirmDelete ? (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <div className="dm-modal-meta-row">
                  <span className="dm-modal-meta-label">Version</span>
                  <span className="dm-modal-meta-value">v{selectedDoc.version || 1}</span>
                </div>
                <div className="dm-modal-meta-row">
                  <span className="dm-modal-meta-label">Uploaded On</span>
                  <span className="dm-modal-meta-value">
                    {new Date(selectedDoc.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
                <div className="dm-modal-meta-row" style={{ borderBottom: "none" }}>
                  <span className="dm-modal-meta-label">File Type</span>
                  <span className="dm-modal-meta-value">{selectedDoc.fileType || "Unknown"}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <button
                    className="dm-modal-btn dm-modal-btn-primary"
                    onClick={() => handleDownload(selectedDoc.id, selectedDoc.originalName)}
                  >
                    <Download size={14} /> Download File
                  </button>

                  {(role === "admin" || role === "lawyer") && (
                    <button
                      className="dm-modal-btn dm-modal-btn-outline"
                      onClick={() => openSummaryPage(selectedDoc)}
                    >
                      <Sparkles size={14} /> Generate AI Summary
                    </button>
                  )}

                  {role === "admin" && (
                    <button
                      className="dm-modal-btn dm-modal-btn-danger"
                      style={{ border: "1.5px solid #f5c6c2" }}
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 size={14} /> Delete Document
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <p className="dm-confirm-text">
                  This will permanently remove{" "}
                  <strong
                    style={{
                      wordBreak: "break-all",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {selectedDoc.originalName}
                  </strong>{" "}
                  from the case file. This action cannot be undone.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    className="dm-modal-btn dm-modal-btn-confirm-danger"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} /> Confirm Delete
                  </button>
                  <button
                    className="dm-modal-btn dm-modal-btn-outline"
                    style={{ border: "1.5px solid #e5e0d8" }}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}