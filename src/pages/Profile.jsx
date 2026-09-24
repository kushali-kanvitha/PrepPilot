import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase/firebase";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import "./Profile.css";

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
  location: "",

  college: "",
  degree: "",
  branch: "",
  currentYear: "",
  graduationYear: "",
  cgpa: "",

  targetRole: "",
  preferredJobType: "",
  preferredLocation: "",
  placementStatus: "",

  skills: [],

  github: "",
  linkedin: "",
  portfolio: ""
};

const DEGREE_OPTIONS = ["B.Tech", "B.E.", "M.Tech", "MCA", "Other"];
const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated"];
const JOB_TYPE_OPTIONS = ["Full-time", "Internship", "Internship + Full-time", "Other"];
const STATUS_OPTIONS = ["Preparing", "Actively Applying", "Interviewing", "Placed"];

function getInitials(name, email) {
  const source = (name || "").trim() || (email || "").trim();
  if (!source) return "?";

  const parts = source.split(/[\s._@-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]);

  return letters.join("").toUpperCase();
}

function isReasonableUrl(value) {
  if (!value || !value.trim()) return true;

  const candidate = value.trim();
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;

  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success" | "error", text }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const profileRef = doc(db, "profiles", currentUser.uid);
        const profileSnap = await getDoc(profileRef);

        const data = profileSnap.exists() ? profileSnap.data() : {};

        setProfile({
          ...EMPTY_PROFILE,
          ...data,
          email: currentUser.email || data.email || "",
          skills: Array.isArray(data.skills) ? data.skills : []
        });
      } catch (error) {
        console.log("Error loading profile:", error);
        setFeedback({
          type: "error",
          text: "We couldn't load your profile. Please refresh and try again."
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateField = (field) => (event) => {
    setFeedback(null);
    setProfile((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;

    const exists = profile.skills.some(
      (s) => s.toLowerCase() === skill.toLowerCase()
    );

    if (!exists) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    }

    setSkillInput("");
    setFeedback(null);
  };

  const removeSkill = (skill) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }));
    setFeedback(null);
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill();
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!user) {
      setFeedback({ type: "error", text: "Please login first." });
      return;
    }

    if (!profile.name.trim()) {
      setFeedback({ type: "error", text: "Please enter your full name." });
      return;
    }

    const links = [
      ["GitHub", profile.github],
      ["LinkedIn", profile.linkedin],
      ["Portfolio", profile.portfolio]
    ];

    const invalidLink = links.find(([, value]) => !isReasonableUrl(value));

    if (invalidLink) {
      setFeedback({
        type: "error",
        text: `Please enter a valid ${invalidLink[0]} link.`
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          name: profile.name.trim(),
          email: user.email,
          phone: profile.phone.trim(),
          location: profile.location.trim(),

          college: profile.college.trim(),
          degree: profile.degree,
          branch: profile.branch.trim(),
          currentYear: profile.currentYear,
          graduationYear: profile.graduationYear.trim(),
          cgpa: profile.cgpa.trim(),

          targetRole: profile.targetRole.trim(),
          preferredJobType: profile.preferredJobType,
          preferredLocation: profile.preferredLocation.trim(),
          placementStatus: profile.placementStatus,

          skills: profile.skills,

          github: profile.github.trim(),
          linkedin: profile.linkedin.trim(),
          portfolio: profile.portfolio.trim()
        },
        { merge: true }
      );

      setFeedback({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      console.log(error);
      setFeedback({
        type: "error",
        text: "Failed to update profile. Please check your connection and try again."
      });
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.log(error);
      setFeedback({ type: "error", text: "Failed to logout." });
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-state">
          <div className="profile-spinner" aria-hidden="true" />
          <p>Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-state">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">
            Please login to view and manage your PrepPilot profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">
            Manage your personal, academic, and placement information.
          </p>
        </div>

        <div className="profile-header-actions">
          <div className="profile-avatar profile-avatar-sm" aria-hidden="true">
            {getInitials(profile.name, user.email)}
          </div>
          <button
            type="button"
            className="profile-btn profile-btn-ghost"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <section className="profile-card profile-overview">
        <div className="profile-avatar" aria-hidden="true">
          {getInitials(profile.name, user.email)}
        </div>

        <div className="profile-overview-text">
          <h2 className="profile-overview-name">
            {profile.name.trim() || "Add your name"}
          </h2>
          <p className="profile-overview-email">{user.email}</p>
          <p className="profile-overview-status">
            {profile.placementStatus
              ? `${profile.placementStatus}${
                  profile.targetRole ? ` · ${profile.targetRole}` : ""
                }`
              : "Placement preparation profile"}
          </p>
        </div>

        <div className="profile-overview-meta">
          <div>
            <span className="profile-meta-label">College</span>
            <span className="profile-meta-value">
              {profile.college || "Not added"}
            </span>
          </div>
          <div>
            <span className="profile-meta-label">CGPA</span>
            <span className="profile-meta-value">
              {profile.cgpa || "Not added"}
            </span>
          </div>
          <div>
            <span className="profile-meta-label">Skills</span>
            <span className="profile-meta-value">
              {profile.skills.length ? profile.skills.length : "None yet"}
            </span>
          </div>
        </div>
      </section>

      <form className="profile-form" onSubmit={handleSave}>
        <div className="profile-grid">
          <section className="profile-card">
            <div className="profile-card-head">
              <h3>Personal Information</h3>
              <p>Basic details recruiters will see first.</p>
            </div>

            <div className="profile-fields">
              <label className="profile-field">
                <span>Full Name</span>
                <input
                  type="text"
                  placeholder="e.g. Kushali Ganapathi"
                  value={profile.name}
                  onChange={updateField("name")}
                  required
                />
              </label>

              <label className="profile-field">
                <span>Email</span>
                <input type="email" value={user.email || ""} readOnly disabled />
                <small>Linked to your PrepPilot login.</small>
              </label>

              <label className="profile-field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={profile.phone}
                  onChange={updateField("phone")}
                />
              </label>

              <label className="profile-field">
                <span>Location</span>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, India"
                  value={profile.location}
                  onChange={updateField("location")}
                />
              </label>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card-head">
              <h3>Academic Information</h3>
              <p>Your current course and performance.</p>
            </div>

            <div className="profile-fields">
              <label className="profile-field">
                <span>College / University</span>
                <input
                  type="text"
                  placeholder="e.g. PES University"
                  value={profile.college}
                  onChange={updateField("college")}
                />
              </label>

              <div className="profile-field-row">
                <label className="profile-field">
                  <span>Degree</span>
                  <select value={profile.degree} onChange={updateField("degree")}>
                    <option value="">Select degree</option>
                    {DEGREE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-field">
                  <span>Branch / Department</span>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={profile.branch}
                    onChange={updateField("branch")}
                  />
                </label>
              </div>

              <div className="profile-field-row">
                <label className="profile-field">
                  <span>Current Year</span>
                  <select
                    value={profile.currentYear}
                    onChange={updateField("currentYear")}
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="profile-field">
                  <span>Graduation Year</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2027"
                    value={profile.graduationYear}
                    onChange={updateField("graduationYear")}
                  />
                </label>
              </div>

              <label className="profile-field">
                <span>CGPA</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 8.6"
                  value={profile.cgpa}
                  onChange={updateField("cgpa")}
                />
              </label>
            </div>
          </section>
        </div>

        <section className="profile-card">
          <div className="profile-card-head">
            <h3>Placement Preferences</h3>
            <p>What you are targeting this placement season.</p>
          </div>

          <div className="profile-fields profile-fields-2col">
            <label className="profile-field">
              <span>Target Role</span>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={profile.targetRole}
                onChange={updateField("targetRole")}
              />
            </label>

            <label className="profile-field">
              <span>Preferred Job Type</span>
              <select
                value={profile.preferredJobType}
                onChange={updateField("preferredJobType")}
              >
                <option value="">Select job type</option>
                {JOB_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="profile-field">
              <span>Preferred Location</span>
              <input
                type="text"
                placeholder="e.g. Bengaluru / Remote"
                value={profile.preferredLocation}
                onChange={updateField("preferredLocation")}
              />
            </label>

            <label className="profile-field">
              <span>Placement Status</span>
              <select
                value={profile.placementStatus}
                onChange={updateField("placementStatus")}
              >
                <option value="">Select status</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-head">
            <h3>Skills</h3>
            <p>Add the technologies you are confident in.</p>
          </div>

          <div className="profile-skill-input">
            <input
              type="text"
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
            />
            <button
              type="button"
              className="profile-btn profile-btn-secondary"
              onClick={addSkill}
            >
              Add
            </button>
          </div>

          {profile.skills.length ? (
            <ul className="profile-chips">
              {profile.skills.map((skill) => (
                <li key={skill} className="profile-chip">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => removeSkill(skill)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="profile-empty">
              No skills added yet. Start with the languages and frameworks you
              practice most.
            </p>
          )}
        </section>

        <section className="profile-card">
          <div className="profile-card-head">
            <h3>Professional Links</h3>
            <p>Where recruiters can see your work.</p>
          </div>

          <div className="profile-fields profile-fields-2col">
            <label className="profile-field">
              <span>GitHub</span>
              <input
                type="text"
                placeholder="github.com/username"
                value={profile.github}
                onChange={updateField("github")}
              />
            </label>

            <label className="profile-field">
              <span>LinkedIn</span>
              <input
                type="text"
                placeholder="linkedin.com/in/username"
                value={profile.linkedin}
                onChange={updateField("linkedin")}
              />
            </label>

            <label className="profile-field">
              <span>Portfolio</span>
              <input
                type="text"
                placeholder="yourname.dev"
                value={profile.portfolio}
                onChange={updateField("portfolio")}
              />
            </label>
          </div>
        </section>

        <div className="profile-save-bar">
          {feedback && (
            <p className={`profile-feedback profile-feedback-${feedback.type}`}>
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            className="profile-btn profile-btn-primary"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
