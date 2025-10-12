import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { dashboardStore } from "../../store/DashboardStore";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Cell,
} from "recharts";
import { Users, Building2, CreditCard, DollarSign } from "lucide-react";
import Select from "react-select";

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center w-full sm:w-[500px]">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
    </div>
    <div
      className={`p-3 rounded-full ${color} bg-opacity-20 flex items-center justify-center`}
    >
      <Icon className={`${color.replace("bg-", "text-")} w-6 h-6`} />
    </div>
  </div>
);

const Dashboard = observer(() => {
  const [chartType, setChartType] = useState<"pie" | "bar" | "line">("pie");

  useEffect(() => {
    dashboardStore.loadStats();
  }, []);

  const stats = dashboardStore.stats;

  const COLORS_COMPANY = ["#4f46e5", "#6366f1", "#818cf8", "#a5b4fc"];
  const COLORS_CLIENT = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const loansByCompanyData = stats.loansByCompany.map((item: any) => ({
    name: item._id || "Unknown",
    total: item.totalAmount,
  }));

  const loansByClientData = stats.loanByClient.map((item: any) => ({
    name: item._id || "Unknown",
    total: item.totalAmount,
  }));

  const chartOptions = [
    { value: "bar", label: "Bar Chart" },
    { value: "pie", label: "Pie Chart" },
    { value: "line", label: "Line Chart" },
  ];

  const renderChart = (
    type: "bar" | "pie" | "line",
    data: any,
    colors: string[]
  ) => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                <LabelList
                  dataKey="total"
                  formatter={formatCurrency}
                  position="top"
                />
                {data.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                outerRadius={120}
                label={(entry) => entry.name}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke={colors[0]}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-8 min-h-screen text-left relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Dashboard Overview
      </h1>
      <div className="flex gap-4 justify-between">
        <StatCard
          title="Total Clients"
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
          icon={CreditCard}
          color="bg-green-700"
        />
        <StatCard
          title="Total Loan Value"
          value={formatCurrency(stats.totalLoanAmount)}
          icon={DollarSign}
          color="bg-green-700"
        />
      </div>
      <div className="w-64 mb-4">
        <Select
          options={chartOptions}
          value={chartOptions.find((opt) => opt.value === chartType)}
          onChange={(selected) =>
            setChartType(selected?.value as "bar" | "pie" | "line")
          }
          isSearchable
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-6 text-lg">
            Total Loan by Company
          </h2>
          {renderChart(chartType, loansByCompanyData, COLORS_COMPANY)}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-6 text-lg">
            Total Loan by Client
          </h2>
          {renderChart(chartType, loansByClientData, COLORS_CLIENT)}
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
