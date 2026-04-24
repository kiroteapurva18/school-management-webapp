import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const roleNavItems = {
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/students", label: "Students" },
    { to: "/attendance", label: "Attendance" },
    { to: "/timetable", label: "Timetable" },
    { to: "/notifications", label: "Notifications" },
    { to: "/results", label: "Results" },
    { to: "/fees", label: "Fees" },
    { to: "/my-day", label: "My Day" }
  ],
  teacher: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/students", label: "Students" },
    { to: "/attendance", label: "Attendance" },
    { to: "/assignments", label: "Assignments" },
    { to: "/timetable", label: "Timetable" },
    { to: "/leave-requests", label: "Leave Requests" },
    { to: "/results", label: "Results" },
    { to: "/my-day", label: "My Day" }
  ],
  student: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/assignments", label: "Assignments" },
    { to: "/timetable", label: "Timetable" },
    { to: "/notifications", label: "Notifications" }
  ],
  parent: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/notifications", label: "Notifications" },
    { to: "/leave-requests", label: "Leave Requests" },
    { to: "/results", label: "Results" },
    { to: "/fees", label: "Fees" }
  ]
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = roleNavItems[user?.role] || [{ to: "/dashboard", label: "Dashboard" }];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <h1 className="text-lg font-bold">School Management</h1>
        {user && (
          <nav className="flex items-center gap-4 text-sm">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
            <span className="rounded bg-slate-700 px-2 py-1 capitalize">{user.role}</span>
            <button onClick={handleLogout} className="rounded bg-red-600 px-3 py-1 hover:bg-red-700">
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
