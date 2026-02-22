import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../../store/DashboardStore";
import { Users, Building2, CreditCard, DollarSign, EyeOff, Eye } from "lucide-react";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import CountUp from "react-countup";
import PayoffDataTable from "./components/PayoffDataTable";
import SearchFilters from "./components/SearchFilters";
import ChartSection from "./components/ChartSection";
import { formatCompact, normalizeDateObject } from "../../utils/helpers";

const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  isCurrency,
  enableToggle,
  loanBreakdown,
  profitBreakdown
}: any) => {
  const [expanded, setExpanded] = useState(false);

  const isNumber = typeof value === "number";

  return (
    <div className="bg-white rounded-xl shadow p-3 flex justify-between items-start flex-1 min-w-[250px]">
      <div className="w-full">
        {/* Title */}
        <div className="flex items-center">
          <p className="text-sm text-gray-500">{title}</p> {" "}

          {enableToggle && (
            
            <button
              onClick={() => setExpanded(!expanded)}
              className=" w-6 h-6 rounded-full ml-2 flex items-center justify-center bg-gray-100 hover:bg-green-50 text-gray-500 hover:text-green-700 transition-all duration-200"
            >
              {expanded ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
        </div>

        {/* ✅ Value */}
        <h2 className="text-md font-bold text-gray-800 mt-1">
          {isCurrency && <span className="mr-1">$</span>}

  {isNumber ? (
    isCurrency ? (
      expanded ? (
        <CountUp
          end={value}
          duration={1.2}
          separator=","
          decimals={2}
        />
      ) : (
        formatCompact(value)
      )
    ) : (
      value.toLocaleString() 
    )
  ) : (
    value
  )}
           {" "}   {!expanded && subValue && (
          <span className="text-xs text-gray-600 font-medium">
            {subValue}
          </span>
        )}
        </h2>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? "max-h-20 opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}
        >
          {loanBreakdown && (
            <div className="text-xs text-black border-t pt-2 flex gap-1">
              <span className="font-semibold">Merged: <b>{loanBreakdown.merged}</b></span>
              <span>|</span>
              <span className="font-semibold">Paid Off: <b>{loanBreakdown.paidOff}</b></span>
              <span>|</span>
              <span className="font-semibold">Active: <b>{loanBreakdown.unmerged}</b></span>
            </div>
          )}
        </div>
         {isCurrency && title === "Total Profit" && value !== 0 && profitBreakdown && (
  <div className="text-xs text-gray-700 mt-1 border-t pt-1">
    <span className="font-medium">
      Total Base : {profitBreakdown.base.toLocaleString()}
    </span>
    <span className="mx-1">|</span>
    <span className="font-medium">
      Total Recovered : {profitBreakdown.recovered.toLocaleString()}
    </span>
  </div>
)}
      </div>

      {/* Icon */}
      <div className={`p-2 rounded-full ${color} bg-opacity-20 flex items-center justify-center`}>
        <Icon className={`${color.replace("bg-", "text-")} w-4 h-4`} />
      </div>
     
    </div>
  );
};
const Dashboard = observer(() => {
  const [filteredLoansByCompany, setFilteredLoansByCompany] = useState<any[]>(
    []
  );
  const [viewMode, setViewMode] = useState<"graph" | "upcoming">("upcoming");
const { globalStats } = dashboardStore;

  const [filters, setFilters] = useState({
    company: "",
    fromDate: normalizeDateObject(new Date(new Date().getFullYear(), 0, 1)),
    toDate: normalizeDateObject(new Date()),
  });

 const recoveredPercentage =
   globalStats.totalLoanAmount > 0
     ? (
         (globalStats.totalPaymentsAmount / globalStats.totalLoanAmount) *
         100
       ).toFixed(1)
     : "0";

  const normalizeCompanyData = (data: any[]) => {
    return companyStore.companies.map((company) => {
      const found = data.find((item) => String(item._id) === String(company._id));
      return {
        name: company.companyName,
        totalLoan: found?.totalLoanAmount || 0,
        recovered: found?.totalPaidOffAmount || 0,
        profit: found?.totalProfit || 0,
        companyColor: company?.backgroundColor || "#8884d8",
      };
    });
  };
  const handleSearch = async () => {
    try {
      await dashboardStore.loadFilteredStats({
        company: filters.company || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      });

      setFilteredLoansByCompany(
        normalizeCompanyData(dashboardStore.filteredStats?.loansByCompany || [])
      );
    } catch (err) {
      console.error(err);
    } 
  };
  const handleReset = async () => {
    const defaultFrom = normalizeDateObject(
        new Date(new Date().getFullYear(), 0, 1)
      );
    const defaultTo = normalizeDateObject(new Date());

    setFilters({
      company: "",
      fromDate: defaultFrom,
      toDate: defaultTo,
    });
      await dashboardStore.loadFilteredStats({
        company: "",
        fromDate: defaultFrom,
        toDate: defaultTo,
      });
      setFilteredLoansByCompany(
        normalizeCompanyData(dashboardStore.filteredStats?.loansByCompany || [])
      );
  };
  const loadDashboard = async () => {
    try {
      const from = normalizeDateObject(
        new Date(new Date().getFullYear(), 0, 1)
      );
      const to = normalizeDateObject(new Date());
      await Promise.all([
        companyStore.fetchCompany(),
        clientStore.fetchClients(),
      ]);

      await dashboardStore.loadFilteredStats({ fromDate: from, toDate: to });
      setFilteredLoansByCompany(
        normalizeCompanyData(dashboardStore.filteredStats?.loansByCompany || [])
      );
      await dashboardStore.loadStats();
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
    
  };
  useEffect(() => {
    loadDashboard();
  }, []);
  return (
    <div className=" text-left relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-3">Dashboard</h1>

      {/* Stats Cards */}
      <div className="flex gap-2 flex-wrap">
        <StatCard
          title="Total Clients"
          value={globalStats.totalClients}
          icon={Users}
          color="bg-green-700"
        />
        <StatCard
          title="Total Companies"
          value={globalStats.totalCompanies}
          icon={Building2}
          color="bg-green-700"
        />
        <StatCard
          title="Total Loans"
          value={globalStats.totalLoans}
          subValue={`(${globalStats.totalPaidOrMergedLoans} Paid Off)`}
          icon={CreditCard}
          enableToggle
          loanBreakdown={{
          merged: globalStats.totalMergedLoans,
          paidOff: globalStats.totalPaidOffLoans,
          unmerged: globalStats.totalActiveLoans,
        }}
          color="bg-green-700"
        />
        <StatCard
          title="Total Loan Value"
          value={globalStats.totalLoanAmount}
          icon={DollarSign}
          enableToggle
          color="bg-green-700"
          isCurrency
        />
        <StatCard
          title="Total Recovered Amount"
          value={globalStats.totalPaymentsAmount}
          subValue={`(${recoveredPercentage}%)`}
          icon={DollarSign}
          enableToggle
          color="bg-green-500"
          isCurrency
        />
        <StatCard
          title="Total Profit"
          value={globalStats.totalProfit}
          icon={DollarSign}
          enableToggle
          isCurrency
          profitBreakdown={{
            base: globalStats.totalBaseAmount,
            recovered: globalStats.totalPaymentsAmount,
          }}
          color="bg-green-700"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-start mt-2 mb-3">
        <div className="relative flex bg-gray-100 border border-gray-300 rounded-md p-1 shadow-sm">
          {/* Sliding Highlight */}
          <div
            className={`absolute top-1 bottom-1 rounded-md bg-[#166534]  transition-all duration-300 ease-in-out ${
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
