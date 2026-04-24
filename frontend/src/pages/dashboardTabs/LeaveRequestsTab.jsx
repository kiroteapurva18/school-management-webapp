import { useEffect, useState } from "react";
import api from "../../services/api";

const LeaveRequestsTab = ({ user }) => {
  const [items, setItems] = useState([]);
  const [parentItems, setParentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });

  const fetchTeacherItems = async () => {
    setLoading(true);
    const { data } = await api.get("/leave-request/teacher");
    console.log("Teacher leave requests API response:", data);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "teacher") fetchTeacherItems().catch(() => setLoading(false));
    if (user?.role === "parent") {
      api.get("/leave-request/my").then(({ data }) => setParentItems(data)).catch(() => setParentItems([]));
    }
  }, [user?.role]);

  const submitParent = async (e) => {
    e.preventDefault();
    const payload = {
      studentId: user?.studentId,
      studentName: user?.studentName,
      parentId: user?.id,
      parentName: user?.parentDisplayName,
      class: user?.childClass,
      division: user?.childDivision,
      fromDate: form.fromDate,
      toDate: form.toDate,
      reason: form.reason
    };
    console.log("Leave request frontend payload:", payload);
    const { data } = await api.post("/leave-request", payload);
    console.log("Leave request API response:", data);
    setForm({ fromDate: "", toDate: "", reason: "" });
    alert("Leave Request Submitted Successfully");
    api.get("/leave-request/my").then(({ data }) => setParentItems(data)).catch(() => setParentItems([]));
  };

  const updateStatus = async (id, status) => {
    const { data } = await api.put(`/leave-request/${id}`, { status });
    console.log("Leave request status update response:", data);
    alert(`Leave Request ${status}`);
    fetchTeacherItems();
  };

  if (user?.role === "parent") {
    return (
      <div className="space-y-3">
        <div className="rounded border bg-white p-4">
          <h3 className="text-lg font-semibold">Welcome, {user?.parentDisplayName || "Parent Dashboard"}</h3>
          <p className="text-sm text-slate-600">
            Student: {user?.studentName || "Loading student details..."}
            {user?.childClass ? ` | Class: ${user.childClass}` : ""}
            {user?.childDivision ? ` | Division: ${user.childDivision}` : ""}
          </p>
        </div>
        <form onSubmit={submitParent} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-3">
          <input type="date" className="rounded border p-2" value={form.fromDate} onChange={(e) => setForm((p) => ({ ...p, fromDate: e.target.value }))} required />
          <input type="date" className="rounded border p-2" value={form.toDate} onChange={(e) => setForm((p) => ({ ...p, toDate: e.target.value }))} required />
          <input className="rounded border p-2 md:col-span-2" placeholder="Reason" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} required />
          <button className="rounded bg-blue-600 p-2 text-white">Submit Leave Request</button>
        </form>
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2">Dates</th><th className="border p-2">Reason</th><th className="border p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {parentItems.map((item) => (
                <tr key={item._id}>
                  <td className="border p-2">{new Date(item.fromDate).toLocaleDateString()} - {new Date(item.toDate).toLocaleDateString()}</td>
                  <td className="border p-2">{item.reason}</td>
                  <td className="border p-2">
                    <span className={`rounded px-2 py-1 text-xs ${item.status === "Approved" ? "bg-emerald-100 text-emerald-700" : item.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
              <td className="border p-2">
                <span className={`rounded px-2 py-1 text-xs ${r.status === "Approved" ? "bg-emerald-100 text-emerald-700" : r.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {r.status}
                </span>
              </td>
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
