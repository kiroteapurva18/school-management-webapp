import { useEffect, useState } from "react";
import api from "../../services/api";

const NotificationsTab = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", message: "", type: "holiday", holidayDate: "", class: "", division: "" });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await api.get("/notifications");
    console.log("Notifications API response:", data);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData().catch(() => setLoading(false));
  }, []);

  const canCreate = user?.role === "admin";
  const create = async (e) => {
    e.preventDefault();
    await api.post("/notifications", form);
    setForm({ title: "", message: "", type: "holiday", holidayDate: "", class: "", division: "" });
    fetchData();
  };

  const remove = async (id) => {
    const { data } = await api.delete(`/notifications/${id}`);
    setItems((prev) => prev.filter((item) => item._id !== id));
    alert(data.message || "Notification deleted successfully");
  };

  return (
    <div className="space-y-4">
      {canCreate && (
        <form onSubmit={create} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-4">
          <input className="rounded border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className="rounded border p-2 md:col-span-2" placeholder="Message" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required />
          <select className="rounded border p-2" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="holiday">Holiday</option>
            <option value="general">General</option>
          </select>
          {form.type === "holiday" && <input type="date" className="rounded border p-2" value={form.holidayDate} onChange={(e) => setForm((p) => ({ ...p, holidayDate: e.target.value }))} />}
          <input className="rounded border p-2" placeholder="Class (optional)" value={form.class} onChange={(e) => setForm((p) => ({ ...p, class: e.target.value }))} />
          <input className="rounded border p-2" placeholder="Division (optional)" value={form.division} onChange={(e) => setForm((p) => ({ ...p, division: e.target.value }))} />
          <button className="rounded bg-blue-600 p-2 text-white">Publish</button>
        </form>
      )}
      {loading ? <p className="text-sm text-slate-600">Loading...</p> : !items.length ? <p className="text-sm text-slate-600">No notifications</p> : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n._id} className="rounded border bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{n.title}</p>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">{n.type}</span>
              </div>
              <p className="text-sm text-slate-700">{n.message}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                {canCreate && (
                  <button onClick={() => remove(n._id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
