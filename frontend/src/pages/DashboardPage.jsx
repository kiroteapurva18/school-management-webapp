import useAuth from "../hooks/useAuth";

const DashboardPage = () => {
  const { user } = useAuth();
  const classValue = user?.className || user?.class || null;
  const divisionValue = user?.division || null;

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-2 text-slate-700">
          Class: {classValue || "Class/Division not available"}
        </p>
        <p className="text-slate-700">
          Division: {divisionValue || "Class/Division not available"}
        </p>
        <p className="mt-1 text-slate-600">
          You are logged in as <span className="font-semibold capitalize">{user?.role}</span>.
        </p>
      </div>
      <div className="rounded bg-white p-6 shadow">
        <p className="text-slate-700">
          Use the top navigation to open `Attendance`, `Assignments`, `Timetable`, `Notifications`, `Leave Requests`, `Results`, and `Fees`.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
