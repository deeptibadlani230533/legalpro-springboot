import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard, Briefcase, BarChart3, Users, Settings, FileText, ClipboardList,Calendar,Receipt } from "lucide-react";

// Auto-generate breadcrumbs from the current path
const routeMeta = {
  "/dashboard":      { label: "Dashboard",       icon: LayoutDashboard },
  "/lawyer/dashboard":{ label: "Dashboard",       icon: LayoutDashboard },
  "/cases":          { label: "Case Directory",   icon: Briefcase       },
  "/reports":        { label: "Reports",          icon: BarChart3       },
  "/team":           { label: "Personnel",        icon: Users           },
  "/settings":       { label: "Settings",         icon: Settings        },
  "/intake":         { label: "New Intake",       icon: ClipboardList   },

  "/calendar":         { label: "Calendar",        icon: Calendar        },
  "/billing":         { label: "Billing",         icon: Receipt         },
};

function getBreadcrumbs(pathname) {
  const crumbs = [{ label: "Home", path: null }];

  // Match known routes or pattern-match /cases/:id
  if (routeMeta[pathname]) {
    crumbs.push({ label: routeMeta[pathname].label, path: pathname });
  } else if (pathname.startsWith("/cases/") && pathname !== "/cases") {
    crumbs.push({ label: "Case Directory", path: "/cases" });
    crumbs.push({ label: "Case Detail",    path: null });
  } else if (pathname.startsWith("/documents/")) {
    crumbs.push({ label: "Case Directory", path: "/cases" });
    crumbs.push({ label: "Document Summary", path: null });
  }

  return crumbs;
}

export default function Header({ title, children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const pathname  = location.pathname;

  const meta   = routeMeta[pathname];
  const Icon   = meta?.icon || null;
  // Use explicit title prop if passed, otherwise derive from route
  const pageTitle = title || meta?.label || "LegalPro";

  const crumbs = getBreadcrumbs(pathname);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500&family=Inter:wght@300;400;500;600&display=swap');

        .hdr-root {
          background: #fff;
          border-bottom: 1px solid #e5e0d8;
          padding: 0 32px;
          position: sticky; top: 64px;   /* sits below the Navbar (64px) */
          z-index: 40;
          font-family: 'Inter', sans-serif;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; min-height: 52px;
        }

        .hdr-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* Breadcrumb trail */
        .hdr-crumbs {
          display: flex; align-items: center; gap: 4px;
        }

        .hdr-crumb {
          font-size: 12px; font-weight: 400; color: #b8b2a8;
          background: none; border: none; padding: 0; cursor: pointer;
          transition: color 0.15s;
        }
        .hdr-crumb:hover { color: #c4a158; }
        .hdr-crumb.current { color: #1a1a1a; font-weight: 500; cursor: default; }

        .hdr-crumb-sep { color: #d0cbc2; flex-shrink: 0; }

        /* Divider between breadcrumbs and page title */
        .hdr-sep {
          width: 1px; height: 18px; background: #e5e0d8; flex-shrink: 0;
        }

        /* Page title */
        .hdr-page {
          display: flex; align-items: center; gap: 8px;
        }

        .hdr-page-icon {
          width: 28px; height: 28px; border-radius: 7px;
          background: rgba(196,161,88,0.10);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .hdr-page-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 500; color: #1a1a1a;
          letter-spacing: -0.01em;
        }

        /* Right slot */
        .hdr-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
      `}</style>

      <header className="hdr-root">
        <div className="hdr-left">
          {/* Breadcrumbs */}
          <div className="hdr-crumbs">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && (
                  <ChevronRight size={11} className="hdr-crumb-sep" />
                )}
                <button
                  className={`hdr-crumb${i === crumbs.length - 1 ? " current" : ""}`}
                  onClick={() => c.path && navigate(c.path)}
                  style={{ pointerEvents: c.path ? "auto" : "none" }}
                >
                  {c.label}
                </button>
              </span>
            ))}
          </div>

          {/* Divider + Page Title */}
          <div className="hdr-sep" />
          <div className="hdr-page">
            {Icon && (
              <div className="hdr-page-icon">
                <Icon size={14} color="#c4a158" />
              </div>
            )}
            <span className="hdr-page-title">{pageTitle}</span>
          </div>
        </div>

        {/* Right slot — passed-in buttons or actions */}
        {children && (
          <div className="hdr-right">{children}</div>
        )}
      </header>
    </>
  );
}
