import { useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import TimetableTab from "./dashboardTabs/TimetableTab";
import NotificationsTab from "./dashboardTabs/NotificationsTab";
import LeaveRequestsTab from "./dashboardTabs/LeaveRequestsTab";
import ResultsTab from "./dashboardTabs/ResultsTab";
import FeesTab from "./dashboardTabs/FeesTab";
import HomeworkTab from "./dashboardTabs/HomeworkTab";

const DashboardPage = () => {
  const { user } = useAuth();
  const tabs = useMemo(() => {
    const common = [
      { id: "attendance", label: "Attendance" },
      { id: "homework", label: "Assignments / Homework" },
      { id: "timetable", label: "Timetable" }
    ];
    if (user?.role === "student") return [...common, { id: "notifications", label: "Notifications" }, { id: "results", label: "Results" }];
    if (user?.role === "parent") return [...common, { id: "notifications", label: "Notifications" }, { id: "leave", label: "Leave Requests" }, { id: "results", label: "Results" }, { id: "fees", label: "Fees & Payment" }];
    if (user?.role === "teacher") return [...common, { id: "notifications", label: "Notifications" }, { id: "leave", label: "Leave Requests" }, { id: "results", label: "Results" }];
    if (user?.role === "admin") return [...common, { id: "notifications", label: "Notifications" }, { id: "leave", label: "Leave Requests" }, { id: "results", label: "Results" }, { id: "fees", label: "Fees & Payment" }];
    return common;
  }, [user?.role]);
  const [activeTab, setActiveTab] = useState("timetable");

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-1 text-slate-600">
          You are logged in as <span className="font-semibold capitalize">{user?.role}</span>.
        </p>
      </div>
      <div className="rounded bg-white p-3 shadow">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-3 py-1.5 text-sm ${activeTab === tab.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded bg-slate-50 p-4">
        {activeTab === "attendance" && <p className="text-sm text-slate-600">Attendance tools are available in the Attendance page for staff users.</p>}
        {activeTab === "homework" && <HomeworkTab user={user} />}
        {activeTab === "timetable" && <TimetableTab user={user} />}
        {activeTab === "notifications" && <NotificationsTab user={user} />}
        {activeTab === "leave" && <LeaveRequestsTab user={user} />}
        {activeTab === "results" && <ResultsTab user={user} />}
        {activeTab === "fees" && <FeesTab user={user} />}
      </div>
    </div>
  );
};

export default DashboardPage;
