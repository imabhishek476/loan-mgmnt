// src/components/EditLoanModal.tsx
import  { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import { X, Save, Eye, RefreshCw } from "lucide-react";
import { clientStore } from "../store/ClientStore";
import { companyStore } from "../store/CompanyStore";
import { loanStore } from "../store/LoanStore";
import moment from "moment";
import type { Moment } from "moment";
import {
  Button,
  Switch,
  Autocomplete,
  TextField as MuiTextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers";
import { fetchPaymentsByLoan } from "../services/LoanPaymentServices";
import { fetchLoanById } from "../services/LoanService";
import {
  calculateDynamicTermAndPayment,
  calculateLoanAmounts,
} from "../utils/loanCalculations";

const parseNumber = (val: any): number => {
  if (typeof val === "string") return parseFloat(val) || 0;
  return val || 0;
};

const ALLOWED_TERMS = [6, 12, 18, 24, 30, 36, 48];
const getLoanRunningDetails = (loan: any) => {
  const { monthsPassed } = calculateDynamicTermAndPayment(loan);
  const runningTenure =
    ALLOWED_TERMS.find((t) => monthsPassed <= t) || ALLOWED_TERMS.at(-1);

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
const calculateLoan = (
  base: number,
  fees: Record<string, { value: number; type: "flat" | "percentage" }>,
  type: "flat" | "compound",
  rate: number,
  term: number,
  previousLoanTotal: number = 0
) => {
  const num = (val: any): number =>
    typeof val === "string" ? parseFloat(val) || 0 : val || 0;

  const baseNum = num(base);
  const prevLoan = num(previousLoanTotal);
  const totalBase = baseNum + prevLoan;
  if (totalBase <= 0)
    return { subtotal: 0, interestAmount: 0, totalWithInterest: 0 };

  const rateNum = num(rate);
  const termNum = Math.max(0, Math.floor(num(term)));
  const feeKeys = [
    "administrativeFee",
    "applicationFee",
    "attorneyReviewFee",
    "brokerFee",
    "annualMaintenanceFee",
  ];

  const feeTotal = feeKeys.reduce((sum, key) => {
    const fee = fees[key];
    if (!fee) return sum;
    const value = num(fee.value);
    return fee.type === "percentage"
      ? sum + (baseNum * value) / 100
      : sum + value;
  }, 0);

  const subtotal = totalBase + feeTotal;
  let interest = 0;
  let total = subtotal;
  if (termNum > 0 && rateNum > 0) {
    if (type === "flat") {
      for (let i = 6; i <= termNum; i += 6) {
        const stepInterest = total * (rateNum / 100) * 6;
        total += stepInterest;
        if (i === 18 || i === 30) total += 200;
      }
      interest = total - subtotal;
    } else {
      total = subtotal * Math.pow(1 + rateNum / 100, termNum);
      interest = total - subtotal;
    }
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    interestAmount: parseFloat(interest.toFixed(2)),
    totalWithInterest: parseFloat(total.toFixed(2)),
  };
};

const EditLoanModal = observer(
  ({ loanId, onClose }: { loanId: string; onClose: () => void }) => {
    const [formData, setFormData] = useState<any>(null);
    const [companyData, setCompanyData] = useState<any>(null);
    const [activeLoans, setActiveLoans] = useState<any[]>([]);
    const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
    const [overlapMode, setOverlapMode] = useState(false);
    const [saving, setSaving] = useState(false);
    // @ts-ignore
    const [endDate, setEndDate] = useState<string | null>(null);
    const [viewLoan, setViewLoan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [previousToggleDisabled, setPreviousToggleDisabled] = useState(false);
    const [originalLoan, setOriginalLoan] = useState<any>(null);

    useEffect(() => {
      let mounted = true;

      const load = async () => {
        try {
          setLoading(true);
          const loan = await fetchLoanById(loanId);
          setOriginalLoan(loan);
          if (!mounted) return;
          if (!loan) {
            toast.error("Loan not found");
            onClose();
            return;
          }

          await Promise.all([
            companyStore.fetchCompany(),
            clientStore.fetchClients(),
            loanStore.fetchLoans(),
          ]);
              //@ts-ignore
        const normalizeId = (id: any) =>
          id == null ? "" : typeof id === "string" ? id : id.toString();
        const mergedLoans = loan.previousLoans || [];

        if (mergedLoans.length > 0) {
          const mergedIds = mergedLoans.map((m: any) =>
            typeof m === "string" ? m : m._id?.toString?.()
          );
          const clientId =
            loan.client?._id?.toString?.() || loan.client?.toString?.();
          const filtered = loanStore.loans.filter((l) => {
            const lClient =
              l.client?.["_id"]?.toString?.() || l.client?.toString?.();
            return (
              lClient === clientId &&
              l._id?.toString?.() !== loanId?.toString?.()
            );
          });

          setActiveLoans(filtered);
          setSelectedLoanIds(
            filtered
              .filter((l) => mergedIds.includes(l._id?.toString?.()))
              .map((l) => l._id?.toString?.())
          );
          setPreviousToggleDisabled(false); 
          setOverlapMode(true);
        } else {
          const availableLoans =
            loanStore.loans?.filter((l) => {
              const lClient =
                l.client?.["_id"]?.toString?.() || l.client?.toString?.();
              return (
                lClient ===
                  (loan.client?._id?.toString?.() ||
                    loan.client?.toString?.()) &&
                l.status !== "Paid Off" &&
                l.status !== "Merged" &&
                l.loanStatus !== "Deactivated" &&
                l._id?.toString?.() !== loanId?.toString?.()
              );
            }) || [];
          setActiveLoans(availableLoans);
        }

          const company = companyStore.companies.find(
            (c) => c._id === loan.company
          );
          const client = clientStore.clients.find((c) => c._id === loan.client);
          if (!company || !client) {
            toast.error("Client or company missing");
            onClose();
            return;
          }

          const mapFee = (fee: any) => ({
            value: fee?.value || 0,
            type: fee?.type === "percentage" ? "percentage" : "flat",
          });

          const fees = {
            administrativeFee: mapFee(loan.fees?.administrativeFee),
            applicationFee: mapFee(loan.fees?.applicationFee),
            attorneyReviewFee: mapFee(loan.fees?.attorneyReviewFee),
            brokerFee: mapFee(loan.fees?.brokerFee),
            annualMaintenanceFee: mapFee(loan.fees?.annualMaintenanceFee),
          };

          setFormData({
            ...loan,
            client: loan.client,
            company: loan.company,
            baseAmount: loan.baseAmount || 0,
            checkNumber: loan.checkNumber || "",
            fees,
            interestType: loan.interestType || "flat",
            monthlyRate: loan.monthlyRate || 0,
            loanTerms: loan.loanTerms || 24,
            issueDate: moment(loan.issueDate).format("MM-DD-YYYY"),
            previousLoanAmount: loan.previousLoanAmount || 0,
            paidAmount: loan.paidAmount || 0,
          });

          setCompanyData(company);

          if (loan.previousLoans?.length > 0) {
            const previousLoans = loanStore.loans.filter((l) =>
              loan.previousLoans.includes(l._id)
            );
            const totalRemaining = previousLoans.reduce((sum, l) => {
              const details = getLoanRunningDetails(l);
              return sum + (details?.remaining || 0);
            }, 0);
            setFormData((prev) => ({
              ...prev,
              previousLoanAmount: loan.previousLoanAmount || totalRemaining,
            }));
            setSelectedLoanIds(loan.previousLoans.map((pl) => pl._id));
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load loan");
          onClose();
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();
      return () => {
        mounted = false;
      };
    }, [loanId]);

    const selectedPreviousLoanTotal = activeLoans
      .filter((loan) => selectedLoanIds.includes(loan._id))
      .reduce((sum, loan) => sum + getLoanRunningDetails(loan).remaining, 0);

    const handleView = async (loan: any) => {
      try {
        await fetchPaymentsByLoan(loan._id);
      } catch {}
      setViewLoan(loan);
    };

    const handleCloseView = () => setViewLoan(null);

const handleSave = async () => {
  try {
    if (saving) return;
    setSaving(true);
    if (!formData.client) return toast.error("Please select a client");
    if (!formData.company) return toast.error("Please select a company");
    if (!formData.baseAmount || formData.baseAmount <= 0)
      return toast.error("Base amount must be greater than 0");
    if (!formData.loanTerms || formData.loanTerms <= 0)
      return toast.error("Please enter valid loan terms");
    const loan = await fetchLoanById(loanId);
    if (!loan) return toast.error("Loan not found");

    const { runningTenure } = getLoanRunningDetails(loan);
    const calc = calculateLoan(
      formData.baseAmount,
      formData.fees,
      formData.interestType,
      formData.monthlyRate,
      runningTenure,
      overlapMode ? selectedPreviousLoanTotal : 0
    );

    const totalDue = calc.totalWithInterest || 0;
    const paid = parseFloat(formData.paidAmount || 0);
    let status = "Active";
    if (paid >= totalDue) status = "Paid Off";
    else if (paid > 0 && paid < totalDue) status = "Partial Payment";
    const teneur_endDate = moment(formData.issueDate)
      .add(runningTenure, "months")
      .toISOString();
    const payload = {
      ...formData,
      previousLoanAmount: overlapMode ? selectedPreviousLoanTotal : 0,
      subTotal: calc.subtotal,
      totalLoan: totalDue,
      teneur_endDate,
      status,
    };
    await loanStore.updateLoan(loanId, payload);
    if (overlapMode && selectedLoanIds.length > 0) {
      const selectedIds =
        activeLoans
          ?.filter(
            (loan) =>
              selectedLoanIds.includes(loan._id) && loan.status !== "Merged"
          )
          ?.map((loan) => loan._id) || [];

      for (const id of selectedIds) {
        await loanStore.updateLoan(id, {
          status: "Merged",
          parentLoanId: loanId,
        });
      }
      // toast.success(
      //   `${selectedIds.length} previous loan${
      //     selectedIds.length > 1 ? "s" : ""
      //   } merged successfully`
      // );
    }
    await loanStore.fetchLoans();
    toast.success("Loan updated successfully");
    onClose();
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update loan";
    toast.error(message);
    console.error("Error saving loan:", error);
  } finally {
    setSaving(false);
  }
};

    useEffect(() => {
      if (!formData?.issueDate || !formData?.loanTerms) return;
      const start = moment(formData.issueDate, "MM-DD-YYYY");
      const end = start.clone().add(formData.loanTerms, "months");
      setEndDate(end.format("MM-DD-YYYY"));
    }, [formData?.loanTerms, formData?.issueDate]);

    if (loading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center space-y-3">
            <CircularProgress color="success" />
            <span className="text-gray-700 font-medium">Loading loan...</span>
          </div>
        </div>
      );
    }

    if (!formData || !companyData) return null;

    const feeItems = [
      { key: "applicationFee", label: "Application Fee" },
      { key: "brokerFee", label: "Broker Fee" },
      { key: "administrativeFee", label: "Administrative Fee" },
      { key: "attorneyReviewFee", label: "Attorney Review Fee" },
      { key: "annualMaintenanceFee", label: "Annual Maintenance Fee" },
    ];

    const formatDate = (dateStr: string) =>
      moment(dateStr, "MM-DD-YYYY").format("MMM DD, YYYY");

    const LoanTemsCard = () => {
      const start = moment(formData.issueDate, "MM-DD-YYYY");
      return (
        <div className="px-2 py-2">
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex space-x-2 min-w-max">
              {ALLOWED_TERMS.map((term) => {
                const result = calculateLoan(
                  formData.baseAmount || 0,
                  formData.fees,
                  formData.interestType || "flat",
                  formData.monthlyRate || 0,
                  term,
                  overlapMode ? selectedPreviousLoanTotal : 0
                );

                const isSelected = term <= formData.loanTerms;
                const termEnd = start.clone().add(term, "months");

                return (
                  <div
                    key={term}
                    className={`flex-shrink-0 w-32 p-2 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer
              ${
                isSelected
                  ? "bg-red-700 border-red-800 text-white shadow-lg scale-105"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
                    onClick={() => {
                      setFormData((prev: any) => ({
                        ...prev,
                        loanTerms: term,
                      }));
                    }}
                  >
                    <div className="font-medium text-sm font-semibold">
                      {term} months
                    </div>
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isSelected ? "text-yellow-300" : "text-gray-700"
                      }`}
                    >
                      Interest: {usd.format(result.interestAmount)}
                    </div>
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isSelected ? "text-yellow-300" : "text-gray-700"
                      }`}
                    >
                      Total: {usd.format(result.totalWithInterest)}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Date: {termEnd.format("MMM DD, YYYY")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };
    const currentCalc = calculateLoan(
      formData.baseAmount || 0,
      formData.fees,
      formData.interestType || "flat",
      formData.monthlyRate || 0,
      formData.loanTerms || 24,
      overlapMode ? selectedPreviousLoanTotal : 0
    );
 const usd = new Intl.NumberFormat("en-US", {
   style: "currency",
   currency: "USD",
 });
    return (
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
          <div className="bg-white shadow-lg w-full max-w-6xl flex flex-col rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b bg-white sticky top-0 z-10 rounded-md">
              <h2 className="text-xl font-bold text-gray-800">Edit Loan </h2>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={onClose}
              >
                <X />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden px-4 pt-1 flex flex-col lg:flex-row gap-4 flex-1">
              {/* Left: Form Fields */}
              <div className="flex-1 space-y-3">
                {/* Client */}
                <div className="flex flex-col text-left py-1">
                  <label className="mb-1 font-medium text-gray-700">
                    Client
                  </label>
                  <Autocomplete
                    disabled
                    options={
                      clientStore.clients?.map((c) => ({
                        label: c.fullName,
                        value: c._id,
                      })) || []
                    }
                    getOptionLabel={(opt) => opt.label}
                    value={
                      clientStore.clients
                        ?.map((c) => ({ label: c.fullName, value: c._id }))
                        .find((opt) => opt.value === formData.client) || null
                    }
                    //@ts-ignore
                    onChange={(e, newValue) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        client: newValue?.value || "",
                      }))
                    }
                    renderInput={(params) => (
                      <MuiTextField
                        {...params}
                        placeholder="Select Client"
                        size="small"
                      />
                    )}
                  />
                </div>

                {/* Company */}
                <div className="flex flex-col text-left py-1">
                  <label className="mb-1 font-medium text-gray-700">
                    Company
                  </label>
                  <Autocomplete
                    options={
                      companyStore.companies
                        ?.filter((c) => c.activeCompany)
                        .map((c) => ({ label: c.companyName, value: c._id })) ||
                      []
                    }
                    getOptionLabel={(opt) => opt.label}
                    value={
                      companyStore.companies
                        ?.filter((c) => c.activeCompany)
                        .map((c) => ({ label: c.companyName, value: c._id }))
                        .find((opt) => opt.value === formData.company) || null
                    }
                    //@ts-ignore
                    onChange={(e, newValue) => {
                      const selectedCompany = companyStore.companies.find(
                        (c) => c._id === newValue?.value
                      );
                      if (selectedCompany) {
                        setFormData((prev: any) => ({
                          ...prev,
                          company: selectedCompany._id,
                          companyName: selectedCompany.companyName || "",
                          backgroundColor:
                            selectedCompany.backgroundColor || "#555555",
                        }));
                        setCompanyData(selectedCompany);
                      } else {
                        setFormData((prev: any) => ({
                          ...prev,
                          company: "",
                          companyName: "",
                          backgroundColor: "#555555",
                        }));
                        setCompanyData(null);
                      }
                    }}
                    renderInput={(params) => (
                      <MuiTextField
                        {...params}
                        placeholder="Company"
                        size="small"
                      />
                    )}
                  />
                </div>

                {/* Issue Date */}
                <div className="flex flex-col text-left py-1 z-20">
                  <label className="mb-1 font-medium text-gray-700">
                    Issue Date
                  </label>
                  <DatePicker
                    value={moment(formData.issueDate, "MM-DD-YYYY")}
                    onChange={(date: Moment | null) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        issueDate: date ? date.format("MM-DD-YYYY") : "",
                      }))
                    }
                    slotProps={{ textField: { size: "small" } }}
                  />
                </div>

                {/* Check Number */}
                <div className="flex flex-col text-left py-1">
                  <label className="mb-1 font-medium text-gray-700">
                    Check Number
                  </label>
                  <input
                    type="text"
                    value={formData.checkNumber || ""}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        checkNumber: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center justify-between mt-3 mb-2">
                  <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <RefreshCw size={14} className="text-gray-500" /> Previous
                    Loan
                  </label>
                  <Switch
                    color="success"
                    size="small"
                    checked={overlapMode}
                    onChange={(e) => {
                      setOverlapMode(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedLoanIds([]);
                      }
                    }}
                  />
                </div>
                {/* Overlap Mode */}
                {overlapMode && activeLoans.length > 0 && (
                  <div className="mt-4 p-2 bg-green-100 border-l-4 border-yellow-500 rounded">
                

                    <div className="transition-all duration-700 ease-in-out overflow-auto max-h-40 opacity-100">
                      {activeLoans.map((loan) => {
                        const { runningTenure, total, remaining } =
                          getLoanRunningDetails(loan);
                        const loanIdStr = loan._id?.toString?.();
                        const alreadyMerged = loan.status === "Merged";
                        const isSelected = selectedLoanIds.includes(loanIdStr);
                        const isDisabled =
                          alreadyMerged || previousToggleDisabled;
                        const checked = alreadyMerged ? true : isSelected;

                        return (
                          <div
                            key={loanIdStr}
                            className={`flex justify-between items-center p-3 border rounded-lg shadow-sm transition ${
                              checked
                                ? "bg-green-100 border-green-400"
                                : "bg-white hover:bg-gray-50"
                            } ${
                              isDisabled ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              setSelectedLoanIds((prev) =>
                                prev.includes(loanIdStr)
                                  ? prev.filter((id) => id !== loanIdStr)
                                  : [...prev, loanIdStr]
                              );
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col text-xs">
                                <span className="font-semibold text-white px-1 py-0 rounded-md bg-green-600 w-fit">
                                  Issue Date: {formatDate(loan.issueDate)}
                                </span>
                                <span className="font-semibold">
                                  Current Tenure: <b>{runningTenure} Months</b>
                                </span>
                                <span className="text-green-700 font-bold">
                                  Total: $
                                  {total.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}{" "}
                                  (
                                  <span className="text-red-600 font-bold">
                                    Remaining: $
                                    {(alreadyMerged
                                      ? 0
                                      : remaining
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                  )
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(loan);
                                }}
                              >
                                <Eye size={18} />
                              </IconButton>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (isDisabled) return;
                                  setSelectedLoanIds((prev) =>
                                    prev.includes(loanIdStr)
                                      ? prev.filter((id) => id !== loanIdStr)
                                      : [...prev, loanIdStr]
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-4 h-4 m-0 accent-green-600 ${
                                  isDisabled
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                                disabled={isDisabled}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Calculation Panel */}
              <div className="flex lg:max-w-3xl">
                <div
                  className="rounded-xl shadow-sm px-0 min-w-0"
                  style={{
                    backgroundColor: companyData.backgroundColor || "#555555",
                  }}
                >
                  <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
                    <h3 className="text-sm font-semibold text-white">
                      Loan Calculation - {companyData.companyName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 px-2">
                    <div className="flex flex-col">
                      <label className="text-sm text-white mb-1 font-medium">
                        Base Amount
                        {originalLoan && (
                          <span className="text-xs text-gray-300 ml-2">
                            (min: ${originalLoan.baseAmount?.toLocaleString()})
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={
                          formData.baseAmount === null ||
                          formData.baseAmount === undefined
                            ? ""
                            : formData.baseAmount
                        }
                        onChange={(e) => {
                          const rawValue = e.target.value;
                          setFormData((prev: any) => ({
                            ...prev,
                            baseAmount:
                              rawValue === "" ? "" : parseFloat(rawValue),
                          }));
                        }}
                        onBlur={() => {
                          const value = Number(formData.baseAmount);
                          if (!isNaN(value)) {
                            if (
                              originalLoan &&
                              value < (originalLoan.baseAmount || 0)
                            ) {
                              toast.error(
                                `Base amount cannot be less than $${originalLoan.baseAmount}`
                              );
                              setFormData((prev: any) => ({
                                ...prev,
                                baseAmount: originalLoan.baseAmount,
                              }));
                            }
                          }
                        }}
                        className="w-full px-2 h-8 py-2 border rounded-lg bg-white text-gray-800"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-white mb-1 font-medium">
                        Interest Type
                      </label>
                      <select
                        value={formData.interestType}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            interestType: e.target.value as "flat" | "compound",
                          }))
                        }
                        className="w-full h-8 px-2 border rounded-lg bg-white text-gray-800"
                      >
                        <option value="flat">Flat Interest</option>
                        <option value="compound">Compound Interest</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-white mb-1 font-medium">
                        Monthly Interest (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.monthlyRate}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            monthlyRate: e.target.value,
                          }))
                        }
                        className="w-full h-8 px-2 py-2 border rounded-lg bg-white text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-0 px-2">
                    {feeItems.map((item) => {
                      const fee = formData.fees[item.key];
                      if (!fee) return null;
                      const isPercentage = fee.type === "percentage";
                      const contribution = isPercentage
                        ? (formData.baseAmount * fee.value) / 100
                        : fee.value;
                      return (
                        <div
                          key={item.key}
                          className="flex flex-col gap-2 pr-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white font-medium whitespace-nowrap">
                              {item.label}
                            </span>
                            <span className="text-md font-semibold text-green-700 bg-white px-1 py-0 rounded-md shadow-md">
                              +${contribution.toFixed(2)}
                            </span>
                          </div>

                          <div className="relative flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={fee.value}
                              onChange={(e) => {
                                const val = parseNumber(e.target.value);
                                setFormData((prev: any) => ({
                                  ...prev,
                                  fees: {
                                    ...prev.fees,
                                    [item.key]: { ...fee, value: val },
                                  },
                                }));
                              }}
                              className="w-full h-8 px-3 py-2 border rounded-md bg-white text-gray-800"
                              placeholder={isPercentage ? "0.00 %" : "0.00 $"}
                            />
                            <span className="absolute right-[70px] top-1/2 -translate-y-1/2 text-red-400 font-semibold">
                              {isPercentage ? "%" : "$"}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isPercentage}
                                onChange={() => {
                                  setFormData((prev: any) => ({
                                    ...prev,
                                    fees: {
                                      ...prev.fees,
                                      [item.key]: {
                                        ...fee,
                                        type: isPercentage
                                          ? "flat"
                                          : "percentage",
                                      },
                                    },
                                  }));
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-14 h-7 bg-gray-300 rounded-full peer-checked:bg-gray-400 transition-colors relative">
                                <div
                                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center transition-transform ${
                                    isPercentage ? "translate-x-7" : ""
                                  }`}
                                >
                                  <span className="text-sm font-bold text-gray-700">
                                    {isPercentage ? "%" : "$"}
                                  </span>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-sm text-white mt-2 font-semibold px-2">
                    {overlapMode && selectedPreviousLoanTotal > 0 && (
                      <div className="flex justify-between text-yellow-300 font-semibold mt-2">
                        <span>Previous Loan Amount Carry Forward:</span>
                        <span>{usd.format(selectedPreviousLoanTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>
                        {overlapMode && selectedPreviousLoanTotal > 0
                          ? "Loan Amount (Base + Additional Fees + Previous Loan)"
                          : "Loan Amount (Base + Additional Fees)"}
                      </span>
                      <span className="text-md text-green-700 px-2 rounded-md bg-white">
                        {usd.format(currentCalc.subtotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 relative max-w-full px-2">
                    <label className="text-sm font-semibold text-white mb-2 block">
                      Select Loan Term (
                      <span className="font-bold">{formData.loanTerms}</span>{" "}
                      Months)
                    </label>
                    <div className="flex justify-between">
                      {ALLOWED_TERMS.map((term) => (
                        <span
                          key={term}
                          className={`text-sm font-semibold ${
                            term === formData.loanTerms
                              ? "text-yellow-300 font-bold"
                              : "text-white"
                          }`}
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={ALLOWED_TERMS.length - 1}
                      value={ALLOWED_TERMS.indexOf(formData.loanTerms)}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value, 10);
                        const term = ALLOWED_TERMS[idx] || 24;
                        setFormData((prev: any) => ({
                          ...prev,
                          loanTerms: term,
                        }));
                      }}
                      className="w-full accent-white cursor-pointer"
                    />
                    <LoanTemsCard />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 bg-white sticky bottom-0 z-10 rounded-md">
              <button
                onClick={onClose}
                className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    {" "}
                    <Save size={16} /> Update Loan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* View Loan Modal */}
        {viewLoan && (
          <Dialog open onClose={handleCloseView} maxWidth="sm" fullWidth>
            <DialogTitle className="font-semibold text-lg text-green-700 border-b pb-2 flex justify-between items-center">
              Loan Details
              <IconButton onClick={handleCloseView}>
                <X size={18} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers className="space-y-3 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-800 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Client</p>
                  <p className="font-semibold">
                    {clientStore.clients.find((c) => c._id === viewLoan.client)
                      ?.fullName || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Company
                  </p>
                  <p className="font-semibold">
                    {companyStore.companies.find(
                      (c) => c._id === viewLoan.company
                    )?.companyName || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Issue Date
                  </p>
                  <p>{moment(viewLoan.issueDate).format("MMM DD, YYYY")}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Loan Term
                  </p>
                  <p>{viewLoan.loanTerms} months</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Interest Type
                  </p>
                  <p className="capitalize">{viewLoan.interestType}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Monthly Rate
                  </p>
                  <p>{viewLoan.monthlyRate}%</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Base Amount
                  </p>
                  <p>${(viewLoan.baseAmount || 0).toLocaleString()}</p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Total Loan
                  </p>
                  <p className="font-semibold text-green-700">
                    $
                    {getLoanRunningDetails(viewLoan).total.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                      }
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">
                    Remaining
                  </p>
                  <p className="font-semibold text-red-600">
                    $
                    {(viewLoan.status === "Merged"
                      ? 0
                      : getLoanRunningDetails(viewLoan).remaining
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
                  <p
                    className={`font-bold ${
                      viewLoan.status === "Paid Off"
                        ? "text-green-600"
                        : viewLoan.status === "Merged"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {viewLoan.status}
                  </p>
                </div>

                {viewLoan.checkNumber && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Check Number
                    </p>
                    <p>{viewLoan.checkNumber}</p>
                  </div>
                )}
              </div>
            </DialogContent>

            <DialogActions>
              <Button
                onClick={handleCloseView}
                color="success" // 👈 matches your other Close buttons
                variant="contained"
                className="mx-4 mb-3 font-bold"
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </LocalizationProvider>
    );
  }
);

export default EditLoanModal;
