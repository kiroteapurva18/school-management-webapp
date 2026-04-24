import { useEffect, useState } from "react";
import api from "../../services/api";

const FeesTab = ({ user }) => {
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ studentId: "", examFees: 800, pendingFees: 0, status: "Pending" });

  const fetchFee = async () => {
    setLoading(true);
    const { data } = await api.get("/fees/student");
    setFee(data);
    setLoading(false);
  };

  useEffect(() => { fetchFee().catch(() => setLoading(false)); }, []);

  const saveFee = async (e) => {
    e.preventDefault();
    await api.put("/fees/update", form);
    fetchFee();
  };

  return (
    <div className="space-y-4">
      {(user?.role === "parent" || user?.role === "student") && (
        loading ? <p className="text-sm text-slate-600">Loading...</p> : !fee ? <p className="text-sm text-slate-600">No data available</p> : (
          <div className="rounded border bg-white p-4">
            <p>Exam Fees: Rs {fee.examFees}</p>
            <p>Pending Fees: Rs {fee.pendingFees}</p>
            <p className="font-semibold">Total Due: Rs {fee.totalDue}</p>
            <p className={`mt-1 inline-block rounded px-2 py-1 text-xs ${Number(fee.pendingFees) === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {Number(fee.pendingFees) === 0 ? "Fees Clear" : "Pending"}
            </p>
          </div>
        )
      )}
      {user?.role === "admin" && (
        <form onSubmit={saveFee} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))} required />
          <input className="rounded border p-2" type="number" placeholder="Exam Fees" value={form.examFees} onChange={(e) => setForm((p) => ({ ...p, examFees: Number(e.target.value) }))} />
          <input className="rounded border p-2" type="number" placeholder="Pending Fees" value={form.pendingFees} onChange={(e) => setForm((p) => ({ ...p, pendingFees: Number(e.target.value) }))} />
          <select className="rounded border p-2" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
          <button className="rounded bg-blue-600 p-2 text-white">Save Fees</button>
        </form>
      )}
    </div>
  );
};

export default FeesTab;
