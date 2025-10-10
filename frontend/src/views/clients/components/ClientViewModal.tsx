import { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Plus,
} from "lucide-react";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
import moment from "moment";
import { observer } from "mobx-react-lite";
import LoanPaymentModal from "../../../components/PaymentModel";
import { fetchPaymentsByLoan } from "../../../services/LoanPaymentServices";

interface ClientViewModalProps {
  open: boolean;
  onClose: () => void;
  client: any;
}

const ClientViewModal = ({ open, onClose, client }: ClientViewModalProps) => {
  const [paymentLoan, setPaymentLoan] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [loanPayments, setLoanPayments] = useState<Record<string, any[]>>({});
  const hasLoaded = useRef(false);

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

  // Refresh payments for a loan after new payment
  const refreshPayments = async (loanId: string) => {
    try {
      const payments = await fetchPaymentsByLoan(loanId);
      setLoanPayments(prev => ({ ...prev, [loanId]: payments }));
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
    if (client?._id) {
      loanStore.fetchLoans();
    }
  }, [client?._id]);

  if (!open) return null;

  const clientLoans = Array.isArray(loanStore.loans)
    ? loanStore.loans.filter(
        (loan) => loan.client?.['_id'] === client._id || loan.client === client._id
      )
    : [];

  const handleToggleLoan = async (loanId: string) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null);
      return;
    }
    setExpandedLoanId(loanId);

    try {
      const payments = await fetchPaymentsByLoan(loanId); // always fetch latest
      setLoanPayments(prev => ({ ...prev, [loanId]: payments }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch payment history");
    }
  };

  const getStatusStyles = (loan: any) => {
    if ((loan.paidAmount || 0) >= (loan.totalLoan || 0))
      return "bg-green-600 text-white";
    const lower = loan.status?.toLowerCase() || "";
    if (lower === "Active") return "bg-green-600 text-white";
    if (lower === "paid") return "bg-gray-600 text-white";
    if (lower === "claim advance") return "bg-red-600 text-white animate-pulse";
    return "bg-yellow-500 text-white";
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl shadow-lg relative mx-4 sm:mx-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-20">
          <h2 className="text-2xl font-bold text-gray-800">{client.fullName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
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
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {!sidebarCollapsed && (
              <>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200">
                  <FileText size={20} className="text-green-600" />
                  <h3 className="text-lg font-bold text-gray-800">Client Information</h3>
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
                    <p className="text-xs uppercase text-gray-500 font-medium">Address</p>
                    <p className="font-semibold text-sm break-words">{client.address || "—"}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Loans */}
          <div className="flex-1 border-r overflow-y-auto relative">
            <div className="sticky top-0 bg-white z-10 p-3 border-b flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              <h3 className="text-lg font-bold text-gray-800">Loan History</h3>
            </div>

            <div className="p-4 space-y-4 min-h-[400px]">
              {clientLoans.length > 0 ? (
                clientLoans.map((loan: any) => {
                  const company = companyStore.companies.find((c) => c._id === loan.company);
                  const companyName = company?.companyName || "Unknown";
                  const companyColor = company?.backgroundColor || "#555555";
                  const outstanding = (loan.totalLoan || 0) - (loan.paidAmount || 0);
                  const isPaidOff = (loan.paidAmount || 0) >= (loan.totalLoan || 0);

                  return (
                    <div
                      key={loan._id}
                      className="border rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden"
                    >
                      {/* Header */}
                      <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        style={{ borderLeft: `15px solid ${companyColor}` }}
                        onClick={() => handleToggleLoan(loan._id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 w-full justify-between">
                          <p className="font-semibold text-gray-900 text-base flex-shrink-0">
                            {companyName}
                          </p>
                          <p className="text-sm text-gray-700 flex-1 text-right sm:text-left">
                            Base: ${loan.baseAmount?.toLocaleString()} | Total: $
                            {loan.totalLoan?.toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusStyles(
                            loan
                          )}`}
                        >
                          {isPaidOff ? "Paid Off" : loan.status}
                        </span>
                      </div>

                      {/* Content */}
                      {expandedLoanId === loan._id && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
                          {/* Payment History */}
                          <div className="flex-1 space-y-2 border-r pr-4">
                            <h4 className="text-sm font-semibold text-gray-800">Payment History</h4>
                            {!isPaidOff && (
                              <div className="flex items-center gap-2">
                                <Plus
                                  className="w-5 h-5 text-emerald-600 cursor-pointer"
                                  onClick={() => setPaymentLoan(loan)}
                                />
                                <span className="text-red-600 font-medium">
                                  Outstanding: ${outstanding?.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {loanPayments[loan._id]?.length > 0 ? (
                              loanPayments[loan._id].map((p) => (
                                <div
                                  key={p._id}
                                  className="flex justify-between text-sm text-gray-700 border-b pb-1"
                                >
                                  <span>{moment(p.paidDate).format("MMM DD, YYYY")}</span>
                                  <span>${p.paidAmount?.toLocaleString()} Received</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-sm">No payments recorded yet.</p>
                            )}
                          </div>

                          {/* Loan Details */}
                          <div className="flex-1 space-y-2 text-sm text-gray-700">
                            {(() => {
                              const tenureMonths = loan.loanTerms || 0;
                              const monthlyInstallment = (loan.totalLoan || 0) / tenureMonths;
                              const paidMonths = Math.floor((loan.paidAmount || 0) / monthlyInstallment);
                              let displayTenure = tenureMonths;
                              if (paidMonths >= tenureMonths) displayTenure = tenureMonths * 2;
                              const remainingAmount = (loan.totalLoan || 0) - (loan.paidAmount || 0);

                              return (
                                <>
                                  <p>Tenure: {displayTenure} month{displayTenure !== 1 && "s"}</p>
                                  <p>Total Amount: ${loan.totalLoan?.toLocaleString()}</p>
                                  <p>Remaining Amount: ${remainingAmount?.toLocaleString()}</p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600 text-center py-4">No loans available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
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
