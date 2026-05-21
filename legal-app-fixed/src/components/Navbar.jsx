import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  UserCircle, LogOut, Briefcase, LayoutDashboard,
  PlusCircle, Settings, Users, ChevronDown, Calendar,
  MessageSquare, Receipt, ShieldCheck
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "../components/NotificationBell";

export default function Navbar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const role      = localStorage.getItem("role") || "user";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimer = useRef(null);

  const dashboardPath = role === "lawyer" ? "/lawyer/dashboard" : "/dashboard";

  const roleConfig = {
    admin:  { label: "Admin",  bg: "#fdf4f3", color: "#c0392b", border: "#f5c6c2" },
    lawyer: { label: "Lawyer", bg: "#eef4fd", color: "#2859a0", border: "#bdd3f5" },
    client: { label: "Client", bg: "#edfaf2", color: "#2d7a4f", border: "#a8dfc0" },
    user:   { label: "User",   bg: "#f4f2ee", color: "#6b6355", border: "#e5e0d8" },
  };

  const rc = roleConfig[role] || roleConfig.user;

  const openMenu  = () => { clearTimeout(closeTimer.current); setIsMenuOpen(true); };
  const closeMenu = () => { closeTimer.current = setTimeout(() => setIsMenuOpen(false), 220); };

  const navLinks = [
    { name: "Dashboard",      path: dashboardPath,  icon: LayoutDashboard },
    { name: "Case Directory", path: "/cases",        icon: Briefcase       },
    { name: "Calendar",       path: "/calendar",     icon: Calendar        },
    { name: "Billings",       path: "/billing",     icon: Receipt         },
    { name: "AI Assistant",   path: "/chat",         icon: MessageSquare   },
    ...(role === "admin" ? [{ name: "Audit Log", path: "/audit", icon: ShieldCheck }] : []),
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');

        .nav-root {
          height: 64px;
          background: #fff;
          border-bottom: 1px solid #e5e0d8;
          position: sticky; top: 0;
          z-index: 100;
          font-family: 'Inter', sans-serif;
        }

        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 32px; height: 100%;
          display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
        }

        .nav-left { display: flex; align-items: center; gap: 32px; }

        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }

        .nav-brand-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #c4a158, #e2c07a);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }

        .nav-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 18px; font-weight: 500;
          color: #1a1a1a; letter-spacing: 0.02em;
        }
        .nav-brand-name b { color: #c4a158; font-weight: 600; }

        .nav-links { display: flex; align-items: center; gap: 2px; }

        .nav-link {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 13px; border-radius: 9px;
          font-size: 13px; font-weight: 500; color: #9a9485;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          position: relative; white-space: nowrap;
        }
        .nav-link:hover       { background: #f4f2ee; color: #1a1a1a; }
        .nav-link.active      { background: rgba(196,161,88,0.08); color: #1a1a1a; }
        .nav-link-bar {
          position: absolute; bottom: -17px; left: 13px; right: 13px;
          height: 2px; background: #c4a158; border-radius: 999px;
        }

        .nav-right { display: flex; align-items: center; gap: 10px; }

        .nav-new-btn {
          display: flex; align-items: center; gap: 7px;
          height: 36px; background: #1c2b3a; color: #f0ede4;
          border: none; border-radius: 9px; padding: 0 16px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer; transition: background 0.15s, transform 0.12s; white-space: nowrap;
        }
        .nav-new-btn:hover  { background: #243547; }
        .nav-new-btn:active { transform: scale(0.98); }

        .nav-divider { width: 1px; height: 22px; background: #e5e0d8; flex-shrink: 0; }

        .nav-profile-trigger {
          display: flex; align-items: center; gap: 8px;
          padding: 5px 10px 5px 5px;
          border: 1.5px solid #e5e0d8; border-radius: 10px;
          background: #fff; cursor: pointer; outline: none;
          transition: border-color 0.15s, background 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .nav-profile-trigger:hover { border-color: #c4a158; background: #fdf9f2; }

        .nav-avatar {
          width: 28px; height: 28px; border-radius: 7px; background: #1c2b3a;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .nav-role-badge {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 5px; border: 1px solid;
        }

        .nav-dropdown {
          width: 240px !important;
          background: #fff !important;
          border: 1px solid #e5e0d8 !important;
          border-radius: 14px !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.11) !important;
          padding: 6px !important;
          margin-top: 8px !important;
          font-family: 'Inter', sans-serif;
          z-index: 200 !important;
        }

        .nav-dd-header {
          padding: 12px 12px 10px;
          border-bottom: 1px solid #f0ece4; margin-bottom: 4px;
        }

        .nav-dd-header-top {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 4px;
        }

        .nav-dd-title  { font-size: 13px; font-weight: 600; color: #1a1a1a; }
        .nav-dd-sub    { font-size: 11px; font-weight: 300; color: #9a9485; font-style: italic; }

        .nav-menu-item {
          display: flex !important; align-items: center !important; gap: 10px !important;
          padding: 9px 12px !important; border-radius: 9px !important;
          font-size: 13px !important; font-weight: 400 !important;
          color: #5c5649 !important; cursor: pointer !important;
          transition: background 0.12s, color 0.12s !important; outline: none !important;
        }
        .nav-menu-item:hover { background: #f4f2ee !important; color: #1a1a1a !important; }

        .nav-menu-icon { color: #b8b2a8 !important; flex-shrink: 0; }

        .nav-menu-sep { background: #f0ece4 !important; margin: 4px 0 !important; }

        .nav-menu-danger { color: #c0392b !important; }
        .nav-menu-danger:hover { background: #fdf4f3 !important; color: #c0392b !important; }
        .nav-menu-danger .nav-menu-icon { color: #c0392b !important; }

        @media (max-width: 700px) { .nav-links { display: none; } }
      `}</style>

      <nav className="nav-root">
        <div className="nav-inner">

          {/* Left */}
          <div className="nav-left">
            <Link to={dashboardPath} className="nav-brand">
              <div className="nav-brand-icon">
                <svg viewBox="0 0 76 65" fill="#1c2b3a" width="14" height="14">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
              </div>
              <span className="nav-brand-name">Legal<b>Pro</b></span>
            </Link>

            <div className="nav-links">
              {navLinks.map(({ name, path, icon: Icon }) => {
                const isActive = location.pathname === path ||
                  (path !== dashboardPath && location.pathname.startsWith(path));
                return (
                  <Link key={path} to={path} className={`nav-link${isActive ? " active" : ""}`}>
                    <Icon size={14} />
                    {name}
                    {isActive && <span className="nav-link-bar" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right */}
          <div className="nav-right">
            {role === "client" && (
              <button className="nav-new-btn" onClick={() => navigate("/intake")}>
                <PlusCircle size={13} /> New Case
              </button>
            )}

            <div style={{ position: "relative", zIndex: 200 }}>
              <NotificationBell />
            </div>

            <div className="nav-divider" />

            <div
              style={{ position: "relative" }}
              onMouseEnter={openMenu}
              onMouseLeave={closeMenu}
            >
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="nav-profile-trigger"
                    tabIndex={-1}
                    onMouseEnter={openMenu}
                    onMouseLeave={closeMenu}
                  >
                    <div className="nav-avatar">
                      <UserCircle size={16} color="#f0ede4" />
                    </div>
                    <span className="nav-role-badge" style={{ background: rc.bg, color: rc.color, borderColor: rc.border }}>
                      {rc.label}
                    </span>
                    <ChevronDown size={13} style={{ color: "#b8b2a8" }} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="nav-dropdown"
                  onMouseEnter={openMenu}
                  onMouseLeave={closeMenu}
                  style={{ zIndex: 200 }}
                >
                  <div className="nav-dd-header">
                    <div className="nav-dd-header-top">
                      <span className="nav-dd-title">Account Profile</span>
                      <span className="nav-role-badge" style={{ background: rc.bg, color: rc.color, borderColor: rc.border }}>
                        {rc.label}
                      </span>
                    </div>
                    <div className="nav-dd-sub">Connected to LegalPro Secure</div>
                  </div>

                  <DropdownMenuItem className="nav-menu-item" onClick={() => { setIsMenuOpen(false); navigate("/settings"); }}>
                    <Settings size={14} className="nav-menu-icon" /> Account Settings
                  </DropdownMenuItem>

                  <DropdownMenuItem className="nav-menu-item" onClick={() => { setIsMenuOpen(false); navigate("/team"); }}>
                    <Users size={14} className="nav-menu-icon" /> Team Directory
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="nav-menu-sep" />

                  <DropdownMenuItem
                    className="nav-menu-item nav-menu-danger"
                    onClick={() => { localStorage.clear(); navigate("/login"); }}
                  >
                    <LogOut size={14} className="nav-menu-icon" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
