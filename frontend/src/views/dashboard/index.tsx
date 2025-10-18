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
import {
 Users,
 Building2,
 CreditCard,
 DollarSign,
 Search,
Eye,
} from "lucide-react";
import {
  TextField,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
} from "@mui/material";
import MaterialTable from "@material-table/core";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { fetchDashboardStatsByDate } from "../../services/DashboardService";
import { loanStore } from "../../store/LoanStore";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import moment from "moment";

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

const payoffOptions = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "All", value: "all" },
];
const capitalizeFirst = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const Dashboard = observer(() => {
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [toDate, setToDate] = useState(new Date());
  const [filteredLoansByCompany, setFilteredLoansByCompany] = useState<any[]>(
    []
  );
  const [upcomingPayoffs, setUpcomingPayoffs] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"graph" | "upcoming">("graph");
  const [payoffFilter, setPayoffFilter] = useState<
    "week" | "month" | "year" | "all"
  >("all");
  const [loadingGraph, setLoadingGraph] = useState(false);

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

  const formatToMMDDYYYY = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };
  useEffect(() => {
    loadDashboard();
    loadUpcomingPayoffs();
  }, []);

  const loadDashboard = async () => {
    setLoadingGraph(true);
    try {
      await dashboardStore.loadStats();
      setFilteredLoansByCompany(dashboardStore.stats.loansByCompany || []);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleFilter = async () => {
    if (fromDate && toDate) {
      setLoadingGraph(true);
      try {
        const fromStr = formatToMMDDYYYY(fromDate);
        const toStr = formatToMMDDYYYY(toDate);
        const data = await fetchDashboardStatsByDate(fromStr, toStr);
        setFilteredLoansByCompany(data.loansByCompany || []);
      } catch (err) {
        console.error("Error fetching filtered loans by company", err);
      } finally {
        setLoadingGraph(false);
      }
    }
  };

  const loadUpcomingPayoffs = async () => {
    try {
      await loanStore.fetchLoans();
      await clientStore.fetchClients();
      await companyStore.fetchCompany();

      const today = moment();

      const data = loanStore.loans
        .filter((loan) => loan.status !== "Paid Off")
        .map((loan) => {
          const client = clientStore.clients.find((c) => c._id === loan.client);
          const company = companyStore.companies.find(
            (c) => c._id === loan.company
          );

          const issueDate = moment(loan.issueDate, "MM-DD-YYYY");
          const endDate = loan.endDate
            ? moment(loan.endDate, "MM-DD-YYYY")
            : moment(issueDate).add(loan.loanTerms, "months");

          const isDelayed = endDate.isBefore(today);

          return {
            id: loan._id,
            clientName: client?.fullName || "Unknown",
            companyName: company?.companyName || "Unknown",
            subTotal: loan.subTotal,
            loanTerms: loan.loanTerms,
            issueDate: issueDate.format("MM-DD-YYYY"),
            endDate: endDate.format("MM-DD-YYYY"),
            status: isDelayed ? "Delayed" : "Active",
          };
        });

      const sorted = data.sort(
        (a, b) =>
          moment(a.endDate, "MM-DD-YYYY").valueOf() -
          moment(b.endDate, "MM-DD-YYYY").valueOf()
      );

      setUpcomingPayoffs(sorted);
    } catch (error) {
      console.error("Error loading upcoming payoffs", error);
    }
  };

  const handleView = (rowData: any) => {
    console.log("View loan", rowData);
  };
  const filteredUpcomingPayoffs = upcomingPayoffs.filter((loan) => {
    const end = moment(loan.endDate, "MM-DD-YYYY").startOf("day");
    const today = moment().startOf("day");

    switch (payoffFilter) {
      case "week":
        return end.isBetween(
          today.clone().startOf("week"),
          today.clone().endOf("week"),
          "day",
          "[]"
        );
      case "month":
        return end.isBetween(
          today.clone().startOf("month"),
          today.clone().endOf("month"),
          "day",
          "[]"
        );
      case "year":
        return end.isBetween(
          today.clone().startOf("year"),
          today.clone().endOf("year"),
          "day",
          "[]"
        );
      case "all":
      default:
        return end.isSameOrAfter(today, "day");
    }
  });
  const filteredUpcomingPayoffsWithSrNo = filteredUpcomingPayoffs.map(
    (item, index) => ({
      ...item,
      srNo: index + 1,
    })
  );
  const combinedData = filteredLoansByCompany.map((item) => ({
    name: item._id || "Unknown",
    totalLoan: item.totalAmount || 0,
    recovered:
      stats.totalLoanAmount > 0
        ? ((item.totalAmount || 0) / stats.totalLoanAmount) *
          stats.totalPaymentsAmount
        : 0,
  }));

  const renderBarChart = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex justify-center items-center h-64 text-gray-400 font-semibold">
          No data available for this date range
        </div>
      );
    }

    return (
      <ResponsiveContainer width="50%" height={400}>
        <BarChart
          data={data}
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
    );
  };

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
      <div className="flex justify-between items-center">
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
        >
          <ToggleButton value="graph">Graph View</ToggleButton>
          <ToggleButton value="upcoming">Upcoming Payoff</ToggleButton>
        </ToggleButtonGroup>
      </div>
      {viewMode === "graph" && (
        <>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box className="flex gap-4 items-center mb-4 flex-wrap">
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={(newValue) => newValue && setFromDate(newValue)}
            maxDate={toDate || new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={(newValue) => newValue && setToDate(newValue)}
            minDate={fromDate}
            maxDate={new Date()}
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

          <div className="flex flex-wrap gap-4">
    <div className="bg-white rounded-2xl shadow-lg flex-1 w-1/2 p-3">
        <h2 className="font-semibold text-gray-800 text-lg mb-4">
          Total Loan and Recovered by Company
        </h2>
              {loadingGraph ? (
                <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
                  Loading...
                </div>
              ) : (
                renderBarChart(combinedData)
              )}
            </div>
          </div>
        </>
      )}
      {viewMode === "upcoming" && (
        <div className="bg-white rounded-2xl shadow-lg p-5 mt-6 w-full mx-auto">
          <h2 className="font-semibold text-gray-800 text-lg mb-4">
            Upcoming Payoffs
          </h2>
          <div className="flex gap-2 items-center mb-4 w-full max-w-xs">
            <Autocomplete
              fullWidth
              options={payoffOptions}
              value={payoffOptions.find((o) => o.value === payoffFilter)}
              onChange={(event, newValue) =>
                newValue &&
                setPayoffFilter(
                  newValue.value as "week" | "month" | "year" | "all"
                )
              }
              getOptionLabel={(option) => option.label}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
          </div>

          <MaterialTable
            title={null}
            columns={[
              { title: "Sr.no", field: "srNo", width: "5%" },
              {
                title: "Client",
                render: (rowData) => capitalizeFirst(rowData.clientName),
              },
              {
                title: "Company",
                render: (rowData) => capitalizeFirst(rowData.companyName),
              },
              {
                title: "Loan Amount ($)",
                render: (rowData) =>
                  `$${Number(rowData.subTotal || 0).toLocaleString()}`,
              },
              { title: "Term (months)", field: "loanTerms" },
              {
                title: "Issue Date",
                render: (rowData) =>
                  moment(rowData.issueDate, "MM-DD-YYYY").format("DD MMM YYYY"),
              },
              {
                title: "End Date",
                render: (rowData) =>
                  moment(rowData.endDate, "MM-DD-YYYY").format("DD MMM YYYY"),
              },
              {
                title: "Status",
                render: (rowData) => {
                  const status = capitalizeFirst(rowData.status);
                  const color =
                    status === "Delayed"
                      ? "text-white bg-red-600 py-1 px-2 rounded-lg"
                      : "text-white bg-green-600 py-1 px-2 rounded-lg";
                  return (
                    <span className={`font-semibold ${color}`}>{status}</span>
                  );
                },
              },
            ]}
            data={filteredUpcomingPayoffsWithSrNo}
            actions={[
              {
                icon: () => <Eye className="w-5 h-5 text-blue-600" />,
                tooltip: "View Details",
                onClick: (e, rowData) => handleView(rowData),
              },
            ]}
            options={{
              paging: true,
              pageSize: 10,
              pageSizeOptions: [5, 10, 20],
              sorting: true,
              search: false,
              actionsColumnIndex: -1,
              headerStyle: {
                fontWeight: 600,
                backgroundColor: "#f9fafb",
                color: "#374151",
                fontSize: "13px",
                height: 36,
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              },
              rowStyle: {
                fontSize: "13px",
                height: 38,
                borderBottom: "1px solid #f1f1f1",
              },
              padding: "dense",
              toolbar: false,
              paginationType: "stepped",
            }}
          />
      </div>
      )}
    </div>
  );
});

export default Dashboard;
