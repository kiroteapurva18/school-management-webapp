import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { DAYS } from "../constants/timetable";
import { mapDivision } from "../utils/division";

const roleConfig = {
  admin: ["Manage users", "Oversee students/teachers", "Review all modules"],
  teacher: ["Track attendance", "Create assignments", "Manage students", "View today's timetable"],
  student: ["View assignments", "Track attendance status", "View timetable"],
  parent: ["Monitor child records", "View attendance", "View child timetable"]
};

const DashboardPage = () => {
  const { user } = useAuth();
  const tasks = roleConfig[user?.role] || [];
  const [notifications, setNotifications] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ fromDate: "", toDate: "", reason: "" });
  const [homeworkForm, setHomeworkForm] = useState({ title: "", message: "", class: "1", division: "A" });
  const [adminNoticeForm, setAdminNoticeForm] = useState({ title: "", message: "", type: "holiday", holidayDate: "" });
  const [timetableForm, setTimetableForm] = useState({ id: "", subject: "", teacherId: "", substituteTeacherId: "" });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchNotifications = async () => {
    const { data } = await api.get("/notifications");
    setNotifications(data);
  };

  const fetchTeacherLeaveRequests = async () => {
    const { data } = await api.get("/leave-request/teacher");
    setLeaveRequests(data);
  };

  const fetchAdminData = async () => {
    const [teacherRes, slotRes] = await Promise.all([
      api.get("/timetable/teachers"),
      api.get(`/timetable/day/${DAYS[0]}`)
    ]);
    setTeachers(teacherRes.data);
    setSlots(slotRes.data);
  };

  useEffect(() => {
    if (!user?.role) return;
    setLoading(true);
    const jobs = [fetchNotifications()];
    if (user.role === "teacher" || user.role === "admin") jobs.push(fetchTeacherLeaveRequests());
    if (user.role === "admin") jobs.push(fetchAdminData());
    Promise.all(jobs).catch(() => {}).finally(() => setLoading(false));
  }, [user?.role]);

  const submitLeaveRequest = async (e) => {
    e.preventDefault();
    await api.post("/leave-request", leaveForm);
    setLeaveForm({ fromDate: "", toDate: "", reason: "" });
    showToast("Leave request submitted");
  };

  const updateLeaveStatus = async (id, status) => {
    await api.put(`/leave-request/${id}`, { status });
    setLeaveRequests((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
    showToast(`Request ${status.toLowerCase()}`);
  };

  const createHomework = async (e) => {
    e.preventDefault();
    await api.post("/notifications", {
      title: homeworkForm.title,
      message: homeworkForm.message,
      type: "homework",
      class: homeworkForm.class,
      division: mapDivision(homeworkForm.division)
    });
    setHomeworkForm({ title: "", message: "", class: "1", division: "A" });
    await fetchNotifications();
    showToast("Homework notification sent");
  };

  const createAdminNotice = async (e) => {
    e.preventDefault();
    await api.post("/notifications", adminNoticeForm);
    setAdminNoticeForm({ title: "", message: "", type: "holiday", holidayDate: "" });
    await fetchNotifications();
    showToast("Notification created");
  };

  const updateTimetableSlot = async (e) => {
    e.preventDefault();
    await api.put("/timetable/update", {
      ...timetableForm,
      substituteTeacherId: timetableForm.substituteTeacherId || null
    });
    showToast("Timetable updated");
  };

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-1 text-slate-600">
          You are logged in as <span className="font-semibold capitalize">{user?.role}</span>.
        </p>
      </div>
      <div className="rounded bg-white p-6 shadow">
        <h3 className="mb-3 text-xl font-semibold">Role Based Actions</h3>
        <ul className="list-inside list-disc space-y-2 text-slate-700">
          {tasks.map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </div>
      {toast && <div className="rounded bg-emerald-600 p-3 text-sm text-white">{toast}</div>}

      {["student", "parent", "teacher"].includes(user?.role) && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-xl font-semibold">Notifications</h3>
          {loading ? (
            <p className="text-sm text-slate-600">Loading...</p>
          ) : notifications.length ? (
            <div className="space-y-2">
              {notifications.map((item) => (
                <div key={item._id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.title}</p>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase">{item.type}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No notifications yet.</p>
          )}
        </div>
      )}

      {user?.role === "parent" && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-xl font-semibold">Leave Request</h3>
          <form onSubmit={submitLeaveRequest} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="date" required className="rounded border p-2" value={leaveForm.fromDate} onChange={(e) => setLeaveForm((p) => ({ ...p, fromDate: e.target.value }))} />
            <input type="date" required className="rounded border p-2" value={leaveForm.toDate} onChange={(e) => setLeaveForm((p) => ({ ...p, toDate: e.target.value }))} />
            <input required placeholder="Reason" className="rounded border p-2 md:col-span-2" value={leaveForm.reason} onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))} />
            <button className="rounded bg-blue-600 p-2 text-white">Submit Leave</button>
          </form>
        </div>
      )}

      {(user?.role === "teacher" || user?.role === "admin") && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-xl font-semibold">Leave Requests</h3>
          {!leaveRequests.length ? (
            <p className="text-sm text-slate-600">No leave requests.</p>
          ) : (
            <div className="space-y-2">
              {leaveRequests.map((item) => (
                <div key={item._id} className="rounded border p-3">
                  <p className="font-semibold">{item.studentName} ({item.class}-{item.division})</p>
                  <p className="text-sm text-slate-600">Parent: {item.parentName || "Parent"}</p>
                  <p className="text-sm text-slate-600">{new Date(item.fromDate).toLocaleDateString()} - {new Date(item.toDate).toLocaleDateString()}</p>
                  <p className="text-sm">{item.reason}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded px-2 py-1 text-xs ${item.status === "Approved" ? "bg-emerald-100 text-emerald-700" : item.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.status}</span>
                    <button onClick={() => updateLeaveStatus(item._id, "Approved")} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button>
                    <button onClick={() => updateLeaveStatus(item._id, "Rejected")} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {user?.role === "teacher" && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-xl font-semibold">Homework Notification</h3>
          <form onSubmit={createHomework} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input required placeholder="Title" className="rounded border p-2" value={homeworkForm.title} onChange={(e) => setHomeworkForm((p) => ({ ...p, title: e.target.value }))} />
            <input required placeholder="Message" className="rounded border p-2 md:col-span-2" value={homeworkForm.message} onChange={(e) => setHomeworkForm((p) => ({ ...p, message: e.target.value }))} />
            <input required placeholder="Class" className="rounded border p-2" value={homeworkForm.class} onChange={(e) => setHomeworkForm((p) => ({ ...p, class: e.target.value }))} />
            <select className="rounded border p-2" value={homeworkForm.division} onChange={(e) => setHomeworkForm((p) => ({ ...p, division: e.target.value }))}>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
            <button className="rounded bg-blue-600 p-2 text-white">Post Homework</button>
          </form>
        </div>
      )}

      {user?.role === "admin" && (
        <>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-semibold">Create Admin Notification</h3>
            <form onSubmit={createAdminNotice} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input required placeholder="Title" className="rounded border p-2" value={adminNoticeForm.title} onChange={(e) => setAdminNoticeForm((p) => ({ ...p, title: e.target.value }))} />
              <input required placeholder="Message" className="rounded border p-2 md:col-span-2" value={adminNoticeForm.message} onChange={(e) => setAdminNoticeForm((p) => ({ ...p, message: e.target.value }))} />
              <select className="rounded border p-2" value={adminNoticeForm.type} onChange={(e) => setAdminNoticeForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="holiday">Holiday</option>
                <option value="general">General</option>
              </select>
              {adminNoticeForm.type === "holiday" && (
                <input type="date" className="rounded border p-2" value={adminNoticeForm.holidayDate} onChange={(e) => setAdminNoticeForm((p) => ({ ...p, holidayDate: e.target.value }))} />
              )}
              <button className="rounded bg-blue-600 p-2 text-white">Publish</button>
            </form>
          </div>
          <div className="rounded bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-semibold">Timetable Editor</h3>
            <form onSubmit={updateTimetableSlot} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <select required className="rounded border p-2" value={timetableForm.id} onChange={(e) => setTimetableForm((p) => ({ ...p, id: e.target.value }))}>
                <option value="">Select Slot</option>
                {slots.map((slot) => (
                  <option key={slot._id} value={slot._id}>{slot.day} {slot.startTime}-{slot.endTime} C{slot.class}{slot.division}</option>
                ))}
              </select>
              <input placeholder="Subject" className="rounded border p-2" value={timetableForm.subject} onChange={(e) => setTimetableForm((p) => ({ ...p, subject: e.target.value }))} />
              <select className="rounded border p-2" value={timetableForm.teacherId} onChange={(e) => setTimetableForm((p) => ({ ...p, teacherId: e.target.value }))}>
                <option value="">Main Teacher</option>
                {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
              </select>
              <select className="rounded border p-2" value={timetableForm.substituteTeacherId} onChange={(e) => setTimetableForm((p) => ({ ...p, substituteTeacherId: e.target.value }))}>
                <option value="">No Substitute</option>
                {teachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
              </select>
              <button className="rounded bg-blue-600 p-2 text-white">Update Slot</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
