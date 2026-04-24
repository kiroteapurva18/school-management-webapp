import useAuth from "../hooks/useAuth";
import NotificationsTab from "./dashboardTabs/NotificationsTab";

const NotificationsPage = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>
      <NotificationsTab user={user} />
    </div>
  );
};

export default NotificationsPage;
