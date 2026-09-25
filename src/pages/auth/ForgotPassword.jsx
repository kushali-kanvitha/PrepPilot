import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "../../firebase/firebase";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setMessage(
        "Password reset email sent. Please check your inbox."
      );

      setEmail("");
    } catch (err) {
      console.log(err);

      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account was found with this email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-wrap">

        <div className="forgot-brand">
          <div className="forgot-logo">P</div>
          <h1>PrepPilot</h1>
          <p>Placement preparation, organized.</p>
        </div>

        <main className="forgot-card">
          <h2>Forgot your password?</h2>

          <p className="forgot-subtitle">
            Enter your registered email address and we'll send you
            a password reset link.
          </p>

          {error && (
            <div className="forgot-message forgot-error">
              {error}
            </div>
          )}

          {message && (
            <div className="forgot-message forgot-success">
              {message}
            </div>
          )}

          <form onSubmit={handleReset}>
            <div className="forgot-field">
              <label htmlFor="forgot-email">Email</label>

              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setMessage("");
                }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="forgot-submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="forgot-footer">
            Remember your password?{" "}
            <Link to="/login" className="forgot-link">
              Back to Login
            </Link>
          </p>
        </main>

      </div>
    </div>
  );
}

export default ForgotPassword;