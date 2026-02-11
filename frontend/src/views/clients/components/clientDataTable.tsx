/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import MaterialTable from "@material-table/core";
import {Plus, Power, RefreshCcw, XCircle } from "lucide-react";
import moment from "moment";
import { clientStore } from "../../../store/ClientStore";
import { toast } from "react-toastify";
import { getClientsSearch, toggleClientStatus } from "../../../services/ClientServices";
import Confirm from "../../../components/Confirm";
import { calculateLoanAmounts,formatUSD } from "../../../utils/loanCalculations";
import { getAllowedTerms } from "../../../utils/constants";
import {updateLoanStatus } from "../../../services/LoanService";
import CustomerSearch from "./CustomerSearch";
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
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    attorneyName: "",
    status: "",
    loanStatus: "",
    issueDate: null,
    dob: null,
    accidentDate: null,
    ssn: "",
    underwriter: "",
    medicalParalegal: "",
    caseId: "",
    caseType: "",
    indexNumber: "",
    uccFiled: "",
  });
  const fetchClientsData = async (query) => {
      const params = {
        orderBy: query.orderBy?.field || null,
        orderDirection: query.orderDirection || null,
        page: query.page,
        limit: query.pageSize,
        name: filters.name,
        email: filters.email,
        phone: filters.phone,
        attorneyName: filters.attorneyName,
        status: filters.status,
        loanStatus: filters.loanStatus,
        underwriter: filters.underwriter,
        medicalParalegal: filters.medicalParalegal,
        caseId: filters.caseId,
        indexNumber: filters.indexNumber,
        uccFiled: filters.uccFiled,
        ssn: filters.ssn,
        caseType: filters.caseType,
        issueDate: filters.issueDate
          ? moment(filters.issueDate).format("MM-DD-YYYY")
          : null,
        dob: filters.dob ? moment(filters.dob).format("MM-DD-YYYY") : null,
        accidentDate: filters.accidentDate
          ? moment(filters.accidentDate).format("MM-DD-YYYY")
          : null,
      };
      const data = await getClientsSearch(params);
      clientStore.setClients(data.clients);
      setCurrentPage(query.page);
      setCurrentPageSize(query.pageSize);
      return {
        data: data.clients,
        page: query.page,
        totalCount: data.total,
      };
  };
  const handleDelete = async (id: string) => {
    Confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this customer & their Loans?",
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
          } this client & their Loans?`,
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
  const getStatusStyles = (status: string) => {
    const lower = status?.toLowerCase() || "";

    if (lower === "active") return "bg-green-600 text-white";
    if (lower === "partial payment") return "bg-yellow-500 text-white";
    if (lower === "paid off") return "bg-gray-500 text-white";
    if (lower === "merged") return "bg-gray-500 text-white";
    if (["fraud", "lost", "denied"].includes(lower))
      return "bg-red-600 text-white";

    return "bg-gray-400 text-white";
  };
  const handleLoanStatusChange = async (loanId: string, newStatus: string) => {
    try {
      await updateLoanStatus(loanId, newStatus);
      toast.success("Loan status updated");
      tableRef.current?.onQueryChange();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update loan status");
    }
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
  useEffect(() => {
    clientStore.setTableRef(tableRef);
  }, []);
  return (
    <>
      <CustomerSearch
        filters={filters}
        setFilters={setFilters}
        tableRef={tableRef}
      />
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          isLoading={false}
          title={null}
          tableRef={tableRef}
          data={fetchClientsData}
          columns={[
            {
              title: "Sr.no",
              sorting: false,
              render: (rowData: any) => {
                return rowData.tableData.id + 1 + currentPage * currentPageSize;
              },
            },
            {
              title: "Name",
              field: "fullName",
              sorting: true,
              cellStyle: { fontWeight: 500 },
              render: (rowData) => (
                <a
                  href="#"
                  className="text-green-600 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    onViewClient?.(rowData);
                  }}
                >
                  {rowData?.fullName}
                </a>
              ),
            },
            { title: "Phone", field: "phone", sorting: false },
            {
              title: "Total Loan Amount",
              sorting: false, 
              render: (rowData: any) => (
                <span className="font-semibold text-green-700">
                  ${rowData.loanSummary?.totalSubTotal?.toLocaleString() || "0"}
                </span>
              ),
            },
            {
              title: "Paid",
              sorting:false,  
              render: (rowData: any) => {
                const clientLoans = rowData.allLoans.filter(
                  (loan) =>
                    loan.client === rowData._id ||
                    loan.client?._id === rowData._id
                );
                const { totalPaid, totalRemaining } =
                  calculateLoanTotals(clientLoans);
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
              sorting: false, 
              render: (rowData: any) => {
                if (!rowData.latestLoan || !rowData.latestLoan.issueDate) {
                  return <span className="text-gray-400 italic">-</span>;
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
              title: "Payment Status",
              sorting: false, 
              headerStyle: { whiteSpace: "nowrap" },
              cellStyle: { whiteSpace: "nowrap", minWidth: 160 },
              render: (rowData: any) => {
                const loan = rowData.latestLoan;
                if (!loan) return <span className="text-gray-400">—</span>;
                // const isDisabled = !rowData.isActive || loan.status === "Merged";

                return (
                  <select
                    className={`
                                px-3 py-1 rounded text-xs text-white font-semibold cursor-pointer
                                focus:outline-none transition  disabled:opacity-100  
                                ${getStatusStyles(loan.status)}
                              `}
                    value={loan.status}
                    disabled={true}
                    title="Change Loan Status"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      handleLoanStatusChange(loan._id, e.target.value)
                    }
                  >
                    {loan.status === "Merged" ? (
                      <option value="Merged">Merged</option>
                    ) : (
                      <>
                        <option value="Active">Active</option>
                        <option value="Partial Payment">Partial Payment</option>
                        <option value="Paid Off">Paid Off</option>
                        <option value="Fraud">Fraud</option>
                        <option value="Lost">Lost</option>
                        <option value="Denied">Denied</option>
                      </>
                    )}
                  </select>
                );
              },
            },
            // {
            //   title: "Status",
            //   render: (rowData) =>
            //     rowData.isActive ? (
            //       <span className="px-2 py-0.5 bg-green-600 text-white text-sm font-semibold rounded-md">
            //         Active
            //       </span>
            //     ) : (
            //       <span className="px-2 py-0.5 bg-red-600 text-white text-sm font-semibold rounded-md">
            //         Inactive
            //       </span>
            //     ),
            //   cellStyle: { width: 100, textAlign: "left", padding: "6px" },
            // },
            {
              title: "DOB",
              field: "dob",
              type: "date",
              sorting: true,
              cellStyle: { width: 140, minWidth: 140 },
            },
            { title: "Accident Date", field: "accidentDate", type: "date",sorting:true },
            { title: "Attorney", field: "attorneyName", sorting:true},
            { title: "SSN", field: "ssn",sorting:true  },
            { title: "Email", field: "email", sorting: true},
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
              icon: () => <XCircle className="w-5 h-5 text-red-600" />,
              tooltip: "Delete Customer",
              onClick: (_event, rowData: any) => handleDelete(rowData._id),
            },       
          ]}
          options={{
            paging: true,
            pageSize: 20,
            pageSizeOptions: [5, 10, 15, 20, 50, 100, 200, 500,1000],
            sorting: true,
            search: false,
            actionsColumnIndex: -1,
            headerStyle: {
              position: "sticky",
              fontWeight: "600",
              backgroundColor: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              height: 36,
              padding: "6px 8px",
              borderBottom: "1px solid #e5e7eb",
              whiteSpace: "nowrap",
              right: 0,
              zIndex: 30,
            },
            maxBodyHeight: "calc(100vh - 408px)", // adjust
            minBodyHeight: "calc(100vh - 408px)", // optional but helpful
            actionsCellStyle: {
              position: "sticky",
              right: 0,
              zIndex: 10,
              background: "#fff",
            },  
            rowStyle: (rowData: any) => ({
              fontSize: "13px",
              height: 38,
              width: 38,
              borderBottom: "1px solid #f1f1f1",
              transition: "background 0.2s",
               backgroundColor: !rowData.isActive ? "#f3e2e2" : "#ffffff",
            }),
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
    </>
  );
};

export default ClientsDataTable;
