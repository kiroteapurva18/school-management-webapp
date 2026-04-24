import useAuth from "../hooks/useAuth";
import LeaveRequestsTab from "./dashboardTabs/LeaveRequestsTab";

const LeaveRequestsPage = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Leave Requests</h2>
      </div>
      <LeaveRequestsTab user={user} />
    </div>
  );
};

export default LeaveRequestsPage;
