import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Plus, Calendar,
  Clock, Briefcase, X, Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Header from "../components/Header";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EVENT_TYPES = [
  { value: "hearing",  label: "Court Hearing",     color: "#c0392b", bg: "#fdf4f3" },
  { value: "deadline", label: "Filing Deadline",   color: "#b8902a", bg: "#fdf8ec" },
  { value: "meeting",  label: "Client Meeting",    color: "#2859a0", bg: "#eef4fd" },
  { value: "reminder", label: "General Reminder",  color: "#4a7c59", bg: "#edfaf2" },
];

function getTypeConfig(type) {
  return EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[3];
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  const today = new Date();
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDay,  setSelectedDay]  = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [saving,       setSaving]       = useState(false);

  const [form, setForm] = useState({
    title: "", caseId: "", type: "hearing", date: "", time: "", notes: "",
  });

  // Fetch events
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/calendar?month=${currentMonth + 1}&year=${currentYear}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok) setEvents(Array.isArray(data) ? data : []);
      } catch { /* silently fail — use empty state */ }
      finally { setLoading(false); }
    };
    fetch_();
  }, [currentMonth, currentYear]);

  // Calendar grid
  const firstDay   = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter((e) => {
      const eventDate = Array.isArray(e.date)
        ? `${e.date[0]}-${String(e.date[1]).padStart(2,"0")}-${String(e.date[2]).padStart(2,"0")}`
        : e.date?.split("T")[0];
      return eventDate === dateStr;
    });
  };

  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear  === today.getFullYear();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const openModal = (day) => {
    setSelectedDay(day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    setForm({ title:"", caseId:"", type:"hearing", date: dateStr, time:"", notes:"" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Please enter an event title"); return; }
    if (!form.date)          { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");

      const normalizedEvent = {
        ...data,
        date: Array.isArray(data.date)
          ? `${data.date[0]}-${String(data.date[1]).padStart(2,"0")}-${String(data.date[2]).padStart(2,"0")}`
          : data.date?.split("T")[0] ?? form.date,
      };
      setEvents((prev) => [...prev, normalizedEvent]);
      toast.success("Event added to calendar");
      if (form.type === "hearing" || form.type === "deadline") {
        toast.success("📱 WhatsApp reminder sent");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event removed");
  };

  // Upcoming events (next 30 days)
  const upcoming = events
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      const diff = (d - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .cal-root {
          min-height: 100vh; display: flex; flex-direction: column;
          background: #f4f2ee; font-family: 'Inter', sans-serif;
        }

        .cal-main {
          flex: 1; width: 100%; max-width: 1200px;
          margin: 0 auto; padding: 36px 32px 60px;
          display: flex; flex-direction: column; gap: 28px;
        }

        /* Page header */
        .cal-page-header {
          display: flex; justify-content: space-between;
          align-items: flex-end; gap: 20px; flex-wrap: wrap;
          padding-bottom: 24px; border-bottom: 1px solid #e5e0d8;
        }

        .cal-page-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }

        .cal-page-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3vw, 36px); font-weight: 400;
          color: #1a1a1a; margin: 0 0 6px; letter-spacing: -0.01em;
        }
        .cal-page-title em { font-style: italic; color: #c4a158; }
        .cal-page-sub { font-size: 13px; font-weight: 300; color: #9a9485; }

        .cal-add-btn {
          display: flex; align-items: center; gap: 7px;
          height: 42px; background: #1c2b3a; color: #f0ede4;
          border: none; border-radius: 10px; padding: 0 20px;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: background 0.15s; flex-shrink: 0;
        }
        .cal-add-btn:hover { background: #243547; }

        /* Body grid */
        .cal-body {
          display: grid; grid-template-columns: 1fr 300px;
          gap: 24px; align-items: start;
        }
        @media (max-width: 900px) { .cal-body { grid-template-columns: 1fr; } }

        /* Calendar card */
        .cal-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 18px; overflow: hidden;
        }

        .cal-nav {
          padding: 18px 22px; border-bottom: 1px solid #f0ece4;
          display: flex; align-items: center; justify-content: space-between;
        }

        .cal-month-label {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500; color: #1a1a1a;
        }

        .cal-nav-btn {
          width: 34px; height: 34px; border-radius: 9px;
          background: #faf9f6; border: 1.5px solid #e5e0d8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: border-color 0.15s, background 0.15s;
        }
        .cal-nav-btn:hover { border-color: #c4a158; background: #fdf9f2; }

        .cal-grid { padding: 16px; }

        .cal-days-header {
          display: grid; grid-template-columns: repeat(7,1fr);
          margin-bottom: 8px;
        }

        .cal-day-label {
          text-align: center; font-size: 10px; font-weight: 600;
          color: #b8b2a8; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 6px 0;
        }

        .cal-cells {
          display: grid; grid-template-columns: repeat(7,1fr); gap: 3px;
        }

        .cal-cell {
          min-height: 72px; border-radius: 10px; padding: 6px;
          cursor: pointer; transition: background 0.12s;
          border: 1.5px solid transparent;
          position: relative;
        }

        .cal-cell:hover { background: #faf9f6; border-color: #e5e0d8; }
        .cal-cell.today { background: rgba(196,161,88,0.07); border-color: #c4a158 !important; }
        .cal-cell.empty { cursor: default; }
        .cal-cell.empty:hover { background: transparent; border-color: transparent; }

        .cal-cell-num {
          font-size: 13px; font-weight: 500; color: #1a1a1a;
          line-height: 1; margin-bottom: 4px;
        }
        .cal-cell.today .cal-cell-num {
          color: #c4a158; font-weight: 700;
        }

        .cal-event-dot {
          display: flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 500; margin-bottom: 2px;
          overflow: hidden;
        }

        .cal-event-dot-circle {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }

        .cal-event-label {
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          color: #1a1a1a; font-size: 9px;
        }

        .cal-more {
          font-size: 9px; color: #9a9485; font-weight: 500;
        }

        /* Right sidebar */
        .cal-right { display: flex; flex-direction: column; gap: 16px; }

        .cal-upcoming-card {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 16px; overflow: hidden;
        }

        .cal-upcoming-head {
          padding: 16px 20px 13px; border-bottom: 1px solid #f0ece4;
        }

        .cal-upcoming-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 4px;
        }

        .cal-upcoming-title {
          font-family: 'Playfair Display', serif;
          font-size: 16px; font-weight: 500; color: #1a1a1a;
        }

        .cal-upcoming-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 10px; }

        .cal-event-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 11px 13px; border-radius: 11px; border: 1px solid #ede9e2;
          background: #faf9f6; position: relative;
        }

        .cal-event-type-bar {
          width: 3px; height: 100%; border-radius: 999px;
          position: absolute; left: 0; top: 0; bottom: 0; border-radius: 11px 0 0 11px;
        }

        .cal-event-content { padding-left: 6px; flex: 1; min-width: 0; }

        .cal-event-title {
          font-size: 12px; font-weight: 600; color: #1a1a1a;
          margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .cal-event-meta {
          font-size: 10px; font-weight: 400; color: #9a9485;
          display: flex; align-items: center; gap: 6px;
        }

        .cal-event-badge {
          font-size: 9px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
        }

        .cal-event-delete {
          background: none; border: none; cursor: pointer; padding: 2px;
          color: #c8c2b8; transition: color 0.12s; flex-shrink: 0;
        }
        .cal-event-delete:hover { color: #c0392b; }

        .cal-empty-state {
          text-align: center; padding: 28px 16px;
        }
        .cal-empty-icon {
          width: 44px; height: 44px; border-radius: 50%; background: #f4f2ee;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;
        }
        .cal-empty-text { font-size: 12px; font-weight: 300; color: #b8b2a8; }

        /* Legend */
        .cal-legend {
          background: #fff; border: 1px solid #e5e0d8; border-radius: 14px; padding: 16px 18px;
        }
        .cal-legend-title {
          font-size: 11px; font-weight: 600; color: #6b6355;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;
        }
        .cal-legend-items { display: flex; flex-direction: column; gap: 7px; }
        .cal-legend-item { display: flex; align-items: center; gap: 8px; }
        .cal-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cal-legend-label { font-size: 12px; font-weight: 400; color: #5c5649; }

        /* Modal overlay */
        .cal-overlay {
          position: fixed; inset: 0; background: rgba(28,43,58,0.45);
          backdrop-filter: blur(3px); z-index: 200;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }

        .cal-modal {
          background: #faf9f6; border: 1px solid #e5e0d8; border-radius: 20px;
          width: 100%; max-width: 460px; overflow: hidden;
          box-shadow: 0 24px 60px rgba(0,0,0,0.14);
        }

        .cal-modal-top-bar {
          height: 3px; background: linear-gradient(90deg,#c4a158,#e2c07a,#c4a158);
        }

        .cal-modal-head {
          padding: 22px 24px 16px; border-bottom: 1px solid #f0ece4;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        }

        .cal-modal-eyebrow {
          font-size: 10px; font-weight: 600; color: #c4a158;
          letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 5px;
        }

        .cal-modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px; font-weight: 500; color: #1a1a1a;
        }

        .cal-modal-close {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: #9a9485; transition: color 0.12s; flex-shrink: 0;
        }
        .cal-modal-close:hover { color: #1a1a1a; }

        .cal-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

        .cal-field { display: flex; flex-direction: column; gap: 6px; }

        .cal-field-label {
          font-size: 11px; font-weight: 600; color: #5c5649;
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        .cal-input {
          height: 46px; background: #fff; border: 1.5px solid #e5e0d8;
          border-radius: 10px; padding: 0 14px;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #1a1a1a;
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        .cal-input:focus {
          border-color: #c4a158; box-shadow: 0 0 0 3px rgba(196,161,88,0.12);
        }
        .cal-input::placeholder { color: #c8c2b8; }

        .cal-type-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }

        .cal-type-btn {
          padding: 9px 12px; border: 1.5px solid #e5e0d8;
          border-radius: 9px; cursor: pointer; background: #fff;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
          color: #6b6355; transition: all 0.12s; text-align: left;
          display: flex; align-items: center; gap: 7px;
        }
        .cal-type-btn:hover { border-color: #c4a158; background: #fdf9f2; }
        .cal-type-btn.selected { border-color: currentColor; font-weight: 600; }

        .cal-type-indicator {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        .cal-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .cal-modal-footer {
          padding: 14px 24px 20px; border-top: 1px solid #f0ece4;
          display: flex; justify-content: flex-end; gap: 10px;
        }

        .cal-btn-cancel {
          height: 42px; padding: 0 18px; border-radius: 9px;
          background: #fff; color: #9a9485; border: 1.5px solid #e5e0d8;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer;
          transition: border-color 0.15s;
        }
        .cal-btn-cancel:hover { border-color: #c4a158; color: #1a1a1a; }

        .cal-btn-save {
          height: 42px; padding: 0 22px; border-radius: 9px;
          background: #1c2b3a; color: #f0ede4; border: none;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          transition: background 0.15s; display: flex; align-items: center; gap: 7px;
        }
        .cal-btn-save:hover:not(:disabled) { background: #243547; }
        .cal-btn-save:disabled { opacity: 0.55; cursor: not-allowed; }

        .cal-footer {
          text-align: center; padding: 22px; font-size: 11px;
          color: #c0b9ae; letter-spacing: 0.06em; border-top: 1px solid #ede9e2;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cal-root">
        <Header />

        <main className="cal-main">

          {/* Page header */}
          <div className="cal-page-header">
            <div>
              <div className="cal-page-eyebrow"><Calendar size={11} /> Legal Calendar</div>
              <h1 className="cal-page-title">Court <em>Schedule</em></h1>
              <p className="cal-page-sub">Track hearings, deadlines, and meetings for all your cases.</p>
            </div>
            <button className="cal-add-btn" onClick={() => { setSelectedDay(today.getDate()); openModal(today.getDate()); }}>
              <Plus size={14} /> Add Event
            </button>
          </div>

          <div className="cal-body">

            {/* Calendar */}
            <div className="cal-card">
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={15} color="#6b6355" /></button>
                <span className="cal-month-label">{MONTHS[currentMonth]} {currentYear}</span>
                <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={15} color="#6b6355" /></button>
              </div>

              <div className="cal-grid">
                <div className="cal-days-header">
                  {DAYS.map((d) => <div key={d} className="cal-day-label">{d}</div>)}
                </div>

                <div className="cal-cells">
                  {cells.map((day, i) => {
                    const dayEvents = eventsForDay(day);
                    return (
                      <div
                        key={i}
                        className={`cal-cell${!day ? " empty" : ""}${isToday(day) ? " today" : ""}`}
                        onClick={() => day && openModal(day)}
                      >
                        {day && (
                          <>
                            <div className="cal-cell-num">{day}</div>
                            {dayEvents.slice(0, 2).map((ev, ei) => {
                              const tc = getTypeConfig(ev.type);
                              return (
                                <div key={ei} className="cal-event-dot">
                                  <div className="cal-event-dot-circle" style={{ background: tc.color }} />
                                  <span className="cal-event-label">{ev.title}</span>
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="cal-more">+{dayEvents.length - 2} more</div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="cal-right">

              {/* Upcoming events */}
              <div className="cal-upcoming-card">
                <div className="cal-upcoming-head">
                  <div className="cal-upcoming-eyebrow">Next 30 Days</div>
                  <div className="cal-upcoming-title">Upcoming Events</div>
                </div>
                <div className="cal-upcoming-body">
                  {upcoming.length === 0 ? (
                    <div className="cal-empty-state">
                      <div className="cal-empty-icon"><Calendar size={18} color="#c8c2b8" /></div>
                      <p className="cal-empty-text">No upcoming events. Click any date to add one.</p>
                    </div>
                  ) : (
                    upcoming.map((ev) => {
                      const tc = getTypeConfig(ev.type);
                      return (
                        <div className="cal-event-item" key={ev.id}>
                          <div className="cal-event-type-bar" style={{ background: tc.color }} />
                          <div className="cal-event-content">
                            <div className="cal-event-title">{ev.title}</div>
                            <div className="cal-event-meta">
                              <span>{new Date(ev.date).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</span>
                              {ev.time && <><span>·</span><span>{ev.time}</span></>}
                              <span
                                className="cal-event-badge"
                                style={{ background: tc.bg, color: tc.color }}
                              >
                                {tc.label}
                              </span>
                            </div>
                          </div>
                          <button className="cal-event-delete" onClick={() => deleteEvent(ev.id)}>
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="cal-legend">
                <div className="cal-legend-title">Event Types</div>
                <div className="cal-legend-items">
                  {EVENT_TYPES.map((t) => (
                    <div key={t.value} className="cal-legend-item">
                      <div className="cal-legend-dot" style={{ background: t.color }} />
                      <span className="cal-legend-label">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>

        <footer className="cal-footer">
          LegalPro Management Systems &copy; 2026 &nbsp;·&nbsp; AES-256 Encrypted
        </footer>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="cal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="cal-modal">
            <div className="cal-modal-top-bar" />
            <div className="cal-modal-head">
              <div>
                <div className="cal-modal-eyebrow">New Event</div>
                <div className="cal-modal-title">Add to Calendar</div>
              </div>
              <button className="cal-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cal-modal-body">
              <div className="cal-field">
                <label className="cal-field-label">Event Title</label>
                <input className="cal-input" placeholder="e.g. Hearing for Case #4821"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="cal-field">
                <label className="cal-field-label">Event Type</label>
                <div className="cal-type-grid">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      className={`cal-type-btn${form.type === t.value ? " selected" : ""}`}
                      style={form.type === t.value ? { color: t.color, borderColor: t.color, background: t.bg } : {}}
                      onClick={() => setForm({ ...form, type: t.value })}
                    >
                      <div className="cal-type-indicator" style={{ background: t.color }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cal-grid-2">
                <div className="cal-field">
                  <label className="cal-field-label">Date</label>
                  <input type="date" className="cal-input" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="cal-field">
                  <label className="cal-field-label">Time (optional)</label>
                  <input type="time" className="cal-input" value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>

              <div className="cal-field">
                <label className="cal-field-label">Case ID (optional)</label>
                <input className="cal-input" placeholder="e.g. 42"
                  value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} />
              </div>

              <div className="cal-field">
                <label className="cal-field-label">Notes (optional)</label>
                <input className="cal-input" placeholder="Additional details…"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="cal-modal-footer">
              <button className="cal-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="cal-btn-save" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader2 size={13} style={{ animation:"spin 0.8s linear infinite" }} /> Saving…</>
                  : <><Calendar size={13} /> Save Event</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
