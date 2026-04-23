import { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";

const initialForm = { title: "", description: "", dueDate: "" };

const AssignmentsPage = () => {
  const { user } = useAuth();
  const canManageAssignments = user?.role === "admin" || user?.role === "teacher";
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchAssignments = async () => {
    const { data } = await api.get("/assignments");
    setAssignments(data);
  };

  useEffect(() => {
    fetchAssignments().catch(() => setError("Failed to load assignments"));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManageAssignments) return;
    try {
      if (editingId) {
        await api.put(`/assignments/${editingId}`, form);
      } else {
        await api.post("/assignments", form);
      }
      setForm(initialForm);
      setEditingId(null);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save assignment");
    }
  };

  const editAssignment = (assignment) => {
    setForm({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate?.slice(0, 10)
    });
    setEditingId(assignment._id);
  };

  const remove = async (id) => {
    if (!canManageAssignments) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete assignment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Assignment Management</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {canManageAssignments ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="rounded border p-2" required />
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="rounded border p-2" required />
            <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="rounded border p-2" required />
            <button className="rounded bg-blue-600 p-2 text-white md:col-span-2">{editingId ? "Update" : "Create"} Assignment</button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">You can view assignments only.</p>
        )}
      </div>
      <div className="rounded bg-white p-6 shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2">Title</th><th className="border p-2">Description</th><th className="border p-2">Due Date</th><th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id}>
                  <td className="border p-2">{a.title}</td>
                  <td className="border p-2">{a.description}</td>
                  <td className="border p-2">{new Date(a.dueDate).toLocaleDateString()}</td>
                  <td className="border p-2">
                    {canManageAssignments ? (
                      <div className="flex gap-2">
                        <button onClick={() => editAssignment(a)} className="rounded bg-amber-500 px-2 py-1 text-white">Edit</button>
                        <button onClick={() => remove(a._id)} className="rounded bg-red-600 px-2 py-1 text-white">Delete</button>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">View only</span>
                    )}
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

export default AssignmentsPage;
