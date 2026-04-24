import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { DAYS, TIME_SLOTS } from "../../constants/timetable";
import { mapDivision } from "../../utils/division";

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
        setRows(data || []);
      } else if (user?.role === "student") {
        const className = user?.className;
        const division = mapDivision(user?.division);
        console.log("Student timetable fetch with:", { className, division });
        const { data } = await api.get("/timetable/student");
        console.log("Student timetable response:", data);
        setRows(data?.timetable || []);
      } else if (user?.role === "parent" && user?.childClass && user?.childDivision) {
        const { data } = await api.get(`/timetable/class/${encodeURIComponent(user.childClass)}/division/${encodeURIComponent(user.childDivision)}`);
        setRows(data || []);
      } else if (user?.role === "admin") {
        const [dayRes, teachersRes] = await Promise.all([api.get(`/timetable/day/${DAYS[0]}`), api.get("/timetable/teachers")]);
        setRows(dayRes.data || []);
        setTeachers(teachersRes.data || []);
      } else {
        setRows([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "No timetable available");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const normalized = useMemo(() => {
    const map = {};
    rows.forEach((row) => {
      const day = row.day;
      const key = `${row.startTime}-${row.endTime}`;
      if (!map[day]) map[day] = {};
      map[day][key] = row;
    });
    return map;
  }, [rows]);

  if (loading) return <p className="text-sm text-slate-600">Loading...</p>;
  if (error) return <p className="text-sm text-slate-600">{error}</p>;
  if (!rows.length) return <p className="text-sm text-slate-600">No timetable available</p>;

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
            {TIME_SLOTS.map((slot) => (
              <th key={`${slot.startTime}-${slot.endTime}`} className={`border p-2 text-left ${slot.isLunch ? "bg-amber-100" : ""}`}>
                {slot.startTime}-{slot.endTime}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="border p-2 font-semibold">{day}</td>
              {TIME_SLOTS.map((slot) => {
                const key = `${slot.startTime}-${slot.endTime}`;
                const row = normalized[day]?.[key];
                return (
                  <td key={`${day}-${key}`} className="border p-2 align-top">
                    {slot.isLunch ? (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Lunch Break</span>
                    ) : row ? (
                      <>
                        <p className="font-medium">{row.subject}</p>
                        <p className="text-xs text-slate-600">{row.teacherName || "Teacher"}</p>
                        {user?.role === "teacher" && (
                          <p className="text-xs text-slate-500">Class {row.class}-{row.displayDivision || row.division}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimetableTab;
