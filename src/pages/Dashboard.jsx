import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  doc,
  onSnapshot,
  query,
  where
} from "firebase/firestore";

import "./Dashboard.css";


/* =========================
   HELPERS
========================= */

// Turns a Firestore Timestamp, JS Date, number or date string into a Date.
// Returns null when there is no usable date (we never invent dates).
function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Picks the first real date found on a document.
function getDocDate(item) {
  return (
    toDate(item.updatedAt) ||
    toDate(item.createdAt) ||
    toDate(item.dateAdded) ||
    toDate(item.date) ||
    null
  );
}

function formatRelative(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const SECTIONS = ["dsa", "companies", "events", "interview", "goals", "notes", "resumes", "profile"];

const QUICK_LINKS = [
  { to: "/dsa", icon: "💻", name: "DSA Tracker", desc: "Log and review problems you solve." },
  { to: "/companies", icon: "🏢", name: "Company Tracker", desc: "Track applications and their status." },
  { to: "/resume", icon: "📄", name: "Resume Manager", desc: "Manage your resume versions." },
  { to: "/ats", icon: "🤖", name: "ATS Analyzer", desc: "Check how your resume scores." },
  { to: "/interview", icon: "🎤", name: "Interview Prep", desc: "Prepare answers to common questions." },
  { to: "/calendar", icon: "📅", name: "Interview Calendar", desc: "Plan your upcoming interviews." },
  { to: "/goals", icon: "🎯", name: "Goals", desc: "Set daily preparation targets." },
  { to: "/notes", icon: "📝", name: "Notes", desc: "Keep your study notes in one place." },
  { to: "/analytics", icon: "📊", name: "Analytics", desc: "See trends in your preparation." },
  { to: "/profile", icon: "👤", name: "Profile", desc: "Update your personal details." }
];


function Dashboard() {

  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [dsaCount, setDsaCount] = useState(0);

  const [companyStats, setCompanyStats] = useState({
    applications: 0,
    interviews: 0,
    selected: 0
  });

  const [interviewStats, setInterviewStats] = useState({
    total: 0,
    prepared: 0
  });

  const [todayGoal, setTodayGoal] = useState(null);
  const [goalStats, setGoalStats] = useState({ total: 0, completed: 0 });

  const [readinessScore, setReadinessScore] = useState(0);

  const [noteCount, setNoteCount] = useState(0);
  const [resumeCount, setResumeCount] = useState(0);
  const [currentResume, setCurrentResume] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [authName, setAuthName] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  // Recent activity, grouped by source so each listener can update its own part.
  const [activitySources, setActivitySources] = useState({});

  // Loading + error state per section.
  const [loaded, setLoaded] = useState({});
  const [errors, setErrors] = useState({});


  /* =========================
     FIREBASE DATA
  ========================= */

  useEffect(() => {

    let unsubscribers = [];

    const markLoaded = (key) =>
      setLoaded((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

    const markError = (key, label, error) => {
      console.log(`Error loading ${label}:`, error);
      setErrors((prev) => ({ ...prev, [key]: `Couldn't load ${label}.` }));
      markLoaded(key);
    };

    const clearError = (key) =>
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });

    const setActivity = (key, items) =>
      setActivitySources((prev) => ({ ...prev, [key]: items }));

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {

      unsubscribers.forEach((fn) => fn());
      unsubscribers = [];

      if (!user) {
        setDsaCount(0);
        setCompanyStats({ applications: 0, interviews: 0, selected: 0 });
        setUpcomingInterviews([]);
        setInterviewStats({ total: 0, prepared: 0 });
        setTodayGoal(null);
        setGoalStats({ total: 0, completed: 0 });
        setReadinessScore(0);
        setNoteCount(0);
        setResumeCount(0);
        setCurrentResume(null);
        setProfileName("");
        setAuthName("");
        setPhotoURL("");
        setActivitySources({});
        setErrors({});
        setLoaded(Object.fromEntries(SECTIONS.map((s) => [s, true])));
        return;
      }

      setAuthName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setLoaded({});
      setErrors({});

      const userQuery = (name) =>
        query(collection(db, name), where("userId", "==", user.uid));


      /* DSA */
      unsubscribers.push(onSnapshot(
        userQuery("dsaProblems"),
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setDsaCount(items.length);
          setActivity("dsa", items.map((p) => ({
            id: `dsa-${p.id}`,
            icon: "💻",
            text: `DSA problem added: ${p.title || p.problemName || p.name || "Untitled problem"}`,
            date: getDocDate(p)
          })));
          clearError("dsa");
          markLoaded("dsa");
        },
        (error) => markError("dsa", "DSA data", error)
      ));


      /* COMPANIES */
      unsubscribers.push(onSnapshot(
        userQuery("companies"),
        (snapshot) => {
          const companies = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCompanyStats({
            applications: companies.length,
            interviews: companies.filter((c) => c.status === "Interview").length,
            selected: companies.filter((c) => c.status === "Selected").length
          });
          setActivity("companies", companies.map((c) => ({
            id: `company-${c.id}`,
            icon: c.status === "Selected" ? "🎉" : "🏢",
            text: `${c.companyName || c.name || "Company"}${c.status ? ` — ${c.status}` : " application added"}`,
            date: getDocDate(c)
          })));
          clearError("companies");
          markLoaded("companies");
        },
        (error) => markError("companies", "company data", error)
      ));


      /* INTERVIEW CALENDAR */
      unsubscribers.push(onSnapshot(
        userQuery("interviewEvents"),
        (snapshot) => {
          const eventList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          const now = new Date();
          const upcoming = eventList
            .filter((event) => {
              if (event.status !== "Upcoming") return false;
              return new Date(`${event.date}T${event.time}`) >= now;
            })
            .sort((a, b) =>
              new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)
            );
          setUpcomingInterviews(upcoming.slice(0, 3));
          clearError("events");
          markLoaded("events");
        },
        (error) => markError("events", "interviews", error)
      ));


      /* INTERVIEW PREPARATION */
      unsubscribers.push(onSnapshot(
        userQuery("interviewAnswers"),
        (snapshot) => {
          const questions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          const preparedList = questions.filter(
            (q) => q.answer && q.answer.trim() !== ""
          );
          setInterviewStats({ total: questions.length, prepared: preparedList.length });
          setActivity("interview", preparedList.map((q) => ({
            id: `answer-${q.id}`,
            icon: "🎤",
            text: `Interview answer prepared${q.question ? `: ${q.question}` : ""}`,
            date: getDocDate(q)
          })));
          clearError("interview");
          markLoaded("interview");
        },
        (error) => markError("interview", "interview preparation", error)
      ));


      /* GOALS */
      unsubscribers.push(onSnapshot(
        userQuery("goals"),
        (snapshot) => {
          const goals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Prefer a goal dated today (if your goals store a date),
          // otherwise keep the original behaviour of showing the first goal.
          const today = todayKey();
          const datedToday = goals.find((g) => {
            const d = toDate(g.date) || toDate(g.createdAt);
            if (!d) return false;
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${d.getFullYear()}-${m}-${day}` === today;
          });
          setTodayGoal(datedToday || goals[0] || null);

          const completedGoals = goals.filter(
            (g) => Number(g.target) > 0 && Number(g.completed || 0) >= Number(g.target)
          );
          setGoalStats({ total: goals.length, completed: completedGoals.length });

          setActivity("goals", completedGoals.map((g) => ({
            id: `goal-${g.id}`,
            icon: "🎯",
            text: `Goal completed: ${g.goalText || "Goal"}`,
            date: getDocDate(g)
          })));
          clearError("goals");
          markLoaded("goals");
        },
        (error) => markError("goals", "goals", error)
      ));


      /* NOTES */
      unsubscribers.push(onSnapshot(
        userQuery("notes"),
        (snapshot) => {
          setNoteCount(snapshot.docs.length);
          clearError("notes");
          markLoaded("notes");
        },
        (error) => markError("notes", "notes", error)
      ));


      /* RESUMES */
      unsubscribers.push(onSnapshot(
        userQuery("resumes"),
        (snapshot) => {
          const resumes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setResumeCount(resumes.length);
          setCurrentResume(resumes.find((r) => r.isCurrent) || resumes[0] || null);
          setActivity("resumes", resumes.map((r) => ({
            id: `resume-${r.id}`,
            icon: "📄",
            text: `Resume updated: ${r.resumeName || r.fileName || "Resume"}`,
            date: getDocDate(r)
          })));
          clearError("resumes");
          markLoaded("resumes");
        },
        (error) => markError("resumes", "resume data", error)
      ));


      /* PROFILE */
      unsubscribers.push(onSnapshot(
        doc(db, "profiles", user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data();
            setProfileName(profile.name || profile.fullName || "");
          } else {
            setProfileName("");
          }
          clearError("profile");
          markLoaded("profile");
        },
        (error) => markError("profile", "profile data", error)
      ));
    });

    return () => {
      unsubscribeAuth();
      unsubscribers.forEach((fn) => fn());
    };

  }, []);


  /* =========================
     DASHBOARD CALCULATIONS
     (same readiness formula as before)
  ========================= */

  const dsaScore = Math.min((dsaCount / 100) * 100, 100);

  const applicationScore = Math.min((companyStats.applications / 10) * 100, 100);

  const interviewPreparationScore =
    interviewStats.total === 0
      ? 0
      : (interviewStats.prepared / interviewStats.total) * 100;

  const interviewActivityScore = Math.min((upcomingInterviews.length / 3) * 100, 100);

  const calculatedReadiness = Math.round(
    dsaScore * 0.30 +
    applicationScore * 0.25 +
    interviewPreparationScore * 0.25 +
    interviewActivityScore * 0.20
  );

  useEffect(() => {
    setReadinessScore(calculatedReadiness);
  }, [calculatedReadiness]);

  const interviewPercentage =
    interviewStats.total === 0
      ? 0
      : Math.round((interviewStats.prepared / interviewStats.total) * 100);

  const goalPercentage =
    todayGoal && Number(todayGoal.target) > 0
      ? Math.min(
          Math.round((Number(todayGoal.completed || 0) / Number(todayGoal.target)) * 100),
          100
        )
      : 0;

  const goalsCompletedPercentage =
    goalStats.total === 0 ? 0 : Math.round((goalStats.completed / goalStats.total) * 100);

  const isLoading = SECTIONS.some((s) => !loaded[s]);
  const errorMessages = Object.values(errors);

  const displayName = profileName || authName || "";
  const firstName = displayName.split(" ")[0];
  const initials = displayName
    ? displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "🙂";

  const todayText = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const readinessMessage =
    readinessScore === 0
      ? "Start adding your preparation activity to build your score."
      : readinessScore < 30
      ? "Good start — keep building momentum."
      : readinessScore < 60
      ? "You're making steady progress."
      : readinessScore < 85
      ? "You're well on your way. Keep it up!"
      : "Excellent! You're placement ready.";

  const recentActivity = Object.values(activitySources)
    .flat()
    .filter((a) => a.date)
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);

  const overview = [
    {
      label: "DSA",
      value: Math.round(dsaScore),
      detail: `${dsaCount} / 100 problems`,
      empty: dsaCount === 0 && { text: "You haven't added any DSA problems yet.", to: "/dsa", cta: "Start solving →" }
    },
    {
      label: "Interview Preparation",
      value: interviewPercentage,
      detail: `${interviewStats.prepared} / ${interviewStats.total} answered`,
      empty: interviewStats.total === 0 && { text: "No interview questions added yet.", to: "/interview", cta: "Start preparing →" }
    },
    {
      label: "Applications",
      value: Math.round(applicationScore),
      detail: `${companyStats.applications} / 10 applications`,
      empty: companyStats.applications === 0 && { text: "No applications tracked yet.", to: "/companies", cta: "Add application →" }
    },
    {
      label: "Goals",
      value: goalsCompletedPercentage,
      detail: `${goalStats.completed} / ${goalStats.total} completed`,
      empty: goalStats.total === 0 && { text: "No goals created yet.", to: "/goals", cta: "Create goal →" }
    }
  ];

  const stats = [
    { icon: "💻", label: "DSA Problems Solved", value: dsaCount },
    { icon: "🏢", label: "Applications", value: companyStats.applications },
    { icon: "🎤", label: "Interviews", value: companyStats.interviews },
    { icon: "🎉", label: "Selected", value: companyStats.selected },
    { icon: "📝", label: "Questions Prepared", value: `${interviewStats.prepared}/${interviewStats.total}` },
    { icon: "🎯", label: "Goals Completed", value: `${goalStats.completed}/${goalStats.total}` }
  ];

  // Ring geometry for the readiness widget
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - readinessScore / 100);


  return (
    <div className="pp-dash">

      {/* HEADER */}
      <header className="pp-header">
        <div>
          <p className="pp-date">{todayText}</p>
          <h1>Welcome back{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="pp-muted" style={{ color: "black" }}>
  Here's your placement preparation overview.
</p>
        </div>
        <Link to="/profile" className="pp-avatar" title="Profile">
          {photoURL ? <img src={photoURL} alt="Profile" /> : <span>{initials}</span>}
        </Link>
      </header>

      {errorMessages.length > 0 && (
        <div className="pp-error" role="alert">
          ⚠️ {errorMessages.join(" ")} Other sections are still up to date.
        </div>
      )}

      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* GOAL + READINESS */}
          <section className="pp-top-grid">

            <div className="pp-card pp-goal">
              <div className="pp-card-head">
                <span className="pp-label">Today's Goal</span>
                <Link to="/goals" className="pp-link">Manage →</Link>
              </div>

              {todayGoal ? (
                <>
                  <h2 className="pp-goal-title">{todayGoal.goalText || "Untitled goal"}</h2>
                  <div className="pp-goal-row">
                    <span className="pp-muted">
                      <strong>{Number(todayGoal.completed || 0)}</strong> / {Number(todayGoal.target || 0)} completed
                    </span>
                    <strong className="pp-goal-pct">{goalPercentage}%</strong>
                  </div>
                  <div className="pp-bar pp-bar-lg">
                    <div style={{ width: `${goalPercentage}%` }} />
                  </div>
                </>
              ) : (
                <div className="pp-empty">
                  <strong>No goal set for today</strong>
                  <p>Set a goal to keep your preparation on track.</p>
                  <Link to="/goals" className="pp-btn">Create goal →</Link>
                </div>
              )}
            </div>

            <div className="pp-card pp-readiness">
              <svg viewBox="0 0 100 100" className="pp-ring" aria-hidden="true">
                <circle cx="50" cy="50" r={ringRadius} className="pp-ring-track" />
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  className="pp-ring-fill"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
                <text x="50" y="55" textAnchor="middle" className="pp-ring-text">
                  {readinessScore}%
                </text>
              </svg>
              <div>
                <span className="pp-label">Placement Readiness</span>
                <h2 className="pp-readiness-msg">{readinessMessage}</h2>
                <p className="pp-muted pp-small">
                  Based on DSA, applications, interview preparation and upcoming interviews.
                </p>
              </div>
            </div>
          </section>

          {/* QUICK STATS */}
          <section className="pp-stats">
            {stats.map((s) => (
              <div key={s.label} className="pp-stat">
                <span className="pp-stat-icon">{s.icon}</span>
                <strong>{s.value}</strong>
                <span className="pp-muted pp-small">{s.label}</span>
              </div>
            ))}
          </section>

          {/* OVERVIEW + ACTIVITY */}
          <section className="pp-mid-grid">

            <div className="pp-card">
              <div className="pp-card-head">
                <h3>Preparation Overview</h3>
                <Link to="/analytics" className="pp-link">Analytics →</Link>
              </div>
              <div className="pp-overview">
                {overview.map((o) => (
                  <div key={o.label} className="pp-overview-row">
                    <div className="pp-overview-top">
                      <span>{o.label}</span>
                      <strong>{o.value}%</strong>
                    </div>
                    <div className="pp-bar"><div style={{ width: `${o.value}%` }} /></div>
                    {o.empty ? (
                      <p className="pp-small pp-muted">
                        {o.empty.text} <Link to={o.empty.to} className="pp-link">{o.empty.cta}</Link>
                      </p>
                    ) : (
                      <p className="pp-small pp-muted">{o.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pp-side-col">
              <div className="pp-card">
                <div className="pp-card-head">
                  <h3>Recent Activity</h3>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="pp-empty pp-empty-sm">
                    <strong>No activity yet</strong>
                    <p>Your recent preparation activity will appear here.</p>
                  </div>
                ) : (
                  <ul className="pp-activity">
                    {recentActivity.map((a) => (
                      <li key={a.id}>
                        <span className="pp-activity-icon">{a.icon}</span>
                        <span className="pp-activity-text">{a.text}</span>
                        <time className="pp-small pp-muted">{formatRelative(a.date)}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pp-card">
                <div className="pp-card-head">
                  <h3>Upcoming Interviews</h3>
                  <Link to="/calendar" className="pp-link">Calendar →</Link>
                </div>
                {upcomingInterviews.length === 0 ? (
                  <p className="pp-muted pp-small">No upcoming interviews scheduled.</p>
                ) : (
                  <ul className="pp-activity">
                    {upcomingInterviews.map((event) => (
                      <li key={event.id}>
                        <span className="pp-activity-icon">📅</span>
                        <span className="pp-activity-text">
                          {event.companyName || event.company || event.title || "Interview"}
                          {event.round ? ` · ${event.round}` : ""}
                        </span>
                        <time className="pp-small pp-muted">
                          {new Date(`${event.date}T${event.time}`).toLocaleString(undefined, {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* QUICK ACCESS */}
          <section>
            <div className="pp-section-head">
              <h3>Quick Access</h3>
              <span className="pp-muted pp-small">
                {resumeCount} resume{resumeCount === 1 ? "" : "s"}
                {currentResume ? ` · current: ${currentResume.resumeName || currentResume.fileName || "Resume"}` : ""}
                {` · ${noteCount} note${noteCount === 1 ? "" : "s"}`}
              </span>
            </div>
            <div className="pp-quick">
              {QUICK_LINKS.map((q) => (
                <Link key={q.to} to={q.to} className="pp-quick-card">
                  <span className="pp-quick-icon">{q.icon}</span>
                  <div className="pp-quick-body">
                    <strong>{q.name}</strong>
                    <span className="pp-small pp-muted">{q.desc}</span>
                  </div>
                  <span className="pp-quick-open">Open →</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="pp-skeleton" aria-busy="true" aria-label="Loading dashboard">
      <div className="pp-top-grid">
        <div className="pp-card pp-skel-block" />
        <div className="pp-card pp-skel-block" />
      </div>
      <div className="pp-stats">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pp-stat pp-skel-small" />
        ))}
      </div>
      <div className="pp-mid-grid">
        <div className="pp-card pp-skel-tall" />
        <div className="pp-card pp-skel-tall" />
      </div>
    </div>
  );
}


export default Dashboard;
