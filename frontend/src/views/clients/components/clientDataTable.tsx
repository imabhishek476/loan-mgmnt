/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import MaterialTable from "@material-table/core";
import { Trash2, Plus, Power, RefreshCcw } from "lucide-react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
// import { TextField } from "@mui/material";
import moment from "moment";
import { clientStore } from "../../../store/ClientStore";
import { toast } from "react-toastify";
import { getClientsSearch, toggleClientStatus } from "../../../services/ClientServices";
import Confirm from "../../../components/Confirm";
import { calculateLoanAmounts,formatUSD } from "../../../utils/loanCalculations";
import { getAllowedTerms } from "../../../utils/constants";
interface ClientsDataTableProps {
  // clients: any[];
  onAddLoan: (client: any) => void;
  onViewClient: (client: any) => void;
}

const ClientsDataTable: React.FC<ClientsDataTableProps> = ({
  onAddLoan,
  onViewClient,
}) => {
  const [searchInput,] = useState("");

  const [issueDateFilterInput] = useState<any>(null);
  const tableRef = useRef<any>(null);
  const [currentPage] = useState(0);
  const [currentPageSize] = useState(10);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    attorneyName: "",
    status: "",
    issueDate: null,
  });
  const handleReset = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
      attorneyName: "",
      status: "",
      issueDate: null,
    });
    tableRef.current?.onQueryChange();
  };
  const handleSearch = () => {
    tableRef.current?.onQueryChange();
  };

  const fetchClientsData = async (query: any) => {
      const params = {
        page: query.page,
        limit: query.pageSize,
        name: filters.name,
        email: filters.email,
        phone: filters.phone,
        attorneyName: filters.attorneyName,
        status: filters.status,
        issueDate: filters.issueDate
          ? moment(filters.issueDate).format("MM-DD-YYYY")
          : null,
      };
      const data = await getClientsSearch(params);
      clientStore.setClients(data.clients);
      return {
        data: data.clients,
        page: query.page,
        totalCount: data.total,
      };
  };
  const handleDelete = async (id: string) => {
    Confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this customer?",
      confirmText: "Yes, Delete",
      onConfirm: async () => {
        await clientStore.deleteClient(id);
        tableRef.current?.onQueryChange();
        toast.success("Customer deleted successfully");
      },
    });
  };
const handleToggleActive = async (id: string, isActive: boolean) => {
  Confirm({
    title: isActive ? "Deactivate Client" : "Recover Client",
    message: `Are you sure you want to ${
      isActive ? "deactivate" : "recover"
    } this client?`,
    confirmText: isActive ? "Yes, Deactivate" : "Yes, Recover",
    onConfirm: async () => {
      try {
        await toggleClientStatus(id);
        tableRef.current?.onQueryChange();
        toast.success(
          `Client ${!isActive ? "recovered" : "deactivated"} successfully`
        );
      } catch (error) {
        toast.error("Failed to update client status");
        console.error(error);
      }
    },
  });
};
  function calculateLoanTotals(clientLoans) {
    let totalPaid = 0;
    let totalRemaining = 0;
    for (const loan of clientLoans) {
      const ALLOWED_TERMS = getAllowedTerms(loan.loanTerms);
      const { monthsPassed } = calculateLoanAmounts(loan);
      const runningTenure = ALLOWED_TERMS.find((t) => monthsPassed <= t) || loan.loanTerms;
      const Terms =  runningTenure;
      const loanData = calculateLoanAmounts({
        ...loan,
        loanTerms: Terms,
      });
      totalPaid += loanData.paidAmount;
      if (!["Paid Off", "Merged"].includes(loan.status)) {
        totalRemaining += loanData.remaining;
      }
    }
    return { totalPaid, totalRemaining };
  }

  return (
    <div className="">
      <div className="grid grid-cols-1 sm:grid-cols-8 gap-2 mb-2">
        <div>
          <label className="font-semibold text-gray-600">Name</label>
          <input
            className="border p-1.5 rounded text-sm w-full"
            placeholder="Search Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>

        {/* Email */}
        <div>
          <label className="font-semibold text-gray-600">Email</label>
          <input
            className="border p-1.5 rounded text-sm w-full"
            placeholder="Search Email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
        </div>
        <div>
          <label className="font-semibold text-gray-600">Phone</label>
          <input
            className="border p-1.5 rounded text-sm w-full"
            placeholder="Search Phone"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="font-semibold text-gray-600">Attorney</label>
          <input
            className="border p-1.5 rounded text-sm w-full"
            placeholder="Search Attorney"
            value={filters.attorneyName}
            onChange={(e) =>
              setFilters({ ...filters, attorneyName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="font-semibold text-gray-600">Status</label>
          <select
            className="border p-1.5 rounded text-sm w-full"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="font-semibold text-gray-600">Issue Date</label>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border rounded text-sm w-full",
                  inputProps: { className: "p-1.5 text-sm" },
                },
              }}
              value={filters.issueDate}
              onChange={(v) => setFilters({ ...filters, issueDate: v })}
            />
          </LocalizationProvider>
        </div>
        <div className="gap-4 mt-6 flex">
          <button
            onClick={handleSearch}
            className="bg-green-700 text-white px-3 py-2 rounded text-sm"
          >
            Search
          </button>

          <button
            onClick={handleReset}
            className="bg-gray-500 text-white px-3 py-2 rounded text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          isLoading={false}
          title={null}
          tableRef={tableRef}
          data={fetchClientsData}
          columns={[
            {
              title: "Sr.no",
              render: (rowData: any) => {
              return (
                rowData.tableData.id +
                1 +
                currentPage * currentPageSize
              );
            }
            },
            {
              title: "Name",
              field: "fullName",

              cellStyle: { fontWeight: 500 },
              render: (rowData) => (
                <a 
                  href='#'
                  className="text-green-600 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    onViewClient?.(rowData)
                  }}
                >
                  {rowData?.fullName}
                </a>
              ),
            },
            { title: "Email", field: "email" },
            { title: "Phone", field: "phone" },
            {
              title: "Total Loan Amount",
              render: (rowData: any) => (
                <span className="font-semibold text-green-700">
                  ${rowData.loanSummary?.totalSubTotal?.toLocaleString() || "0"}
                </span>
              ),
            },
            {
        title: "Paid",
        render: (rowData: any) => {
          const clientLoans = rowData.allLoans.filter(
            (loan) =>
              loan.client === rowData._id ||
              loan.client?._id === rowData._id
          );
                const { totalPaid, totalRemaining } =
                  calculateLoanTotals(clientLoans);
          const allPaidOff = clientLoans.every(
            (loan) => loan.status === "Paid Off" || loan.status === "Merged"
          );
          return (
            <span className="font-semibold">
              <span className={`${allPaidOff ? "text-green-600" : "text-blue-600"}`}>
                {formatUSD(totalPaid)}
              </span>
              <br />
              {totalRemaining > 0 && (
                <span className="text-red-600 text-xs font-medium">
                  (Pending: {formatUSD(totalRemaining)})
                </span>
              )}
            </span>
          );
        },
      },

            {
              title: "Issue Date",
              render: (rowData: any) => {
                if (!rowData.latestLoan || !rowData.latestLoan.issueDate) {
                  return <span className="text-gray-400 italic">N/A</span>;
                }

                return (
                  <span className="text-gray-800 font-medium">
                    {new Date(rowData.latestLoan.issueDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </span>
                );
              },
            },
            {
              title: "Status",
              render: (rowData) =>
                rowData.isActive ? (
                  <span className="px-2 py-0.5 bg-green-700 text-white text-sm font-semibold rounded-lg">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">
                    Inactive
                  </span>
                ),
              cellStyle: { width: 100, textAlign: "left", padding: "6px" },
            },
            // {
            //   title: "Active Loans",
            //   render: (rowData) => {
            //     return loanStore.loans.filter(
            //       (loan) =>
            //         (loan.client === rowData._id ||
            //           loan.client?.["_id"] === rowData._id) &&
            //         loan.status !== "Paid Off"
            //     ).length;
            //   },
            // },

            // {
            //   title: "Total Paid Off",
            //   render: (rowData) => {
            //     return loanStore.loans.filter(
            //       (loan) =>
            //         (loan.client === rowData._id ||
            //           loan.client?.["_id"] === rowData._id) &&
            //         loan.status === "Paid Off"
            //     ).length;
            //   },
            // },
            // { title: "DOB", field: "dob", type: "date"  ,cellStyle: { width: 140, minWidth: 140 }, },
            // { title: "Accident Date", field: "accidentDate", type: "date" },
            { title: "Attorney", field: "attorneyName" },
            // { title: "SSN", field: "ssn" },
          ]}
          actions={[
            (rowData: any) =>
              rowData.isActive
                ? {
                    icon: () => <Plus className="w-5 h-5 text-emerald-600" />,
                    tooltip: "Add Loan",
                    onClick: (_event, data: any) => onAddLoan(data),
                  }
                : null, 

            (rowData: any) => ({
              icon: rowData.isActive
                ? () => <Power className="w-5 h-5 text-green-600" />
                : () => <RefreshCcw className="w-5 h-5 text-red-600" />,
              tooltip: rowData.isActive
                ? "Deactivate Client"
                : "Recover Client",
              onClick: (_event, data: any) =>
                handleToggleActive(data._id, data.isActive),
            }),
            {
              icon: () => <Trash2 className="w-5 h-5 text-red-600" />,
              tooltip: "Delete",
              onClick: (_event, rowData: any) => handleDelete(rowData._id),
            },
          ]}
          options={{
            paging: true,
            pageSize: 15,
            pageSizeOptions: [5, 10, 15, 20, 50, 100, 200, 500],
            sorting: true,
            search: false,
            actionsColumnIndex: -1,
            headerStyle: {
              fontWeight: "600",
              backgroundColor: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              height: 36,
              padding: "6px 8px",
              borderBottom: "1px solid #e5e7eb",
              whiteSpace: "nowrap",
            },
            rowStyle: {
              fontSize: "13px",
              height: 38,
              width: 38,
              borderBottom: "1px solid #f1f1f1",
              transition: "background 0.2s",
            },
            padding: "default",
            toolbar: false,
            // paginationType: "stepped",
          }}
          localization={{
            body: {
              emptyDataSourceMessage: `${
                searchInput
                  ? `No results found for "${searchInput}"`
                  : issueDateFilterInput
                  ? `No results found for "${moment(
                      issueDateFilterInput
                    ).format("MM-DD-YYYY")}"`
                  : "No clients available. Add a new client to get started."
              }`,
            },
          }}
        />
      </div>
    </div>
  );
};

export default ClientsDataTable;
