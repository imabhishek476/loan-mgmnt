import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../../store/DashboardStore";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Users, Building2, CreditCard, DollarSign, Search } from "lucide-react";
import { TextField, Box } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fetchDashboardStatsByDate } from "../../services/DashboardService";

const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center flex-1 min-w-[200px]">
    <div>
      <p className="text-sm text-gray-500 whitespace-nowrap">{title}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-md font-bold text-gray-800">{value}</h2>
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

  useEffect(() => {
    dashboardStore.loadStats().then(() => {
      setFilteredLoansByCompany(dashboardStore.stats.loansByCompany || []);
    });
  }, []);

  const formatToMMDDYYYY = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  const handleFilter = async () => {
    if (fromDate && toDate) {
      try {
        const fromStr = formatToMMDDYYYY(fromDate);
        const toStr = formatToMMDDYYYY(toDate);

        const data = await fetchDashboardStatsByDate(fromStr, toStr);
        setFilteredLoansByCompany(data.loansByCompany || []);
      } catch (err) {
        console.error("Error fetching filtered loans by company", err);
      }
    }
  };

  const stats = dashboardStore.stats;
  const formatCurrency = (value: number | undefined) =>
    `$${(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const recoveredPercentage =
    stats.totalLoanAmount > 0
      ? ((stats.totalPaymentsAmount / stats.totalLoanAmount) * 100).toFixed(1)
      : "0";
const combinedData = (
  filteredLoansByCompany.length
    ? filteredLoansByCompany
    : stats.loansByCompany || []
).map((item) => ({
  name: item._id,
  totalLoan: item.totalAmount || 0,
  recovered:
    ((item.totalAmount || 0) / stats.totalLoanAmount) *
      stats.totalPaymentsAmount || 0,
}));

  return (
    <div className="space-y-5 text-left relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-0">Dashboard</h1>

      {/* Stat Cards */}
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
          value={`${stats.totalLoans} (${stats.totalPaidOffLoans} Paid Off)`}
          icon={CreditCard}
          color="bg-green-700"
        />
        <StatCard
          title="Total Loan Value"
          value={formatCurrency(stats.totalLoanAmount)}
          icon={DollarSign}
          color="bg-green-700"
        />
        <StatCard
          title="Total Recovered Amount"
          value={formatCurrency(stats.totalPaymentsAmount)}
          subValue={`(${recoveredPercentage}%)`}
          icon={DollarSign}
          color="bg-green-500"
        />
      </div>

      {/* Date Filter */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box className="flex gap-4 items-center mb-4">
          <DatePicker
            label="From Date"
            value={fromDate}
            // @ts-ignore
            onChange={(newValue) => newValue && setFromDate(newValue)}
            maxDate={toDate || new Date()}
            // @ts-ignore
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            // @ts-ignore
            onChange={(newValue) => newValue && setToDate(newValue)}
            minDate={fromDate}
            maxDate={new Date()}
            // @ts-ignore
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <div
            className="flex items-center gap-1 cursor-pointer text-green-700 hover:bg-green-700 hover:text-white px-2 py-1 rounded transition-colors duration-200"
            onClick={handleFilter}
          >
            <Search size={26} />
            <span className="font-medium">Search</span>
          </div>
        </Box>
      </LocalizationProvider>

      {/* Charts */}
      <div className="bg-white rounded-2xl shadow-lg p-3 w-1/2">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">
          Total Loan and Recovered by Company
        </h2>
        {combinedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={combinedData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Bar
                dataKey="totalLoan"
                name="Total Loan"
                fill="#4f46e5"
                barSize={30}
              />
              <Bar
                dataKey="recovered"
                name="Total Recovered"
                fill="#1E824C"
                barSize={30}
              />
            </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-400 font-semibold">
              No data available for this date range
            </div>
          )}
      </div>
    </div>
  );
});

export default Dashboard;
