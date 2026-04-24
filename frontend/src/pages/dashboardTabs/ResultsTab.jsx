import { useEffect, useState } from "react";
import api from "../../services/api";

const ResultsTab = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ class: "", division: "", percentage: "" });
  const [file, setFile] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get("/results/student");
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { fetchData().catch(() => setLoading(false)); }, []);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("class", form.class);
    fd.append("division", form.division);
    if (form.percentage) fd.append("percentage", form.percentage);
    await api.post("/results/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setForm({ class: "", division: "", percentage: "" });
    setFile(null);
    fetchData();
  };

  return (
    <div className="space-y-4">
      {user?.role === "teacher" && (
        <form onSubmit={upload} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="Class" value={form.class} onChange={(e) => setForm((p) => ({ ...p, class: e.target.value }))} required />
          <input className="rounded border p-2" placeholder="Division" value={form.division} onChange={(e) => setForm((p) => ({ ...p, division: e.target.value }))} required />
          <input className="rounded border p-2" placeholder="Percentage" type="number" min="0" max="100" value={form.percentage} onChange={(e) => setForm((p) => ({ ...p, percentage: e.target.value }))} />
          <input className="rounded border p-2" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          <button className="rounded bg-blue-600 p-2 text-white">Upload Result PDF</button>
        </form>
      )}
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : !items.length ? <p className="text-sm text-slate-600">No data available</p> : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r._id} className="rounded border bg-white p-3">
              <p className="font-semibold">Class {r.class}-{r.division}</p>
              <p className="text-sm text-slate-700">Percentage: {r.percentage ?? "N/A"}%</p>
              <a className="text-sm text-blue-600" href={r.resultPdfUrl} target="_blank" rel="noreferrer">View Result PDF</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsTab;
