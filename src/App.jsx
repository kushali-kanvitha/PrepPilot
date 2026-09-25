import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DsaTracker from "./pages/DsaTracker";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import CompanyTracker from "./pages/CompanyTracker";
import Dashboard from "./pages/Dashboard";
import ResumeManager from "./pages/ResumeManager";
import ATSAnalyzer from "./pages/ATSAnalyzer";
import InterviewPrep from "./pages/InterviewPrep";
import Calendar from "./pages/Calendar";
import Goals from "./pages/Goals";
import Notes from "./pages/Notes";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Layout from "./components/common/Layout";
import AIDoubtSolver from "./pages/AIDoubtSolver";
import ForgotPassword from "./pages/auth/ForgotPassword";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  }
/>
    <Route
  path="/dsa"
  element={
    <ProtectedRoute>
      <Layout>
      <DsaTracker />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Layout>
      <Profile />
      </Layout>
    </ProtectedRoute>
  }
/>
 
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/login" element={<Login />} />
  
<Route
  path="/ats"
  element={
    <ProtectedRoute>
      <Layout>
      <ATSAnalyzer />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/ai-doubt"
  element={
    <ProtectedRoute>
      <AIDoubtSolver />
    </ProtectedRoute>
  }
/>
<Route
  path="/calendar"
  element={
    <ProtectedRoute>
      <Layout>
      <Calendar />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Layout>
      <Analytics />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/resume"
  element={
    <ProtectedRoute>
      <Layout>
      <ResumeManager />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/companies"
  element={
    <ProtectedRoute>
      <Layout>
      <CompanyTracker />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/notes"
  element={
    <ProtectedRoute>
      <Layout>
      <Notes />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/goals"
  element={
    <ProtectedRoute>
      <Layout>
      <Goals />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route path="/login" element={<Login />} />
<Route
  path="/interview"
  element={
    <ProtectedRoute>
      <Layout>
      <InterviewPrep />
      </Layout>
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;