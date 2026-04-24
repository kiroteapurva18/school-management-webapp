import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuth from "./hooks/useAuth";
import AssignmentsPage from "./pages/AssignmentsPage";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentsPage from "./pages/StudentsPage";
import TeachersPage from "./pages/TeachersPage";
import TeacherTimetablePage from "./pages/TeacherTimetablePage";
import TimetablePage from "./pages/TimetablePage";
import NotificationsPage from "./pages/NotificationsPage";
import LeaveRequestsPage from "./pages/LeaveRequestsPage";
import ResultsPage from "./pages/ResultsPage";
import FeesPage from "./pages/FeesPage";

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="mx-auto max-w-7xl p-4">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher"]}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher", "student", "parent"]}>
                <AssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute allowedRoles={["admin", "teacher", "student", "parent"]}>
                <TimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-timetable"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherTimetablePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["admin", "student", "parent"]}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-requests"
            element={
              <ProtectedRoute allowedRoles={["parent", "teacher", "admin"]}>
                <LeaveRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results"
            element={
              <ProtectedRoute allowedRoles={["parent", "teacher", "student"]}>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fees"
            element={
              <ProtectedRoute allowedRoles={["parent", "admin", "student"]}>
                <FeesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
