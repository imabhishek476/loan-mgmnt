import React, { useState, useMemo, useEffect } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Eye, Trash2, Wallet } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import moment from "moment";
import { observer } from "mobx-react-lite";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

interface LoanTableProps {
  onDelete: (id: string) => void;
  clientId?: string;
}

const LoanTable: React.FC<LoanTableProps> = ({ onDelete, clientId }) => {
  const { loans, loading } = loanStore;
  const [search, setSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);

  const filteredLoans = useMemo(() => {
    if (loading || !loans) return [];
    let data = loans;

    if (clientId) {
      data = data.filter(
        (loan) => loan.client === clientId || loan.client?._id === clientId
      );
    }

    if (!search) return data;

    return data.filter((loan) => {
      const clientName =
        loan.client?.fullName ||
        clientStore.clients.find((c) => c._id === loan.client)?.fullName ||
        "";
      const companyName =
        loan.company?.companyName ||
        companyStore.companies.find((c) => c._id === loan.company)?.companyName ||
        "";
      return (
        clientName.toLowerCase().includes(search.toLowerCase()) ||
        companyName.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [loans, search, clientId, loading]);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearch(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleView = (loan: any) => setSelectedLoan(loan);
  const handleClose = () => setSelectedLoan(null);
  useEffect(() => {
    if (clientId) clientStore.fetchClientLoans(clientId);
  }, [clientId]);

  return (
    <div>
      {/* Search Input */}
      <div className="mb-3 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search loans by client or company..."
          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          onChange={handleSearchChange}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress className="text-green-700" />
            <span className="ml-3 text-gray-700 font-medium">Loading loans...</span>
          </div>
        ) : filteredLoans.length > 0 ? (
          <MaterialTable
            title={null}
            columns={[
              { title: "Sr.no", render: (rowData) => rowData.tableData.id + 1, width: "5%" },
              {
                title: "Client",
                render: (rowData) =>
                  clientStore.clients.find((c) => c._id === rowData.client)?.fullName || "",
              },
              {
                title: "Company",
                render: (rowData) =>
                  companyStore.companies.find((c) => c._id === rowData.company)?.companyName || "Unnown",
              },
              {
                title: "Base Amount ($)",
                render: (rowData) =>
                  `$${Number(rowData.baseAmount || 0).toLocaleString()}`,
              },
              {
                title: "Total Loan ($)",
                render: (rowData) =>
                  `$${Number(rowData.totalLoan || 0).toLocaleString()}`,
              },
              { title: "Term (months)", field: "loanTerms" },
              { title: "Issue Date", render: (rowData) => moment(rowData.issueDate).format("DD MMM YYYY") },
              {
                title: "Status",
                render: (rowData) => {
                  const status = rowData.status;
                  let color = "text-green-700";
                  if (status === "Payment Received") color = "text-blue-700";
                  else if (status === "Partial Payment Received") color = "text-yellow-700";
                  return <span className={`font-semibold ${color}`}>{status}</span>;
                },
              },
            ]}
            data={filteredLoans}
            actions={[
              {
                icon: () => <Eye className="w-5 h-5 text-blue-600" />,
                tooltip: "View Details",
                onClick: (event, rowData: any) => handleView(rowData),
              },
              {
                icon: () => <Trash2 className="w-5 h-5 text-red-600" />,
                tooltip: "Delete",
                onClick: (event, rowData: any) => onDelete(rowData._id),
              },

            ]}
            options={{
              paging: true,
              pageSize: 5,
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
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
              },
              rowStyle: {
                fontSize: "13px",
                height: 38,
                borderBottom: "1px solid #f1f1f1",
                transition: "background 0.2s",
              },
              padding: "dense",
              toolbar: false,
            }}
          />
        ) : (
          <div className="text-center py-10 bg-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-4 bg-gray-300 rounded-full w-20 h-20 mx-auto">
              <Wallet className="w-16 h-16 text-green-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-4">
              {search ? `No results found for "${search}"` : "No loans available."}
            </p>
          </div>
        )}
      </div>
      <Dialog
        open={!!selectedLoan}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: "rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50" }}
      >
        <DialogTitle className="font-semibold text-xl text-green-700 border-b pb-2">
          Loan Details
        </DialogTitle>

        <DialogContent className="p-6">
          {selectedLoan && (
            <div className="grid grid-cols-1 mt-5 sm:grid-cols-2 gap-4 text-gray-800 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Client</p>
                <p className="font-medium">
                  {clientStore.clients.find((c) => c._id === selectedLoan.client)?.fullName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Company</p>
                <p className="font-medium">
                  {companyStore.companies.find((c) => c._id === selectedLoan.company)?.companyName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Base Amount</p>
                <p className="font-semibold text-green-700">
                  ${Number(selectedLoan.baseAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Total Loan</p>
                <p className="font-semibold text-green-700">
                  ${Number(selectedLoan.totalLoan || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Interest Type</p>
                <p className="font-medium capitalize">{selectedLoan.interestType || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Monthly Rate</p>
                <p className="font-medium">{selectedLoan.monthlyRate}%</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Loan Term</p>
                <p className="font-medium">{selectedLoan.loanTerms} months</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Issue Date</p>
                <p className="font-medium">{moment(selectedLoan.issueDate).format("MMM DD, YYYY")}</p>
              </div>
              <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-2">
                <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
                <p className={`font-semibold ${selectedLoan.status === "Fresh Loan Issued"
                    ? "text-green-700"
                    : selectedLoan.status === "Payment Received"
                      ? "text-blue-700"
                      : "text-yellow-700"
                  }`}>
                  {selectedLoan.status}
                </p>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogActions className="px-6 pb-4">
          <Button
            onClick={handleClose}
            variant="contained"
            color="success"
            className="rounded-lg shadow-sm px-5 font-bold"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
const ObservedLoanTable = observer(LoanTable);
export default ObservedLoanTable;

