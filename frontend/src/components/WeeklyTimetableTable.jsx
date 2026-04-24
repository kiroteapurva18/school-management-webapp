import { DAYS } from "../constants/timetable";

const WeeklyTimetableTable = ({ records, showClassInfo = false }) => {
  const times = [...new Set(records.flatMap((record) => record.periods.map((period) => `${period.startTime}-${period.endTime}`)))]
    .sort((a, b) => a.localeCompare(b));

  const normalized = records.reduce((acc, record) => {
    acc[record.day] = record.periods.reduce((slotMap, period) => {
      const key = `${period.startTime}-${period.endTime}`;
      slotMap[key] = period;
      return slotMap;
    }, {});
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left">Day</th>
            {times.map((time) => (
              <th key={time} className="border p-2 text-left">{time}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="border p-2 font-semibold">{day}</td>
              {times.map((time) => {
                const period = normalized[day]?.[time];
                return (
                  <td key={`${day}-${time}`} className="border p-2 align-top">
                    {period ? (
                      <div className="space-y-1">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: `hsl(${(period.subject.length * 35) % 360}, 60%, 45%)` }}
                        >
                          {period.subject}
                        </span>
                        <p className="text-xs text-slate-600">{period.teacherId?.name || "Teacher"}</p>
                        {showClassInfo && (
                          <p className="text-xs text-slate-500">
                            {period.className}-{period.division}
                          </p>
                        )}
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
