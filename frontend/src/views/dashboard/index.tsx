import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../../store/DashboardStore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { Users, Building2, CreditCard, DollarSign, Search } from "lucide-react";
import { TextField, Box, MenuItem, Select, FormControl } from "@mui/material";
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
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [filteredLoansByCompany, setFilteredLoansByCompany] = useState<any[]>(
    []
  );

  useEffect(() => {
    dashboardStore.loadStats();
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
  const COLORS_COMPANY = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"];
  const COLORS_PIE = ["#1E824C", "#48da4e"];
  const formatCurrency = (value: number | undefined) =>
    `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const recoveredPercentage =
    stats.totalLoanAmount > 0
      ? ((stats.totalPaymentsAmount / stats.totalLoanAmount) * 100).toFixed(1)
      : "0";

  const paymentPieData = [
    { name: "Recovered", value: stats.totalPaymentsAmount || 0 },
    {
      name: "Pending",
      value: (stats.totalLoanAmount || 0) - (stats.totalPaymentsAmount || 0),
    },
  ];

  const allCompaniesData = filteredLoansByCompany.length
    ? filteredLoansByCompany.map((item) => ({
        name: item._id,
        value: item.totalAmount,
      }))
    : filteredLoansByCompany.length === 0
    ? []
    : stats.loansByCompany.map((item) => ({
        name: item._id,
        value: item.totalAmount,
      }));

  const renderChart = (data: any) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex justify-center items-center h-64 text-gray-400 font-semibold">
          No data available for this date range
        </div>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 30 }}
          >
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={formatCurrency} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={COLORS_COMPANY[0]}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, bottom: 20, left: 10 }}
        >
          <CartesianGrid strokeDasharray="4 4" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={formatCurrency} />
          <Legend />
          <Bar dataKey="value" fill={COLORS_COMPANY[0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };
useEffect(() => {
  dashboardStore.loadStats().then(() => {
    setFilteredLoansByCompany(dashboardStore.stats.loansByCompany || []);
  });
}, []);

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
          <Search
            size={26}
            className="text-green-700 cursor-pointer hover:scale-110 transition-transform"
            onClick={handleFilter}
          />
        </Box>
      </LocalizationProvider>

      {/* Charts */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800 text-lg">
              Total Loan by Company
            </h2>
            <FormControl size="small">
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as "line" | "bar")}
              >
                <MenuItem value="line">Line</MenuItem>
                <MenuItem value="bar">Bar</MenuItem>
              </Select>
            </FormControl>
          </div>
          {renderChart(allCompaniesData)}
        </div>

        {/* Total Loan Recovered Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex-1">
          <h2 className="font-semibold text-gray-800 mb-6 text-lg">
            Total Loan Recovered
          </h2>
          {stats.totalLoanAmount > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={paymentPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  // @ts-ignore
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {paymentPieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_PIE[index % COLORS_PIE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-400 font-semibold">
              No payment data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
