import useAuth from "../hooks/useAuth";
import TimetableTab from "./dashboardTabs/TimetableTab";

const TimetablePage = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Timetable</h2>
      </div>
      <TimetableTab user={user} />
    </div>
  );
};

export default TimetablePage;
