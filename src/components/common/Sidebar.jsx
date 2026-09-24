import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/dsa", label: "DSA Tracker", icon: "💻" },
  { path: "/companies", label: "Companies", icon: "🏢" },
  { path: "/resume", label: "Resume Manager", icon: "📄" },
  { path: "/ats", label: "ATS Analyzer", icon: "🤖" },
  { path: "/interview", label: "Interview Prep", icon: "🎤" },
  { path: "/calendar", label: "Calendar", icon: "📅" },

  // NEW
  { path: "/ai-doubt", label: "AI Doubt Solver", icon: "🧠" },

  { path: "/goals", label: "Goals", icon: "🎯" },
  { path: "/notes", label: "Notes", icon: "📝" },
  { path: "/analytics", label: "Analytics", icon: "📈" },
  { path: "/profile", label: "Profile", icon: "👤" }
];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>PrepPilot</h2>
        <p>Placement Companion</p>
      </div>

      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;