import { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const TeacherTimetablePage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  const today = DAY_NAMES[new Date().getDay()];
  const nowInMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  useEffect(() => {
    if (!user?.id) return;
    api
      .get(`/timetable/teacher/${user.id}`)
      .then((response) => setRecords(response.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load teacher timetable"));
  }, [user?.id]);

  const todaysPeriods = useMemo(() => {
    const dayRecord = records.find((item) => item.day === today);
    if (!dayRecord) return [];
    return [...dayRecord.periods]
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
      .map((period) => ({
        ...period,
        classTag: `${dayRecord.class}-${dayRecord.division}`
      }));
  }, [records, today]);

  const getStatus = (period) => {
    const start = toMinutes(period.startTime);
    const end = toMinutes(period.endTime);
    if (nowInMinutes >= start && nowInMinutes < end) return "current";
    if (start > nowInMinutes) return "next";
    return "done";
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-xl font-bold">My Daily Timetable - {today}</h2>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!todaysPeriods.length ? (
          <p className="mt-3 text-slate-600">No lectures scheduled for today.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {todaysPeriods.map((period) => {
              const status = getStatus(period);
              const className =
                status === "current"
                  ? "border-green-300 bg-green-50"
                  : status === "next"
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white";
              return (
                <div key={`${period.startTime}-${period.subject}`} className={`rounded border p-3 ${className}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{period.subject}</p>
                    <span className="text-sm text-slate-600">{period.startTime} - {period.endTime}</span>
                  </div>
                  <p className="text-sm text-slate-600">Class: {period.classTag}</p>
                  {status === "current" && <p className="text-sm font-medium text-green-700">Ongoing now</p>}
                  {status === "next" && <p className="text-sm font-medium text-blue-700">Next lecture</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherTimetablePage;
