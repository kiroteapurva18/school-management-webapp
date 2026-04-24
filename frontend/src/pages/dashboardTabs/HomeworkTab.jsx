import { useEffect, useState } from "react";
import api from "../../services/api";

const HomeworkTab = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", subject: "", class: "", division: "", description: "" });
  const [submission, setSubmission] = useState({ homeworkId: "", file: null });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get("/homework");
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { fetchData().catch(() => setLoading(false)); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/homework", form);
    setForm({ title: "", subject: "", class: "", division: "", description: "" });
    fetchData();
  };

  const uploadSubmission = async (e) => {
    e.preventDefault();
    if (!submission.homeworkId || !submission.file) return;
    const fd = new FormData();
    fd.append("homeworkId", submission.homeworkId);
    fd.append("file", submission.file);
    await api.post("/homework/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setSubmission({ homeworkId: "", file: null });
    fetchData();
  };

  return (
    <div className="space-y-4">
      {user?.role === "teacher" && (
        <form onSubmit={create} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-3">
          <input className="rounded border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className="rounded border p-2" placeholder="Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required />
          <input className="rounded border p-2" placeholder="Class" value={form.class} onChange={(e) => setForm((p) => ({ ...p, class: e.target.value }))} required />
          <input className="rounded border p-2" placeholder="Division" value={form.division} onChange={(e) => setForm((p) => ({ ...p, division: e.target.value }))} required />
          <input className="rounded border p-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          <button className="rounded bg-blue-600 p-2 text-white">Add Homework</button>
        </form>
      )}

      {(user?.role === "student") && (
        <form onSubmit={uploadSubmission} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-3">
          <select className="rounded border p-2" value={submission.homeworkId} onChange={(e) => setSubmission((p) => ({ ...p, homeworkId: e.target.value }))} required>
            <option value="">Select Homework</option>
            {items.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select>
          <input className="rounded border p-2" type="file" accept="application/pdf" onChange={(e) => setSubmission((p) => ({ ...p, file: e.target.files?.[0] || null }))} required />
          <button className="rounded bg-blue-600 p-2 text-white">Upload PDF Submission</button>
        </form>
      )}

      {loading ? <p className="text-sm text-slate-600">Loading...</p> : !items.length ? <p className="text-sm text-slate-600">No data available</p> : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="rounded border bg-white p-3">
              <p className="font-semibold">{item.title} ({item.subject})</p>
              <p className="text-sm text-slate-600">Class {item.class}-{item.division}</p>
              <p className="text-sm">{item.description}</p>
              {item.studentSubmissionPdf && <a className="text-sm text-blue-600" href={item.studentSubmissionPdf} target="_blank" rel="noreferrer">View submission</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeworkTab;
