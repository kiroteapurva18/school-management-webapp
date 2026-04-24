import { useEffect, useState } from "react";
import api from "../../services/api";

const LeaveRequestsTab = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });

  const fetchTeacherItems = async () => {
    setLoading(true);
    const { data } = await api.get("/leave-request/teacher");
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "teacher" || user?.role === "admin") fetchTeacherItems().catch(() => setLoading(false));
  }, [user?.role]);

  const submitParent = async (e) => {
    e.preventDefault();
    await api.post("/leave-request", form);
    setForm({ fromDate: "", toDate: "", reason: "" });
  };

  const updateStatus = async (id, status) => {
    await api.put(`/leave-request/${id}`, { status });
    fetchTeacherItems();
  };

  if (user?.role === "parent") {
    return (
      <form onSubmit={submitParent} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-3">
        <input type="date" className="rounded border p-2" value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))} required />
        <input type="date" className="rounded border p-2" value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} required />
        <input className="rounded border p-2 md:col-span-2" placeholder="Reason" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} required />
        <button className="rounded bg-blue-600 p-2 text-white">Submit Leave Request</button>
      </form>
    );
  }

  if (loading) return <p className="text-sm text-slate-600">Loading...</p>;
  if (!items.length) return <p className="text-sm text-slate-600">No leave requests</p>;
  return (
    <div className="overflow-x-auto rounded border bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2">Student</th><th className="border p-2">Parent</th><th className="border p-2">Class</th><th className="border p-2">Dates</th><th className="border p-2">Reason</th><th className="border p-2">Status</th><th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r._id}>
              <td className="border p-2">{r.studentName}</td>
              <td className="border p-2">{r.parentName || "Parent"}</td>
              <td className="border p-2">{r.class}-{r.division}</td>
              <td className="border p-2">{new Date(r.fromDate).toLocaleDateString()} - {new Date(r.toDate).toLocaleDateString()}</td>
              <td className="border p-2">{r.reason}</td>
              <td className="border p-2">{r.status}</td>
              <td className="border p-2">
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(r._id, "Approved")} className="rounded bg-emerald-600 px-2 py-1 text-white">Approve</button>
                  <button onClick={() => updateStatus(r._id, "Rejected")} className="rounded bg-red-600 px-2 py-1 text-white">Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveRequestsTab;
