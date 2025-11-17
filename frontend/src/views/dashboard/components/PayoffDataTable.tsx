import React, { useState, useRef, useCallback } from "react";
import MaterialTable from "@material-table/core";
import { Search,} from "lucide-react";
import { Autocomplete, TextField } from "@mui/material";
import { dashboardStore } from "../../../store/DashboardStore";

interface PayoffDataTableProps {
  loading: boolean;
}

const payoffOptions = [
  { label: "Today", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
];

const PayoffDataTable: React.FC<PayoffDataTableProps> = ({ loading }) => {
  const tableRef = useRef<any>(null);
  const [payoffFilter, setPayoffFilter] = useState<
 "day" | "week" | "month"
  >("week");

  const fetchPayoffData = useCallback(
    async (query: any) => {
      const page = query.page + 1;
      const limit = query.pageSize;

      try {
        await dashboardStore.loadPayoffStats(payoffFilter, page, limit);
        const { data, total } = dashboardStore.payoffStats;

        return {
          data: data || [],
          page: (dashboardStore.payoffStats.page || 1) - 1,
          totalCount: total || 0,
        };
      } catch (err) {
        console.error(err);
        return { data: [], page: 0, totalCount: 0 };
      }
    },
    [payoffFilter]
  );

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Autocomplete
          options={payoffOptions}
          value={payoffOptions.find((o) => o.value === payoffFilter)}
          onChange={(_event, newValue) =>
            newValue && setPayoffFilter(newValue.value as any)
          }
          getOptionLabel={(option) => option.label}
          renderInput={(params) => <TextField {...params} size="small" />}
          className="min-w-[200px]"
        />
        <div
          className="flex items-center gap-1 cursor-pointer text-green-700 hover:bg-green-700 hover:text-white px-2 py-1 rounded transition-colors duration-200"
          onClick={() => tableRef.current?.onQueryChange()}
        >
          <Search size={26} />
          <span className="font-medium">Search</span>
        </div>
      </div>

      <MaterialTable
        isLoading={loading}
        tableRef={tableRef}
        title={null}
        columns={[
          {
            title: "Sr.no",
            render: (rowData: any) => rowData.tableData.id + 1,
          },
          { title: "Customer", field: "clientName" },
          { title: "Company", field: "companyName" },
          {
            title: "Total Loan",
            render: (rowData: any) =>
              `$${(rowData.subTotal || 0).toLocaleString()}`,
          },
          {
            title: "Remaining",
            render: (rowData: any) =>
              `$${(rowData.remaining || 0).toLocaleString()}`,
          },
          {
            title: "Issue Date",
            render: (rowData: any) =>
              rowData.issueDate
                ? new Date(rowData.issueDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A",
          },
          {
            title: "Teneur",
            render: (rowData: any) =>
              rowData.currentTerm || rowData.dynamicTerm
                ? `${rowData.currentTerm || rowData.dynamicTerm} Months`
                : "N/A",
          },
          {
            title: "End Date",
            render: (rowData: any) =>
              rowData.endDate
                ? new Date(rowData.endDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "N/A",
          },
          {
            title: "Status",
            render: (rowData: any) => (
              <span
                className={`px-2 py-0.5 rounded-lg text-white ${
                  rowData.status === "Paid Off"
                    ? "bg-gray-600"
                    : rowData.status === "Delayed"
                    ? "bg-red-600"
                    : "bg-green-600"
                }`}
              >
                {rowData.status}
              </span>
            ),
          },
        ]}
        data={fetchPayoffData}
        options={{
          paging: true,
          pageSize: 10,
          pageSizeOptions: [5, 10, 20],
          search: false,
          toolbar: false,
          headerStyle: {
            fontWeight: 600,
            backgroundColor: "#f9fafb",
            color: "#374151",
            fontSize: "13px",
            height: 36,
            padding: "6px 8px",
            borderBottom: "1px solid #e5e7eb",
            whiteSpace: "nowrap",
          },
          rowStyle: (rowData) => ({
            fontSize: "13px",
            height: 44,
            borderBottom: "1px solid #f1f1f1",
            backgroundColor: "#fff",
            borderLeft: `6px solid ${
              rowData.companyObject?.backgroundColor || "#555555"
            }`,
            borderRadius: "50px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
            margin: "4px 0",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }),
        }}
        localization={{
          body: {
            emptyDataSourceMessage: "No upcoming payoffs available.",
          },
        }}
      />
    </div>
  );
};

export default PayoffDataTable;
