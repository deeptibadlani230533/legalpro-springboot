import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import Cases from "./pages/Cases";
import Intake from "./pages/Intake";
import Login from "./pages/Login";
import CaseDetail from "./pages/CaseDetails";
import EditCase from "./pages/EditCase";
import Team from "./pages/Team";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import DocumentSummary from "./pages/DocumentSummary";
import { CommandMenu } from "./components/CommandMenu";
import CalendarPage from "./pages/CalendarPage";
import ChatPage from "./pages/ChatPage";
import Billing from "./pages/BillingsPage";
import AuditLog from "./pages/AuditLog";
// Add these imports at the top
import PendingApproval from "./pages/PendingApproval.jsx";
import OAuthCallback   from "./pages/OAuthCallback.jsx";
import SelectRole from "./pages/SelectRole.jsx";
export default function App() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (
  !token &&
  location.pathname !== "/login" &&
  location.pathname !== "/signup" &&
  location.pathname !== "/forgot-password" &&
  location.pathname !== "/pending-approval" &&
  location.pathname !== "/select-role" &&
  location.pathname !== "/oauth/callback"
) {
  return <Navigate to="/login" />;
}

  if (token && location.pathname === "/login") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 font-sans">
      {token && (
        <>
          <Navbar />
          <CommandMenu />
        </>
      )}

      <div className="flex-1 w-full">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/cases/:id/edit" element={<EditCase />} />
          <Route path="/team" element={<Team />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/documents/:docId/summary" element={<DocumentSummary />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
<Route path="/oauth/callback"   element={<OAuthCallback />} />
<Route path="/select-role" element={<SelectRole />} />
        </Routes>
      </div>
    </div>
  );
}
