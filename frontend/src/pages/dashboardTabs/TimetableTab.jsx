import { useEffect, useState } from "react";
import api from "../../services/api";
import { mapDivision } from "../../utils/division";
import { DAYS } from "../../constants/timetable";



const TimetableTab = ({ user }) => {
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slotForm, setSlotForm] = useState({ id: "", subject: "", teacherId: "", substituteTeacherId: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getTeacherName = (row) => {
    return row.teacherName?.trim() || "Teacher";
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (user?.role === "teacher") {
        const { data } = await api.get("/timetable/teacher");
        setRows(data?.length ? data : []);
      } else if (user?.role === "student") {
        const className = user?.className || user?.class;
        const division = (user?.division || "").toUpperCase();
        const mappedDivision = mapDivision(division);
        const { data } = await api.get("/timetable/student");
        setRows(data?.timetable?.length ? data.timetable : []);
      } else if (user?.role === "parent" && user?.childClass && user?.childDivision) {
        const { data } = await api.get(`/timetable/class/${encodeURIComponent(user.childClass)}/division/${encodeURIComponent(user.childDivision)}`);
        setRows(data?.length ? data : []);
      } else if (user?.role === "admin") {
        const [dayRes, teachersRes] = await Promise.all([api.get(`/timetable/day/${DAYS[0]}`), api.get("/teachers")]);
        setRows(dayRes.data?.length ? dayRes.data : []);
        setTeachers(teachersRes.data || []);
      } else {
        setRows([]);
      }
    } catch (err) {
      setError("");
      setRows([]);
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
  const classLabel = classValues.length === 1 ? classValues[0] : classValues[0] || user?.className || user?.class || "N/A";
  const divisionLabel = divisionValues.length === 1 ? divisionValues[0] : divisionValues[0] || user?.division || "N/A";

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
