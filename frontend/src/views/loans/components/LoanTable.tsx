  import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
  } from "react";
  import MaterialTable from "@material-table/core";
  import { Eye, Save, Trash2 } from "lucide-react";
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
  import ClientViewModal from "../../clients/components/ClientViewModal";
  import FormModal, { type FieldConfig } from "../../../components/FormModal";
import { useNavigate } from "react-router-dom";

  interface LoanTableProps {
    clientId?: string;
  }
  const LoanTable: React.FC<LoanTableProps> = ({clientId }) => {
    const [search] = useState("");
    const [selectedLoan, setSelectedLoan] = useState(null);
    const tableRef = useRef<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentPageSize, setCurrentPageSize] = useState(10);
    const [viewClient, setViewClient] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
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
    const [editingClient, setEditingClient] = useState(null);
    
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
    const handleDelete = async (loan: any) => {
          const isMerged = loan.status === "Merged";
      Confirm({
        title: isMerged ? "⚠️ Delete Merged Loan" : "Confirm Delete",
        message: isMerged ? (
              <div className="text-left">
              <div className="text-sm text-gray-700 leading-6">
                <p className="mb-2">
                  This loan is <strong className="text-red-600">MERGED</strong>.
                  Deleting it will permanently delete:
                </p>

                <ul className="list-disc list-inside mb-3 text-gray-800">
                  <li>This loan</li>
                  <li>All linked / merged loans</li>
                  <li>All payment history</li>
                </ul>
              </div>

                <p className="text-red-600 font-semibold">
                  This action CANNOT be undone.
                </p>
              </div>
            ) : (
              "Are you sure you want to delete this loan?"
            ),
            confirmText: isMerged
              ? "Yes, Delete"
              : "Yes, Delete",
        onConfirm: async () => {
          await deleteLoan(loan._id);
        if (tableRef.current) tableRef.current.onQueryChange();
             await loanStore.fetchActiveLoans(clientId);
             await clientStore.refreshDataTable();
              toast.success(
                isMerged
                  ? "Merged loan and all linked loans deleted"
                  : "Loan deleted successfully"
              );
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
    const navigate = useNavigate();
    const handleViewClient = async (client) => {
    // setViewClient({ ...client, loans: [] });
    navigate(`/client/${client._id}`);
    // setViewModalOpen(true);
    };
    const customFields: {
      id: number;
      name: string;
      value: string | number | boolean;
      type: "string" | "number";
    }[] = (clientStore.customFields || []).map(
      (field: FieldConfig, idx: number) => ({
        id: idx,
        name: field.key,
        value: "",
        type:
          field.type === "text" || field.type === "textarea"
            ? "string"
            : field.type === "number"
            ? "number"
            : "string",
      })
    );
    const handleSave = async (data: any) => {
      try {
        if (editingClient) {
          await clientStore.updateClient(editingClient?._id, data);  
          toast.success("Client updated successfully");
          try {
            await clientStore.refreshDataTable();
            const refreshedClient = clientStore.clients.find(
              (c) => c?._id === editingClient?._id
            );
            if (refreshedClient) setViewClient(refreshedClient);
          } catch (refreshError) {
            console.error("Refresh error:", refreshError);
          }  
          setEditingClient(null);
          setModalOpen(false);
        } else {
          await clientStore.createClient(data);  
          toast.success("New Client added successfully");  
          try {
            await clientStore.refreshDataTable();
          } catch (refreshError) {
            console.error("Refresh error:", refreshError);
          }  
          setModalOpen(false);
        }
      } catch (error: any) {
        console.error("Save error:", error);
        toast.error(error.response?.data?.error || "Failed to save Client");
      }
    };
    const clientFields: FieldConfig[] = [
      { label: "Full Name", key: "fullName", type: "text", required: true },
      { label: "Email", key: "email", type: "email" },
      { label: "Phone", key: "phone", type: "text" },
      { label: "SSN", key: "ssn", type: "text" },
      { label: "Date of Birth", key: "dob", type: "date" },
      { label: "Accident Date", key: "accidentDate", type: "date" },
      { label: "Attorney Name", key: "attorneyName", type: "text" },
      { label: "Memo", key: "memo", required: false ,type: "textarea" },
      { label: "Address", key: "address", type: "textarea" },
    ];
  
    return (
      <div>
        <LoanSearch
          filters={filters}
          setFilters={setFilters}
          handleSearch={handleSearch}
          handleReset={handleReset}
        />
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white mt-2">
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
                  sorting: false,
                  width: 70,
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap" },
                },
                {
                  title: "Client",
                  sorting: false,
                  render: (rowData: any) => (
                    <a
                      href="#"
                      className="text-green-700 hover:underline font-medium cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        // Open Client Modal the same way as Clients Table
                        handleViewClient?.(rowData.client);
                      }}
                    >
                      {rowData.client?.fullName || "N/A"}
                    </a>
                  ),
                },

                {
                  title: "Company",
                  sorting: false,
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
                  sorting: false,
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
                  sorting: false,
                  render: (rowData) => {
                    const today = moment().startOf("day");
                    const issueDate = moment(rowData.issueDate, "MM-DD-YYYY");
                    const parentIssueDate = rowData.parentLoan?.issueDate
                      ? moment(rowData.parentLoan.issueDate, "MM-DD-YYYY")
                      : null;
                    let daysPassed = 0;
                    if (parentIssueDate) {
                      const referenceDate = parentIssueDate;
                      daysPassed = referenceDate.diff(issueDate, "days");
                    } else {
                      const referenceDate = today; // normal behaviour
                      daysPassed = referenceDate.diff(issueDate, "days");
                    }
                    let completedMonths = Math.ceil(daysPassed / 30);
                    if (daysPassed % 30 === 0 && daysPassed !== 0) {
                      completedMonths -= 1;
                    }
                    completedMonths = Math.max(0, completedMonths);
                    const ALLOWED_TERMS = getAllowedTerms(rowData.loanTerms);
                    const runningTenure =
                      ALLOWED_TERMS.find(
                        (t) => t >= completedMonths && t <= rowData.loanTerms
                      ) || rowData.loanTerms;
                    return <span>{runningTenure}</span>;
                  },
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap" },
                },
                {
                  title: "Issue Date",
                  sorting: false,
                  render: (rowData) =>
                    moment(rowData.issueDate).format("MMM DD, YYYY"),

                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap", minWidth: 120 },
                },
                {
                  title: "Payment Status",
                  sorting: false,
                  headerStyle: { whiteSpace: "nowrap" },
                  cellStyle: { whiteSpace: "nowrap", minWidth: 150 },
                  render: (rowData) => {
                    let bgColor = "bg-green-700";
                    let displayText = rowData.status;
                    switch (rowData.status) {
                      case "Paid Off":
                        bgColor = "bg-gray-500 text-white font-semibold";
                        break;
                      case "Merged":
                        bgColor = "bg-gray-500 text-white font-semibold";
                        displayText = "Paid Off (Merged)";
                        break;
                      case "Partial Payment":
                        bgColor = "bg-yellow-500 text-white font-semibold";
                        break;
                         case "Denied":
                        bgColor = "bg-red-600 text-white font-semibold";
                        displayText = "Denied";
                        break;
                         case "Fraud":
                        bgColor = "bg-red-600 text-white font-semibold";
                        displayText = "Fraud";
                        break;
                         case "Lost":
                        bgColor = "bg-red-600 text-white font-semibold";
                        displayText = "Lost";
                        break;
                      case "Active":
                      default:
                        bgColor = "bg-green-600 text-white font-semibold";
                        break;
                    }
                    return (
                      <span
                        className={`px-2 py-1 rounded-md text-white text-sm ${bgColor}`}
                      >
                        {displayText}
                      </span>
                    );
                  },
                },
                {
                  title: "Active Status",
                  headerStyle: { whiteSpace: "nowrap" },
                  sorting: false,
                  cellStyle: { whiteSpace: "nowrap", minWidth: 130 },
                  render: (rowData) => (
                    <span
                      className={`px-2 py-1 rounded-md text-white text-sm font-semibold ${
                        rowData.loanStatus === "Active"
                          ? "bg-green-600"
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
                  tooltip:
                    rowData.status === "Merged"
                      ? "Delete Merged Loan (Deletes all linked loans)"
                      : "Delete Loan",
                  onClick: (_event, row) => handleDelete(row),
                }),
              ]}
              options={{
                paging: true,
                pageSize: 20,
                pageSizeOptions: [5, 10, 15, 20, 50, 100, 200, 500,1000],               
                search: false,
                actionsColumnIndex: -1,
                padding: "dense",
                toolbar: false,
                // paginationType: "stepped",
                tableLayout: "auto",
                maxBodyHeight: "calc(100vh - 213px)", // adjust
                minBodyHeight: "calc(100vh - 305px)", // optional but helpful
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
        <FormModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingClient(null);
          }}
          title={editingClient ? "Edit Client" : "New Client"}
          fields={clientFields}
          //@ts-ignore
          customFields={customFields}
          initialData={editingClient || {}}
          submitButtonText={
            editingClient ? (
              "Update Client"
            ) : (
              <>
                <Save size={16} className="inline mr-1" /> Create Client
              </>
            )
          }
          onSubmit={handleSave}
        />
        {viewModalOpen && viewClient && (
          <ClientViewModal
            open={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            client={viewClient}
            //@ts-ignore
            loans={viewClient?.loans || []}
            onEditClient={(client) => {
              setEditingClient(client);
              setModalOpen(true);
            }}
          />
        )}
      </div>
    );
  };
  const ObservedLoanTable = observer(LoanTable);
  export default ObservedLoanTable;
