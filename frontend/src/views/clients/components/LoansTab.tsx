import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  AlertCircle,
  Trash2,
  RefreshCcw,
  Eye,
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
import {recoverLoan, updateLoanStatus,} from "../../../services/LoanService";
import { DocTypes, getAllowedTerms } from "../../../utils/constants";
import { loanStore } from "../../../store/LoanStore";
import { fetchCompanies } from "../../../services/CompaniesServices";
import api from "../../../api/axios";
import DocumentModal from "./DocumentModal";

interface LoansTabProps {
client: any;
clientLoans: any[];
refreshKey: number;
  onDataChanged: () => void;  
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

const LoansTab = ({ client,refreshKey,clientLoans,onDataChanged }: LoansTabProps) => {
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
const [loading, setLoading] = useState(true);
const loans = clientLoans || [];
const [generateDocMap, setGenerateDocMap] = useState<Record<string, boolean>>({});
const [selectedDocTypeMap, setSelectedDocTypeMap] = useState<Record<string, string>>({});
const [docLoadingMap, setDocLoadingMap] = useState<Record<string, boolean>>({});
const [docModalOpen, setDocModalOpen] = useState(false);
const [modalDocs, setModalDocs] = useState<any[]>([]);
const [modalTitle, setModalTitle] = useState("");
const [selectedLoanForDoc, setSelectedLoanForDoc] = useState<any>(null);
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

const loadData = async () => {
  if (!client?._id) return;

  try {
    setLoading(true);
    setLoadingLoans(true);

    const [paymentRes, companyRes]:any = await Promise.all([          
      fetchAllPaymentsForClient(client._id),
      fetchCompanies(),
    ]);


    setLoanPayments(paymentRes.payments || {});
    setLoanProfitMap(paymentRes.profits || {});

    setCompanies(companyRes.data || companyRes || []);
  } catch (err) {
    console.error("loadData error →", err);
    toast.error("Failed to load data");
  } finally {
    setLoading(false);
    setLoadingLoans(false);
  }
};
useEffect(() => {
  if(!client?._id && !refreshKey) return;
  loadData();  
}, [client?._id,refreshKey]);

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
    onDataChanged();
    toast.success("Payment deleted successfully");
    }
  });
};
    // const handleDelete = async (loan: any) => {
    //       const isMerged = loan.status === "Merged";
    //   Confirm({
    //     title: isMerged ? "⚠️ Delete Merged Loan" : "Confirm Delete",
    //     message: isMerged ? (
    //           <div className="text-left">
    //           <div className="text-sm text-gray-700 leading-6">
    //             <p className="mb-2">
    //               This loan is <strong className="text-red-600">MERGED</strong>.
    //               Deleting it will permanently delete:
    //             </p>

    //             <ul className="list-disc list-inside mb-3 text-gray-800">
    //               <li>This loan</li>
    //               <li>All linked / merged loans</li>
    //               <li>All payment history</li>
    //             </ul>
    //           </div>

    //             <p className="text-red-600 font-semibold">
    //               This action CANNOT be undone.
    //             </p>
    //           </div>
    //         ) : (
    //           "Are you sure you want to delete this loan?"
    //         ),
    //         confirmText: isMerged
    //           ? "Yes, Delete"
    //           : "Yes, Delete",
    //     onConfirm: async () => {
    //       await deleteLoan(loan._id);
    //          await loanStore.fetchLoanByClientId(loan.client);
    //          onDataChanged();

    //          toast.success(
    //             isMerged
    //               ? "Merged loan and all linked loans deleted"
    //               : "Loan deleted successfully"
    //           );
    // },
    // });
    // };
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
        onDataChanged();

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
    // if (loan.loanStatus === "Deactivated") return "bg-gray-400 text-white";
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
    onDataChanged();

  } catch (err) {
    console.error(err);
    toast.error("Failed to update status");
  }
};
const handleOpenDocumentModal = (loanData: any) => {
  const { loan, companyName } = loanData;

  const selectedDocKey = selectedDocTypeMap[loan._id];

  if (!selectedDocKey) {
    toast.error("Please select document type");
    return;
  }

  const selectedCategory = DocTypes.find(
    (doc) => doc.key === selectedDocKey
  );

  if (!selectedCategory) {
    toast.error("Invalid document type");
    return;
  }

  // Filter documents for selected company
  const filteredDocs = selectedCategory.companies.filter(
    (c) =>
      c.companyName.trim().toLowerCase() ===
      companyName.trim().toLowerCase()
  );

  if (!filteredDocs.length) {
    toast.error("No documents available for this company");
    return;
  }

  setModalDocs(filteredDocs);
  setModalTitle(selectedCategory.label);
  setSelectedLoanForDoc(loanData);
  setDocModalOpen(true);
};

const generateFinalDocument = async (
  loanData: any,
  selectedDocUrl: string,
  selectedTitle: string
) => {
  const { loan, companyName } = loanData;

  const todayFormatted = moment().format("MMM DD, YYYY");
  const selectedDocKey = selectedDocTypeMap[loan._id];
  const clientAddress = `${client?.address || ""}`.trim();

if (!selectedDocKey) {
  toast.error("Please select document type");
  return;
}

const selectedCategory = DocTypes.find(
  (doc) => doc.key === selectedDocKey
);

if (!selectedCategory) {
  toast.error("Invalid document type");
  return;
}

// Find company specific document
const companyObj = companies.find(
  (c) =>
    c.companyName?.trim().toLowerCase() ===
    companyName?.trim().toLowerCase()
);
    const companyAddress = `
    ${companyObj?.address || ""}
    ${companyObj?.city || ""}`.trim();
    if (!companyObj) {
      toast.error("No document available for this company");
      return;
    }
  if (!selectedDocUrl) {
    toast.error("Please select document type");
    return;
  }

  try {
    // 🔥 Start loader
    setDocLoadingMap((prev) => ({
      ...prev,
      [loan._id]: true,
    }));

    const calculated = loanStore.calculateLoans(
      loan,
      loans,
      "mergedDate"
    );

    if (!calculated) {
      toast.error("Calculation failed");
      return;
    }

    const brokerFee = loan?.fees?.brokerFee || {};
    const otherFees = loan?.fees || {};

    const baseAmount = loan?.baseAmount || 0;
    const previousLoanAmount = loan?.previousLoanAmount || 0;
    const totalPrincipal = baseAmount + previousLoanAmount;

    const brokerFeeCalculatedAmount =
      brokerFee?.type === "percentage"
        ? (totalPrincipal * brokerFee?.value) / 100
        : brokerFee?.value || 0;
      const now = new Date();
      const formattedTimestamp = `${now.getFullYear()}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(
        now.getHours()
      ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
        now.getSeconds()
      ).padStart(2, "0")}`;
    const payload = {
      loanid: loan._id,
      document_title: selectedTitle, 
      document_link: selectedDocUrl,
      document_data: {
        client_fullname: client?.fullName || "",
        client_address: clientAddress,
        company_companyName: companyName || "",
        company_address: companyAddress,
        today_date: todayFormatted,
        loan_issueDate: calculated.issueDate?.format("MMM DD, YYYY"),
        loan_baseAmount: baseAmount,
        loan_previousLoanAmount: previousLoanAmount,
        loan_totalPrincipal: totalPrincipal,
        loan_subTotal: calculated.subtotal,
        loan_interestType: loan.interestType,
        loan_monthlyRate: loan.monthlyRate,
        loan_interestAmount: calculated.interestAmount,
        loan_totalAmount: calculated.total,
        loan_paidAmount: calculated.paidAmount,
        loan_remainingAmount: calculated.remaining,
        loan_dynamicTerm: calculated.dynamicTerm,
        loan_parentLoanId: loan.parentLoanId || "",
        loan_mergedDate: calculated.mergedDate
          ? calculated.mergedDate.format("MMM DD, YYYY")
          : "",
        loan_fee_type: brokerFee?.type || "",
        loan_fee_value: brokerFee?.value || 0,
        brokerFeeCalculatedAmount: brokerFeeCalculatedAmount,
        loan_status: loan.status || "",
        loan_allFees: otherFees,       
      },
    };

    console.log("🔥 FULL DOCUMENT PAYLOAD →", payload);

    const response = await api.post(
      "/templates/document/generate",
      payload,
      {
        responseType: "blob",
      }
    );
    // Create blob
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = window.URL.createObjectURL(blob);
    // Auto download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTitle}_${formattedTimestamp}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
        toast.success("Document generated successfully");

  } catch (error) {
    console.error(error);
    toast.error("Failed to generate document");
  } finally {
    // 🔥 Stop loader
    setDocLoadingMap((prev) => ({
      ...prev,
      [loan._id]: false,
    }));
  }
};
const handleModalDocSubmit = (doc: any) => {
  setDocModalOpen(false);

  generateFinalDocument(
    selectedLoanForDoc,
    doc.value,
    doc.fileName
  );
};
return (
        <div className="h-[calc(84vh-20px)] overflow-y-auto p-2 space-y-4">
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
                                {loading ? (
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

                          <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
  
  {/* Profit Section */}
  {profitData?.totalProfit > 0 && (
    <div className="text-sm font-semibold text-emerald-600">
      <span className="text-gray-600 font-medium">
        ( Base: {formatUSD(profitData.totalBaseAmount)} |
        {" "}Paid: {formatUSD(profitData.totalPaid)} )
      </span>
      {" "}Profit: {formatUSD(profitData.totalProfit)}
    </div>
  )}

  {/* Generate Documents */}
  <div className="flex items-center gap-2">
    <input
      id={`generate-${loan._id}`}
      type="checkbox"
      className="w-4 h-4 accent-green-600 cursor-pointer"
      checked={generateDocMap[loan._id] || false}
      onChange={(e) =>
        setGenerateDocMap((prev) => ({
          ...prev,
          [loan._id]: e.target.checked,
        }))
      }
    />
    <label
      htmlFor={`generate-${loan._id}`}
      className="text-sm font-medium text-gray-700 cursor-pointer"
    >
      Generate Documents
    </label>
  </div>

</div>
                         {/* Generate Document Section */}
<div className="mt-0 border-t pb-2">


  {generateDocMap[loan._id] && (
    <div className="flex items-center gap-3 mt-3">
      
      {/* Styled Select */}
      <div className="relative">
        <select
          className="appearance-none bg-white border border-gray-300 
                     rounded-md px-3 py-2 pr-8 text-sm 
                     focus:outline-none focus:ring-2 focus:ring-green-600 
                     focus:border-green-600 transition font-semibold text-gray-700"
          value={selectedDocTypeMap[loan._id] || ""}
          onChange={(e) =>
            setSelectedDocTypeMap((prev) => ({
              ...prev,
              [loan._id]: e.target.value,
            }))
          }
        >
          <option value="" className=" font-semibold text-gray-700">Select Document</option>
          {DocTypes.map((doc) => (
            <option className=" font-semibold text-gray-700"key={doc.key} value={doc.key}>
              {doc.label}
            </option>
          ))}
        </select>

        {/* Dropdown Arrow */}
        <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 text-xs">
          ▼
        </span>
      </div>

      {/* Submit Button (Matching Your Green Theme) */}
    <button
onClick={() => handleOpenDocumentModal(loanData)}
  disabled={docLoadingMap[loan._id]}
  className={`px-4 py-2 text-white text-sm font-medium rounded-md transition shadow-sm
    ${
      docLoadingMap[loan._id]
        ? "bg-green-700 cursor-not-allowed"
        : "bg-green-700 hover:bg-green-800"
    }`}
>
  {docLoadingMap[loan._id] ? (
    <span className="flex items-center gap-2">
      <svg
        className="animate-spin h-4 w-4 text-white"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      Generating...
    </span>
  ) : (
    "Submit"
  )}
</button>
    </div>
  )}
</div>
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
                                               {/* <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(loan);
                                              }}
                                              className="p-1 rounded-full  hover:bg-red-200 text-red-600 transition ml-2"
                                              title="Delete Loan"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button> */}
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
     

      {/* Add loan Modals */}
      {loanModalOpen && selectedClientForLoan && (
        <Loans
          defaultClient={selectedClientForLoan}
          showTable={false}
          fromClientPage={true}
           
          
          onClose={() => {
          setLoanModalOpen(false);
          setSelectedClientForLoan(null);
           onDataChanged(); 
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
            onDataChanged(); 
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
          onPaymentSuccess={onDataChanged}    
    />
      )}
        {docModalOpen && (
        <DocumentModal
          open={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          documents={modalDocs}
          title={modalTitle}
          onSubmit={handleModalDocSubmit}
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
          onPaymentSuccess={onDataChanged}        />
      )}
  </div>
  );


};
export default LoansTab;