import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { Search, Trash2, User, Plus } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { TextField } from "@mui/material";
import moment from "moment";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
interface ClientsDataTableProps {
  clients: any[];
  loading: boolean;
  onSearch: (query: string) => void;
  onAddLoan: (client: any) => void;
  onViewClient: (client: any) => void;
  onDelete: (id: string) => void;
  onFilter?: (filters: { search: string; issueDate: string | null }) => void;
}

const ClientsDataTable: React.FC<ClientsDataTableProps> = ({
  clients,
  loading,
  onSearch,
  onAddLoan,
  onViewClient,
  onDelete,
  onFilter,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [issueDateFilterInput, setIssueDateFilterInput] = useState<any>(null);
  const clearedSearch = "";
  const clearedDate = null;
  const handleFilter = () => {
    if (typeof onFilter === "function") {
      const formattedDate = issueDateFilterInput
        ? moment(issueDateFilterInput).format("MM-DD-YYYY")
        : null;
      onFilter({ search: searchInput, issueDate: formattedDate });
    }
  };
const handleReset = async () => {
  await clientStore.fetchClients();
  await loanStore.fetchActiveLoans();
  setSearchInput(clearedSearch);
  setIssueDateFilterInput(clearedDate);
  if (typeof onFilter === "function") {
    onFilter({ search: clearedSearch, issueDate: clearedDate });
  }
};

  return (
    <div className="">
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <div className="mb-3 flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="flex gap-2 items-center">
            <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-green-700" />
        </span>
        <input
          type="text"
          placeholder="Search by Customer or Company"
                className="w-96 pl-10 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
            <button
              className="flex items-center gap-1 text-white bg-green-800 hover:bg-green-900 px-2 py-1 rounded transition-all duration-200 hover:shadow-lg"
              onClick={handleFilter}
            >
              <Search size={15} />
              <span className="font-sm">Search</span>
            </button>
          </div>
          <DatePicker
            label="Issue Date"
            value={issueDateFilterInput}
            onChange={(newValue) => setIssueDateFilterInput(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                className="w-44"
                size="small"
                variant="outlined"
              />
            )}
          />
          <button
            className="flex items-center gap-1 text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded transition-colors duration-200"
            onClick={handleFilter}
          >
            <Search size={20} />
            <span className="font-medium">Filter</span>
          </button>
          <button
            className="flex items-center gap-1 text-white bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded transition-colors duration-200"
            onClick={handleReset}
          >
            <span className="font-medium">Reset</span>
          </button>
        </div>
      </LocalizationProvider>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress className="text-green-700" />
            <span className="ml-3 text-gray-700 font-medium">
              Loading Customer...
            </span>
          </div>
        ) : clients.length > 0 ? (
          <MaterialTable
            isLoading={loading}
            title={null}
            columns={[
              {
                title: "Sr.no",
                render: (rowData) => rowData.tableData.id + 1,
              },
              {
                title: "Name",
                field: "fullName",
                cellStyle: { fontWeight: 500 },
                render: (rowData) => (
                  <span
                    className="text-green-600 cursor-pointer hover:underline"
                    onClick={() => onViewClient?.(rowData)}
                  >
                    {rowData.fullName}
                  </span>
                ),
              },
              { title: "Email", field: "email" },
              { title: "Phone", field: "phone" },
              {
                title: "Total Loan Amount",
                render: (rowData) => {
                    const clientLoans = loanStore.loans.filter(
                    (loan) =>
                      loan.client === rowData._id ||
                      loan.client?.["_id"] === rowData._id
                    );

                    const totalGiven = clientLoans.reduce(
                      (acc, loan) => acc + (loan.subTotal || 0),
                      0
                    );

                    return (
                      <span className="font-semibold text-green-700">
                        ${totalGiven.toLocaleString()}
                      </span>
                    );
                  },
                },
                {
                  title: "Paid",
                render: (rowData) => {
                    const clientLoans = loanStore.loans.filter(
                    (loan) =>
                        loan.client === rowData._id ||
                      loan.client?.["_id"] === rowData._id
                    );
                    const pending = clientLoans.reduce(
                      (acc, loan) => acc + (loan.paidAmount || 0),
                      0
                    );
                  const allPaidOff = clientLoans.every(
                    (loan) => loan.status === "Paid Off" || "Merged"
                  );

                    return (
                    <span
                      className={`font-semibold ${
                        allPaidOff ? "text-green-600" : "text-blue-600"
                      }`}
                    >
                      {allPaidOff
                        ? `$ ${pending.toLocaleString()} `
                        : `$${pending.toLocaleString()}`}
                      </span>
                    );
                  },
                },
              {
                title: "Issue Date(latest loan)",
                render: (rowData) => {
                  const clientLoans = loanStore.loans.filter(
                    (loan) =>
                      loan.client === rowData._id ||
                      loan.client?._id === rowData._id
                  );
                  if (clientLoans.length === 0)
                    return <span className="text-gray-400">—</span>;
                  const latestLoan = clientLoans.reduce((latest, current) =>
                    new Date(current.issueDate) > new Date(latest.issueDate)
                      ? current
                      : latest
                  );
                  return (
                    <span className="text-gray-800 font-medium">
                      {new Date(latestLoan.issueDate).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                      </span>
                    );
                  },
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
            data={clients}
            actions={[
              {
                icon: () => <Plus className="w-5 h-5 text-emerald-600" />,
                tooltip: "Add Loan",
                //@ts-ignore
                onClick: (event, rowData: any) => onAddLoan(rowData),
              },

              // {
              //   icon: () => <Pencil className="w-5 h-5 text-green-600" />,
              //   tooltip: "Edit",
              //   //@ts-ignore
              //   onClick: (event, rowData: any) => onEdit(rowData),
              // },
              {
                icon: () => <Trash2 className="w-5 h-5 text-red-600" />,
                tooltip: "Delete",
                //@ts-ignore
                onClick: (event, rowData: any) => onDelete(rowData._id),
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
              paginationType: "stepped",
            }}
          />
        ) : (
          <div className="text-center py-10 bg-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-4 bg-gray-300 rounded-full w-20 h-20 mx-auto">
              <User className="w-16 h-16 text-green-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-4">
              {searchInput
                ? `No results found for "${searchInput}"`
                : issueDateFilterInput
                ? `No results found for "${moment(issueDateFilterInput).format(
                    "MM-DD-YYYY"
                  )}"`
                : "No clients available. Add a new client to get started."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsDataTable;
