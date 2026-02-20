import { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Pencil,
  AlertCircle,
  ChevronRight,
  ChevronUp,
  ChevronLeft,
  ChevronDown,
  Trash2,
  RefreshCcw,
  Eye,
} from "lucide-react";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
import moment from "moment";
import { observer } from "mobx-react-lite";
import LoanPaymentModal from "../../../components/PaymentModel";
import { deletePayment, fetchPaymentsByLoan } from "../../../services/LoanPaymentServices";
import { Button } from "@mui/material";
import Loans from "../../loans";
import {formatUSD } from "../../../utils/loanCalculations";
import EditLoanModal from "../../../components/EditLoanModal";
import EditPaymentModal from "../../../components/EditPaymentModal";
import Confirm from "../../../components/Confirm";
import {deactivateLoan,recoverLoan, updateLoanStatus,} from "../../../services/LoanService";
import { getAllowedTerms } from "../../../utils/constants";

interface ClientViewModalProps {
  open: boolean;
  onClose: () => void;
  client: any;
  onEditClient: (client: any) => void;
  initialEditingLoan?: any;
}

// eslint-disable-next-line react-refresh/only-export-components
const ClientViewModal = ({ open, onClose, client ,onEditClient}: ClientViewModalProps) => {
  const [paymentLoan, setPaymentLoan] = useState<any>(null);
  const [editPaymentLoan, setEditPaymentLoan] = useState<any>(null);
  const [expandedLoanIds, setExpandedLoanIds] = useState<string[]>([]);
  const [loanPayments, setLoanPayments] = useState<Record<string, any[]>>({});
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanEditModalOpen, setEditLoanModalOpen] = useState(false);
  const [showAllTermsMap, setShowAllTermsMap] = useState<
    Record<string, boolean>
  >({});
  const [loanModalMode, setLoanModalMode] = useState<"edit" | "view">("edit");

  const [selectedClientForLoan, setSelectedClientForLoan] = useState<any>(null);
  const companyLoanTerms = (loan: any) => {
    const company = companyStore.companies.find((c) => c._id === loan.company);
    return company?.loanTerms?.length ? company.loanTerms : [12, 24, 36]; // fallback
  };
const [currentTermMap, setCurrentTermMap] = useState<Record<string, number>>({});
const [editingLoanId, setEditingLoanId] = useState<any>(null);
const [editingPayment, setEditingPayment] = useState<any>(null);
const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
const [activeTab, setActiveTab] = useState<"customer" | "loans">("customer");
  const loadInitialData = async () => {
    try {
      const promises = [];
      if (companyStore.companies.length == 0 ) {
        promises.push(companyStore.fetchCompany());
      }
       if (clientStore.clients.length == 0) {
         promises.push(clientStore.fetchClients());
       }
        if (loanStore.loans.length == 0) {
          promises.push(loanStore.fetchActiveLoans(client._id));
        }
      await Promise.all(promises);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    }
  };

  const refreshPayments = async (loanId: string) => {
    try {
      const payments = await fetchPaymentsByLoan(loanId);
      setLoanPayments((prev) => ({ ...prev, [loanId]: payments }));
      await loanStore.getLoanProfitByLoanId(client._id);
    
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch payment history");
    }
  };

  const clientLoans = useMemo(() => {
  return Array.isArray(loanStore.loans)
    ? loanStore.loans.filter(
        (loan) => loan.client?.['_id'] === client._id || loan.client === client._id
      )
    : [];
}, [loanStore.loans, client?._id]);

 const getClientLoansData = useMemo(() => {
  return clientLoans.map((loan) => {
    const companyId =
      typeof loan.company === "string"
        ? loan.company
        : loan.company?._id;
    const company =
      companyStore.companies.find((c) => c._id === companyId) ||
      loan.company;
    const companyName = company?.companyName || "Unknown";
    const companyColor = company?.backgroundColor || "#555555";
    const selectedDynamicTerm = currentTermMap[loan._id];

    
    const selectedLoanData = loanStore.calculateLoans(
      {
        ...loan,
        // loanTerms: selectedDynamicTerm,
      },
      clientLoans,       
      "mergedDate"       
    );
    const today = moment();
    const endDate = moment(loan.issueDate).add(
      loan.loanTerms,
      "months"
    );
    const end = Number(selectedDynamicTerm) * 30;
    const currentEndDate = moment(loan.issueDate).add(end, "day");
    const isDelayed = today.isAfter(endDate, "day");
    const profitData = loanStore.loanProfitMap[String(loan?._id)];

    return {
      loan,
      companyName,
      isDelayed,
      selectedLoanData,
      companyColor,
      currentEndDate,
      selectedDynamicTerm,
      endDate,
      profitData,
    };
  });
}, [clientLoans, companyStore.companies, currentTermMap]);

  const getDefaultLoanTerm = (loan: any) => {
    const LOAN_TERMS = getAllowedTerms(loan.loanTerms) || [];
    if (!LOAN_TERMS.length) return loan.loanTerms;
    const loanData = loanStore.calculateLoans(loan, loanStore.loans, "mergedDate");
    if (!loanData) return LOAN_TERMS[0];
    const monthsPassed = Math.ceil(loanData.monthsPassed || 0);
    const nextTerm = LOAN_TERMS.find((t) => t > monthsPassed);
    return nextTerm ?? LOAN_TERMS[LOAN_TERMS.length - 1];
  };

useEffect(() => {
  if (clientLoans.length > 0 && expandedLoanIds.length === 0) {
    setExpandedLoanIds(clientLoans.map((loan) => loan._id));
  }
}, [clientLoans]);

  useEffect(() => {
    loadInitialData();
  if (client?._id) loanStore.fetchActiveLoans(client?._id);
  }, [client?._id]);
  useEffect(() => {
    const newMap: Record<string, number> = {};
    clientLoans.forEach((loan) => {
      newMap[loan._id] = getDefaultLoanTerm(loan);
    });
    setCurrentTermMap(newMap);
  }, [clientLoans]);
  if (!open) return null;

const handleToggleLoan = async (loanId: string) => {
  setExpandedLoanIds((prev) =>
    prev.includes(loanId)
      ? prev.filter((id) => id !== loanId) // collapse
      : [...prev, loanId] // expand
  );

  try {
    const payments = await fetchPaymentsByLoan(loanId);
    setLoanPayments((prev) => ({ ...prev, [loanId]: payments }));
    loanStore.getLoanProfitByLoanId(loanId);
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch payment history");
  }
};
const handleDeletePayment = async (payment: any) => {
  Confirm({
    title: "Confirm Delete",
    message: "Are you sure you want to delete this Payment?",
    confirmText: "Yes, Delete",
    onConfirm: async () => {
      await deletePayment(payment._id!);
      refreshPayments(payment.loanId);
       await loanStore.fetchActiveLoans(payment.clientId);
      await clientStore.refreshDataTable();
      toast.success("Payment deleted successfully");
    },
  });
};
const handleDeleteLoan = async (loanId) => {
  try {
       Confirm({
             title: "Confirm Deactivate",
             message: "Are you sure you want to deactivate this loan?",
             confirmText: "Yes, Deactivate",
             onConfirm: async () => {
                 await deactivateLoan(loanId);
                            await loanStore.fetchActiveLoans(client._id);
                            await clientStore.refreshDataTable();
               toast.success("Loan Deactivated successfully");
             },
           });   
  } catch (err) {
    toast.error("Failed to delete loan");
  }
};
 const handleRecover = async (loanId) => {
   Confirm({
     title: "Recover Loan",
     message: `Are you sure you want to recover the loan ?`,
     confirmText: "Yes, Recover",
     cancelText: "Cancel",
     onConfirm: async () => {
       try {
         await recoverLoan(loanId);
          await loanStore.fetchActiveLoans(client._id);
          await clientStore.refreshDataTable();
         toast.success(
           `Loan has been recovered successfully!`
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
  const toggleShowAllTerms = (loanId: string) => {
    setShowAllTermsMap((prev) => ({ ...prev, [loanId]: !prev[loanId] }));
  };

  const getStatusStyles = (loan: any) => {
    if (loan.loanStatus === "Deactivated") return "bg-gray-400 text-white";
  const paid = loan.paidAmount || 0;
  const total = loan.totalLoan || 0;
  const lower = loan.status?.toLowerCase() || "";
  if (paid >= total && lower === "paid off") 
    return "bg-gray-500 text-white";
  if (lower === "merged") 
    return "bg-gray-500 text-white";
  if (lower === "active") 
    return "bg-green-600 text-white";
  if (lower === "partial payment") 
    return "bg-yellow-500 text-white";
  if (lower === "fraud") 
    return "bg-red-600 text-white";
  if (lower === "lost") 
    return "bg-red-600 text-white";
  if (lower === "denied") 
    return "bg-red-600 text-white";
  return "bg-gray-500 text-white";
};
const handleStatusChange = async (loanId, newStatus) => {
  try {
    await updateLoanStatus(loanId, newStatus);
    toast.success("Loan status updated");
    await loanStore.getLoanProfitByLoanId(loanId);
    await loanStore.fetchActiveLoans(client._id);
    await clientStore.refreshDataTable();
  } catch (err) {
    console.error(err);
    toast.error("Failed to update status");
  }
};

return (
  <div className="flex-col">
    <div className=" sticky top-0 z-20">
      {/* Header */}
      <div className="border-b  py-1 sticky top-0 z-20  flex justify-between items-left">
        <h1 className="font-bold text-xl text-gray-800">
          {client.fullName}
        </h1>
      </div>
      <div className="sticky top-[48px]  z-20 border-b px-3">

        <div className="flex justify-between items-center">

          {/* LEFT → Tabs */}
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("customer")}
              className={`py-3 text-sm font-semibold border-b-2 transition ${activeTab === "customer"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              Customer Info
            </button>

            <button
              onClick={() => setActiveTab("loans")}
              className={`py-3 text-sm font-semibold border-b-2 transition ${activeTab === "loans"
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              Loan History
            </button>
          </div>

          {/* RIGHT → Button */}
          {activeTab === "loans" && (
            <Button
              variant="contained"
              startIcon={<Plus />}
              sx={{
                backgroundColor: "#15803d",
                "&:hover": { backgroundColor: "#166534" },
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "6px",
                boxShadow: "none",
              }}
              onClick={() => {
                setSelectedClientForLoan(client);
                setLoanModalOpen(true);
              }}
            >
              New Loan
            </Button>
          )}

        </div>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1  overflow-hidden ">

      {/* ✅ CUSTOMER TAB */}
      {activeTab === "customer" && (
        <div className="h-full overflow-y-auto p-3">
          <div className="flex items-center mb-4 gap-3">
            <h3 className="font-bold text-gray-800">
              Customer Information
            </h3>

            <Pencil
              size={18}
              className="text-green-700 cursor-pointer hover:text-green-900"
              onClick={() => onEditClient(client)}
            />
          </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                  <Info label="Full Name" value={client.fullName} />
                  <Info label="Email" value={client.email} />
                  <Info label="Phone" value={client.phone} />
                  <Info label="DOB" value={client.dob} />
                  <Info label="Accident Date" value={client.accidentDate} />
                  <Info label="Attorney" value={client.attorneyName} />
                  <Info label="SSN" value={client.ssn} />
                    {client.underwriter && (
                      <Info label="Underwriter" value={client.underwriter} />
                    )}
                    {client.medicalParalegal && (
                      <Info label="Medical Paralegal" value={client.medicalParalegal} />
                    )}
                    {client.caseId && (
                      <Info label="Case ID" value={client.caseId} />
                    )}
                    {client.caseType && (
                      <Info label="Case Type" value={client.caseType} />
                    )}
                    {client.indexNumber && (
                      <Info label="Index #" value={client.indexNumber} />
                    )}
                    {client.uccFiled !== undefined && (
                      <Info label="UCC Filed" value={client.uccFiled ? "Yes" : "No"} />
                    )}
            <div className="sm:col-span-2">
              <Info label="Address" value={client.address} />
            </div>

            {/* Memo */}
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase text-gray-500 font-medium">
                      Memo
                    </p>
                    <div className="bg-yellow-100 border-l-4 border-yellow-600 p-3 rounded text-sm">
                      {client.memo || "—"}
                    </div>
                  </div>
                </div>
        </div>
      )}
      {/* ✅ LOANS TAB */}
      {activeTab === "loans" && (
        <div className="h-[calc(90vh-53px)] overflow-y-auto p-2 space-y-4">
          {/* Loans List */}
          <div className="overflow-y-auto p-2 space-y-4">
              {getClientLoansData.length > 0 ? (
                getClientLoansData.map((loanData: any) => {
                  const { loan, companyName, companyColor, selectedLoanData, isDelayed, currentEndDate, profitData } = loanData;
                  return (
                    <div
                      key={loan._id}
                      style={{ borderLeft: `6px solid ${companyColor}` }}
                      className={`border rounded-lg shadow-sm hover:shadow-lg  transition-all overflow-hidden bg-gray-100 hover:bg-gray-50  ${loan.status === "Merged" ? "ml-6 sm:ml-6" : ""}`}
                    >
                        <table className="w-full">
                       <tbody>
                      <tr
                        className="cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => handleToggleLoan(loan._id)}
                      >
                        <td colSpan={4} className="px-3 py-2 w-3/4">
                          <div className="flex justify-between items-center text-sm font-semibold text-gray-700  gap-10 sm:gap-6">
                            <div className="flex items-center gap-2 flex-wrap  max-w-[150px]">
                              <span className="font-bold text-gray-800 ">
                                {companyName}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-4 ml-auto text-right w-full sm:w-auto">
                              <span>
                                Principal Amount:{" "}
                                <span className="text-blue-700 font-bold">
                                  {formatUSD(loan.subTotal.toFixed(2))}
                                </span>
                              </span>
                              <span>
                                Paid:{" "}
                                <span className="text-green-700 font-bold">
                                  {formatUSD(selectedLoanData.paidAmount)}
                                </span>{" "}
                                /{" "}
                             <span className="text-red-700 font-bold">
                                 {formatUSD(
                                    loan.status === "Paid Off"
                                      ? 0
                                      : selectedLoanData.remaining
                                  )}
                                </span>
                              </span>
                              {!["Paid Off", "Merged"].includes(
                                loan.status
                              ) &&
                                    loan.loanStatus !== "Deactivated" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentLoan(loan);
                                  }}
                                  className="p-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition ml-2"
                                  title="Add Payment"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}

                              <div className="relative">
                                <select
                                  className={`
                                    px-3 py-1 rounded-sm text-xs font-semibold shadow-sm cursor-pointer
                                    focus:outline-none focus:ring-0 
                                    transition-all duration-200
                                    ${getStatusStyles(loan)}
                                  `}
                                  value={loan.status}
                                  title="Status"
                                  disabled={loan.status === "Merged"}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleStatusChange(loan._id, e.target.value)}
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
                              </div>
                             {isDelayed &&
                      loan.status !== "Paid Off" &&
                      loan.status !== "Merged" && (
                        <AlertCircle
                          size={16}
                          className="text-red-600"
                        />
                      )}
                                <span>
                                  {loan.status !== "Merged" &&
                                    loan.loanStatus !== "Deactivated" && (
                                      <span title="Edit Loan">
                                        <Pencil
                                          size={16}
                                          className="text-green-700 inline-block cursor-pointer hover:text-green-900"
                                          onClick={(e) => {
                                            setLoanModalMode("edit");
                                            e.stopPropagation();
                                            setSelectedClientForLoan(client);
                                            setEditLoanModalOpen(true);
                                            setEditingLoanId(loan._id);
                                          }}
                                        />
                                      </span>
                                    )}
                                </span>
                                <span title="View Loan">
                                  <Eye
                                    size={16}
                                    className="text-blue-600 cursor-pointer hover:text-blue-800 ml-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLoanModalMode("view");
                                        setSelectedClientForLoan(client);
                                        setEditLoanModalOpen(true);
                                        setEditingLoanId(loan._id);
                                      }}
                                    />
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    </table>
                      {/* Content */}
                      {expandedLoanIds.includes(loan._id) && (
                        <div className="px-4 pb-1  bg-gray-50 flex  flex-col sm:flex-row gap-1 overflow-y-auto max-h-[50vh] md:max-h-none">
                          {loan.loanStatus === "Deactivated" ? (
                            <>
                            <p className="text-gray-500 italic">
                              This loan has been deactivated.
                            </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecover(loan._id);
                                }}
                                className="p-1 rounded-full  hover:bg-green-200 text-red-600 transition ml-2"
                                title="Recover Loan"
                              >
                                <RefreshCcw className="w-5 h-5 text-green-600" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Payment History */}
                              <div className="flex-1  pr-4 space-y-3 pt-2 border-r-2">
                                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                  PayOff History
                                  {(loan.status === "Active" ||
                                loan.status === "Partial Payment")&&(
                                  <button
                                    onClick={() => setPaymentLoan(loan)}
                                    title="Add Payment"
                                    className="p-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition ml-2"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                                </h4>

                                {loanPayments[loan._id]?.length > 0 ? (
                                  <div className="mt-2 max-h-48 overflow-y-auto rounded-md">
                                    {loanPayments[loan._id].map((p) => (
                                      <div
                                        key={p._id}
                                        className="flex justify-between items-start text-left text-sm text-gray-700 border-b pb-2 px-1"
                                      >
                                        <div className="flex items-center gap-2">
                                        <span className="font-medium w-28">
                                          {moment(p.paidDate).format(
                                            "MMM DD, YYYY"
                                          )}
                                        </span>
                                          <span className="block font-medium">
                                            {formatUSD(
                                              p.paidAmount?.toFixed(2)
                                            )}
                                          </span>
                                          <div className="text-xs mt-0.5 flex flex-col">
                                            {p.checkNumber && (
                                              <span>
                                                Check No: {p.checkNumber}
                                              </span>
                                            )}
                                            {p.payoffLetter && (
                                              <span>
                                                Payoff Letter: {p.payoffLetter}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {loan.status !== "Merged" && loan.status !== "Paid Off" && (
    <>
                                          <button
                                            onClick={() => {
                                              setEditingPayment(p);
                                              setEditPaymentLoan(loan);
                                              setEditPaymentModalOpen(true);
                                            }}
                                            title="Edit Payment"
                                            className="text-green-700 cursor-pointer hover:text-green-900   transition md:w-5 md:h-5"
                                          >
                                            <Pencil size={16} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeletePayment(p)
                                            }
                                            className="p-1 rounded-full  hover:bg-red-200 text-red-600 transition"
                                            title="Delete Payment"
                                          >
                                            <X size={14} />
                                          </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm italic">
                                    No payments recorded yet.
                                  </p>
                                )}
                                  {profitData?.totalProfit > 0 && (
                                    <div className="text-sm font-semibold text-emerald-600">
                                      Profit: {formatUSD(profitData.totalProfit)}
                                    </div>
                                )}
                              </div>

                              {/* Loan Details */}
                              <div className="flex-2 text-sm text-gray-700 space-y-1 pt-2">
                          
                                  <>
                                    {(() => {
                                      return (
                                        <table className="w-full text-sm text-gray-700 border-collapse">
                                          <tbody>
                                            <tr className="">
                                              <td>
                                                {loan.status === "Paid Off" && (
                                                  <p className="text-green-600 font-semibold">
                                                    This loan has been fully
                                                    paid off.
                                                  </p>
                                                )}
                                                {loan.status === "Merged" && (
                                                  <p className="text-blue-600 font-semibold">
                                                    This loan has been merged
                                                    with a new loan.
                                                  </p>
                                                )}
                                              </td>
                                            </tr>
                                            <tr className="">
                                              <td className="font-semibold py-0 whitespace-nowrap">
                                                Issue Date:
                                              </td>
                                              <td className="py-0">
                                                {loan.issueDate
                                                  ? moment(
                                                      loan.issueDate
                                                    ).format("MMM DD, YYYY")
                                                  : "—"}
                                              </td>
                                               <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteLoan(loan._id);
                                              }}
                                              className="p-1 rounded-full  hover:bg-red-200 text-red-600 transition ml-2"
                                              title="Deactivate Loan"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                            </tr>
                                            <tr className="">
                                              <td className="font-semibold py-0 whitespace-nowrap">
                                                Check No:
                                              </td>
                                              <td className="py-0">
                                                {loan.checkNumber}
                                              </td>
                                            </tr>
                                            {loan.status !== "Paid Off" &&
                                              loan.status !== "Merged" && (
                                                <>
                                            <tr className="">
                                              <td className="font-semibold py-0">
                                                Current Tenure:
                                              </td>
                                              <td className="py-0">
                                                {selectedLoanData.dynamicTerm} month {""}
                                                <span
                                                  className={`${isDelayed
                                                      ? "text-red-400 font-bold animate-pulse"
                                                      : ""
                                                  }`}
                                                  ></span>{" "}
                                                <span>
                                                  (
                                                  {moment(
                                                    currentEndDate
                                                  ).format("MMM DD YYYY")}
                                                  )
                                                </span>
                                                {isDelayed && (
                                                  <span className="ml-2 text-xs text-red-600 font-semibold">
                                                    • Delayed
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                            <tr className="">
                                              <td className="font-semibold py-0">
                                                Interest:
                                              </td>
                                              <td className="py-0">
                                                <span
                                                  className={`${isDelayed
                                                      ? "text-red-600 font-bold animate-pulse"
                                                      : ""
                                                  }`}
                                                >
                                                  $
                                                  {selectedLoanData.interestAmount.toFixed(
                                                    2
                                                  )}
                                                </span>{" "}
                                                ({loan.monthlyRate}%{" "}
                                                {loan.interestType ===
                                                "compound"
                                                  ? "compound"
                                                  : "flat"}{" "}
                                                per month)
                                              </td>
                                            </tr>
                                          </>
                                          )}
                                            {/* 
                                            <tr className="">
                                              <td className="font-semibold py-0">
                                                Loan Amount:
                                              </td>
                                              <td className="py-0">
                                                {formatUSD(loan.subTotal)}
                                              </td>
                                            </tr> */}
                                            {loan.status !== "Paid Off" && (
                                            <tr className="">
                                              <td className="font-semibold py-0 whitespace-nowrap">
                                                Total Loan Amount:
                                              </td>
                                              <td className="py-0">
                                                {formatUSD(
                                                  selectedLoanData.total.toFixed(
                                                    2
                                                  )
                                                )}{" "}
                                                 (Base Amount: {formatUSD(loan.baseAmount)})
                                              </td>
                                            </tr>
                                           )}
                                            <tr>
                                              <td>
                                              {/* <td className="font-semibold py-0">
                                                Paid Amount:
                                              </td>
                                              <td className="py-0 flex items-center gap-2">
                                                {formatUSD(
                                                  selectedLoanData.paidAmount
                                                )}
                                                <span className="text-xs text-red-600 rounded-full whitespace-nowrap">
                                                  Outstanding:{" "}
                                                  <strong>
                                                    {formatUSD(
                                                      selectedLoanData.remaining
                                                )}
                                              </strong>
                                            </span>
                                            {loanPayments[loan._id]
                                                  ?.length > 0 && (
                                              <button
                                                onClick={() =>
                                                  setPaymentLoan(loan)
                                                }
                                                className="p-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition ml-2"
                                              >
                                                <Plus className="w-4 h-4" />
                                              </button>
                                            )}
                                          </td> */}
                                            </td>
                                            </tr>
                                            <tr className="">
                                              <td className="font-semibold py-0">
                                                Terms:
                                              </td>
                                              <td className="py-0">
                                                {(loan.status === "Paid Off" || companyLoanTerms(loan).length >
                                                  1) && (
                                                  <button
                                                    onClick={() => toggleShowAllTerms(loan._id)}
                                                    className="text-xs text-blue-600 hover:underline"
                                                    title={showAllTermsMap[loan._id] ? "Less Details..." : "More Details..."}
                                                  >
                                                    {showAllTermsMap[loan._id] ? "Less Details..." : "More Details..."}
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                    <div
                                      className={`mt-0 overflow-y-auto transition-all duration-300 ${showAllTermsMap[loan._id] ? "max-h-[140px]" : "max-h-[70px]"
                                      }`}
                                    >
                                      <ul className="grid grid-cols-0 sm:grid-cols-3 gap-1">
                                        {(() => {
                                          const companyTerms = companyLoanTerms(loan);
                                          const allTerms = companyTerms.includes(
                                              loan.loanTerms)
                                            ? companyTerms
                                            : [...companyTerms, loan.loanTerms].sort((a, b) => a - b);
                                          let termsToShow;

                                          if (loan.status === "Paid Off") {
                                            termsToShow = showAllTermsMap[loan._id] ? allTerms : [];
                                          } else {
                                             termsToShow = showAllTermsMap[loan._id]
                                           ? allTerms.filter((t) => t <= loan.loanTerms)
                                          : [currentTermMap[loan._id]];
                                          }
                                          return termsToShow.map((term) => {
                                            const loanTermData = loanStore.calculateLoans({
                                              ...loan,
                                              loanTerms: term,
                                            })!;
                                          // const isSelected =
                                          //   term ===
                                          //   currentTermMap[loan._id];

                                          return (
                                            <li
                                              key={term}
                                              className={`border rounded-lg cursor-pointer transition-all duration-200 `}
                                            >
                                              <div className="flex flex-col items-left font-bold p-1">
                                                <div className="text-xs">
                                                  {term} months
                                                </div>
                                                <div className="text-xs text-left">
                                                  <div>
                                                    Interest:{" "}
                                                    {formatUSD(
                                                      loanTermData.interestAmount
                                                    )}
                                                  </div>
                                                  <div>
                                                    Total:{" "}
                                                    {formatUSD(
                                                      loanTermData.total
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </li>
                                             );
                                          });
                                        })()}
                                      </ul>
                                    </div>
                                  </>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No Active loans available.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {loanModalOpen && selectedClientForLoan && (
        <Loans
          defaultClient={selectedClientForLoan}
          showTable={false}
          fromClientPage={true}
        />
      )}

      {loanEditModalOpen && editingLoanId && (
        <EditLoanModal
          loanId={editingLoanId}
          mode={loanModalMode}
          onClose={() => {
            setEditLoanModalOpen(false);
            setEditingLoanId(null);
            loanStore.fetchActiveLoans(client._id);
          }}
        />
      )}

      {paymentLoan && (
        <LoanPaymentModal
          open={!!paymentLoan}
          onClose={() => setPaymentLoan(null)}
          loan={{
            ...paymentLoan,
            loanTerms: currentTermMap[paymentLoan._id],
          }}
          clientId={client._id}
          onPaymentSuccess={() => refreshPayments(paymentLoan._id)}
        />
      )}

      {editPaymentModalOpen && (
        <EditPaymentModal
          open={editPaymentModalOpen}
          onClose={() => setEditPaymentModalOpen(false)}
          loan={{
            ...editPaymentLoan,
            loanTerms: currentTermMap[editPaymentLoan?._id],
          }}
          clientId={client._id}
          payment={editingPayment}
          onPaymentSuccess={() => refreshPayments(editPaymentLoan._id)}
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
