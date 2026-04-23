import { useEffect, useState } from "react";
import api from "../services/api";

const initialForm = { name: "", class: "", rollNumber: "", email: "" };

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchStudents = async () => {
    const { data } = await api.get("/students");
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents().catch(() => setError("Failed to load students"));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, form);
      } else {
        await api.post("/students", form);
      }
      setForm(initialForm);
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save student");
    }
  };

  const startEdit = (student) => {
    setForm(student);
    setEditingId(student._id);
  };

  const remove = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Student Management</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Object.keys(initialForm).map((key) => (
            <input
              key={key}
              name={key}
              value={form[key]}
              onChange={handleChange}
              placeholder={key}
              className="rounded border p-2"
              required
            />
          ))}
          <button className="rounded bg-blue-600 p-2 text-white">{editingId ? "Update" : "Add"} Student</button>
        </form>
      </div>
      <div className="rounded bg-white p-6 shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2">Name</th><th className="border p-2">Class</th><th className="border p-2">Roll Number</th><th className="border p-2">Email</th><th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">{s.class}</td>
                  <td className="border p-2">{s.rollNumber}</td>
                  <td className="border p-2">{s.email}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(s)} className="rounded bg-amber-500 px-2 py-1 text-white">Edit</button>
                      <button onClick={() => remove(s._id)} className="rounded bg-red-600 px-2 py-1 text-white">Delete</button>
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

export default StudentsPage;
