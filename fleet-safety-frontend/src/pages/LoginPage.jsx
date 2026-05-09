import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import SectionHeader from "../components/SectionHeader";
import { adminApi } from "../lib/apiClient";
import { companyApi } from "../lib/apiClient";
import { setAdminSession } from "../lib/adminSession";
import { setCompanySession } from "../lib/companySession";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

function LoginPage() {
  const [role, setRole] = useState("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = useMemo(() => location.state?.from || "", [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError(`Please enter both ${role} email and password.`);
      return;
    }

    setIsLoading(true);
    try {
      const data = role === "admin"
        ? await adminApi.login({ email: identifier, password })
        : await companyApi.login({ email: identifier, password });

      if (!data?.access_token) {
        throw new Error("Login response did not include access token.");
      }

      if (role === "admin") {
        setAdminSession(data.access_token, data.token_type || "bearer", rememberMe);
      } else {
        setCompanySession(data.access_token, data.token_type || "bearer", rememberMe);
      }

      const defaultPath = role === "admin" ? "/admin/dashboard" : "/company/dashboard";
      const validFromPath =
        fromPath && ((role === "admin" && fromPath.startsWith("/admin")) || (role === "company" && fromPath.startsWith("/company")))
          ? fromPath
          : defaultPath;

      navigate(validFromPath, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container login-wrap">
        <SectionHeader
          eyebrow="Secure Access"
          title="Vigilant Driver Monitoring and Safety Assurance System"
          text="Select your role and sign in to your safety dashboard."
        />

        <div className="card login-card">
          <div className="role-toggle" role="tablist" aria-label="Role Selection">
            <button
              type="button"
              className={role === "admin" ? "active" : ""}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>
            <button
              type="button"
              className={role === "company" ? "active" : ""}
              onClick={() => setRole("company")}
            >
              Company
            </button>
          </div>

          <form noValidate onSubmit={handleSubmit}>
            <label>
              {role === "admin" ? "Admin Email" : "Company Email"}
              <input
                type="email"
                placeholder={role === "admin" ? "admin@example.com" : "company@example.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-label={role === "admin" ? "Admin Email" : "Company Email"}
              />
            </label>
            <label>
              Password
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={error ? "is-error" : ""}
                  aria-label="Password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div className="login-meta">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                /> Remember me
              </label>
              <button type="button" className="link-button" onClick={() => setShowForgotPassword(true)}>
                Forgot password?
              </button>
            </div>

            <div className="mock-states">
              {isLoading ? <p className="state loading">Signing in...</p> : null}
              {error ? <p className="state error">{error}</p> : null}
            </div>

            <button type="submit" className="btn btn-primary full" disabled={isLoading}>
              {isLoading ? "Please wait..." : `Login as ${role}`}
            </button>
          </form>
        </div>

        {showForgotPassword ? (
          <ForgotPasswordModal role={role} onClose={() => setShowForgotPassword(false)} />
        ) : null}
      </div>
    </section>
  );
}

export default LoginPage;
