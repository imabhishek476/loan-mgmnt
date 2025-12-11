  import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
  } from "react";
  import MaterialTable from "@material-table/core";
  import { Eye, Trash2, X } from "lucide-react";
  import { loanStore } from "../../../store/LoanStore";
  import { clientStore } from "../../../store/ClientStore";
  import { companyStore } from "../../../store/CompanyStore";
  import moment from "moment";
  import { observer } from "mobx-react-lite";
  import Confirm from "../../../components/Confirm";
  import { toast } from "react-toastify";
  import {
    calculateDynamicTermAndPayment,
    calculateLoanAmounts,
  } from "../../../utils/loanCalculations";
  import { deleteLoan, getLoansSearch} from "../../../services/LoanService";
import { getAllowedTerms } from "../../../utils/constants";
import LoanView from "./LoanView";
import LoanSearch from "./LoanSearch";

  interface LoanTableProps {
    clientId?: string;
  }
  const LoanTable: React.FC<LoanTableProps> = ({clientId }) => {
    const [search] = useState("");
    const [selectedLoan, setSelectedLoan] = useState(null);
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
    const [filters, setFilters] = useState({
      customer: "",
      company: "",
      issueDate: null,
      paymentStatus: "",
      loanStatus: "",
    });
    const handleReset = () => {
      setFilters({
        customer: "",
        company: "",
        issueDate: null,
        paymentStatus: "",
        loanStatus: "",
      });
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
          const filterData = {
            customer: filters.customer,
            company: filters.company,
            issueDate: filters.issueDate
              ? moment(filters.issueDate).format("MM-DD-YYYY")
              : null,
            paymentStatus: filters.paymentStatus,
            loanStatus: filters.loanStatus,
            page: query.page,
            limit: query.pageSize,
            clientId: clientId || null,
          };
          const data = await getLoansSearch(filterData);
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
      [filters, clientId]
    );
    useEffect(() => {
      if (clientId) clientStore.fetchClientLoans(clientId);
    }, [clientId]);
    const handleDelete = async (id: string) => {
      Confirm({
        title: "Confirm Delete",
        message: "Are you sure you want to delete this Loan?",
        confirmText: "Yes, Delete",
        onConfirm: async () => {
          await deleteLoan(id);
        if (tableRef.current) tableRef.current.onQueryChange();
             await loanStore.fetchActiveLoans(clientId);
             await clientStore.refreshDataTable();
          toast.success("Loan deleted successfully");
    },
    });
    };
    const getLoanRunningDetails = (loan: any) => {          
      const ALLOWED_TERMS = getAllowedTerms(loan.loanTerms);
      const { monthsPassed } = calculateDynamicTermAndPayment(loan);
      const runningTenure = ALLOWED_TERMS.find((t) => monthsPassed <= t) || loan.loanTerms;

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
        <LoanSearch
          filters={filters}
          setFilters={setFilters}
          handleSearch={handleSearch}
          handleReset={handleReset}
        />
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
                    const ALLOWED_TERMS = getAllowedTerms(rowData.loanTerms);
                    const runningTenure = ALLOWED_TERMS.find((t) => completedMonths <= t) || rowData.loanTerms;
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
                () => ({
                  icon: () => <Eye className="w-5 h-5 text-blue-600" />,
                  tooltip: "View Loan",
                  hidden: false,
                  onClick: (_event, row) => handleView(row),
                }),
                (rowData: any) => ({
                  icon: () => <Trash2 className="w-5 h-5 text-red-500" />,
                  tooltip: "Delete Loan",
                  hidden: rowData.status === "Merged",
                  onClick: (_event, row) => handleDelete(row._id),
                }),
              ]}
              options={{
                paging: true,
                pageSize: 15,
                pageSizeOptions: [5, 10, 15, 20, 50, 100, 200, 500],
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
                      : "No loans available. Add a new loan to get started."
                  }`,
                },
              }}
            />
          </div>
        </div>
        <LoanView
          selectedLoan={selectedLoan}
          handleClose={handleClose}
          total={total}
          remaining={remaining}
          runningTenure={runningTenure}
        />
      </div>
    );
  };
  const ObservedLoanTable = observer(LoanTable);
  export default ObservedLoanTable;
