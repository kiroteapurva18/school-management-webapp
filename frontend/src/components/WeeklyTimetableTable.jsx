import { DAYS, TIME_SLOTS } from "../constants/timetable";

const WeeklyTimetableTable = ({ records }) => {
  const normalized = records.reduce((acc, row) => {
    if (!acc[row.day]) acc[row.day] = {};
    const key = `${row.startTime}-${row.endTime}`;
    acc[row.day][key] = row;
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left">Day</th>
            {TIME_SLOTS.map((slot) => (
              <th key={`${slot.startTime}-${slot.endTime}`} className={`border p-2 text-left ${slot.isLunch ? "bg-amber-100" : ""}`}>
                {slot.startTime}-{slot.endTime}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="border p-2 font-semibold">{day}</td>
              {TIME_SLOTS.map((slot) => {
                const time = `${slot.startTime}-${slot.endTime}`;
                const period = normalized[day]?.[time];
                return (
                  <td key={`${day}-${time}`} className="border p-2 align-top">
                    {slot.isLunch ? (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Lunch Break</span>
                    ) : period ? (
                      <div className="space-y-1">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: `hsl(${(period.subject.length * 29) % 360}, 60%, 45%)` }}
                        >
                          {period.subject}
                        </span>
                        <p className="text-xs text-slate-600">{period.teacherName || period.teacherId?.name || "Teacher"}</p>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyTimetableTable;
