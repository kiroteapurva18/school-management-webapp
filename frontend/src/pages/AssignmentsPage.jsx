import { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import { mapDivision } from "../utils/division";

const initialForm = { title: "", subject: "", class: "", division: "", description: "" };

const AssignmentsPage = () => {
  const { user } = useAuth();
  const canManageAssignments = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [upload, setUpload] = useState({ homeworkId: "", file: null });
  const [error, setError] = useState("");

  const fetchAssignments = async () => {
    const { data } = await api.get("/homework");
    console.log("Assignment/Homework fetch response:", data);
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
      await api.post("/homework", { ...form, division: mapDivision(form.division) });
      setForm(initialForm);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save assignment");
    }
  };

  const uploadSubmission = async (e) => {
    e.preventDefault();
    if (!isStudent || !upload.homeworkId || !upload.file) return;
    try {
      const fd = new FormData();
      fd.append("homeworkId", upload.homeworkId);
      fd.append("file", upload.file);
      await api.post("/homework/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setUpload({ homeworkId: "", file: null });
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload homework");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Assignment Management</h2>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {canManageAssignments ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="rounded border p-2" required />
            <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" className="rounded border p-2" required />
            <input name="class" value={form.class} onChange={handleChange} placeholder="Class" className="rounded border p-2" required />
            <input name="division" value={form.division} onChange={handleChange} placeholder="Division" className="rounded border p-2" required />
            <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="rounded border p-2" required />
            <button className="rounded bg-blue-600 p-2 text-white md:col-span-3">Create Assignment</button>
          </form>
        ) : isStudent ? (
          <form onSubmit={uploadSubmission} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <select className="rounded border p-2" value={upload.homeworkId} onChange={(e) => setUpload((p) => ({ ...p, homeworkId: e.target.value }))} required>
              <option value="">Select Assignment</option>
              {assignments.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
            </select>
            <input type="file" accept="application/pdf" className="rounded border p-2" onChange={(e) => setUpload((p) => ({ ...p, file: e.target.files?.[0] || null }))} required />
            <button className="rounded bg-blue-600 p-2 text-white">Upload Homework PDF</button>
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
                <th className="border p-2">Title</th><th className="border p-2">Subject</th><th className="border p-2">Class</th><th className="border p-2">Division</th><th className="border p-2">Description</th><th className="border p-2">Submission</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id}>
                  <td className="border p-2">{a.title}</td>
                  <td className="border p-2">{a.subject}</td>
                  <td className="border p-2">{a.class}</td>
                  <td className="border p-2">{a.division}</td>
                  <td className="border p-2">{a.description}</td>
                  <td className="border p-2">
                    {a.studentSubmissionPdf ? <a href={a.studentSubmissionPdf} target="_blank" rel="noreferrer" className="text-blue-600">View PDF</a> : <span className="text-sm text-slate-500">Not submitted</span>}
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
