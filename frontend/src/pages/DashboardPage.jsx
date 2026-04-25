import { useEffect } from "react";
import useAuth from "../hooks/useAuth";

const DashboardPage = () => {
  const { user } = useAuth();
  const classValue = user?.className || user?.class || null;
  const divisionValue = user?.division || null;
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin";
  const isParent = user?.role === "parent";
  const childClass = user?.childClass || null;
  const childDivision = user?.childDivision || null;
  const parentHeader = user?.parentDisplayName || "Parent Dashboard";

  useEffect(() => {
    console.log("Dashboard user object:", user);
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">Welcome, {isParent ? parentHeader : user?.name}</h2>
        {isParent ? (
          <>
            <p className="mt-2 text-slate-700">Student: {user?.studentName || "N/A"}</p>
            <p className="text-slate-700">Class: {childClass || "N/A"}</p>
            <p className="text-slate-700">Division: {childDivision || "N/A"}</p>
          </>
        ) : isStudent ? (
          <>
            <p className="mt-2 text-slate-700">Class: {classValue || "N/A"}</p>
            <p className="text-slate-700">Division: {divisionValue || "N/A"}</p>
            {user?.rollNumber !== undefined && user?.rollNumber !== null && (
              <p className="text-slate-700">Roll Number: {user.rollNumber}</p>
            )}
          </>
        ) : isTeacher ? (
          <>
            <p className="mt-2 text-slate-700">Subject: {user?.subject || "N/A"}</p>
          </>
        ) : null}
        <p className="mt-1 text-slate-600">
          You are logged in as <span className="font-semibold capitalize">{user?.role}</span>.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
