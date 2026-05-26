import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * OAuthCallback.jsx
 * Route: /oauth/callback
 *
 * After Google OAuth success, backend redirects here with:
 *   ?token=JWT&role=client&redirect=/dashboard
 *
 * This page reads those params, stores them, and navigates.
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token    = params.get("token");
    const role     = params.get("role");
    const redirect = params.get("redirect") || "/dashboard";
    const error    = params.get("error");

    if (error === "rejected") {
      toast.error("Your access request was declined. Please contact the firm.");
      navigate("/login");
      return;
    }

    if (error === "oauth_failed") {
      toast.error("Google sign-in failed. Please try again.");
      navigate("/login");
      return;
    }

    if (token && role) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      toast.success("Signed in with Google!");
      navigate(redirect);
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#f4f2ee", fontFamily: "Inter, sans-serif"
    }}>
      <div style={{ textAlign: "center", color: "#9a9485" }}>
        <Loader2
          size={32}
          color="#c4a158"
          style={{ animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }}
        />
        <p style={{ fontSize: 14, fontWeight: 300 }}>Completing sign-in…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
