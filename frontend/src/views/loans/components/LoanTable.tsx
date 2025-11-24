  import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
  } from "react";
  import MaterialTable from "@material-table/core";
  // import { debounce } from "lodash";
  import { Search, Eye, Trash2, RefreshCcw, X } from "lucide-react";
  import { loanStore } from "../../../store/LoanStore";
  import { clientStore } from "../../../store/ClientStore";
  import { companyStore } from "../../../store/CompanyStore";
  import moment from "moment";
  import { observer } from "mobx-react-lite";
  import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
  import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
  import Confirm from "../../../components/Confirm";
  import { toast } from "react-toastify";
  import {
    calculateDynamicTermAndPayment,
    calculateLoanAmounts,
  } from "../../../utils/loanCalculations";
  import { deleteLoan, getLoansSearch, recoverLoan } from "../../../services/LoanService";

  interface LoanTableProps {
    onDelete: (id: string) => void;
    clientId?: string;
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  const LoanTable: React.FC<LoanTableProps> = ({clientId }) => {
    const [search] = useState("");
    const [selectedLoan, setSelectedLoan] = useState(null);
  // const [, setLoansDataTable] = useState<any[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [issueDateFilterInput, setIssueDateFilterInput] =
      useState<moment.Moment | null>(null);
    const capitalizeFirst = (text?: string) => {
      if (!text) return "";
      return text.charAt(0).toUpperCase() + text.slice(1);
    };
    const tableRef = useRef<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentPageSize, setCurrentPageSize] = useState(10);
    const handleSearch = () => {
      if (tableRef.current) tableRef.current.onQueryChange();
    };

    const handleReset = async () => {
      setSearchInput("");
      setIssueDateFilterInput(null);
      if (tableRef.current) tableRef.current.onQueryChange();
    };
    const handleView = (loan: any) => setSelectedLoan(loan);
    const handleClose = () => setSelectedLoan(null);
    //@ts-ignore
    const [loading, setLoading] = useState(false);
    const fetchLoansData = useCallback(
      async (query: any) => {
        setLoading(true);
        setCurrentPage(query.page);
        setCurrentPageSize(query.pageSize);
        try {
          const filters = {
            query: searchInput,
            page: query.page,
            limit: query.pageSize,
            issueDate: issueDateFilterInput
              ? moment(issueDateFilterInput).format("MM-DD-YYYY")
              : null,
            clientId: clientId || null,
          };
          const data = await getLoansSearch(filters);
          // setLoansDataTable(data.loans || []);
          
          return {
            data: data.loans || [],
            page: query.page,
            totalCount: data.total || 0,
          };
        } catch (error) {
          console.error(error);
          toast.error("Failed to fetch loans");
          return { data: [], page: query.page, totalCount: 0 };
        } finally {
          loanStore.setTableRef(tableRef);
          setLoading(false);
        }
      },
      [searchInput, issueDateFilterInput, clientId]
    );
    useEffect(() => {
      if (clientId) clientStore.fetchClientLoans(clientId);
    }, [clientId]);
    const handleDelete = async (id: string) => {
      Confirm({
        title: "Confirm Deactivate",
        message: "Are you sure you want to deactivate this loan?",
        confirmText: "Yes, Deactivate",
        onConfirm: async () => {
          await deleteLoan(id);
          tableRef.current?.onQueryChange();
          toast.success("Loan Deactivated successfully");
        },
      });
    };
    const handleRecover = async (loan: any) => {
       Confirm({
      title: "Recover Loan",
      message: `Are you sure you want to recover the loan for "${loan.client?.fullName || "client"}"?`,
      confirmText: "Yes, Recover",
      cancelText: "Cancel",
      onConfirm: async () => {
      try {
        await recoverLoan(loan._id);
        if (tableRef.current) tableRef.current.onQueryChange();
        toast.success(
          `Loan for "${loan.client?.fullName || "client"}" recovered successfully!`
        );
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred.";

        toast.error(backendMessage);
      }
    },
  });
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
        <div className="mb-3 flex flex-col sm:flex-row gap-2">
          {/* Search input */}
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
                onClick={handleSearch}
              >
                <Search className="w-5 h-5 text-green-700" />
              </span>
            </div>
            <div className="sm:w-auto">
              <button
                className=" hidden sm:flex items-center gap-1 text-white bg-green-700 hover:bg-green-900 px-2 py-1 rounded transition-all duration-200 hover:shadow-lg"
                onClick={handleSearch}
              >
                <Search size={20} />
                <span className="font-medium py-1">Search</span>
              </button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Issue Date"
                value={issueDateFilterInput}
                //@ts-ignore
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
              className="flex items-center gap-1 text-white bg-green-700 hover:bg-green-800 px-3 py-2 rounded transition-colors duration-200"
              onClick={handleSearch}
            >
              <Search size={20} />
              <span className="font-medium">Filter</span>
            </button>
            <button
              className="flex items-center gap-1 text-white bg-gray-500 hover:bg-gray-600 px-3 py-2 rounded transition-colors duration-200"
              onClick={handleReset}
            >
              <span className="font-medium">Reset</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
          <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
            <MaterialTable
              title={null}
              tableRef={tableRef}
              columns={[
                {
                  title: "Sr.no",
                  render: (rowData: any) => {
                    return (
                      rowData.tableData.id + 1 + currentPage * currentPageSize
                    );
                  },
                  width: 70,
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap" },
                },
                {
                  title: "Customer",
                  cellStyle: {
                    minWidth: 120,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  },
                  headerStyle: { whiteSpace: "nowrap" },
                  render: (rowData) => {
                    const clientName =
                      rowData.client?.fullName ||
                      clientStore.clients.find(
                        (c) => c._id === rowData.client?._id
                      )?.fullName ||
                      "";
                    return capitalizeFirst(clientName);
                  },
                },

                {
                  title: "Company",
                  cellStyle: { minWidth: 140, whiteSpace: "nowrap" },
                  headerStyle: { whiteSpace: "nowrap" },
                  render: (rowData) => {
                    const company =
                      rowData.company ||
                      companyStore.companies.find(
                        (c) => c._id === rowData.company?._id
                      );
                    const companyName = company?.companyName || "";
                    const color = company?.backgroundColor || "#555555";
                    return (
                      <span
                        style={{
                          color,
                          borderRadius: "20px",
                          fontWeight: 600,
                          fontSize: "13px",
                          display: "inline-block",
                          textTransform: "capitalize",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {companyName}
                      </span>
                    );
                  },
                },

                {
                  title: "Total Loan ($)",
                  render: (rowData) =>
                    `$${Number(rowData.subTotal || 0).toLocaleString()}`,
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap", minWidth: 120 },
                },
                // {
                //   title: "Total Loan ($)",
                //   render: (rowData) =>
                //     `$${Number(rowData.totalLoan || 0).toLocaleString()}`,
                // },
                {
                  title: "Term (months)",
                  render: (rowData) => {
                    const today = moment().startOf("day");
                    const issueDate = moment(rowData.issueDate, "MM-DD-YYYY").startOf("day");
                    const daysPassed = today.diff(issueDate, "days");
                    let completedMonths = Math.floor(daysPassed / 30);
                    if (daysPassed % 30 === 0 && daysPassed !== 0) {
                      completedMonths -= 1;
                    }

                    const runningTenure =
                      ALLOWED_TERMS.find((t) => completedMonths < t) || ALLOWED_TERMS.at(-1);
                    return <span>{runningTenure}</span>;
                  },
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap" },
                },
                {
                  title: "Issue Date",
                  render: (rowData) =>
                    moment(rowData.issueDate).format("MMM DD, YYYY"),

                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap", minWidth: 120 },
                },
                {
                  title: "Payment Status",
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap", minWidth: 150 },
                  render: (rowData) => {
                    let bgColor = "bg-green-700";
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
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap", minWidth: 130 },
                  render: (rowData) => (
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
              data={fetchLoansData}
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
                  //@ts-ignore
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
                padding: "dense",
                toolbar: false,
                // paginationType: "stepped",
                tableLayout: "auto",
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
                rowStyle: (rowData: any) => {
                  const companyId =
                    typeof rowData.company === "string"
                      ? rowData.company
                      : rowData.company?._id;

                  const company =
                    companyStore.companies.find((c) => c._id === companyId) ||
                    rowData.company;

                  const borderColor = company?.backgroundColor || "#555555";

                  return {
                    fontSize: "13px",
                    height: 44,
                    borderBottom: "1px solid #f1f1f1",
                    backgroundColor: "#ffffff",
                    transition: "all 0.25s ease",
                    borderLeft: `6px solid ${borderColor}`,
                    cursor: "pointer",
                  };
                },
              }}
              localization={{
                body: {
                  emptyDataSourceMessage: `${
                    search
                      ? `No results found for "${search}"`
                      : issueDateFilterInput
                      ? `No results found for "${moment(
                          issueDateFilterInput
                        ).format("MM-DD-YYYY")}"`
                      : "No loans available. Add a new loan to get started."
                  }`,
                },
              }}
            />
          </div>
        </div>
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/70 overflow-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl mx-3 sm:mx-6 relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center border-b px-6 py-3">
                <h2 className="font-semibold text-xl text-green-700">
                  Loan Details
                </h2>

                <button
                  onClick={handleClose}
                  className="text-gray-600 hover:text-red-500 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 text-sm mt-2">
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Customer
                    </p>
                    <p className="font-medium">
                      {selectedLoan.client?.fullName ||
                        clientStore.clients.find(
                          (c) => c._id === selectedLoan.client?._id
                        )?.fullName ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Company
                    </p>
                    <p className="font-medium">
                      {selectedLoan.company?.companyName ||
                        companyStore.companies.find(
                          (c) => c._id === selectedLoan.company?._id
                        )?.companyName ||
                        "-"}
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
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
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

                  {/* Paid Amount */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Paid Amount
                    </p>
                    <p className="font-semibold text-blue-700">
                      $
                      {Number(selectedLoan.paidAmount || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>
                  </div>

                  {/* Remaining Amount */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Remaining Amount
                    </p>
                    <p
                      className={`font-semibold ${
                        selectedLoan.status === "Merged"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      $
                      {(selectedLoan.status === "Merged"
                        ? 0
                        : remaining
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="sm:col-span-2 mt-2">
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Progress
                    </p>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          selectedLoan.status === "Merged"
                            ? "bg-green-500"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${
                            selectedLoan.status === "Merged"
                              ? 100
                              : ((selectedLoan.paidAmount || 0) /
                                  (total || 1)) *
                                100
                          }%`,
                        }}
                      />
                    </div>
                    {selectedLoan.status === "Merged" && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Merged loan — fully settled
                      </p>
                    )}
                  </div>

                  {/* Interest Type */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Interest Type
                    </p>
                    <p className="font-medium capitalize">
                      {selectedLoan.interestType
                        ? selectedLoan.interestType.charAt(0).toUpperCase() +
                          selectedLoan.interestType.slice(1)
                        : "-"}
                    </p>
                  </div>

                  {/* Monthly Rate */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Monthly Rate
                    </p>
                    <p className="font-medium">{selectedLoan.monthlyRate}%</p>
                  </div>

                  {/* Loan Term */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Loan Term
                    </p>
                    <p className="font-medium">{runningTenure} Months</p>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Issue Date
                    </p>
                    <p className="font-medium">
                      {moment(selectedLoan.issueDate).format("MMM DD, YYYY")}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-2">
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Loan Status
                    </p>
                    <p
                      className={`font-semibold ${
                        selectedLoan.status === "Paid Off"
                          ? "text-gray-500"
                          : selectedLoan.status === "Merged"
                          ? "text-green-600"
                          : selectedLoan.status === "Active"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {selectedLoan.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t px-6 py-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  const ObservedLoanTable = observer(LoanTable);
  export default ObservedLoanTable;
