import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  AlertCircle,
  Trash2,
  RefreshCcw,
  Eye,
  FileText,
  StickyNote,
  User,
  Building2,
} from "lucide-react";
import { toast } from "react-toastify";
import moment from "moment";
import LoanPaymentModal from "../../../components/PaymentModel";
import { deletePayment, fetchAllPaymentsForClient } from "../../../services/LoanPaymentServices";
import { Button, Skeleton } from "@mui/material";
import Loans from "../../loans";
import {formatUSD } from "../../../utils/loanCalculations";
import EditLoanModal from "../../../components/EditLoanModal";
import EditPaymentModal from "../../../components/EditPaymentModal";
import Confirm from "../../../components/Confirm";
import {activeLoansData, deactivateLoan,recoverLoan, updateLoanStatus,} from "../../../services/LoanService";
import { getAllowedTerms } from "../../../utils/constants";
import { loanStore } from "../../../store/LoanStore";
import api from "../../../api/axios";
import { fetchCompanies } from "../../../services/CompaniesServices";

interface LoansTabProps {
client: any;
clientLoans: any[];
}
 type Payment = {
  _id?: string;
  loanId?: string;
  clientId?: string;

  paidDate?: string;      // ISO string
  paidAmount?: number;

  checkNumber?: string;
  payoffLetter?: string;

  createdAt?: string;
  updatedAt?: string;
};

 interface LoanProfit {
  loanId: string;
  rootLoanId: string;
  totalBaseAmount: number;
  totalPaid: number;
  totalProfit: number;
}
// eslint-disable-next-line react-refresh/only-export-components

const LoansTab = ({ client }: LoansTabProps) => {
const [loans, setLoans] = useState<any[]>([]);
const [companies, setCompanies] = useState<any[]>([]);
  const [paymentLoan, setPaymentLoan] = useState<any>(null);
  const [editPaymentLoan, setEditPaymentLoan] = useState<any>(null);
  const [expandedLoanIds, setExpandedLoanIds] = useState<string[]>([]);
  const [loanPayments, setLoanPayments] = useState<Record<string, Payment[]>>({});
const [loanProfitMap, setLoanProfitMap] = useState<Record<string, LoanProfit>>({});
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanEditModalOpen, setEditLoanModalOpen] = useState(false);
  const [showAllTermsMap, setShowAllTermsMap] = useState<
    Record<string, boolean>
  >({});
  
  const [loanModalMode, setLoanModalMode] = useState<"edit" | "view">("edit");

  const [selectedClientForLoan, setSelectedClientForLoan] = useState<any>(null);
const companyLoanTerms = (loan: any) => {
  const company = companies.find(c => c._id === loan.company);
  return company?.loanTerms?.length ? company.loanTerms : [12, 24, 36];
};
const [currentTermMap, setCurrentTermMap] = useState<Record<string, number>>({});
const [editingLoanId, setEditingLoanId] = useState<any>(null);
const [editingPayment, setEditingPayment] = useState<any>(null);
const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
const [loadingLoans, setLoadingLoans] = useState(true);
const [loadingPaymentsMap, setLoadingPaymentsMap] = useState<Record<string, boolean>>({});
const [loading, setLoading] = useState(true);

// const refreshPayments = async () => {
//   if (!client?._id) return;

//   try {
//     const paymentRes = await fetchAllPaymentsForClient(client._id);

//     setLoanPayments(paymentRes.payments ?? {});
//     setLoanProfitMap(paymentRes.profits ?? {});
//   } catch (err) {
//     console.error(err);
//     toast.error("Failed to refresh payments");
//   }
// };
const getClientLoansData = useMemo(() => {
  return loans.map((loan) => {
    const companyId =
      typeof loan.company === "string"
        ? loan.company
        : loan.company?._id;

    const company =
      companies.find((c) => c._id === companyId) || loan.company;

    const companyName = company?.companyName || "Unknown";
    const companyColor = company?.backgroundColor || "#555555";
    const selectedDynamicTerm = currentTermMap[loan._id];

    const selectedLoanData = loanStore.calculateLoans(
      { ...loan },
      loans,                 // ✅ FIXED
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

    const profitData = loanProfitMap[loan._id];

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
}, [loans, companies, currentTermMap, loanProfitMap]);
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
  if (!client?._id) return;

  setExpandedLoanIds([]);

  if (loans.length > 0) {
    setExpandedLoanIds(loans.map((loan) => loan._id));
  }
}, [client?._id, loans]);

// const loadPaymentsForLoans = async () => {
//   if (!client?._id) return;

//   try {

//     const { paymentsMap, profitMap } =
//       await fetchAllPaymentsForClient(client._id);

//     setLoanPayments(paymentsMap);
//     setLoanProfitMap(profitMap);

//   } catch (err) {
//     console.error("Failed all payments");
//     toast.error("Failed to load payments");
//   } finally {
//     // setGlobalPaymentsLoading(false);
//   }
// };
const loadData = async () => {
  if (!client?._id) return;

  try {
    setLoading(true);
    setLoadingLoans(true);

    const [loanRes, paymentRes, companyRes]:any = await Promise.all([
      activeLoansData(client._id),              // ✅ USE SERVICE
      fetchAllPaymentsForClient(client._id),
      fetchCompanies(),
    ]);

    setLoans(loanRes || []);

    setLoanPayments(paymentRes.payments || {});
    setLoanProfitMap(paymentRes.profits || {});

    setCompanies(companyRes.data || companyRes || []);
    console.log("paymentRes →", paymentRes);
console.log("paymentsMap →", paymentRes.payments);

  } catch (err) {
    console.error("loadData error →", err);
    toast.error("Failed to load data");
  } finally {
    setLoading(false);
    setLoadingLoans(false);
  }
};
useEffect(() => {
  loadData();
  
}, [client?._id]);

  useEffect(() => {
    const newMap: Record<string, number> = {};
    loans.forEach((loan) => {
      newMap[loan._id] = getDefaultLoanTerm(loan);
    });
    setCurrentTermMap(newMap);
  }, [loans]);

const handleToggleLoan = (loanId: string) => {
  setExpandedLoanIds(prev =>
    prev.includes(loanId)
      ? prev.filter(id => id !== loanId)
      : [...prev, loanId]
  );
};
const handleDeletePayment = async (payment: any) => {
  Confirm({
    title: "Confirm Delete",
    message: "Are you sure you want to delete this Payment?",
    confirmText: "Yes, Delete",
    onConfirm: async () => {
    await deletePayment(payment._id!);
    await loadData();
    toast.success("Payment deleted successfully");
    }
  });
};
const handleDeleteLoan = async (loanId: string) => {
  Confirm({
    title: "Confirm Deactivate",
    message: "Are you sure you want to deactivate this loan?",
    confirmText: "Yes, Deactivate",

    onConfirm: async () => {
      try {
        await deactivateLoan(loanId);

        toast.success("Loan Deactivated successfully");

        // ✅ Reload loans + payments from API
        await loadData();

      } catch (err) {
        console.error(err);
        toast.error("Failed to deactivate loan");
      }
    },
  });
};
const handleRecover = async (loanId: string) => {
  Confirm({
    title: "Recover Loan",
    message: "Are you sure you want to recover the loan?",
    confirmText: "Yes, Recover",
    cancelText: "Cancel",

    onConfirm: async () => {
      try {
        await recoverLoan(loanId);

        toast.success("Loan has been recovered successfully!");

        // ✅ Reload loans + payments
        await loadData();

      } catch (error: any) {
        console.error(error);

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
const handleStatusChange = async (loanId: string, newStatus: string) => {
  try {
    await updateLoanStatus(loanId, newStatus);

    toast.success("Loan status updated");

    // ✅ Reload loans + payments from API
    await loadData();

  } catch (err) {
    console.error(err);
    toast.error("Failed to update status");
  }
};
const tabs = [
  { key: "client", label: "Client Info", icon: <User size={16} /> },
  { key: "loans", label: "Loan History", icon: <Building2 size={16} /> },
  { key: "notes", label: "Notes", icon: <StickyNote size={16} /> },
  { key: "templates", label: "Templates", icon: <FileText size={16} /> },
];

return (
        <div className="h-[calc(88vh-30px)] overflow-y-auto p-2 space-y-4">
           <div className="flex justify-end">
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
            </div>
          {/* Loans List */}
          <div className="overflow-y-auto p-2 pt-0 space-y-4">
            {loadingLoans ? (
                <div className="space-y-3 p-2">
                  <Skeleton variant="rectangular" height={80} />
                  <Skeleton variant="rectangular" height={80} />
                  <Skeleton variant="rectangular" height={80} />
                </div>
              ) :
              getClientLoansData?.length > 0 ? (
                getClientLoansData?.map((loanData: any) => {
                  const { loan, companyName, companyColor, selectedLoanData, isDelayed, currentEndDate, profitData } = loanData;
                  const totalAmount = loan?.baseAmount + loan?.previousLoanAmount;
                  const brokerValue = loan?.fees?.brokerFee?.value;
                  const brokerAmount =  loan?.fees?.brokerFee?.type === "percentage" ? (totalAmount * brokerValue ) / 100 : loan?.fees?.brokerFee.value;
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
                                Base Amount:{" "}
                                <span className="text-blue-700 font-bold">
                                  {formatUSD(loan?.baseAmount)}
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
                                    (loan.status === "Active" ||
                                loan.status === "Partial Payment")&&(
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
                              <div className="sm:w-1/2 md:w-1/2 pr-4 space-y-3 pt-2 border-r-2">
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
                                {loadingPaymentsMap[loan._id] ? (
                                 <div className="space-y-3 p-2">
                                    <Skeleton variant="rectangular" height={15} />
                                    <Skeleton variant="rectangular" height={15} />
                                    <Skeleton variant="rectangular" height={15} />
                                  </div>
                                ) : loanPayments[loan._id]?.length > 0 ? (
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
                                            <Trash2 size={14} />
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
                              <div className="text-sm font-semibold mt-2 text-emerald-600">
                                <span className="text-gray-600">
                                  ( Total Base: {formatUSD(profitData.totalBaseAmount)} |
                                    Total Paid: {formatUSD(profitData.totalPaid)} )
                                </span>
                                {" "}Profit: {formatUSD(profitData.totalProfit)}
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
                                            {brokerValue > 0 && (
                                                <tr>
                                                <td className="font-semibold py-0 whitespace-nowrap">
                                                  Broker Fee (  {loan?.fees?.brokerFee?.type === "percentage"
                                                    ? `${brokerValue}%`
                                                    : `${brokerValue}$`}) :
                                                </td>
                                              <td className="py-0">
                                                  {(brokerAmount ?? 0).toLocaleString("en-US", {
                                                    style: "currency",
                                                    currency: "USD",
                                                  })}
                                                </td>
                                              </tr>
                                            )}
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
                                                 ({" "} Principal : {formatUSD(loan.subTotal)} {" "})
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
     

      {/* Modals */}
      {loanModalOpen && selectedClientForLoan && (
        <Loans
          defaultClient={selectedClientForLoan}
          showTable={false}
          fromClientPage={true}
          onClose={() => {
          setLoanModalOpen(false);
          setSelectedClientForLoan(null);
        }}
        />
      )}

      {loanEditModalOpen && editingLoanId && (
        <EditLoanModal
          loanId={editingLoanId}
          mode={loanModalMode}
          onClose={() => {
            setEditLoanModalOpen(false);
            setEditingLoanId(null);
  loadData();
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
onPaymentSuccess={loadData}        />
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
    onPaymentSuccess={loadData}        />
      )}
  </div>
  );


};
export default LoansTab;