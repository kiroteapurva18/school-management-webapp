import { useEffect, useState } from "react";
import api from "../services/api";

const initialForm = { studentEmail: "", date: "", status: "Present" };

const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [attendanceRes, studentsRes] = await Promise.all([api.get("/attendance"), api.get("/students")]);
    setRecords(attendanceRes.data);
    setStudents(studentsRes.data);
  };

  useEffect(() => {
    fetchData().catch(() => setError("Failed to load attendance data"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/attendance/${editingId}`, form);
      } else {
        await api.post("/attendance", form);
      }
      setForm(initialForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save attendance");
    }
  };

  const editRecord = (record) => {
    setForm({
      studentEmail: record.studentEmail || "",
      date: record.date?.slice(0, 10),
      status: record.status
    });
    setEditingId(record._id);
  };

  const remove = async (id) => {
    try {
      await api.delete(`/attendance/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete attendance");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Attendance Tracking</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select className="rounded border p-2" value={form.studentEmail} onChange={(e) => setForm((p) => ({ ...p, studentEmail: e.target.value }))} required>
            <option value="">Select Student Email</option>
            {students.map((s) => (
              <option key={s._id} value={s.email}>{s.email}</option>
            ))}
          </select>
          <input type="date" className="rounded border p-2" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          <select className="rounded border p-2" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
          <button className="rounded bg-blue-600 p-2 text-white">{editingId ? "Update" : "Mark"} Attendance</button>
        </form>
      </div>
      <div className="rounded bg-white p-6 shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2">Student Email</th><th className="border p-2">Date</th><th className="border p-2">Status</th><th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td className="border p-2">{r.studentEmail}</td>
                  <td className="border p-2">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="border p-2">{r.status}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button onClick={() => editRecord(r)} className="rounded bg-amber-500 px-2 py-1 text-white">Edit</button>
                      <button onClick={() => remove(r._id)} className="rounded bg-red-600 px-2 py-1 text-white">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
