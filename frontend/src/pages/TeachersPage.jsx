import { useEffect, useState } from "react";
import api from "../services/api";

const initialForm = { name: "", subject: "", email: "" };

const TeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const fetchTeachers = async () => {
    const { data } = await api.get("/teachers");
    setTeachers(data);
  };

  useEffect(() => {
    fetchTeachers().catch(() => setError("Failed to load teachers"));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/teachers/${editingId}`, form);
      } else {
        await api.post("/teachers", form);
      }
      setForm(initialForm);
      setEditingId(null);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save teacher");
    }
  };

  const startEdit = (teacher) => {
    setForm(teacher);
    setEditingId(teacher._id);
  };

  const remove = async (id) => {
    try {
      await api.delete(`/teachers/${id}`);
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete teacher");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Teacher Management</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Object.keys(initialForm).map((key) => (
            <input key={key} name={key} value={form[key]} onChange={handleChange} placeholder={key} className="rounded border p-2" required />
          ))}
          <button className="rounded bg-blue-600 p-2 text-white">{editingId ? "Update" : "Add"} Teacher</button>
        </form>
      </div>
      <div className="rounded bg-white p-6 shadow">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2">Name</th><th className="border p-2">Subject</th><th className="border p-2">Email</th><th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t._id}>
                  <td className="border p-2">{t.name}</td>
                  <td className="border p-2">{t.subject}</td>
                  <td className="border p-2">{t.email}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(t)} className="rounded bg-amber-500 px-2 py-1 text-white">Edit</button>
                      <button onClick={() => remove(t._id)} className="rounded bg-red-600 px-2 py-1 text-white">Delete</button>
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

export default TeachersPage;
