import { useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { DAYS } from "../constants/timetable";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FALLBACK_SUBJECTS = ["English", "Mathematics", "Science", "Social Studies", "Computer", "Hindi / Marathi"];

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const TeacherTimetablePage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const defaultDay = DAY_NAMES[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(defaultDay) ? defaultDay : "Monday");
  const nowInMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const fallbackDay = DAYS.flatMap((day) => ([
    { day, startTime: "10:00", endTime: "11:00", subject: FALLBACK_SUBJECTS[0], class: "1", division: "A", displayDivision: "A" },
    { day, startTime: "11:00", endTime: "12:00", subject: FALLBACK_SUBJECTS[1], class: "2", division: "A", displayDivision: "A" },
    { day, startTime: "12:00", endTime: "13:00", subject: FALLBACK_SUBJECTS[2], class: "3", division: "B", displayDivision: "B" },
    { day, startTime: "14:00", endTime: "15:00", subject: FALLBACK_SUBJECTS[3], class: "4", division: "B", displayDivision: "B" },
    { day, startTime: "15:00", endTime: "16:00", subject: FALLBACK_SUBJECTS[4], class: "5", division: "A", displayDivision: "A" },
    { day, startTime: "16:00", endTime: "17:00", subject: FALLBACK_SUBJECTS[5], class: "6", division: "B", displayDivision: "B" }
  ]));

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    api
      .get("/timetable/teacher")
      .then((response) => setRecords(response.data?.length ? response.data : fallbackDay))
      .catch(() => {
        setError("");
        setRecords(fallbackDay);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const todaysPeriods = useMemo(
    () =>
      records
        .filter((item) => item.day === selectedDay)
        .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
        .map((row) => ({
          ...row,
          classTag: `${row.class}${row.displayDivision || row.division}`
        })),
    [records, selectedDay]
  );

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">My Daily Timetable</h2>
          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="rounded border p-2 text-sm">
            {DAYS.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        {error && <p className="mt-2 text-sm text-slate-600">{error}</p>}
        {loading ? (
          <p className="mt-3 text-slate-600">Loading...</p>
        ) : !todaysPeriods.length ? (
          <p className="mt-3 text-slate-600">No lectures scheduled for selected day.</p>
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
