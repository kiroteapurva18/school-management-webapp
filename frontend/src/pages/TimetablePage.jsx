import { useEffect, useRef, useState } from "react";
import WeeklyTimetableTable from "../components/WeeklyTimetableTable";
import { CLASSES, DAYS, DIVISIONS } from "../constants/timetable";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const newEntry = { subject: "", teacherId: "", startTime: "10:00", endTime: "11:00" };

const TimetablePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";
  const cacheRef = useRef(new Map());

  const [selectedClass, setSelectedClass] = useState(isStudent ? "" : isParent ? "" : "1");
  const [selectedDivision, setSelectedDivision] = useState(isStudent ? "" : isParent ? "" : "A");
  const [studentProfile, setStudentProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    class: "1",
    division: "A",
    day: DAYS[0],
    entries: [{ ...newEntry }]
  });

  const fetchStudentTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/timetable/student");
      setStudentProfile(data.student);
      setSelectedClass(data.student.class);
      setSelectedDivision(data.student.division);
      setRecords(data.timetable);
      cacheRef.current.set(`student:${data.student.class}:${data.student.division}`, data.timetable);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load student timetable";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassTimetable = async (className, division, roleKey = "general") => {
    const cacheKey = `${roleKey}:${className}:${division}`;
    if (cacheRef.current.has(cacheKey)) {
      setRecords(cacheRef.current.get(cacheKey));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/timetable/class/${encodeURIComponent(className)}/division/${encodeURIComponent(division)}`);
      setRecords(data);
      cacheRef.current.set(cacheKey, data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    if (!isAdmin) return;
    const { data } = await api.get("/timetable/teachers");
    setTeachers(data);
  };

  useEffect(() => {
    if (isStudent) {
      fetchStudentTimetable();
      return;
    }
    if (isParent && user?.childClass && user?.childDivision) {
      setSelectedClass(user.childClass);
      setSelectedDivision(user.childDivision);
      fetchClassTimetable(user.childClass, user.childDivision, "parent");
      return;
    }
    if (!isStudent && !isParent && selectedClass && selectedDivision) {
      fetchClassTimetable(selectedClass, selectedDivision, user?.role || "general");
    }
    fetchTeachers().catch(() => {});
  }, [isStudent, isParent, selectedClass, selectedDivision, user?.role, user?.childClass, user?.childDivision]);

  const handleEntryChange = (index, field, value) => {
    setForm((prev) => {
      const entries = [...prev.entries];
      entries[index] = { ...entries[index], [field]: value };
      return { ...prev, entries };
    });
  };

  const addEntry = () => setForm((prev) => ({ ...prev, entries: [...prev.entries, { ...newEntry }] }));
  const removeEntry = (index) =>
    setForm((prev) => ({ ...prev, entries: prev.entries.filter((_, current) => current !== index) }));

  const submitTimetable = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/timetable", {
        entries: form.entries.map((entry) => ({
          class: form.class,
          division: form.division,
          day: form.day,
          ...entry
        }))
      });
      cacheRef.current.clear();
      if (form.class === selectedClass && form.division === selectedDivision) {
        fetchClassTimetable(selectedClass, selectedDivision, user?.role || "general");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save timetable");
    }
  };

  const canChangeClassFilter = !(isStudent || isParent);
  const effectiveLabel = selectedClass && selectedDivision ? `${selectedClass}-${selectedDivision}` : "N/A";

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Timetable ({effectiveLabel})</h2>
          <button onClick={() => window.print()} className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-800">
            Export PDF
          </button>
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!canChangeClassFilter}
            className="rounded border p-2"
          >
            {CLASSES.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            disabled={!canChangeClassFilter}
            className="rounded border p-2"
          >
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>{division}</option>
            ))}
          </select>
          <div className="rounded border bg-slate-50 p-2 text-sm text-slate-600">
            {loading ? "Loading..." : `${records.length} day records`}
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : selectedClass && selectedDivision ? (
          <WeeklyTimetableTable records={records} />
        ) : isStudent ? (
          <p className="text-sm text-amber-700">Student profile not found</p>
        ) : (
          <p className="text-sm text-amber-700">Profile class/division is missing. Update your profile to view timetable.</p>
        )}
        {studentProfile && (
          <p className="mt-3 text-sm text-slate-600">
            Student: <span className="font-semibold">{studentProfile.name}</span> | Class: {studentProfile.class}-{studentProfile.division}
          </p>
        )}
      </div>

      {isAdmin && (
        <div className="rounded bg-white p-6 shadow">
          <h3 className="mb-3 text-lg font-semibold">Create / Update Timetable</h3>
          <form onSubmit={submitTimetable} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select className="rounded border p-2" value={form.class} onChange={(e) => setForm((prev) => ({ ...prev, class: e.target.value }))}>
                {CLASSES.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
              <select className="rounded border p-2" value={form.division} onChange={(e) => setForm((prev) => ({ ...prev, division: e.target.value }))}>
                {DIVISIONS.map((division) => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
              <select className="rounded border p-2" value={form.day} onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}>
                {DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            {form.entries.map((entry, index) => (
              <div key={`${entry.subject}-${index}`} className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-5">
                <input
                  className="rounded border p-2"
                  placeholder="Subject"
                  value={entry.subject}
                  onChange={(e) => handleEntryChange(index, "subject", e.target.value)}
                  required
                />
                <select
                  className="rounded border p-2"
                  value={entry.teacherId}
                  onChange={(e) => handleEntryChange(index, "teacherId", e.target.value)}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                  ))}
                </select>
                <input
                  type="time"
                  className="rounded border p-2"
                  value={entry.startTime}
                  onChange={(e) => handleEntryChange(index, "startTime", e.target.value)}
                  required
                />
                <input
                  type="time"
                  className="rounded border p-2"
                  value={entry.endTime}
                  onChange={(e) => handleEntryChange(index, "endTime", e.target.value)}
                  required
                />
                <button
                  type="button"
                  disabled={form.entries.length === 1}
                  onClick={() => removeEntry(index)}
                  className="rounded bg-red-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={addEntry} className="rounded bg-slate-700 px-3 py-2 text-white">Add Period</button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">Save Timetable</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
