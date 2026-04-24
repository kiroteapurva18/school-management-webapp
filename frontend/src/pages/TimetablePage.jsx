import { useEffect, useMemo, useState } from "react";
import WeeklyTimetableTable from "../components/WeeklyTimetableTable";
import { CLASSES, DAYS, DIVISIONS } from "../constants/timetable";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const newPeriod = { subject: "", teacherId: "", startTime: "", endTime: "" };

const TimetablePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";

  const defaultClass = isStudent ? user?.className : isParent ? user?.childClass : "8th";
  const defaultDivision = isStudent ? user?.division : isParent ? user?.childDivision : "A";

  const [selectedClass, setSelectedClass] = useState(defaultClass || "8th");
  const [selectedDivision, setSelectedDivision] = useState(defaultDivision || "A");
  const [records, setRecords] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    class: defaultClass || "8th",
    division: defaultDivision || "A",
    day: DAYS[0],
    periods: [{ ...newPeriod }]
  });

  const fetchClassTimetable = async (className, division) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/timetable/class/${encodeURIComponent(className)}/division/${encodeURIComponent(division)}`);
      setRecords(data);
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
    if (!selectedClass || !selectedDivision) return;
    fetchClassTimetable(selectedClass, selectedDivision);
    fetchTeachers().catch(() => {});
  }, [selectedClass, selectedDivision]);

  const handlePeriodChange = (index, field, value) => {
    setForm((prev) => {
      const periods = [...prev.periods];
      periods[index] = { ...periods[index], [field]: value };
      return { ...prev, periods };
    });
  };

  const addPeriod = () => setForm((prev) => ({ ...prev, periods: [...prev.periods, { ...newPeriod }] }));
  const removePeriod = (index) =>
    setForm((prev) => ({ ...prev, periods: prev.periods.filter((_, current) => current !== index) }));

  const submitTimetable = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/timetable", form);
      if (form.class === selectedClass && form.division === selectedDivision) {
        fetchClassTimetable(selectedClass, selectedDivision);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save timetable");
    }
  };

  const canChangeClassFilter = !(isStudent || isParent);
  const effectiveLabel = useMemo(() => `${selectedClass}-${selectedDivision}`, [selectedClass, selectedDivision]);

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
        {selectedClass && selectedDivision ? (
          <WeeklyTimetableTable records={records} />
        ) : (
          <p className="text-sm text-amber-700">Profile class/division is missing. Update your profile to view timetable.</p>
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
            {form.periods.map((period, index) => (
              <div key={`${period.subject}-${index}`} className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-5">
                <input
                  className="rounded border p-2"
                  placeholder="Subject"
                  value={period.subject}
                  onChange={(e) => handlePeriodChange(index, "subject", e.target.value)}
                  required
                />
                <select
                  className="rounded border p-2"
                  value={period.teacherId}
                  onChange={(e) => handlePeriodChange(index, "teacherId", e.target.value)}
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
                  value={period.startTime}
                  onChange={(e) => handlePeriodChange(index, "startTime", e.target.value)}
                  required
                />
                <input
                  type="time"
                  className="rounded border p-2"
                  value={period.endTime}
                  onChange={(e) => handlePeriodChange(index, "endTime", e.target.value)}
                  required
                />
                <button
                  type="button"
                  disabled={form.periods.length === 1}
                  onClick={() => removePeriod(index)}
                  className="rounded bg-red-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={addPeriod} className="rounded bg-slate-700 px-3 py-2 text-white">Add Period</button>
              <button type="submit" className="rounded bg-blue-600 px-3 py-2 text-white">Save Timetable</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
