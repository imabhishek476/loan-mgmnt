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
import { calculateLoanAmounts, formatUSD } from "../../../utils/loanCalculations";
import EditLoanModal from "../../../components/EditLoanModal";
import EditPaymentModal from "../../../components/EditPaymentModal";
import Confirm from "../../../components/Confirm";
import { deactivateLoan, recoverLoan } from "../../../services/LoanService";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [loanPayments, setLoanPayments] = useState<Record<string, any[]>>({});
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [loanEditModalOpen, setEditLoanModalOpen] = useState(false);
  const [showAllTermsMap, setShowAllTermsMap] = useState<
    Record<string, boolean>
  >({});
  
  const [selectedClientForLoan, setSelectedClientForLoan] = useState<any>(null);
  const companyLoanTerms = (loan: any) => {
    const company = companyStore.companies.find((c) => c._id === loan.company);
    return company?.loanTerms?.length ? company.loanTerms : [12, 24, 36]; // fallback
  };
const [currentTermMap, setCurrentTermMap] = useState<Record<string, number>>({});
const [editingLoanId, setEditingLoanId] = useState<any>(null);
const [editingPayment, setEditingPayment] = useState<any>(null);
const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
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
    const LOAN_TERMS = [6, 12, 18, 24, 30, 36, 48];

  const getDefaultLoanTerm = (loan: any) => {
   const loanData = calculateLoanAmounts(loan,mergedLoans,"mergedDate");
    return (
      LOAN_TERMS.find((t) => t > loanData.monthsPassed) || loanData.dynamicTerm
    );
  };

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
  const mergedLoans = useMemo(() => {
    return loanStore.loans
      .filter((loan) => loan.status === "Active")
      .map((loan) => ({
        _id: loan._id,
        issueDate: loan.issueDate,
        parentLoanId: loan.parentLoanId,
        status: loan.status,
        loanTerms: loan.loanTerms,
      }));
  }, [loanStore.loans]);
  if (!open) return null;

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
    return "bg-green-600 text-white";
  if (lower === "active") 
    return "bg-green-600 text-white";
  if (lower === "partial payment") 
    return "bg-yellow-500 text-white";
  return "bg-gray-500 text-white";
};


  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50  rounded-md">
      <div
        className="bg-white rounded-lg w-full max-w-7xl shadow-lg relative mx-4 sm:mx-6 flex flex-col overflow-y-auto"
        style={{ height: "650px" }}
      >
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
        <div className="flex flex-col lg:flex-row h-full  ">
          {/* Sidebar */}
          <div
            className={`relative transition-all duration-300 ease-in-out bg-gray-50 border-l ${
              sidebarCollapsed
                ? "lg:w-12 h-12 lg:h-full"
                : "w-full lg:w-1/3  h-full"
            } p-2`}
          >
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-200  border-b">
              {/* <FileText size={20} className={`text-green-700 ${
                  sidebarCollapsed ? "lg:hidden" : ""
                }`}/> */}
              <h3
                className={`text-lg font-bold text-gray-800  ${
                  sidebarCollapsed ? "lg:hidden" : ""
                }`}
              >
                Customer Information
              </h3>
              <Pencil
                size={18}
                className={`text-green-700 cursor-pointer hover:text-green-900 transition md:w-5 md:h-5 ${
                  sidebarCollapsed ? "lg:hidden" : ""
                }`}
                onClick={() => onEditClient(client)}
              />
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute top-2 right-2 items-center justify-center w-8 h-8 bg-green-700 text-white rounded-full shadow-lg hover:bg-green-800 transition-transform transform hover:scale-105"
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <span className="hidden lg:flex flex-col items-center">
                  {sidebarCollapsed ? (
                    <ChevronRight size={20} />
                  ) : (
                    <ChevronLeft size={20} />
                  )}
                </span>
                <span className="flex lg:hidden flex-col items-center">
                  {sidebarCollapsed ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronUp size={20} />
                  )}
                </span>
              </button>
            </div>

            {!sidebarCollapsed && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 px-2 pb-4">
                  <Info label="Full Name" value={client.fullName} />
                  <Info label="Email" value={client.email} />
                  <Info label="Phone" value={client.phone} />
                  <Info label="DOB" value={client.dob} />
                  <Info label="Accident Date" value={client.accidentDate} />
                  <Info label="Attorney" value={client.attorneyName} />
                  <Info label="SSN" value={client.ssn} />
                  <Info
                    label="Custom Fields"
                    value={client.customFields
                      .map((field) => `${field.name}: ${field.value}`)
                      .join(", ")}
                  />

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
                    <div className="bg-yellow-100 border-l-4 border-yellow-600 p-5 rounded shadow-sm text-sm text-gray-800">
                      {client.memo || "—"}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Loans */}
          <div className="flex-1 border-r relative">
            <div className="sticky top-0 bg-white z-10 px-3 py-2 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                {/* <DollarSign size={20} className="text-green-600" /> */}
                <h3 className="text-lg font-bold text-gray-800">
                  Loan History
                </h3>
              </div>

              {/* <Tooltip title="Add New Loan" arrow> */}
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  sx={{
                    backgroundColor: "#15803d",
                    "&:hover": { backgroundColor: "#166534" },
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!client?._id) {
                      toast.error("Client data not available");
                      return;
                    }
                    setLoanModalOpen(false);
                    setTimeout(() => {
                      setSelectedClientForLoan(client);
                      setLoanModalOpen(true);
                    }, 10);
                  }}
                >
                  New Loan
                </Button>
              {/* </Tooltip> */}
            </div>
            <div className="p-2 space-y-4 min-h-[400px] ">
              {clientLoans.length > 0 ? (
                clientLoans.map((loan: any) => {
                  const companyId =
                    typeof loan.company === "string"
                      ? loan.company
                      : loan.company?._id;

                  const company =
                    companyStore.companies.find((c) => c._id === companyId) ||
                    loan.company; // fallback if object is directly in loan

                  const companyName = company?.companyName || "Unknown";
                  const companyColor = company?.backgroundColor || "#555555";
                  // const isPaidOff =
                  //   (loan.paidAmount || 0) >= (loan.totalLoan || 0);
                  const loanData = calculateLoanAmounts(loan);
                  if (!loanData) return null;

                  const { paidAmount } = loanData;
                  const selectedDynamicTerm = currentTermMap[loan._id];
                  // console.log(selectedDynamicTerm,'selectedDynamicTerm');
                  const selectedLoanData = calculateLoanAmounts({
                    ...loan,
                    loanTerms: selectedDynamicTerm,
                  })!;
                  const selectedDynamicLoanData = calculateLoanAmounts({
                    ...loan,
                    loanTerms: selectedDynamicTerm,
                  })!;
                  const today = moment();
                  const totalLoan =
                    loan.interestType === "flat"
                      ? loanData.subtotal +
                        loanData.subtotal *
                          (loan.monthlyRate / 100) *
                          // @ts-ignore
                          selectedDynamicLoanData
                      : loanData.subtotal *
                        Math.pow(
                          1 + loan.monthlyRate / 100,
                          // @ts-ignore
                          selectedDynamicLoanData
                        );
                  const endDate = moment(loan.issueDate).add(
                    loan.loanTerms,
                    "months"
                  );
                  const end = Number(selectedDynamicTerm) * 30;
                  const currentEndDate = moment(loan.issueDate).add(end,
                    "day"
                  );
                  const isDelayed = today.isAfter(endDate, "day");
                  const isPaidOff = paidAmount >= totalLoan;

                  // const isDelayed =
                  //   selectedLoanData.monthsPassed != loan.loanTerms;
                  return (
                    <div
                      key={loan._id}
                      style={{ borderLeft: `6px solid ${companyColor}` }}
                      className="border rounded-lg shadow-sm hover:shadow-lg  transition-all overflow-hidden bg-gray-100 hover:bg-gray-50"
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

                              {/* Month */}
                              {/* <span
                                className={`px-2 py-1 rounded text-xs ${
                                  isDelayed
                                    ? "bg-red-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                Month: {selectedDynamicTerm}
                              </span> */}
                              <span>
                                Paid:{" "}
                                <span className="text-green-700 font-bold">
                                  {formatUSD(selectedLoanData.paidAmount)}
                                </span>{" "}
                                /{" "}
                                <span className="text-red-700 font-bold">
                                  {formatUSD(selectedLoanData.remaining)}
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

                              <span
                                className={`px-3 py-1 rounded-md text-xs font-semibold shadow-sm whitespace-nowrap ${getStatusStyles(
                                  loan
                                )}`}
                              >
                                {loan.loanStatus === "Deactivated"
                                  ? "Deactivated"
                                  : isPaidOff
                                  ? "Paid Off"
                                  : loan.status}
                              </span>
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
                                  <Pencil
                                    size={16}
                                    className="text-green-700 inline-block cursor-pointer hover:text-green-900"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedClientForLoan(client);
                                      setEditLoanModalOpen(true);
                                      setEditingLoanId(loan._id);
                                    }}
                                  />
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    </table>
                      {/* Content */}
                      {expandedLoanId === loan._id && (
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
                              </div>

                              {/* Loan Details */}
                              <div className="flex-2 text-sm text-gray-700 space-y-1 pt-2">
                          
                                  <>
                                    {(() => {
                                      return (
                                        <table className="w-full text-sm text-gray-700 border-collapse">
                                          <tbody>
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
                                                {selectedDynamicTerm} month {""}
                                                <span
                                                  className={`${
                                                    isDelayed
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
                                                  className={`${
                                                    isDelayed
                                                      ? "text-red-600 font-bold animate-pulse"
                                                      : ""
                                                  }`}
                                                >
                                                  $
                                                  {selectedDynamicLoanData.interestAmount.toFixed(
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
                                            <tr className="">
                                              <td className="font-semibold py-0 whitespace-nowrap">
                                                Total Loan Amount:
                                              </td>
                                              <td className="py-0">
                                                {formatUSD(
                                                  selectedLoanData.total.toFixed(
                                                    2
                                                  )
                                                )}
                                              </td>
                                            </tr>
                                            <tr>
                                            <td>
                                              {loan.status === "Paid Off" && (
                                                <p className="text-green-600 font-semibold">
                                                  This loan has been fully paid
                                                  off.
                                                </p>
                                              )}
                                              {loan.status === "Merged" && (
                                                <p className="text-blue-600 font-semibold">
                                                  This loan has been merged with
                                                  a new loan.
                                                </p>
                                              )}
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
                                                {companyLoanTerms(loan).length >
                                                  1 && (
                                                  <button
                                                    onClick={() =>
                                                      toggleShowAllTerms(
                                                        loan._id
                                                      )
                                                    }
                                                    className="text-xs text-blue-600 hover:underline"
                                                  >
                                                    {showAllTermsMap[loan._id]
                                                      ? "Less..."
                                                      : "More..."}
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                    <div
                                      className={`mt-0 overflow-y-auto transition-all duration-300 ${
                                        showAllTermsMap[loan._id]
                                          ? "max-h-[140px]"
                                          : "max-h-[70px]"
                                      }`}
                                    >
                                      <ul className="grid grid-cols-0 sm:grid-cols-3 gap-1">
                                        {(() => {
                                          const companyTerms =
                                            companyLoanTerms(loan);
                                          const allTerms =
                                            companyTerms.includes(
                                              loan.loanTerms
                                            )
                                              ? companyTerms
                                              : [
                                                  ...companyTerms,
                                                  loan.loanTerms,
                                                ].sort((a, b) => a - b);

                                        return showAllTermsMap[loan._id]
                                          ? allTerms.filter(
                                              (t) => t <= loan.loanTerms
                                            )
                                          : [currentTermMap[loan._id]];
                                      })().map((term) => {
                                          const loanTermData =
                                            calculateLoanAmounts({
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
                                        })}
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
        </div>
      </div>

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
            loanTerms: currentTermMap[paymentLoan._id], // selected term
          }}
          clientId={client._id}
          onPaymentSuccess={() => refreshPayments(paymentLoan._id)}
        />
      )}
      {editPaymentModalOpen && (
        <EditPaymentModal
          open={editPaymentModalOpen}
          onClose={() => {
            setEditPaymentModalOpen(false);
          }}
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
