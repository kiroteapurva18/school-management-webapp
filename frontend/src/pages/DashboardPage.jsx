import useAuth from "../hooks/useAuth";

const roleConfig = {
  admin: ["Manage users", "Oversee students/teachers", "Review all modules"],
  teacher: ["Track attendance", "Create assignments", "Manage students", "View today's timetable"],
  student: ["View assignments", "Track attendance status", "View timetable"],
  parent: ["Monitor child records", "View attendance", "View child timetable"]
};

const DashboardPage = () => {
  const { user } = useAuth();
  const tasks = roleConfig[user?.role] || [];

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-1 text-slate-600">
          You are logged in as <span className="font-semibold capitalize">{user?.role}</span>.
        </p>
      </div>
      <div className="rounded bg-white p-6 shadow">
        <h3 className="mb-3 text-xl font-semibold">Role Based Actions</h3>
        <ul className="list-inside list-disc space-y-2 text-slate-700">
          {tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DashboardPage;
