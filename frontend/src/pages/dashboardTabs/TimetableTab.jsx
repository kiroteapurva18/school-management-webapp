import { useEffect, useState } from "react";
import api from "../../services/api";
import { mapDivision } from "../../utils/division";
import { DAYS } from "../../constants/timetable";

const DEFAULT_SCHEDULE = [
  { startTime: "10:00", endTime: "11:00", subject: "English" },
  { startTime: "11:00", endTime: "12:00", subject: "Mathematics" },
  { startTime: "12:00", endTime: "13:00", subject: "Science" },
  { startTime: "13:00", endTime: "14:00", subject: "Lunch Break", teacherName: "-" },
  { startTime: "14:00", endTime: "15:00", subject: "Social Studies" },
  { startTime: "15:00", endTime: "16:00", subject: "Computer" },
  { startTime: "16:00", endTime: "17:00", subject: "Hindi / Marathi" }
];

const buildDefaultTimetable = (className, division) =>
  DAYS.flatMap((day, dayIndex) =>
    DEFAULT_SCHEDULE.map((slot, index) => {
      const rotateIndex = (index + dayIndex) % DEFAULT_SCHEDULE.length;
      const rotated = DEFAULT_SCHEDULE[rotateIndex];
      return {
        _id: `default-${day}-${slot.startTime}`,
        day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject === "Lunch Break" ? "Lunch Break" : rotated.subject,
        teacherName: slot.subject === "Lunch Break" ? "-" : "Assigned Teacher",
        class: className || "N/A",
        division: division || "N/A",
        displayDivision: division || "N/A"
      };
    })
  );

const TimetableTab = ({ user }) => {
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slotForm, setSlotForm] = useState({ id: "", subject: "", teacherId: "", substituteTeacherId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left">Day</th>
            <th className="border p-2 text-left">Time</th>
            <th className="border p-2 text-left">Subject</th>
            <th className="border p-2 text-left">Teacher</th>
            <th className="border p-2 text-left">Class</th>
            <th className="border p-2 text-left">Division</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].sort((a, b) => `${a.day}${a.startTime}`.localeCompare(`${b.day}${b.startTime}`)).map((row) => (
            <tr key={row._id}>
              <td className="border p-2">{row.day}</td>
              <td className={`border p-2 ${row.startTime === "13:00" && row.endTime === "14:00" ? "bg-amber-100 font-semibold" : ""}`}>{row.startTime} - {row.endTime}</td>
              <td className="border p-2">{row.subject || "N/A"}</td>
              <td className="border p-2">{row.teacherName || "Teacher"}</td>
              <td className="border p-2">{row.class}</td>
              <td className="border p-2">{row.displayDivision || row.division}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableTab;
