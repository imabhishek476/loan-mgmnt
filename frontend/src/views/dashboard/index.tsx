import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../../store/DashboardStore";
import { Users, Building2, CreditCard, DollarSign } from "lucide-react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import ClientViewModal from "../clients/components/ClientViewModal";
import { toast } from "react-toastify";
import FormModal from "../../components/FormModal";
import CountUp from "react-countup";
import PayoffDataTable from "./components/PayoffDataTable";
import SearchFilters from "./components/SearchFilters";
import ChartSection from "./components/ChartSection";

const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  isCurrency,
}: any) => (
  <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center flex-1 min-w-[200px]">
    <div>
      <p className="text-sm text-gray-500 whitespace-nowrap">{title}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-md font-bold text-gray-800 flex items-baseline">
          {isCurrency && <span className="mr-1">$</span>}
          {typeof value === "number" ? (
            <CountUp
              end={value}
              duration={1.5}
              separator=","
              decimals={0}
              decimal="."
            />
          ) : (
            value
          )}
        </h2>
        {subValue && (
          <span className="text-xs text-gray-500 font-medium">{subValue}</span>
        )}
      </div>
    </div>
    <div
      className={`p-2 rounded-full ${color} bg-opacity-20 flex items-center justify-center`}
    >
      <Icon className={`${color.replace("bg-", "text-")} w-6 h-6`} />
    </div>
  </div>
);
const Dashboard = observer(() => {
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = useState(new Date());
  const [filteredLoansByCompany, setFilteredLoansByCompany] = useState<any[]>(
    []
  );
  const [viewMode, setViewMode] = useState<"graph" | "upcoming">("upcoming");
  const [loadingGraph, setLoadingGraph] = useState(false);
  const stats = dashboardStore.stats;

  const [viewClientModalOpen, setViewClientModalOpen] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const [filters, setFilters] = useState({
    company: "",
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    toDate: new Date(),
  });

  const formatToMMDDYYYY = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const recoveredPercentage =
    stats.totalLoanAmount > 0
      ? ((stats.totalPaymentsAmount / stats.totalLoanAmount) * 100).toFixed(1)
      : "0";

  const normalizeCompanyData = (data: any[]) => {
    return data.map((item) => {
      const company = companyStore.companies.find(
        (c) => String(c._id) === String(item._id)
      );

      return {
        name: company?.companyName || item.companyName || "Unknown",
        totalLoan: item.totalPrincipleAmount || 0,
        recovered: item.totalPaidOffAmount || 0,
        companyColor:
          company?.backgroundColor || item.backgroundColor || "#8884d8",
      };
    });
  };
  const handleSearch = async () => {
    setLoadingGraph(true);
    try {
      await dashboardStore.loadFilteredStats({
        ...filters,
        fromDate: filters.fromDate
          ? formatToMMDDYYYY(filters.fromDate)
          : undefined,
        toDate: filters.toDate ? formatToMMDDYYYY(filters.toDate) : undefined,
        company: filters.company || undefined,
      });

      setFilteredLoansByCompany(
        normalizeCompanyData(dashboardStore.stats.loansByCompany || [])
      );
      await dashboardStore.loadStats();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGraph(false);
    }
  };
  const handleReset = async () => {
    const defaultFrom = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const defaultTo = new Date();

    setFilters({
      company: "",
      fromDate: defaultFrom,
      toDate: defaultTo,
    });
    setLoadingGraph(true);
    try {
      await Promise.all([companyStore.fetchCompany()]);

      await dashboardStore.loadFilteredStats({});
      setFilteredLoansByCompany(
        normalizeCompanyData(dashboardStore.stats?.loansByCompany || [])
      );
      await dashboardStore.loadStats();
    } finally {
      setLoadingGraph(false);
    }
  };
  const loadDashboard = async () => {
    setLoadingGraph(true);
    try {
      await Promise.all([
        companyStore.fetchCompany(),
        clientStore.fetchClients(),
      ]);

      await dashboardStore.loadFilteredStats(null);
      setFilteredLoansByCompany(
        normalizeCompanyData(dashboardStore.stats?.loansByCompany || [])
      );
      await dashboardStore.loadStats();
    } finally {
      setLoadingGraph(false);
    }
  };
  useEffect(() => {
    loadDashboard();
  }, []);

  const clientOptions = clientStore.clients.map((c) => ({
    label: c.fullName,
    value: c._id,
  }));

  return (
    <div className="space-y-5 text-left relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-0">Dashboard</h1>

      {/* Stats Cards */}
      <div className="flex gap-2 flex-wrap">
        <StatCard
          title="Total Customers"
          value={stats.totalClients}
          icon={Users}
          color="bg-green-700"
        />
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies}
          icon={Building2}
          color="bg-green-700"
        />
        <StatCard
          title="Total Loans"
          value={stats.totalLoans}
          subValue={`(${stats.totalPaidOffLoans} Paid Off)`}
          icon={CreditCard}
          color="bg-green-700"
        />
        <StatCard
          title="Total Loan Value"
          value={stats.totalLoanAmount}
          icon={DollarSign}
          color="bg-green-700"
          isCurrency
        />
        <StatCard
          title="Total Recovered Amount"
          value={stats.totalPaymentsAmount}
          subValue={`(${recoveredPercentage}%)`}
          icon={DollarSign}
          color="bg-green-500"
          isCurrency
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-start mt-2">
        <div className="relative flex bg-gray-100 border border-gray-300 rounded-full p-1 shadow-sm">
          {/* Sliding Highlight */}
          <div
            className={`absolute top-1 bottom-1 rounded-full bg-[#166534]  transition-all duration-300 ease-in-out ${
              viewMode === "upcoming"
                ? "left-1 w-[160px]"
                : "left-[165px] w-[220px]"
            }`}
          />
          {/* Buttons */}
          <button
            onClick={() => setViewMode("upcoming")}
            className={`relative z-10 w-[160px] text-center px-4 py-2 rounded-full font-semibold transition ${
              viewMode === "upcoming" ? "text-white" : "text-gray-700"
            }`}
          >
            Upcoming Payoff
          </button>

          <button
            onClick={() => setViewMode("graph")}
            className={`relative z-10 w-[220px] text-center px-4 py-2 rounded-full font-semibold transition ${
              viewMode === "graph" ? "text-white" : "text-gray-700"
            }`}
          >
            Companies Performance
          </button>
        </div>
      </div>

      {/* Graph View */}
      {viewMode === "graph" && (
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleSearch={handleSearch}
          handleReset={handleReset}
        />
      )}

      {viewMode === "graph" && (
        <ChartSection chartData={filteredLoansByCompany} />
      )}

      {viewMode === "upcoming" && (
        <div className="bg-white p-5 rounded-2xl shadow-lg">
          <PayoffDataTable loading={dashboardStore.loading} />
        </div>
      )}
    </div>
  );
});

export default Dashboard;
