import { useEffect, useState } from "react";
import api from "../../services/api";

const FeesTab = ({ user }) => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ studentId: "", amount: "", dueDate: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user?.role === "admin") {
        const [feesRes, studentsRes] = await Promise.all([
          api.get("/fees"),
          api.get("/students")
        ]);
        setFees(feesRes.data);
        setStudents(studentsRes.data);
      } else if (user?.role === "parent" || user?.role === "student") {
        const studentId = user?.studentId || user?.id; // Parent has studentId in auth context, Student has id
        if (studentId) {
          const feesRes = await api.get(`/fees/student/${studentId}`);
          setFees(feesRes.data);
        }
      }
    } catch (error) {
      console.error("Error fetching fees data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post("/fees", {
        studentId: form.studentId,
        amount: Number(form.amount),
        dueDate: form.dueDate
      });
      setFees([res.data, ...fees]);
      setForm({ studentId: "", amount: "", dueDate: "" });
    } catch (error) {
      console.error("Error adding fee:", error);
      alert("Failed to add fee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (feeId) => {
    try {
      const res = await api.put(`/fees/${feeId}/pay`);
      setFees(fees.map((f) => (f._id === feeId ? res.data : f)));
    } catch (error) {
      console.error("Error marking fee as paid:", error);
      alert("Failed to mark as paid");
    }
  };

  if (loading) {
    return <div className="text-slate-600 p-4">Loading fees...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {user?.role === "admin" && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Add New Fee</h3>
          <form onSubmit={handleAddFee} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <select
              className="rounded-md border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.studentId}
              onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} - {student.class} (Roll: {student.rollNumber})
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              type="number"
              placeholder="Amount (Rs)"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              required
              min="1"
            />
            <input
              className="rounded-md border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              required
            />
            <button
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Submit Fee"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {user?.role === "admin" ? "All Fees Records" : "My Fees"}
          </h3>
        </div>
        
        {fees.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No fee records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                <tr>
                  {user?.role === "admin" && <th className="px-6 py-3 font-medium">Student</th>}
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Due Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  {user?.role === "admin" && <th className="px-6 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                    {user?.role === "admin" && (
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{fee.studentId?.name || 'N/A'}</div>
                        <div className="text-xs text-slate-500">
                          {fee.studentId?.class} | Roll: {fee.studentId?.rollNumber}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 font-medium text-slate-800">Rs {fee.amount}</td>
                    <td className="px-6 py-4">{new Date(fee.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fee.status === "Paid" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {fee.status}
                      </span>
                      {fee.status === "Paid" && fee.paidAt && (
                        <div className="text-[10px] text-slate-500 mt-1">
                          on {new Date(fee.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-6 py-4 text-right">
                        {fee.status === "Pending" ? (
                          <button
                            onClick={() => handleMarkPaid(fee._id)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Paid</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeesTab;
