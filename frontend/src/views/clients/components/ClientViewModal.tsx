import { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Plus,
  Pencil,
} from "lucide-react";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
import moment from "moment";
import { observer } from "mobx-react-lite";
import LoanPaymentModal from "../../../components/PaymentModel";
import { fetchPaymentsByLoan } from "../../../services/LoanPaymentServices";
import { Tooltip } from "@mui/material";
import Loans from "../../loans";
import { calculateLoanAmounts,calculateDynamicTermAndPayment } from "../../../utils/loanCalculations"; 

interface ClientViewModalProps {
  open: boolean;
  onClose: () => void;
  client: any;
  onEditClient: (client: any) => void;
}

const ClientViewModal = ({ open, onClose, client ,onEditClient}: ClientViewModalProps) => {
  const [paymentLoan, setPaymentLoan] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [loanPayments, setLoanPayments] = useState<Record<string, any[]>>({});
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [showAllTermsMap, setShowAllTermsMap] = useState<
    Record<string, boolean>
  >({});
  const hasLoaded = useRef(false);
  const [selectedClientForLoan, setSelectedClientForLoan] = useState<any>(null);
  const companyLoanTerms = (loan: any) => {
    const company = companyStore.companies.find((c) => c._id === loan.company);
    return company?.loanTerms?.length ? company.loanTerms : [12, 24, 36]; // fallback
  };

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

  const refreshPayments = async (loanId: string) => {
    try {
      const payments = await fetchPaymentsByLoan(loanId);
      setLoanPayments((prev) => ({ ...prev, [loanId]: payments }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch payment history");
    }
  };

  useEffect(() => {
    if (!hasLoaded.current) {
      loadInitialData();
      hasLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    if (client?._id) loanStore.fetchLoans();
  }, [client?._id]);

  if (!open) return null;

  const clientLoans = Array.isArray(loanStore.loans)
    ? loanStore.loans.filter(
      // @ts-ignore
        (loan) => loan.client?._id === client._id || loan.client === client._id
      )
    : [];

  const handleToggleLoan = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
      return;
    }
    setExpandedLoanId(loanId);

    try {
      const payments = await fetchPaymentsByLoan(loanId);
      setLoanPayments((prev) => ({ ...prev, [loanId]: payments }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch payment history");
    }
  };

  const toggleShowAllTerms = (loanId: string) => {
    setShowAllTermsMap((prev) => ({ ...prev, [loanId]: !prev[loanId] }));
  };

  const getStatusStyles = (loan: any) => {
    if ((loan.paidAmount || 0) >= (loan.totalLoan || 0))
      return "bg-green-600 text-white";
    const lower = loan.status?.toLowerCase() || "";
    if (lower === "active") return "bg-green-600 text-white";
    if (lower === "paid off") return "bg-gray-600 text-white";
    if (lower === "claim advance") return "bg-red-600 text-white animate-pulse";
    return "bg-yellow-500 text-white";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50 overflow-auto rounded-md">
      <div className="bg-white rounded-lg w-full max-w-6xl shadow-lg relative mx-4 sm:mx-6 flex flex-col"style={{ height: '650px' }}>
        {" "}
        {/* Header */}
        <div className="flex justify-between items-center py-4  px-4 border-b sticky top-0 bg-white z-20 rounded-md">
          <h2 className="font-bold text-gray-800">{client.fullName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Sidebar */}
          <div
            className={`relative transition-all duration-300 ease-in-out bg-gray-50 border-l overflow-y-auto ${
              sidebarCollapsed ? "w-12" : "w-full md:w-1/3 p-2"
            }`}
          >
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-green-700 text-white rounded-full shadow-lg hover:bg-green-800 transition-transform transform hover:scale-105"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
            </button>

            {!sidebarCollapsed && (
              <>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200">
                  <FileText size={20} className="text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Customer Information
                  </h3>
                  <Pencil
                    size={16}
                    className="text-green-700"
                    onClick={() => onEditClient(client)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 px-4">
                  <Info label="Full Name" value={client.fullName} />
                  <Info label="Email" value={client.email} />
                  <Info label="Phone" value={client.phone} />
                  <Info label="DOB" value={client.dob} />
                  <Info label="Accident Date" value={client.accidentDate} />
                  <Info label="Attorney" value={client.attorneyName} />
                  <Info label="SSN" value={client.ssn} />
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-gray-500 font-medium">
                      Address
                    </p>
                    <p className="font-semibold text-sm break-words">
                      {client.address || "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-gray-500 font-medium mb-1">
                      Memo
                    </p>
                    <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded shadow-sm text-sm text-gray-800">
                      {client.memo || "—"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Loans */}
          <div className="flex-1 border-r overflow-y-auto relative">
            <div className="sticky top-0 bg-white z-10 p-3 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Loan History
                </h3>
              </div>

              <Tooltip title="Add New Loan" arrow>
                <button
                  className="flex items-center gap-2 px-3 py-1 text-white rounded"
                  onClick={() => {
                    setSelectedClientForLoan(client);
                    setLoanModalOpen(true);
                  }}
                >
                  <Plus size={26} className="text-green-700" />
                </button>
              </Tooltip>
            </div>
            <div className="p-4 space-y-4 min-h-[400px]">
              {clientLoans.length > 0 ? (
                clientLoans.map((loan: any) => {
                  const company = companyStore.companies.find(
                    (c) => c._id === loan.company
                  );
                  const companyName = company?.companyName || "Unknown";
                  const companyColor = company?.backgroundColor || "#555555";
                  const isPaidOff =
                    (loan.paidAmount || 0) >= (loan.totalLoan || 0);

                  const {
                    dynamicTerm,
                    monthsPassed,
                    // suggestedPayment,
                    monthsDue,
                  } = calculateDynamicTermAndPayment(loan);

                  const loanData = calculateLoanAmounts(loan);
                  if (!loanData) return null;

                  const {
                    // subtotal,
                    interestAmount,
                    total,
                    paidAmount,
                    remaining,
                    currentTerm,
                  } = loanData;

                  const showAllTerms = showAllTermsMap[loan._id] || false;
                  const loanTermsOptions = loan.loanTermsOptions || [
                    currentTerm,
                  ];
                  // @ts-ignore
                  const displayedTerms = showAllTerms
                    ? loanTermsOptions
                    : [currentTerm];

                  return (
                    <div
                      key={loan._id}
                      className="border rounded-lg shadow-sm hover:shadow-lg transition-all overflow-hidden bg-white"
                    >
                      {/* Header */}
                      <div
                        className="flex justify-between items-center p-4 cursor-pointer border-b"
                        style={{ borderLeft: `6px solid ${companyColor}` }}
                        onClick={() => handleToggleLoan(loan._id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 w-full justify-between">
                          <p className="font-semibold text-gray-900 text-base">
                            {companyName}
                          </p>
                          <div className="flex flex-wrap items-center justify-end sm:justify-start gap-3 text-sm text-gray-700">
                            <span>
                              Base: ${loan.subTotal?.toLocaleString()}
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 rounded text-white text-xs font-semibold ${
                                monthsDue > 0 ? "bg-red-600" : "bg-gray-500"
                              }`}
                            >
                              Month: {monthsPassed} / {dynamicTerm}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`ml-3 px-3 py-1 rounded-md text-sm font-semibold shadow-sm whitespace-nowrap ${getStatusStyles(
                            loan
                          )}`}
                        >
                          {isPaidOff ? "Paid Off" : loan.status}
                        </span>
                      </div>

                      {/* Content */}
                      {expandedLoanId === loan._id && (
                        <div className="p-4 bg-gray-50 flex flex-col sm:flex-row gap-6">
                          {/* Payment History */}
                          <div className="flex-1 border-r pr-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                              Payment History
                              {loan.status !== "Paid Off" &&
                                !loanPayments[loan._id]?.length && (
                                  <button
                                    onClick={() => setPaymentLoan(loan)}
                                    className="p-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition ml-2"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                            </h4>

                            {loanPayments[loan._id]?.length > 0 ? (
                              loanPayments[loan._id].map((p) => (
                                <div
                                  key={p._id}
                                  className="flex justify-between items-center text-sm text-gray-700 border-b pb-1"
                                >
                                  <span className="font-medium">
                                    {moment(p.paidDate).format("MMM DD, YYYY")}
                                  </span>
                                  <span className="text-right">
                                    <span>
                                      ${p.paidAmount?.toLocaleString()} Received
                                    </span>
                                    {p.checkNumber && (
                                      <span className="ml-1 text-gray-500 whitespace-nowrap">
                                        (Check No: {p.checkNumber})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm italic">
                                No payments recorded yet.
                              </p>
                            )}
                          </div>

                          {/* Loan Details */}
                          <div className="flex-1 text-sm text-gray-700 space-y-2">
                            {loan.status !== "Paid Off" ? (
                              <>
                                <p>
                                  <span className="font-semibold">Tenure:</span>{" "}
                                  {currentTerm} month{currentTerm !== 1 && "s"}{" "}
                                  (
                                  {moment(loan.issueDate).format("MMM D, YYYY")}{" "}
                                  - {moment(loan.endDate).format("MMM D, YYYY")}
                                  )
                                </p>

                                <p>
                                  <span className="font-semibold">
                                    {currentTerm} Month Interest:
                                  </span>{" "}
                                  ${interestAmount.toLocaleString()} (
                                  {loan.monthlyRate}%
                                  {loan.interestType === "compound"
                                    ? " compound"
                                    : " flat"}{" "}
                                  per month)
                                </p>

                                <p>
                                  <span className="font-semibold">
                                    Total Amount:
                                  </span>{" "}
                                  ${total.toFixed(2)}
                                </p>

                                <p>
                                  <span className="font-semibold">
                                    Paid Amount:
                                  </span>{" "}
                                  ${paidAmount.toFixed(2)} (
                                  <span className="text-xs text-red-600 rounded-full">
                                    Outstanding:{" "}
                                    <strong>${remaining.toFixed(2)}</strong>
                                  </span>
                                  )
                                  {loanPayments[loan._id]?.length > 0 && (
                                    <button
                                      onClick={() => setPaymentLoan(loan)}
                                      className="p-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition ml-2"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}
                                </p>

                                {/* Loan Terms Scrollable Container */}
                                <div className="mt-3">
                                  <div className="flex items-center">
                                    <span className="font-semibold text-sm pr-5">
                                      Loan Terms:
                                    </span>
                                    {companyLoanTerms(loan).length > 1 && (
                                      <button
                                        onClick={() =>
                                          toggleShowAllTerms(loan._id)
                                        }
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        {showAllTermsMap[loan._id]
                                          ? "Show Less"
                                          : "More..."}
                                      </button>
                                    )}
                                  </div>

                                  <div className="overflow-x-auto w-72">
                                    <div className="grid grid-flow-col gap-2">
                                      {companyLoanTerms(loan)
                                        .filter((term) =>
                                          showAllTermsMap[loan._id]
                                            ? true
                                            : term === currentTerm
                                        )
                                        .map((term) => {
                                          const loanData = calculateLoanAmounts(
                                            { ...loan, loanTerms: term }
                                          )!;
                                          const isSelected =
                                            term === currentTerm;

                                          return (
                                            <div
                                              key={term}
                                              className={`w-28 p-2 pb-0 rounded-xl border text-center cursor-pointer flex-shrink-0 ${
                                                isSelected
                                                  ? "bg-red-700 border-red-800 text-white shadow-lg"
                                                  : "bg-white border-gray-200 text-gray-700 hover:border-red-400 hover:shadow-md"
                                              }`}
                                              onClick={() =>
                                                // @ts-ignore
                                                (currentTerm = term)
                                              }
                                            >
                                              <div className="font-medium text-sm">
                                                {term} months
                                              </div>
                                              <div className="text-xs font-bold">
                                                Interest: $
                                                {loanData.interestAmount.toFixed(
                                                  2
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="text-gray-500 italic">
                                This loan is Paid Off.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No loans available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {loanModalOpen && selectedClientForLoan && (
        <Loans
          defaultClient={selectedClientForLoan}
          onClose={() => setLoanModalOpen(false)}
          showTable={false}
          fromClientPage={true}
        />
      )}

      {paymentLoan && (
        <LoanPaymentModal
          open={!!paymentLoan}
          onClose={() => setPaymentLoan(null)}
          loan={paymentLoan}
          clientId={client._id}
          onPaymentSuccess={() => refreshPayments(paymentLoan._id)}
        />
      )}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase text-gray-500 font-medium">{label}</p>
    <p className="font-semibold text-sm">{value || "—"}</p>
  </div>
);

export default observer(ClientViewModal);
