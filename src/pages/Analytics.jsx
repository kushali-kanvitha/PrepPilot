// src/pages/Analytics.jsx
// PrepPilot — Advanced Analytics
// React + Firebase + Recharts
// JavaScript / JSX only

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import "./Analytics.css";

/* ================================================================
   HELPERS
================================================================ */

function toDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date) {
  if (!date) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function prettyDay(key) {
  if (!key) return "";

  const [year, month, day] = key.split("-");

  return `${day}/${month}/${String(year).slice(2)}`;
}

function shortDate(date) {
  if (!date) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function daysForRange(range) {
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  if (range === "3m") return 90;

  return null;
}

function startOfRange(range) {
  const days = daysForRange(range);

  if (!days) return null;

  const start = new Date();

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  return start;
}

function pct(part, total) {
  if (!total) return 0;

  return Math.min(100, Math.round((part / total) * 100));
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeDifficulty(value) {
  const valueText = normalize(value);

  if (valueText === "easy") return "Easy";
  if (valueText === "medium") return "Medium";
  if (valueText === "hard") return "Hard";

  return "Unknown";
}

function normalizeStatus(value) {
  return normalize(value);
}

/* ================================================================
   STREAK CALCULATION
================================================================ */

function calcStreaks(dates) {
  const keys = Array.from(
    new Set(
      dates
        .filter(Boolean)
        .map(dayKey)
        .filter(Boolean)
    )
  ).sort();

  if (keys.length === 0) {
    return {
      current: 0,
      longest: 0,
    };
  }

  let longest = 1;
  let run = 1;

  for (let i = 1; i < keys.length; i++) {
    const previous = new Date(`${keys[i - 1]}T00:00:00`);
    const current = new Date(`${keys[i]}T00:00:00`);

    const difference = Math.round(
      (current - previous) / 86400000
    );

    if (difference === 1) {
      run++;
    } else {
      run = 1;
    }

    longest = Math.max(longest, run);
  }

  const set = new Set(keys);

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  /*
     If the user did not solve anything today,
     allow the streak to continue from yesterday.
  */
  if (!set.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let current = 0;

  while (set.has(dayKey(cursor))) {
    current++;

    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    current,
    longest,
  };
}

/* ================================================================
   UI COMPONENTS
================================================================ */

function StatCard({
  label,
  value,
  sub,
  accent,
}) {
  return (
    <div
      className={`pp-stat ${
        accent ? `pp-stat--${accent}` : ""
      }`}
    >
      <span className="pp-stat__label">
        {label}
      </span>

      <strong className="pp-stat__value">
        {value}
      </strong>

      {sub ? (
        <span className="pp-stat__sub">
          {sub}
        </span>
      ) : null}
    </div>
  );
}

function ProgressRow({
  label,
  value,
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  return (
    <div className="pp-progress">
      <div className="pp-progress__head">
        <span>{label}</span>

        <strong>
          {safeValue}%
        </strong>
      </div>

      <div
        className="pp-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="pp-progress__fill"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  wide,
}) {
  return (
    <section
      className={`pp-card ${
        wide ? "pp-card--wide" : ""
      }`}
    >
      {title ? (
        <header className="pp-card__head">
          <h2>{title}</h2>

          {subtitle ? (
            <p>{subtitle}</p>
          ) : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}

function Empty({ text }) {
  return (
    <p className="pp-empty">
      {text}
    </p>
  );
}

const PIE_COLORS = [
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#06b6d4",
];

/* ================================================================
   MAIN ANALYTICS PAGE
================================================================ */

export default function Analytics() {
  /* --------------------------------------------------------------
     STATE
  -------------------------------------------------------------- */

  const [range, setRange] = useState("30d");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [signedIn, setSignedIn] = useState(true);

  const [dsa, setDsa] = useState([]);

  const [companies, setCompanies] = useState([]);

  const [answers, setAnswers] = useState([]);

  const [events, setEvents] = useState([]);

  const [goals, setGoals] = useState([]);

  const [resumes, setResumes] = useState([]);

  /* --------------------------------------------------------------
     FIREBASE LISTENERS
  -------------------------------------------------------------- */

  useEffect(() => {
    let unsubscribers = [];

    let loadedCollections = 0;

    const collectionNames = [
      "dsaProblems",
      "companies",
      "interviewAnswers",
      "interviewEvents",
      "goals",
      "resumes",
    ];

    const stopAuth = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribers.forEach((unsubscribe) => {
          unsubscribe();
        });

        unsubscribers = [];

        loadedCollections = 0;

        if (!user) {
          setSignedIn(false);
          setLoading(false);
          return;
        }

        setSignedIn(true);
        setLoading(true);
        setError("");

        const listen = (collectionName, setter) => {
          const q = query(
            collection(db, collectionName),
            where("userId", "==", user.uid)
          );

          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const rows = snapshot.docs.map(
                (doc) => ({
                  id: doc.id,
                  ...doc.data(),
                })
              );

              setter(rows);

              loadedCollections++;

              /*
                 Wait until all six collections have
                 returned once before removing loading state.
              */
              if (
                loadedCollections >=
                collectionNames.length
              ) {
                setLoading(false);
              }
            },
            (firebaseError) => {
              console.error(
                `Analytics error in ${collectionName}:`,
                firebaseError
              );

              setError(
                "Some analytics data could not be loaded."
              );

              loadedCollections++;

              if (
                loadedCollections >=
                collectionNames.length
              ) {
                setLoading(false);
              }
            }
          );

          unsubscribers.push(unsubscribe);
        };

        listen("dsaProblems", setDsa);
        listen("companies", setCompanies);
        listen("interviewAnswers", setAnswers);
        listen("interviewEvents", setEvents);
        listen("goals", setGoals);
        listen("resumes", setResumes);
      }
    );

    return () => {
      stopAuth();

      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, []);

  /* ================================================================
     RANGE
  ================================================================ */

  const rangeStart = useMemo(
    () => startOfRange(range),
    [range]
  );

  function inRange(date) {
    if (!date) return false;

    if (!rangeStart) {
      return true;
    }

    return date >= rangeStart;
  }

  /* ================================================================
     DSA
  ================================================================ */

  const dsaDated = useMemo(() => {
    return dsa.map((problem) => ({
      ...problem,

      date:
        toDate(problem.dateSolved) ||
        toDate(problem.createdAt),

      difficulty: normalizeDifficulty(
        problem.difficulty
      ),

      topic:
        String(problem.topic || "Other").trim() ||
        "Other",

      status: normalizeStatus(
        problem.status
      ),
    }));
  }, [dsa]);

  /*
     IMPORTANT:
     A missing status is NOT considered solved.
  */
  const solved = useMemo(() => {
    return dsaDated.filter((problem) => {
      return [
        "solved",
        "completed",
        "done",
      ].includes(problem.status);
    });
  }, [dsaDated]);

  const dsaInRange = useMemo(() => {
    return solved.filter((problem) =>
      inRange(problem.date)
    );
  }, [solved, rangeStart]);

  /* --------------------------------------------------------------
     DSA OVER TIME
  -------------------------------------------------------------- */

  const dsaOverTime = useMemo(() => {
    const map = new Map();

    dsaInRange.forEach((problem) => {
      if (!problem.date) return;

      const key = dayKey(problem.date);

      map.set(
        key,
        (map.get(key) || 0) + 1
      );
    });

    return Array.from(map.entries())
      .sort((a, b) =>
        a[0].localeCompare(b[0])
      )
      .map(([key, count]) => ({
        date: prettyDay(key),
        key,
        count,
      }));
  }, [dsaInRange]);

  /* --------------------------------------------------------------
     DIFFICULTY
  -------------------------------------------------------------- */

  const difficultyData = useMemo(() => {
    const counts = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    };

    dsaInRange.forEach((problem) => {
      if (counts[problem.difficulty] !== undefined) {
        counts[problem.difficulty]++;
      }
    });

    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
      }));
  }, [dsaInRange]);

  /* --------------------------------------------------------------
     TOPICS
  -------------------------------------------------------------- */

  const topicData = useMemo(() => {
    const counts = {};

    dsaInRange.forEach((problem) => {
      const topic =
        problem.topic || "Other";

      counts[topic] =
        (counts[topic] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([topic, count]) => ({
        topic,
        count,
      }))
      .sort(
        (a, b) => b.count - a.count
      );
  }, [dsaInRange]);

  /* --------------------------------------------------------------
     DSA STATUS
  -------------------------------------------------------------- */

  const statusCounts = useMemo(() => {
    const output = {
      Solved: 0,
      Attempted: 0,
      Todo: 0,
    };

    dsaDated.forEach((problem) => {
      const status = problem.status;

      if (
        [
          "solved",
          "completed",
          "done",
        ].includes(status)
      ) {
        output.Solved++;
      } else if (
        [
          "attempted",
          "in progress",
          "in-progress",
        ].includes(status)
      ) {
        output.Attempted++;
      } else {
        output.Todo++;
      }
    });

    return output;
  }, [dsaDated]);

  /* --------------------------------------------------------------
     DSA STREAK
  -------------------------------------------------------------- */

  const streaks = useMemo(() => {
    return calcStreaks(
      solved.map(
        (problem) => problem.date
      )
    );
  }, [solved]);

  /* --------------------------------------------------------------
     HEATMAP
  -------------------------------------------------------------- */

  const heatmap = useMemo(() => {
    const counts = new Map();

    solved.forEach((problem) => {
      if (!problem.date) return;

      const key = dayKey(problem.date);

      counts.set(
        key,
        (counts.get(key) || 0) + 1
      );
    });

    if (counts.size === 0) {
      return [];
    }

    let start;

    if (rangeStart) {
      start = new Date(rangeStart);
    } else {
      /*
         All Time:
         show the latest 120 days rather than
         creating an enormous heatmap.
      */
      start = new Date();

      start.setHours(0, 0, 0, 0);

      start.setDate(
        start.getDate() - 119
      );
    }

    const end = new Date();

    end.setHours(0, 0, 0, 0);

    const cells = [];

    const cursor = new Date(start);

    while (cursor <= end) {
      const key = dayKey(cursor);

      cells.push({
        key,
        count: counts.get(key) || 0,
      });

      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    return cells;
  }, [solved, rangeStart]);

  function heatLevel(count) {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;

    return 4;
  }

  /* ================================================================
     COMPANIES / APPLICATIONS
  ================================================================ */

  const companyRows = useMemo(() => {
    return companies.map((company) => ({
      ...company,

      date:
        toDate(company.applicationDate) ||
        toDate(company.createdAt),

      statusLabel:
        String(
          company.status || "Applied"
        ).trim(),
    }));
  }, [companies]);

  const companiesInRange = useMemo(() => {
    return companyRows.filter(
      (company) =>
        !company.date ||
        inRange(company.date)
    );
  }, [companyRows, rangeStart]);

  /* --------------------------------------------------------------
     APPLICATION STATUS
  -------------------------------------------------------------- */

  const appStatusData = useMemo(() => {
    const counts = {};

    companiesInRange.forEach((company) => {
      const status =
        company.statusLabel || "Applied";

      const key =
        status.charAt(0).toUpperCase() +
        status.slice(1).toLowerCase();

      counts[key] =
        (counts[key] || 0) + 1;
    });

    return Object.entries(counts).map(
      ([name, value]) => ({
        name,
        value,
      })
    );
  }, [companiesInRange]);

  /* --------------------------------------------------------------
     APPLICATION FUNNEL
  -------------------------------------------------------------- */

  const funnel = useMemo(() => {
    const applications =
      companiesInRange.length;

    let interviews = 0;

    let selected = 0;

    companiesInRange.forEach(
      (company) => {
        const status =
          normalize(company.status);

        if (
          status.includes("interview") ||
          company.interviewDate
        ) {
          interviews++;
        }

        if (
          [
            "selected",
            "offer",
            "placed",
          ].includes(status)
        ) {
          selected++;
        }
      }
    );

    return {
      applications,
      interviews,
      selected,
    };
  }, [companiesInRange]);

  /* --------------------------------------------------------------
     APPLICATIONS OVER TIME
  -------------------------------------------------------------- */

  const appsOverTime = useMemo(() => {
    const map = new Map();

    companiesInRange.forEach(
      (company) => {
        if (!company.date) return;

        const key = dayKey(company.date);

        map.set(
          key,
          (map.get(key) || 0) + 1
        );
      }
    );

    return Array.from(map.entries())
      .sort((a, b) =>
        a[0].localeCompare(b[0])
      )
      .map(([key, count]) => ({
        date: prettyDay(key),
        key,
        count,
      }));
  }, [companiesInRange]);

  /* ================================================================
     INTERVIEW PREPARATION
  ================================================================ */

  const answerRows = useMemo(() => {
    return answers.map((answer) => ({
      ...answer,

      date:
        toDate(answer.createdAt) ||
        toDate(answer.updatedAt),

      text: String(
        answer.answer ||
          answer.userAnswer ||
          ""
      ).trim(),

      category:
        answer.category ||
        answer.topic ||
        answer.type ||
        null,
    }));
  }, [answers]);

  const prepared = useMemo(() => {
    return answerRows.filter(
      (answer) =>
        answer.text.length > 0 ||
        answer.prepared === true ||
        answer.completed === true
    );
  }, [answerRows]);

  const prepProgress = pct(
    prepared.length,
    answerRows.length
  );

  /* --------------------------------------------------------------
     PREPARATION OVER TIME
  -------------------------------------------------------------- */

  const prepOverTime = useMemo(() => {
    const map = new Map();

    prepared.forEach((answer) => {
      if (!answer.date) return;

      if (!inRange(answer.date)) return;

      const key = dayKey(answer.date);

      map.set(
        key,
        (map.get(key) || 0) + 1
      );
    });

    return Array.from(map.entries())
      .sort((a, b) =>
        a[0].localeCompare(b[0])
      )
      .map(([key, count]) => ({
        date: prettyDay(key),
        key,
        count,
      }));
  }, [prepared, rangeStart]);

  /* --------------------------------------------------------------
     PREPARATION CATEGORIES
  -------------------------------------------------------------- */

  const prepCategories = useMemo(() => {
    const counts = {};

    answerRows.forEach((answer) => {
      if (!answer.category) return;

      const category =
        String(answer.category).trim();

      counts[category] =
        (counts[category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort(
        (a, b) => b.value - a.value
      );
  }, [answerRows]);

  /* ================================================================
     INTERVIEW EVENTS
  ================================================================ */

  const eventRows = useMemo(() => {
    return events
      .map((event) => ({
        ...event,

        date:
          toDate(event.date) ||
          toDate(event.start) ||
          toDate(event.startTime) ||
          toDate(event.createdAt),

        title:
          event.title ||
          event.companyName ||
          event.name ||
          "Interview",
      }))
      .sort(
        (a, b) =>
          (b.date?.getTime() || 0) -
          (a.date?.getTime() || 0)
      );
  }, [events]);

  const now = new Date();

  const upcomingInterviews =
    eventRows.filter(
      (event) =>
        event.date &&
        event.date >= now
    ).length;

  const completedInterviews =
    eventRows.filter(
      (event) =>
        event.date &&
        event.date < now
    ).length;

  /* ================================================================
     GOALS
  ================================================================ */

  const goalsCompleted =
    goals.filter(
      (goal) =>
        goal.completed === true
    ).length;

  const goalCompletion = pct(
    goalsCompleted,
    goals.length
  );

  const goalsByPeriod = useMemo(() => {
    const map = {};

    goals.forEach((goal) => {
      const period =
        goal.period
          ? String(goal.period)
          : "Other";

      if (!map[period]) {
        map[period] = {
          period,
          total: 0,
          completed: 0,
        };
      }

      map[period].total++;

      if (goal.completed === true) {
        map[period].completed++;
      }
    });

    return Object.values(map);
  }, [goals]);

  /* ================================================================
     RESUME / ATS
  ================================================================ */

  const resumeRows = useMemo(() => {
    return resumes
      .map((resume) => ({
        ...resume,

        date:
          toDate(resume.createdAt) ||
          toDate(resume.updatedAt),
      }))
      .sort(
        (a, b) =>
          (b.date?.getTime() || 0) -
          (a.date?.getTime() || 0)
      );
  }, [resumes]);

  const currentResume = useMemo(() => {
    return (
      resumeRows.find(
        (resume) =>
          resume.isCurrent === true
      ) ||
      resumeRows[0] ||
      null
    );
  }, [resumeRows]);

  /*
     This only reads ATS scores if they are actually
     stored inside the resume documents.
  */
  const atsHistory = useMemo(() => {
    return resumeRows
      .filter(
        (resume) =>
          typeof resume.atsScore ===
            "number" ||
          typeof resume.score ===
            "number"
      )
      .map((resume) => ({
        date: resume.date
          ? prettyDay(
              dayKey(resume.date)
            )
          : "—",

        score:
          typeof resume.atsScore ===
          "number"
            ? resume.atsScore
            : resume.score,
      }))
      .reverse();
  }, [resumeRows]);

  const latestAts =
    atsHistory.length > 0
      ? atsHistory[
          atsHistory.length - 1
        ].score
      : null;

  /* ================================================================
     PLACEMENT READINESS
  ================================================================ */

  /*
     These are transparent progress indicators based on
     actual user data.

     They are not an official placement probability.
  */

  const dsaReadiness = Math.min(
    solved.length,
    100
  );

  const applicationReadiness =
    Math.min(
      companyRows.length * 20,
      100
    );

  const interviewReadiness =
    prepProgress;

  const activityReadiness =
    upcomingInterviews > 0
      ? 100
      : eventRows.length > 0
      ? 50
      : 0;

  const goalsReadiness =
    goals.length > 0
      ? goalCompletion
      : 0;

  const readiness = Math.round(
    dsaReadiness * 0.3 +
      applicationReadiness * 0.2 +
      interviewReadiness * 0.2 +
      activityReadiness * 0.15 +
      goalsReadiness * 0.15
  );

  /* ================================================================
     WEEKLY ACTIVITY
  ================================================================ */

  const weekly = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - i
      );

      days.push({
        key: dayKey(date),
        date: prettyDay(
          dayKey(date)
        ),
        DSA: 0,
        Interview: 0,
        Applications: 0,
      });
    }

    const index = new Map(
      days.map((day) => [
        day.key,
        day,
      ])
    );

    solved.forEach((problem) => {
      if (!problem.date) return;

      const day =
        index.get(
          dayKey(problem.date)
        );

      if (day) {
        day.DSA++;
      }
    });

    prepared.forEach((answer) => {
      if (!answer.date) return;

      const day =
        index.get(
          dayKey(answer.date)
        );

      if (day) {
        day.Interview++;
      }
    });

    companyRows.forEach((company) => {
      if (!company.date) return;

      const day =
        index.get(
          dayKey(company.date)
        );

      if (day) {
        day.Applications++;
      }
    });

    return days;
  }, [solved, prepared, companyRows]);

  const weeklyHasData = weekly.some(
    (day) =>
      day.DSA ||
      day.Interview ||
      day.Applications
  );

  /* ================================================================
     RECENT ACTIVITY
  ================================================================ */

  const recent = useMemo(() => {
    const items = [];

    solved.forEach((problem) => {
      items.push({
        icon: "💻",

        text: `Solved ${
          problem.problemName ||
          "a DSA problem"
        }`,

        date: problem.date,
      });
    });

    prepared.forEach((answer) => {
      items.push({
        icon: "🎤",

        text: `Prepared ${
          answer.category
            ? `${answer.category} `
            : ""
        }interview question`,

        date: answer.date,
      });
    });

    companyRows.forEach((company) => {
      items.push({
        icon: "🏢",

        text: `Applied to ${
          company.companyName ||
          "a company"
        }`,

        date: company.date,
      });
    });

    goals
      .filter(
        (goal) =>
          goal.completed === true
      )
      .forEach((goal) => {
        items.push({
          icon: "🎯",

          text: `Completed goal: ${
            goal.goalText || "goal"
          }`,

          date: toDate(
            goal.completedAt
          ) ||
            toDate(
              goal.updatedAt
            ) ||
            toDate(
              goal.createdAt
            ),
        });
      });

    return items
      .filter((item) => item.date)
      .sort(
        (a, b) =>
          b.date - a.date
      )
      .slice(0, 8);
  }, [
    solved,
    prepared,
    companyRows,
    goals,
  ]);

  /* ================================================================
     SUGGESTIONS
  ================================================================ */

  const suggestions = [];

  if (dsaReadiness < 50) {
    suggestions.push(
      "Keep building your DSA practice."
    );
  }

  if (interviewReadiness < 50) {
    suggestions.push(
      "Prepare more interview questions."
    );
  }

  if (companyRows.length < 5) {
    suggestions.push(
      "Start tracking more placement applications."
    );
  }

  if (
    goals.length > 0 &&
    goalCompletion < 100
  ) {
    suggestions.push(
      "Focus on completing your current goals."
    );
  }

  if (latestAts === null) {
    suggestions.push(
      "Run an ATS analysis on your resume to see how it scores."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "You're on track — keep up the consistency."
    );
  }

  /* ================================================================
     PREPARATION ACTIVITY TREND
  ================================================================ */

  /*
     IMPORTANT:
     This is NOT pretending to be historical placement
     readiness.

     It measures actual recorded preparation activity:
     DSA + interview preparation + applications.
  */

  const activityTrend = useMemo(() => {
    const map = new Map();

    function addActivity(
      date,
      weight
    ) {
      if (!date) return;

      const key = dayKey(date);

      if (!key) return;

      map.set(
        key,
        (map.get(key) || 0) +
          weight
      );
    }

    solved.forEach((problem) => {
      if (
        problem.date &&
        inRange(problem.date)
      ) {
        addActivity(
          problem.date,
          1
        );
      }
    });

    prepared.forEach((answer) => {
      if (
        answer.date &&
        inRange(answer.date)
      ) {
        addActivity(
          answer.date,
          1
        );
      }
    });

    companyRows.forEach((company) => {
      if (
        company.date &&
        inRange(company.date)
      ) {
        addActivity(
          company.date,
          1
        );
      }
    });

    return Array.from(map.entries())
      .sort((a, b) =>
        a[0].localeCompare(b[0])
      )
      .map(([key, activity]) => ({
        date: prettyDay(key),
        key,
        activity,
      }));
  }, [
    solved,
    prepared,
    companyRows,
    rangeStart,
  ]);

  /* ================================================================
     LOADING
  ================================================================ */

  if (loading) {
    return (
      <div className="pp-analytics">
        <div className="pp-loading">
          Loading analytics…
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="pp-analytics">
        <div className="pp-loading">
          Please sign in to view your analytics.
        </div>
      </div>
    );
  }

  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <div className="pp-analytics">

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <header className="pp-header">
        <div>
          <p className="pp-eyebrow">
            Performance overview
          </p>

          <h1>
            Analytics
          </h1>

          <p className="pp-subtitle">
            Track your placement preparation,
            DSA progress, interview preparation
            and overall readiness.
          </p>
        </div>

        <div
          className="pp-filters"
          role="group"
          aria-label="Time range"
        >
          {[
            ["7d", "Last 7 Days"],
            ["30d", "Last 30 Days"],
            ["3m", "Last 3 Months"],
            ["all", "All Time"],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={`pp-chip ${
                  range === value
                    ? "is-active"
                    : ""
                }`}
                aria-pressed={
                  range === value
                }
                onClick={() =>
                  setRange(value)
                }
              >
                {label}
              </button>
            )
          )}
        </div>
      </header>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {error ? (
        <div className="pp-error">
          {error}
        </div>
      ) : null}

      {/* ==========================================================
          SECTION 1 — SUMMARY
      ========================================================== */}

      <div className="pp-stats">

        <StatCard
          label="Placement Readiness"
          value={`${readiness}%`}
          sub="Based on tracked preparation"
          accent="primary"
        />

        <StatCard
          label="Problems Solved"
          value={solved.length}
          sub={`${dsaInRange.length} in this period`}
        />

        <StatCard
          label="Current Streak"
          value={`${streaks.current} d`}
          sub={`Longest ${streaks.longest} d`}
        />

        <StatCard
          label="Interview Prep"
          value={`${prepared.length} / ${answerRows.length}`}
          sub={`${prepProgress}% prepared`}
        />

        <StatCard
          label="Applications"
          value={companyRows.length}
        />

        <StatCard
          label="Interviews"
          value={eventRows.length}
          sub={`${upcomingInterviews} upcoming`}
        />

      </div>

      {/* ==========================================================
          SECTION 2 — PLACEMENT READINESS
      ========================================================== */}

      <Card
        title="Placement Readiness"
        subtitle="A preparation indicator calculated from the data in your account."
        wide
      >
        <div className="pp-readiness">

          <div
            className="pp-radial"
            style={{
              "--angle": `${readiness * 3.6}deg`,
            }}
            role="img"
            aria-label={`Placement readiness ${readiness} percent`}
          >
            <div className="pp-radial__inner">

              <strong>
                {readiness}%
              </strong>

              <span>
                Ready
              </span>

            </div>
          </div>

          <div className="pp-readiness__bars">

            <ProgressRow
              label="DSA Progress"
              value={dsaReadiness}
            />

            <ProgressRow
              label="Interview Preparation"
              value={interviewReadiness}
            />

            <ProgressRow
              label="Placement Applications"
              value={applicationReadiness}
            />

            <ProgressRow
              label="Interview Activity"
              value={activityReadiness}
            />

            <ProgressRow
              label="Goals"
              value={goalsReadiness}
            />

          </div>
        </div>
      </Card>

      {/* ==========================================================
          SECTION 3 — DSA
      ========================================================== */}

      <div className="pp-grid">

        {/* DSA LINE CHART */}

        <Card
          title="DSA Progress Over Time"
          subtitle="Problems solved per day."
          wide
        >
          {dsaOverTime.length === 0 ? (
            <Empty
              text="No solved DSA activity in this period."
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={280}
            >
              <LineChart
                data={dsaOverTime}
                margin={{
                  top: 10,
                  right: 16,
                  bottom: 0,
                  left: -16,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="count"
                  name="Problems solved"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* DIFFICULTY */}

        <Card title="Difficulty Distribution">

          {difficultyData.length === 0 ? (
            <Empty
              text="No solved problems yet."
            />
          ) : (
            <>
              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <PieChart>

                  <Pie
                    data={difficultyData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {difficultyData.map(
                      (entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={
                            PIE_COLORS[
                              index %
                                PIE_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>
              </ResponsiveContainer>

              <ul className="pp-legend-list">
                {difficultyData.map(
                  (item) => (
                    <li
                      key={item.name}
                    >
                      <span>
                        {item.name}
                      </span>

                      <strong>
                        {item.value}
                      </strong>
                    </li>
                  )
                )}
              </ul>
            </>
          )}

        </Card>

        {/* TOPICS */}

        <Card title="Topic-wise Progress">

          {topicData.length === 0 ? (
            <Empty
              text="No topics recorded yet."
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(
                220,
                topicData.length * 34
              )}
            >
              <BarChart
                data={topicData}
                layout="vertical"
                margin={{
                  left: 24,
                  right: 16,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="topic"
                  width={110}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  name="Solved"
                  fill="#06b6d4"
                  radius={[
                    0,
                    6,
                    6,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

        </Card>

        {/* STATUS */}

        <Card title="DSA Status">

          <div className="pp-three">

            <div>
              <strong>
                {statusCounts.Solved}
              </strong>

              <span>
                Solved
              </span>
            </div>

            <div>
              <strong>
                {statusCounts.Attempted}
              </strong>

              <span>
                Attempted
              </span>
            </div>

            <div>
              <strong>
                {statusCounts.Todo}
              </strong>

              <span>
                Todo
              </span>
            </div>

          </div>

          <div className="pp-streaks">

            <span>
              Current streak:{" "}
              <strong>
                {streaks.current} days
              </strong>
            </span>

            <span>
              Longest streak:{" "}
              <strong>
                {streaks.longest} days
              </strong>
            </span>

          </div>

        </Card>

        {/* HEATMAP */}

        <Card
          title="Activity Heatmap"
          subtitle="Your DSA activity by day."
          wide
        >
          {heatmap.length === 0 ? (
            <Empty
              text="No DSA activity yet."
            />
          ) : (
            <>
              <div className="pp-heatmap">

                {heatmap.map(
                  (cell) => (
                    <span
                      key={cell.key}
                      className={`pp-heat pp-heat--${heatLevel(
                        cell.count
                      )}`}
                      title={`${prettyDay(
                        cell.key
                      )} — ${
                        cell.count
                      } problem${
                        cell.count === 1
                          ? ""
                          : "s"
                      }`}
                      aria-label={`${prettyDay(
                        cell.key
                      )}, ${
                        cell.count
                      } problems`}
                    />
                  )
                )}

              </div>

              <div className="pp-heat-legend">

                <span>
                  Less
                </span>

                {[0, 1, 2, 3, 4].map(
                  (level) => (
                    <span
                      key={level}
                      className={`pp-heat pp-heat--${level}`}
                    />
                  )
                )}

                <span>
                  More
                </span>

              </div>
            </>
          )}
        </Card>

      </div>

      {/* ==========================================================
          SECTION 4 — APPLICATIONS
      ========================================================== */}

      <div className="pp-grid">

        {/* FUNNEL */}

        <Card title="Application Funnel">

          {funnel.applications === 0 ? (
            <Empty
              text="No applications tracked yet."
            />
          ) : (
            <div className="pp-funnel">

              {[
                [
                  "Applications",
                  funnel.applications,
                ],
                [
                  "Interviews",
                  funnel.interviews,
                ],
                [
                  "Selected",
                  funnel.selected,
                ],
              ].map(
                ([label, value]) => (
                  <div
                    key={label}
                    className="pp-funnel__row"
                  >
                    <span>
                      {label}
                    </span>

                    <div className="pp-funnel__bar">
                      <div
                        style={{
                          width: `${pct(
                            value,
                            funnel.applications
                          )}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {value}
                    </strong>
                  </div>
                )
              )}

            </div>
          )}

        </Card>

        {/* STATUS */}

        <Card title="Application Status">

          {appStatusData.length === 0 ? (
            <Empty
              text="No applications yet."
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <BarChart
                data={appStatusData}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  name="Companies"
                  fill="#6366f1"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

        </Card>

        {/* OVER TIME */}

        <Card
          title="Applications Over Time"
          wide
        >
          {appsOverTime.length === 0 ? (
            <Empty
              text="No applications in this period."
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <BarChart
                data={appsOverTime}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="count"
                  name="Applications"
                  fill="#22c55e"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

      </div>

      {/* ==========================================================
          SECTION 5 + 6 — INTERVIEW
      ========================================================== */}

      <div className="pp-grid">

        {/* INTERVIEW PREPARATION */}

        <Card title="Interview Preparation">

          <div className="pp-three">

            <div>
              <strong>
                {answerRows.length}
              </strong>

              <span>
                Questions
              </span>
            </div>

            <div>
              <strong>
                {prepared.length}
              </strong>

              <span>
                Prepared
              </span>
            </div>

            <div>
              <strong>
                {prepProgress}%
              </strong>

              <span>
                Progress
              </span>
            </div>

          </div>

          <ProgressRow
            label="Preparation progress"
            value={prepProgress}
          />

          {prepCategories.length >
          0 ? (
            <ul className="pp-badges">

              {prepCategories.map(
                (category) => (
                  <li
                    key={category.name}
                  >
                    {category.name} ·{" "}
                    {category.value}
                  </li>
                )
              )}

            </ul>
          ) : null}

          {prepOverTime.length >
          0 ? (
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <LineChart
                data={prepOverTime}
                margin={{
                  left: -16,
                  right: 16,
                  top: 12,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="count"
                  name="Questions prepared"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}

        </Card>

        {/* INTERVIEW ACTIVITY */}

        <Card title="Interview Activity">

          <div className="pp-three">

            <div>
              <strong>
                {upcomingInterviews}
              </strong>

              <span>
                Upcoming
              </span>
            </div>

            <div>
              <strong>
                {completedInterviews}
              </strong>

              <span>
                Completed
              </span>
            </div>

            <div>
              <strong>
                {eventRows.length}
              </strong>

              <span>
                Total
              </span>
            </div>

          </div>

          {eventRows.length === 0 ? (
            <Empty
              text="No interview activity yet."
            />
          ) : (
            <ul className="pp-timeline">

              {eventRows
                .slice(0, 5)
                .map((event) => (
                  <li key={event.id}>

                    <span className="pp-timeline__icon">
                      📅
                    </span>

                    <div>
                      <strong>
                        {event.title}
                      </strong>

                      <span>
                        {event.date
                          ? event.date.toLocaleString(
                              "en-IN"
                            )
                          : "No date"}
                      </span>
                    </div>

                  </li>
                ))}

            </ul>
          )}

        </Card>

        {/* GOALS */}

        <Card title="Goals">

          <div className="pp-three">

            <div>
              <strong>
                {goalsCompleted}
              </strong>

              <span>
                Completed
              </span>
            </div>

            <div>
              <strong>
                {goals.length}
              </strong>

              <span>
                Total
              </span>
            </div>

            <div>
              <strong>
                {goalCompletion}%
              </strong>

              <span>
                Completion
              </span>
            </div>

          </div>

          {goals.length === 0 ? (
            <Empty
              text="No goals yet."
            />
          ) : (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <BarChart
                data={goalsByPeriod}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  dataKey="period"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="total"
                  name="Total"
                  fill="#c7d2fe"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#6366f1"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>
          )}

        </Card>

        {/* RESUME / ATS */}

        <Card title="Resume & ATS">

          <div className="pp-three">

            <div>
              <strong>
                {resumeRows.length}
              </strong>

              <span>
                Versions
              </span>
            </div>

            <div>
              <strong>
                {currentResume
                  ? currentResume.name ||
                    currentResume.fileName ||
                    "Resume"
                  : "—"}
              </strong>

              <span>
                Current resume
              </span>
            </div>

            <div>
              <strong>
                {latestAts !== null
                  ? latestAts
                  : "Not analyzed"}
              </strong>

              <span>
                Latest ATS score
              </span>
            </div>

          </div>

          {atsHistory.length > 1 ? (
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <LineChart
                data={atsHistory}
                margin={{
                  left: -16,
                  right: 16,
                  top: 12,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--pp-grid)"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  name="ATS score"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : null}

        </Card>

      </div>

      {/* ==========================================================
          SECTION 9 — WEEKLY ACTIVITY
      ========================================================== */}

      <Card
        title="Weekly Activity"
        subtitle="Your actual preparation activity during the last 7 days."
        wide
      >
        {!weeklyHasData ? (
          <Empty
            text="No activity in the last 7 days."
          />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={260}
          >
            <BarChart
              data={weekly}
              margin={{
                left: -16,
                right: 16,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pp-grid)"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 12,
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 12,
                }}
              />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="DSA"
                stackId="activity"
                name="DSA"
                fill="#6366f1"
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
              />

              <Bar
                dataKey="Interview"
                stackId="activity"
                name="Interview"
                fill="#f59e0b"
              />

              <Bar
                dataKey="Applications"
                stackId="activity"
                name="Applications"
                fill="#22c55e"
              />

            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ==========================================================
          SECTION 10 + 11
      ========================================================== */}

      <div className="pp-grid">

        {/* RECENT ACTIVITY */}

        <Card title="Recent Activity">

          {recent.length === 0 ? (
            <Empty
              text="No recent activity."
            />
          ) : (
            <ul className="pp-timeline">

              {recent.map(
                (item, index) => (
                  <li
                    key={`${item.text}-${index}`}
                  >

                    <span className="pp-timeline__icon">
                      {item.icon}
                    </span>

                    <div>
                      <strong>
                        {item.text}
                      </strong>

                      <span>
                        {item.date
                          ? item.date.toLocaleDateString(
                              "en-IN"
                            )
                          : "—"}
                      </span>
                    </div>

                  </li>
                )
              )}

            </ul>
          )}

        </Card>

        {/* AREAS TO IMPROVE */}

        <Card title="Areas to Improve">

          <ul className="pp-tips">

            {suggestions.map(
              (suggestion) => (
                <li key={suggestion}>
                  {suggestion}
                </li>
              )
            )}

          </ul>

        </Card>

      </div>

      {/* ==========================================================
          SECTION 12 — PREPARATION ACTIVITY TREND
      ========================================================== */}

      <Card
        title="Preparation Activity Trend"
        subtitle="Actual DSA, interview-preparation and application activity recorded over time."
        wide
      >
        {activityTrend.length < 2 ? (
          <Empty
            text="Not enough historical activity data yet."
          />
        ) : (
          <ResponsiveContainer
            width="100%"
            height={280}
          >
            <LineChart
              data={activityTrend}
              margin={{
                left: -16,
                right: 16,
                top: 12,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--pp-grid)"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 12,
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 12,
                }}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="activity"
                name="Preparation activity"
                stroke="#6366f1"
                strokeWidth={3}
                dot
              />

            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

    </div>
  );
}