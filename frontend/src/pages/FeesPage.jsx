import useAuth from "../hooks/useAuth";
import FeesTab from "./dashboardTabs/FeesTab";

const FeesPage = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Fees & Payment</h2>
      </div>
      <FeesTab user={user} />
    </div>
  );
};

export default FeesPage;
