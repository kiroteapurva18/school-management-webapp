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
  Wednesday: ["Science", "English", "Mathematics", "Lunch Break", "Social Studies", "Computer", "Marathi"],
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

  const getTeacherName = (row) => {
    const raw = row.teacherName?.trim();
    if (!raw || raw === "Assigned Teacher") {
      return SUBJECT_TEACHER_MAP[row.subject] || "Teacher";
    }
    return raw;
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (user?.role === "teacher") {
        const { data } = await api.get("/timetable/teacher");
        console.log("Teacher timetable response:", data);
        setRows(data?.length ? data : buildDefaultTimetable(user?.className, user?.division));
      } else if (user?.role === "student") {
        const className = user?.className || user?.class;
        const division = (user?.division || "").toUpperCase();
        const mappedDivision = mapDivision(division);
        console.log("user.class:", className);
        console.log("user.division:", division);
        console.log("mapped division:", mappedDivision);
        console.log("Student timetable fetch with:", { className, division: mappedDivision });
        const { data } = await api.get("/timetable/student");
        console.log("Student timetable response:", data);
        setRows(data?.timetable?.length ? data.timetable : buildDefaultTimetable(className, division || "A"));
      } else if (user?.role === "parent" && user?.childClass && user?.childDivision) {
        const { data } = await api.get(`/timetable/class/${encodeURIComponent(user.childClass)}/division/${encodeURIComponent(user.childDivision)}`);
        setRows(data?.length ? data : buildDefaultTimetable(user?.childClass, user?.childDivision));
      } else if (user?.role === "admin") {
        const [dayRes, teachersRes] = await Promise.all([api.get(`/timetable/day/${DAYS[0]}`), api.get("/timetable/teachers")]);
        setRows(dayRes.data?.length ? dayRes.data : buildDefaultTimetable("1", "A"));
        setTeachers(teachersRes.data || []);
      } else {
        setRows(buildDefaultTimetable(user?.className || "1", (user?.division || "A").toUpperCase()));
      }
    } catch (err) {
      setError("");
      setRows(buildDefaultTimetable(user?.className || user?.class || "1", (user?.division || "A").toUpperCase()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

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

  const classValues = [...new Set(sortedRows.map((row) => row.class).filter(Boolean))];
  const divisionValues = [...new Set(sortedRows.map((row) => row.displayDivision || row.division).filter(Boolean))];
  const classLabel = classValues.length === 1 ? classValues[0] : classValues[0] || "8";
  const divisionLabel = divisionValues.length === 1 ? divisionValues[0] : divisionValues[0] || "B";

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
        Class: <span className="font-semibold">{classLabel}</span> | Division: <span className="font-semibold">{divisionLabel}</span>
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
          {grouped.map((group) =>
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
                <td className={`border p-2 ${row.subject === "Lunch Break" ? "bg-amber-100 font-semibold" : ""}`}>{row.subject || "English"}</td>
                <td className="border p-2">{getTeacherName(row)}</td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableTab;
