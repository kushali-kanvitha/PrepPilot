import { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import "./Signup.css";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!fullName.trim() || !email.trim()) {
      setError("Please enter your full name and email.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      try {
        await updateProfile(cred.user, {
          displayName: fullName.trim(),
        });
      } catch {
        // Ignore profile update error
      }

      setSuccess("Account created successfully!");
    } catch (err) {
      const code = err?.code || "";

      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(
          err?.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-wrap">

        <div className="signup-brand">
          <div className="signup-logo" aria-hidden="true">
            P
          </div>

          <h1 className="signup-brand-name">
            PrepPilot
          </h1>

          <p className="signup-brand-tag">
            Placement preparation, organized.
          </p>
        </div>

        <main className="signup-card">

          <h2 className="signup-title">
            Create your account
          </h2>

          <p className="signup-subtitle">
            Start organizing your placement preparation with PrepPilot.
          </p>

          {error && (
            <div className="signup-error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="signup-success" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSignup} noValidate>

            <div className="signup-field">
              <label htmlFor="signup-name">
                Full Name
              </label>

              <input
                id="signup-name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="signup-email">
                Email
              </label>

              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="signup-field">
              <label htmlFor="signup-password">
                Password
              </label>

              <div className="signup-password">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="signup-toggle"
                  onClick={() =>
                    setShowPassword((s) => !s)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="signup-hint">
                Use at least 6 characters.
              </p>
            </div>

            <div className="signup-field">
              <label htmlFor="signup-confirm">
                Confirm Password
              </label>

              <div className="signup-password">
                <input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="signup-toggle"
                  onClick={() =>
                    setShowConfirm((s) => !s)
                  }
                  aria-label={
                    showConfirm
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showConfirm}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>

          <div className="signup-divider">
            <span>or</span>
          </div>

          <p className="signup-footer">
            Already have an account?{" "}

            <Link
              to="/"
              className="signup-link"
            >
              Log in
            </Link>
          </p>

        </main>
      </div>
    </div>
  );
}

export default Signup;