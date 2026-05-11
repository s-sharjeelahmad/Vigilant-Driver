import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { adminApi, companyApi } from "../lib/apiClient";
import { setAdminSession } from "../lib/adminSession";
import { setCompanySession } from "../lib/companySession";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

function LoginPage() {
  const [role, setRole] = useState("company"); // Default to company for most users
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
      setError(`Please enter your email and password.`);
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
      setError(err.message || "Unable to login. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Brand Panel (Hidden on smaller screens via CSS) */}
      <div className="auth-panel">
        <Link to="/" className="mb-8 inline-block text-white opacity-80 hover:opacity-100 transition-opacity" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4rem' }}>
          <ArrowLeft size={16} /> Back to Website
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--color-primary)', padding: '0.75rem', borderRadius: '12px', display: 'inline-flex' }}>
            <ShieldCheck size={36} color="white" />
          </div>
          <h1 className="ds-display-medium" style={{ margin: 0, color: 'white' }}>Vigilant Driver</h1>
        </div>
        <p className="ds-heading-3" style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', fontWeight: 500, lineHeight: 1.6 }}>
          Edge-AI powered driver monitoring and enterprise safety assurance platform.
        </p>
        <div style={{ marginTop: 'auto', paddingTop: '4rem', opacity: 0.6 }}>
          <p className="ds-caption" style={{ color: 'white' }}>© 2025 Vigilant Fleet Systems.</p>
        </div>
      </div>

      {/* Right Form Area */}
      <div className="auth-form-area">
        <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem', border: 'none', boxShadow: 'var(--shadow-high)' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 className="ds-heading-2" style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Welcome Back</h2>
            <p className="ds-body" style={{ margin: 0 }}>Sign in to your dashboard</p>
          </div>

          {/* Role Segmented Control */}
          <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setRole("company"); setError(""); }}
              style={{
                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: role === "company" ? 'var(--color-surface)' : 'transparent',
                color: role === "company" ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: role === "company" ? 'var(--shadow-low)' : 'none'
              }}
            >
              Company Fleet
            </button>
            <button
              type="button"
              onClick={() => { setRole("admin"); setError(""); }}
              style={{
                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: role === "admin" ? 'var(--color-surface)' : 'transparent',
                color: role === "admin" ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: role === "admin" ? 'var(--shadow-low)' : 'none'
              }}
            >
              System Admin
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--color-error)', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="ds-label" htmlFor="email-input">
                {role === "admin" ? "Admin Email" : "Company Email"}
              </label>
              <input
                id="email-input"
                type="email"
                placeholder={role === "admin" ? "admin@example.com" : "company@example.com"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', transition: 'border-color 0.2s', width: '100%' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label className="ds-label" htmlFor="password-input">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', transition: 'border-color 0.2s', width: '100%' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                /> Remember me
              </label>
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{
                width: '100%', padding: '0.875rem', marginTop: '0.5rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.9375rem', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', opacity: isLoading ? 0.8 : 1
              }}
              onMouseOver={(e) => !isLoading && (e.target.style.background = 'var(--color-primary-hover)')}
              onMouseOut={(e) => !isLoading && (e.target.style.background = 'var(--color-primary)')}
            >
              {isLoading ? "Signing in..." : `Sign in as ${role === 'company' ? 'Fleet' : 'Admin'}`}
            </button>
          </form>
        </div>

        {showForgotPassword && (
          <ForgotPasswordModal role={role} onClose={() => setShowForgotPassword(false)} />
        )}
      </div>
    </div>
  );
}

export default LoginPage;
