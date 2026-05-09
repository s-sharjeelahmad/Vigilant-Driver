import { useState } from "react";
import { adminApi, companyApi } from "../lib/apiClient";

function ForgotPasswordModal({ role, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const payload = { email: email.trim() };
      const response = role === "admin"
        ? await adminApi.forgotPassword(payload)
        : await companyApi.forgotPassword(payload);

      if (response?.status === "error") {
        setError(response.message || "Email not found.");
      } else {
        setSuccess("Password has been sent to your email. Please check your inbox.");
      }
    } catch (err) {
      setError(err.message || "Unable to process password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Forgot Password">
      <div className="modal-card card">
        <h3>Forgot Password</h3>
        <p>Enter your {role} email to receive a temporary password.</p>

        <form className="admin-form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </label>

          {error ? <p className="state error">{error}</p> : null}
          {success ? <p className="state success">{success}</p> : null}

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Password"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
