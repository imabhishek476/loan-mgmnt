import React, { useState, useEffect } from "react";
import MaterialTable from "@material-table/core";
import { Search, Trash2, User, Plus } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
// import { TextField } from "@mui/material";
import moment from "moment";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
// import { calculateLoanAmounts } from "../../../utils/loanCalculations";
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
  // onSearch,
  onAddLoan,
  onViewClient,
  onDelete,
  onFilter,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [issueDateFilterInput, setIssueDateFilterInput] = useState<any>(null);
  const clearedSearch = "";
  const clearedDate = null;
  // const hasLoaded = useRef(false);
    const loadInitialData = async () => {
      try {
        await Promise.all([
          companyStore.fetchCompany(),
          clientStore.fetchClients(),
          loanStore.fetchLoans(),
        ]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      }
    };
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
  useEffect(() => {
      loadInitialData();
  }, []);
  return (
    <div className="">
      <div className="mb-3 flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex flex-col sm:flex-row  gap-2 items-left">
          <div className="relative flex-grow min-w-[250px] max-w-md">
            <input
              type="text"
              placeholder="Search by Customer or Company"
              className="w-full sm:p-2 pr-10 pl-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span
              className="absolute sm:hidden inset-y-0 right-0 flex items-center  pr-3  cursor-pointer"
              onClick={handleFilter}
            >
              <Search className="w-5 h-5 text-green-700 " />
            </span>
          </div>

          <button
            className=" hidden sm:flex items-center gap-1 text-white bg-green-800 hover:bg-green-900 px-2 py-1 rounded transition-all duration-200 hover:shadow-lg"
            onClick={handleFilter}
          >
            <Search size={15} />
            <span className="font-sm">Search</span>
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Issue Date"
              value={issueDateFilterInput}
              onChange={(newValue) => setIssueDateFilterInput(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    "& .MuiInputBase-root": {
                      padding: "0px 4px",
                      minHeight: "32px", // make it a bit shorter
                    },
                    "& .MuiInputBase-input": {
                      padding: "4px 6px", // actual text padding
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
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
      </div>

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
                      //@ts-ignore
                      loan.client === rowData._id ||
                      //@ts-ignore
                      loan.client?._id === rowData._id
                  );

                  let totalPaid = 0;
                  let totalRemaining = 0;

                  clientLoans.forEach((loan) => {
                    const issueDate = moment(loan.issueDate, "MM-DD-YYYY");
                    const today = moment();
                    const monthsPassed = today.diff(issueDate, "months") + 1;
                    const allowedTerms = [6, 12, 18, 24, 30, 36, 48];
                    const currentTerm =
                      allowedTerms.find((t) => t >= monthsPassed) ||
                      loan.loanTerms;
                    const subTotal = Number(loan.subTotal || 0);
                    const monthlyRate = Number(loan.monthlyRate || 0);
                    const paidAmount = Number(loan.paidAmount || 0);
                    const interestType = loan.interestType || "flat";
                    let interest = 0;
                    if (interestType === "flat") {
                      interest = subTotal * (monthlyRate / 100) * currentTerm;
                    } else if (interestType === "compound") {
                      interest =
                        subTotal *
                        (Math.pow(1 + monthlyRate / 100, currentTerm) - 1);
                    }
                    const totalLoan = subTotal + interest;
                    const remaining = Math.max(totalLoan - paidAmount, 0);
                    console.log(
                      `Loan: ${
                        loan._id
                      } | Months Passed: ${monthsPassed} | Term: ${currentTerm} | Subtotal: ${subTotal} | Interest: ${interest.toFixed(
                        2
                      )} | Total: ${totalLoan.toFixed(
                        2
                      )} | Paid: ${paidAmount.toFixed(
                        2
                      )} | Remaining: ${remaining.toFixed(2)}`
                    );
                    totalPaid += paidAmount;
                    if (!["Paid Off", "Merged"].includes(loan.status)) {
                      totalRemaining += remaining;
                    }
                  });
                  const allPaidOff = clientLoans.every(
                    (loan) =>
                      loan.status === "Paid Off" || loan.status === "Merged"
                  );

                  return (
                    <span className="font-semibold">
                      <span
                        className={`${
                          allPaidOff ? "text-green-600" : "text-blue-600"
                        }`}
                      >
                        $
                        {totalPaid.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <br />
                      {totalRemaining > 0 && (
                        <span className="text-red-600 text-xs font-medium">
                          (Pending: $
                          {totalRemaining.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          )
                        </span>
                      )}
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
                      //@ts-ignore
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
