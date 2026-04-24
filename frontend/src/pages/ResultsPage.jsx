import useAuth from "../hooks/useAuth";
import ResultsTab from "./dashboardTabs/ResultsTab";

const ResultsPage = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-6 shadow">
        <h2 className="text-xl font-bold">Results</h2>
      </div>
      <ResultsTab user={user} />
    </div>
  );
};

export default ResultsPage;
