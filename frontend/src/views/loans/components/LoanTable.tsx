import React, { useState, useMemo, useEffect } from "react";
import MaterialTable from "@material-table/core";
// import { debounce } from "lodash";
import { Search, Eye, Wallet, Trash2, RefreshCcw} from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import moment from "moment";
import { observer } from "mobx-react-lite";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { toast } from "react-toastify";
import { calculateDynamicTermAndPayment, calculateLoanAmounts } from "../../../utils/loanCalculations";

interface LoanTableProps {
  onDelete: (id: string) => void;
  clientId?: string;
  onEdit?: (loan: any) => void;
}
// @ts-ignore
const LoanTable: React.FC<LoanTableProps> = ({ onEdit,clientId }) => {
  const { loans, loading } = loanStore;
  const [search, setSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [issueDateFilterInput, setIssueDateFilterInput] = useState<moment.Moment | null>(null);
  const [issueDateFilter, setIssueDateFilter] = useState<moment.Moment | null>(null);
  const capitalizeFirst = (text?: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const filteredLoans = useMemo(() => {
    if (loading || !loans) return [];
    let data = loans;

    if (clientId) {
      data = data.filter(
        (loan) => loan.client === clientId || loan.client?.["_id"] === clientId
      );
    }

    if (search) {
 data = data.filter((loan) => {
      const clientName =
        loan.client?.["fullName"] ||
        clientStore.clients.find((c) => c._id === loan.client)?.fullName ||
        "";
      const companyName =
        loan.company?.["companyName"] ||
        companyStore.companies.find((c) => c._id === loan.company)
          ?.companyName ||
        "";
      return (
        clientName.toLowerCase().includes(search.toLowerCase()) ||
        companyName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }
if (issueDateFilter) {
  data = data.filter((loan) =>
    moment(loan.issueDate).isSame(issueDateFilter, "day")
  );
}
return data;
}, [loans, search, clientId, issueDateFilter, loading]);


  const handleView = (loan: any) => setSelectedLoan(loan);
  const handleClose = () => setSelectedLoan(null);
  useEffect(() => {
    if (clientId) clientStore.fetchClientLoans(clientId);
  }, [clientId]);
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this loan?")) return;
    try {
      await loanStore.deleteLoan(id);
      toast.success("Loan Deactivated successfully");
    } catch {
      toast.error("Failed to delete loan");
    }
  };
  const handleRecover = async (loan: any) => {
    try {
      await loanStore.recoverLoan(loan._id);
      toast.success(`Loan for ${loan.client?.fullName || "client"} recovered!`);
    } catch (err) {
      toast.error("Failed to recover loan");
    }
  };
  const ALLOWED_TERMS = [6, 12, 18, 24, 30, 36, 48];
  const getLoanRunningDetails = (loan: any) => {
    const { monthsPassed } = calculateDynamicTermAndPayment(loan);
    const runningTenure =
      ALLOWED_TERMS.find((t) => monthsPassed <= t) || ALLOWED_TERMS.at(-1);

    const loanCalc = calculateLoanAmounts({
      ...loan,
      loanTerms: runningTenure,
    });

    return {
      monthsPassed,
      runningTenure,
      total: loanCalc?.total || 0,
      remaining: loanCalc?.remaining || 0,
    };
  };
  let runningTenure = 0;
  let remaining = 0;
  let total = 0;
  if (selectedLoan) {
    const details = getLoanRunningDetails(selectedLoan);
    runningTenure = details.runningTenure;
    remaining = details.remaining;
    total = details.total;
  }
  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <div className="mb-3 flex flex-wrap gap-2 items-center">
          {/* Search input */}
          <div className="justify-between flex flex-grid">
            <div className="relative flex-1 px-3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
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
              className="flex items-center gap-1 text-white bg-green-800 hover:bg-green-900 px-2 py-0 rounded transition-all duration-200 hover:shadow-lg"
              onClick={() => setSearch(searchInput)}
            >
              <Search size={15} />
              <span className="font-sm">Search</span>
            </button>
          </div>
          <DatePicker
            label="Issue Date"
            value={issueDateFilterInput}
            //@ts-ignore
            onChange={(newValue) => setIssueDateFilterInput(newValue)}
            //@ts-ignores
            renderInput={(params) => (
              <input
                {...params.inputProps}
                value={params.inputProps?.value || ""}
                onChange={params.inputProps?.onChange}
                className="w-44 border px-5 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            )}
          />
          <button
            className="flex items-center gap-1 text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded transition-colors duration-200"
            onClick={() => setIssueDateFilter(issueDateFilterInput)}
          >
            <Search size={20} />
            <span className="font-medium">Filter</span>
          </button>
          <button
            className="flex items-center gap-1 text-white bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded transition-colors duration-200"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setIssueDateFilterInput(null);
              setIssueDateFilter(null);
            }}
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
              Loading loans...
            </span>
          </div>
        ) : filteredLoans.length > 0 ? (
          <MaterialTable
            title={null}
            columns={[
              {
                title: "Sr.no",
                render: (rowData) => (rowData?.tableData?.id ?? 0) + 1,
                width: "5%",
              },

              {
                title: "Customer",
                cellStyle: { width: 80, minWidth: 120, fontWeight: 600 },
                render: (rowData) =>
                  capitalizeFirst(
                    clientStore.clients.find((c) => c._id === rowData.client)
                      ?.fullName || ""
                  ),
              },
              {
                title: "Company",
                cellStyle: { width: 140, minWidth: 140 },
                render: (rowData) => {
                  const company = companyStore.companies.find(
                    (c) => c._id === rowData.company
                  );
                  const companyName = company?.companyName || "";
                  const color = company?.backgroundColor || "#555555";
                  return (
                    <span
                      style={{
                        color: color,
                        borderRadius: "20px",
                        fontWeight: 600,
                        fontSize: "13px",
                        display: "inline-block",
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      {companyName}
                    </span>
                  );
                },
              },
              {
                title: "Total Loan Amount ($)",
                width: "15%",
                render: (rowData) =>
                  `$${Number(rowData.subTotal || 0).toLocaleString()}`,
              },
              // {
              //   title: "Total Loan ($)",
              //   render: (rowData) =>
              //     `$${Number(rowData.totalLoan || 0).toLocaleString()}`,
              // },
              {
                title: "Term (months)",
                render: (rowData) => {
                  const { monthsPassed } =
                    calculateDynamicTermAndPayment(rowData);
                  const runningTenure =
                    ALLOWED_TERMS.find((t) => monthsPassed <= t) ||
                    ALLOWED_TERMS.at(-1);
                  return <span>{runningTenure} </span>;
                },
              },
              {
                title: "Issue Date",
                cellStyle: { width: 140, minWidth: 140 },
                render: (rowData) =>
                  moment(rowData.issueDate).format("DD MMM YYYY"),
              },
              {
                title: "Payment Status",
                cellStyle: { whiteSpace: "nowrap" },
                render: (rowData: any) => {
                  let bgColor = "";
                  let displayText = rowData.status;
                  switch (rowData.status) {
                    case "Paid Off":
                      bgColor = "bg-green-700";
                      break;
                    case "Merged":
                      bgColor = "bg-green-700";
                      displayText = "Paid Off (Merged)";
                      break;
                    case "Partial Payment":
                      bgColor = "bg-yellow-600";
                      break;
                    case "Active":
                    default:
                      bgColor = "bg-green-700";
                      break;
                  }

                  return (
                    <span
                      className={`px-2 py-1 rounded-lg text-white text-sm ${bgColor}`}
                    >
                      {displayText}
                    </span>
                  );
                },
              },
              {
                title: "Active Status",
                cellStyle: { whiteSpace: "nowrap" },
                render: (rowData: any) => (
                  <span
                    className={`px-2 py-1 rounded-lg text-white text-sm ${
                      rowData.loanStatus === "Active"
                        ? "bg-green-700"
                        : "bg-red-500"
                    }`}
                  >
                    {rowData.loanStatus}
                  </span>
                ),
              },
            ]}
            data={filteredLoans}
            actions={[
              // (rowData: any) => ({
              //   icon: () => <Pencil className="w-5 h-5 text-yellow-600" />,
              //   tooltip: "Edit Loan",
              //   hidden: rowData.loanStatus === "Deactivated",
              //   onClick: (event, row) => onEdit?.(row),
              // }),
              // @ts-ignore
              (rowData: any) => ({
                icon: () => <Eye className="w-5 h-5 text-blue-600" />,
                tooltip: "View Loan",
                hidden: false,
                onClick: (_event, row) => handleView(row),
              }),
              (rowData: any) => ({
                icon: () => <Trash2 className="w-5 h-5 text-red-500" />,
                tooltip: "Deactivate Loan",
                hidden: rowData.loanStatus === "Deactivated",
                onClick: (_event, row) => handleDelete(row._id),
              }),
              (rowData: any) => ({
                icon: () => <RefreshCcw className="w-5 h-5 text-green-600" />,
                tooltip: "Recover Loan",
                hidden: rowData.loanStatus !== "Deactivated",
                onClick: (_event, row) => handleRecover(row),
              }),
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
                padding: "0px 8px",
                borderBottom: "1px solid #e5e7eb",
              },
              rowStyle: (rowData) => {
                const company = companyStore.companies.find(
                  (c) => c._id === rowData.company
                );
                const borderColor = company?.backgroundColor || "#555555";
                // const showRibbon = [
                //   "Paid Off",
                //   "Merged",
                //   "Partial Payment",
                // ].includes(rowData.status);
                // let ribbonColor = "";
                // if (rowData.status === "Paid Off") ribbonColor = "#22c55e";
                // else if (rowData.status === "Merged") ribbonColor = "#6366f1";
                // else if (rowData.status === "Partial Payment")
                //   ribbonColor = "#3b82f6";

                return {
                  fontSize: "13px",
                  height: 44,
                  borderBottom: "1px solid #f1f1f1",
                  backgroundColor: "#ffffff",
                  transition: "all 0.25s ease",
                  borderLeft: `6px solid ${borderColor}`,
                  cursor: "pointer",
                  position: "relative",
                  // ...(showRibbon && {
                  //   backgroundImage: `linear-gradient(
                  //   135deg,
                  //   ${ribbonColor} 22px,
                  //   transparent 20px
                  // )`,
                  //   backgroundRepeat: "no-repeat",
                  //   backgroundPosition: "left top",
                  // }),
                };
              },

              padding: "dense",
              toolbar: false,
              paginationType: "stepped",
            }}
          />
        ) : (
          <div className="text-center py-10 bg-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-4 bg-gray-300 rounded-full w-20 h-20 mx-auto">
              <Wallet className="w-16 h-16 text-green-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-4">
              {search
                ? `No results found for "${search}"`
                : "No loans available."}
            </p>
          </div>
        )}
      </div>
      {selectedLoan && (
        <Dialog
          open={!!selectedLoan}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            className:
              "rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50",
          }}
        >
          <DialogTitle className="font-semibold text-xl text-green-700 border-b pb-2">
            Loan Details
          </DialogTitle>
          <DialogContent className="p-6">
            <div className="grid grid-cols-1 mt-5 sm:grid-cols-2 gap-4 text-gray-800 text-sm">
              {/* Client Info */}
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Customer</p>
                <p className="font-medium">
                  {clientStore.clients.find(
                    (c) => c._id === selectedLoan.client
                  )?.fullName || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Company</p>
                <p className="font-medium">
                  {companyStore.companies.find(
                    (c) => c._id === selectedLoan.company
                  )?.companyName || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Base Amount
                </p>
                <p className="font-semibold text-green-700">
                  $
                  {Number(selectedLoan.subTotal || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Total Loan
                </p>
                <p className="font-semibold text-green-700">
                  $
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Paid Amount
                </p>
                <p className="font-semibold text-blue-700">
                  $
                  {Number(selectedLoan.paidAmount || 0).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Remaining Amount
                </p>
                <p className="font-semibold text-red-700">
                  $
                  {remaining.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="sm:col-span-2 mt-2">
                <p className="text-gray-500 text-xs uppercase mb-1">Progress</p>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{
                      width: `${
                        ((selectedLoan.paidAmount || 0) / (total || 1)) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Interest Type
                </p>
                <p className="font-medium capitalize">
                  {selectedLoan.interestType || ""}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Monthly Rate
                </p>
                <p className="font-medium">{selectedLoan.monthlyRate}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Loan Term
                </p>
                <p className="font-medium">
                  <b>{runningTenure} Months</b>
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Issue Date
                </p>
                <p className="font-medium">
                  {moment(selectedLoan.issueDate).format("MMM DD, YYYY")}
                </p>
              </div>
              <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-2">
                <p className="text-gray-500 text-xs uppercase mb-1">
                  Loan Status
                </p>
                <p
                  className={`font-semibold ${
                    selectedLoan.status === "Paid Off"
                      ? "text-green-700"
                      : selectedLoan.status === "Partial Payment"
                      ? "text-yellow-700"
                      : "text-green-700"
                  }`}
                >
                  {selectedLoan.status}
                </p>
              </div>
            </div>
          </DialogContent>

          <DialogActions className="px-6 pb-4">
            <Button
              onClick={handleClose}
              variant="contained"
              color="success"
              className="px-4 py-2 font-bold bg-green-400 text-white rounded-lg hover:bg-green-700 transition"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};
const ObservedLoanTable = observer(LoanTable);
export default ObservedLoanTable;

