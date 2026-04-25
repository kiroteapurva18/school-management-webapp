import { useEffect, useState } from "react";
import api from "../../services/api";
import { mapDivision } from "../../utils/division";
import { DAYS } from "../../constants/timetable";

const SUBJECT_TEACHER_MAP = {
  History: "Mrs. Patil",
  Marathi: "Mr. Wankhede",
  PT: "Mr. Lanjulkar",
  Hindi: "Mr. Bhumbre",
  Geography: "Mrs. Satav",
  English: "Mr. Thakre",
  Science: "Mr. Manza",
  Mathematics: "Mr. Verma",
  "Social Studies": "Mrs. Satav",
  Computer: "Mr. Manza",
  "Hindi / Marathi": "Mr. Wankhede",
  "Lunch Break": "-"
};

const WEEKLY_SCHEDULE = {
  Monday: ["English", "Mathematics", "Science", "Lunch Break", "History", "Computer", "Hindi / Marathi"],
  Tuesday: ["Mathematics", "English", "Geography", "Lunch Break", "Science", "PT", "Hindi / Marathi"],
  Wednesday: ["Science", "English", "Mathematics", "Lunch Break", "History", "Computer", "Marathi"],
  Thursday: ["English", "Science", "Geography", "Lunch Break", "Mathematics", "Hindi", "PT"],
  Friday: ["Mathematics", "English", "Science", "Lunch Break", "History", "Computer", "Marathi"]
};

const TIME_SLOTS = [
  { startTime: "10:00", endTime: "11:00" },
  { startTime: "11:00", endTime: "12:00" },
  { startTime: "12:00", endTime: "13:00" },
  { startTime: "13:00", endTime: "14:00" },
  { startTime: "14:00", endTime: "15:00" },
  { startTime: "15:00", endTime: "16:00" },
  { startTime: "16:00", endTime: "17:00" }
];

const buildDefaultTimetable = (className, division) =>
  DAYS.flatMap((day) =>
    TIME_SLOTS.map((slot, index) => {
      const subject = WEEKLY_SCHEDULE[day][index];
      return {
        _id: `default-${day}-${slot.startTime}`,
        day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject,
        teacherName: SUBJECT_TEACHER_MAP[subject] || "Teacher",
        class: className || "8",
        division: division || "B",
        displayDivision: division || "B"
      };
    })
  );

const TimetableTab = ({ user }) => {
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slotForm, setSlotForm] = useState({ id: "", subject: "", teacherId: "", substituteTeacherId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cls, setCls] = useState("");
  const [div, setDiv] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        const userData = res.data;
        if (userData.role === "admin" || userData.role === "teacher") {
          setCls("8");
          setDiv("B");
        } else if (userData.role === "parent") {
          setCls(userData.childClass || "8");
          setDiv(userData.childDivision || "B");
        } else {
          setCls(userData.className || userData.class || "8");
          setDiv(userData.division || "B");
        }
      } catch (err) {
        console.error(err);
        setCls("8");
        setDiv("B");
      }
    };
    if (user) fetchUser();
  }, [user]);

  const getTeacherName = (row) => {
    const raw = row.teacherName?.trim();
    if (!raw || raw === "Teacher") {
      return SUBJECT_TEACHER_MAP[row.subject] || "Teacher";
    }
    return raw;
  };

  const loadData = async () => {
    if (!cls || !div) return;
    setLoading(true);
    setError("");
    console.log("Class:", cls);
    console.log("Division:", div);

    try {
      if (user?.role === "teacher") {
        const { data } = await api.get("/timetable/teacher");
        setRows(data?.length ? data : buildDefaultTimetable(cls, div));
      } else if (user?.role === "student") {
        const { data } = await api.get(`/timetable/class/${cls}/div/${div.toUpperCase()}`);
        setRows(data?.length ? data : buildDefaultTimetable(cls, div));
      } else if (user?.role === "parent") {
        const { data } = await api.get(`/timetable/class/${encodeURIComponent(cls)}/div/${encodeURIComponent(div.toUpperCase())}`);
        setRows(data?.length ? data : buildDefaultTimetable(cls, div));
      } else if (user?.role === "admin") {
        const [dayRes, teachersRes] = await Promise.all([api.get(`/timetable`), api.get("/teachers")]);
        setRows(dayRes.data?.length ? dayRes.data : buildDefaultTimetable(cls, div));
        setTeachers(teachersRes.data || []);
      } else {
        setRows(buildDefaultTimetable(cls, div));
      }
    } catch (err) {
      console.error(err);
      setError("");
      setRows(buildDefaultTimetable(cls, div));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cls, div, user]);

  if (loading) return <p className="text-sm text-slate-600">Loading...</p>;
  if (error) return <p className="text-sm text-slate-600">{error}</p>;

  const sortedRows = [...rows].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
  const grouped = DAYS.map((day) => ({
    day,
    rows: sortedRows.filter((row) => row.day === day)
  })).filter((group) => group.rows.length > 0);



  return (
    <div className="space-y-3">
      {user?.role === "admin" && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await api.put("/timetable/update", { ...slotForm, substituteTeacherId: slotForm.substituteTeacherId || null });
            await loadData();
          }}
          className="grid grid-cols-1 gap-2 rounded border bg-white p-3 md:grid-cols-5"
        >
          <select className="rounded border p-2" value={slotForm.id} onChange={(e) => setSlotForm((p) => ({ ...p, id: e.target.value }))} required>
            <option value="">Select Slot</option>
            {rows.map((row) => <option key={row._id} value={row._id}>{row.day} {row.startTime}-{row.endTime} C{row.class}{row.displayDivision || row.division}</option>)}
          </select>
          <input className="rounded border p-2" placeholder="Subject" value={slotForm.subject} onChange={(e) => setSlotForm((p) => ({ ...p, subject: e.target.value }))} />
          <select className="rounded border p-2" value={slotForm.teacherId} onChange={(e) => setSlotForm((p) => ({ ...p, teacherId: e.target.value }))}>
            <option value="">Main Teacher</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <select className="rounded border p-2" value={slotForm.substituteTeacherId} onChange={(e) => setSlotForm((p) => ({ ...p, substituteTeacherId: e.target.value }))}>
            <option value="">No Substitute</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <button className="rounded bg-blue-600 p-2 text-white">Update Slot</button>
        </form>
      )}
      <div className="rounded border bg-white px-4 py-2 text-sm text-slate-700">
        Class: <span className="font-semibold">{cls}</span> | Division: <span className="font-semibold">{div}</span>
      </div>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left">Day</th>
            <th className="border p-2 text-left">Time</th>
            <th className="border p-2 text-left">Subject</th>
            <th className="border p-2 text-left">Teacher</th>
          </tr>
        </thead>
        <tbody>
          {grouped.length === 0 ? (
            <tr>
              <td colSpan="4" className="border p-4 text-center text-slate-500">
                No timetable configured for this view.
              </td>
            </tr>
          ) : (
            grouped.map((group) =>
              group.rows.map((row, index) => (
                <tr key={row._id}>
                  {index === 0 && (
                    <td rowSpan={group.rows.length} className="border p-2 align-top font-semibold">
                      {group.day}
                    </td>
                  )}
                  <td className={`border p-2 ${row.startTime === "13:00" && row.endTime === "14:00" ? "bg-amber-100 font-semibold" : ""}`}>
                    {row.startTime} - {row.endTime}
                  </td>
                  <td className={`border p-2 ${row.subject === "Lunch Break" ? "bg-amber-100 font-semibold" : ""}`}>{row.subject || "N/A"}</td>
                  <td className="border p-2">{getTeacherName(row)}</td>
                </tr>
              ))
            )
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableTab;
