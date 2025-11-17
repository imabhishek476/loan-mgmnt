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
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import ClientViewModal from "../clients/components/ClientViewModal";
import { toast } from "react-toastify";
import FormModal from "../../components/FormModal";
import CountUp from "react-countup";
import PayoffDataTable from "./components/PayoffDataTable";

const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center flex-1 min-w-[200px]">
    <div>
      <p className="text-sm text-gray-500 whitespace-nowrap">{title}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-md font-bold text-gray-800">
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

  const formatCurrency = (value: number | undefined) =>
    `$${(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

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

  const handleClientUpdate = async (_id: string, data: any) => {
    try {
      if (editingClient) {
        await clientStore.updateClient(editingClient._id, data);
        await clientStore.fetchClients();
        const refreshedClient = clientStore.clients.find(
          (c) => c._id === editingClient._id
        );
        if (refreshedClient) {
          toast.success("Customer updated successfully");
          setSelectedClientForView((prev: any) => ({
            ...refreshedClient,
            loans: prev?.loans || [],
          }));
        }
        setEditingClient(null);
        setEditClientModalOpen(false);
      } else {
        await clientStore.createClient(data);
        await clientStore.fetchClients();
        toast.success("New Customer added successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save Customer ❌");
    }
  };

  const loadDashboard = async () => {
    setLoadingGraph(true);
    try {
      await Promise.all([
        companyStore.fetchCompany(),
      ]);
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
        await dashboardStore.loadStatsByDate(fromStr, toStr);
        setFilteredLoansByCompany(dashboardStore.stats.loansByCompany || []);
      } catch (err) {
        console.error("Error fetching filtered data", err);
      } finally {
        setLoadingGraph(false);
      }
    }
  };
  const combinedData = filteredLoansByCompany.map((item) => {
    const totalLoan = item.totalAmount || 0;
    const recovered = totalLoan
      ? (totalLoan / stats.totalLoanAmount) * (stats.totalPaymentsAmount || 0)
      : 0;
    return { name: item._id || "-", totalLoan, recovered };
  });
  useEffect(() => {
    loadDashboard();
  }, []);

  const renderBarChart = (data: any[]) => {
    if (!data || !data.length)
      return (
        <div className="flex justify-center items-center h-64 text-gray-400 font-semibold">
          No data available for this date range
        </div>
      );

    return (
      <div className="w-full h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              dy={10}
            />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip formatter={formatCurrency} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
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
      </div>
    );
  };

  return (
    <div className="space-y-5 text-left relative">
      {/* Dashboard Header */}
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
        />
        <StatCard
          title="Total Recovered Amount"
          value={stats.totalPaymentsAmount}
          subValue={`(${recoveredPercentage}%)`}
          icon={DollarSign}
          color="bg-green-500"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_e, newMode) => newMode && setViewMode(newMode)}
        >
          <ToggleButton value="upcoming">Upcoming Payoff</ToggleButton>
          <ToggleButton value="graph">Companies Performance</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Graph View */}
      {viewMode === "graph" && (
        <>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box className="flex gap-4 items-center mb-4 flex-wrap">
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => newValue && setFromDate(newValue)}
                maxDate={toDate || new Date()}
              />
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => newValue && setToDate(newValue)}
                minDate={fromDate}
                maxDate={new Date()}
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
            <div className="bg-white rounded-2xl shadow-lg flex-1 p-3">
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
        <div className="bg-white p-5 rounded-2xl shadow-lg">
          <PayoffDataTable loading={dashboardStore.loading} />
        </div>
      )}

      {/* Modals */}
      {viewClientModalOpen && selectedClientForView && (
        <ClientViewModal
          open={viewClientModalOpen}
          onClose={() => setViewClientModalOpen(false)}
          client={selectedClientForView}
          onEditClient={(client) => {
            setEditingClient(client);
            setEditClientModalOpen(true);
          }}
        />
      )}

      {editClientModalOpen && editingClient && (
        <FormModal
          open={editClientModalOpen}
          onClose={() => {
            setEditClientModalOpen(false);
            setEditingClient(null);
          }}
          title="Edit Client"
          fields={[
            {
              label: "Full Name",
              key: "fullName",
              type: "text",
              required: true,
            },
            { label: "Email", key: "email", type: "email" },
            { label: "Phone", key: "phone", type: "text" },
            { label: "SSN", key: "ssn", type: "text" },
            { label: "Date of Birth", key: "dob", type: "date" },
            { label: "Accident Date", key: "accidentDate", type: "date" },
            { label: "Attorney Name", key: "attorneyName", type: "text" },
            { label: "Memo", key: "memo", type: "textarea" },
            { label: "Address", key: "address", type: "textarea" },
          ]}
          initialData={editingClient}
          submitButtonText="Update Client"
          onSubmit={async (data) => handleClientUpdate(editingClient._id, data)}
        />
      )}
    </div>
  );
});

export default Dashboard;
