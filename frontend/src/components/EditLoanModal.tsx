// src/components/EditLoanModal.tsx
import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import { X, Save, Eye, RefreshCw } from "lucide-react";
import { clientStore } from "../store/ClientStore";
import { companyStore } from "../store/CompanyStore";
import { loanStore} from "../store/LoanStore";
import moment from "moment";
import type { Moment } from "moment";
import {
  Switch,
  Autocomplete,
  TextField as MuiTextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers";
import { fetchPaymentsByLoan } from "../services/LoanPaymentServices";
import { fetchLoanById } from "../services/LoanService";
import { getClientById } from "../services/ClientServices";
import { convertToUsd, isDateBefore } from "../utils/helpers";
import { LoanTermsCard } from "./LoanTermsCard";
import { ALLOWED_TERMS } from "../utils/constants";
import { PreviousLoan } from "./PreviousLoan";

const parseNumber = (val: any): number => {
  if (typeof val === "string") return parseFloat(val) || 0;
  return val || 0;
};
const buildTenures = (
  issueDateStr: string,
  terms: number[],
  outFormat: "iso" | "mm-dd-yyyy" = "mm-dd-yyyy" 
) => {
  const start = moment(issueDateStr, "MM-DD-YYYY").startOf("day");
  return terms.map((t) => {
    const end = start.clone().add(t * 30, "days");
    return {
      term: t,
      endDate:
        outFormat === "iso"
          ? end.format("YYYY-MM-DD")
          : end.format("MM-DD-YYYY"),
    };
  });
};

const EditLoanModal = observer(
  ({ loanId, onClose }: { loanId: string; onClose: () => void }) => {
    const [formData, setFormData] = useState<any>(null);
    const [companyData, setCompanyData] = useState<any>(null);
    const [activeLoans, setActiveLoans] = useState<any[]>([]);
    const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
    const [overlapMode, setOverlapMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subTotal, setSubTotal] = useState(0);
    const [modalTotal, setModalTotal] = useState(0);
    const [modalRemaining, setModalRemaining] = useState(0);


    // @ts-ignore
    const [endDate, setEndDate] = useState<string | null>(null);
    const [viewLoan, setViewLoan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [previousToggleDisabled, setPreviousToggleDisabled] = useState(false);
    const [originalLoan, setOriginalLoan] = useState<any>(null);
    const [selectedPreviousLoanTotal, setSelectedPreviousLoanTotal] = useState(0);

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
          const promises = [];
          if (companyStore.companies.length == 0) {
            promises.push(companyStore.fetchCompany());
          }
          if (clientStore.clients.length == 0) {
            promises.push(clientStore.fetchClients());
          }
          if (loanStore.loans.length == 0) {
            promises.push(loanStore.fetchLoans());
          }
          await Promise.all(promises);
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
            let totalRemaining = 0;

            for (const l of previousLoans) {
              const result = await loanStore.calculateLoanAmounts({
                loan: l,
                date: formData.issueDate,
              });

              totalRemaining += result?.remaining || 0;
            }

            
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


    const handleView = async (loan: any) => {
      try {
        await fetchPaymentsByLoan(loan._id);
      } catch {}
      setViewLoan(loan);
    };

    const handleCloseView = () => setViewLoan(null);
const handleIssueDateChange = (newDate: Moment | null) => {
  if (!newDate) return;

  const formattedDate = newDate.format("MM-DD-YYYY");
  const selectedMergedLoans = activeLoans.filter((l) =>
    selectedLoanIds.includes(l._id)
  );
  for (const loan of selectedMergedLoans) {
    const mergedIssueDate = moment(loan.issueDate).format("MM-DD-YYYY");

    if (isDateBefore(formattedDate, mergedIssueDate)) {
      toast.warn(
        `Issue Date cannot be earlier than merged loan issued on ${mergedIssueDate}!`
      );
      return; 
    }
  }
  setFormData((prev: any) => ({
    ...prev,
    issueDate: formattedDate,
  }));
};

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
     const { totalWithInterest, subtotal } =
      await loanStore.calculateLoanAmounts({
            loan: formData,
            date: null,
            prevLoanTotal: overlapMode ? selectedPreviousLoanTotal : 0,
            calculate: true,
          });
        const totalDue = totalWithInterest || 0;
        const paid = parseFloat(formData.paidAmount || 0);
        let status = "Active";
        if (paid >= totalDue) status = "Paid Off";
        else if (paid > 0 && paid < totalDue) status = "Partial Payment";
        const tenures = buildTenures(
          formData.issueDate,
          ALLOWED_TERMS,
          "mm-dd-yyyy"
        );
        const payload = {
          ...formData,
          tenures: tenures,
          previousLoanAmount: overlapMode ? selectedPreviousLoanTotal : 0,
          subTotal: subtotal,
          totalLoan: totalDue,
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
        }
        await loanStore.fetchActiveLoans(formData.client);
        await clientStore.refreshDataTable();

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
      const tenures = buildTenures(formData.issueDate, ALLOWED_TERMS, "iso");
      setFormData((prev: any) => ({
        ...prev,
        tenures,
      }));
      setEndDate(end.format("MM-DD-YYYY"));
    }, [formData?.loanTerms, formData?.issueDate]);
    useEffect(() => {
      if (!formData || !formData.issueDate || !originalLoan) return;
      if (!loanStore?.loans) return;

      const selectedIssue = new Date(formData.issueDate);
      
      const filteredLoans = loanStore.loans.filter((l) => {
        const lClient = l.client?._id?.toString() || l.client?.toString();
        const originalClient =
          originalLoan.client?._id?.toString() ||
          originalLoan.client?.toString();

        if (lClient !== originalClient) return false;
        if (l._id?.toString() === originalLoan._id?.toString()) return false;
        if (l.status === "Paid Off") return false;
        if (l.loanStatus === "Deactivated") return false;
        console.log(formData._id, "formData._id");
        console.log(l.parentLoanId, l.status, "l.parentLoanId,l.status");

        if (l.status === "Merged" && l.parentLoanId !== formData._id ) return false;

        const issue = l.issueDate ? new Date(l.issueDate) : null;

        return !issue || issue <= selectedIssue;
      });

      setActiveLoans(filteredLoans);
        async function call() {
          const filteredLoansrray = filteredLoans
        .filter((l) => selectedLoanIds.includes(l._id));
      
                  let totalRemaining = 0;

                  for (const l of filteredLoansrray) {
                    const result = await loanStore.calculateLoanAmounts({
                      loan: l,
                      date: formData.issueDate,
                    });

                    totalRemaining += result?.remaining || 0;
                  }
          return totalRemaining;
        }
const totalRemaining = call();
       

      setFormData((prev) => ({
        ...prev,
        previousLoanAmount: totalRemaining,
      }));
    }, [formData?.issueDate, selectedLoanIds, loanStore.loans]);
    
    useEffect(() => {
        let selectedPreviousTotal = 0; 
        async function callFun2() {
          console.log("callFun2");
        for (const loan of activeLoans) {
            if (selectedLoanIds.includes(loan._id)) {
              const result = await loanStore.calculateLoanAmounts({
                loan,
                date: formData.issueDate,
                calculate: true,
              });
            
              const remaining = result?.remaining || 0;
              selectedPreviousTotal += remaining;
            }
          }

          setSelectedPreviousLoanTotal(selectedPreviousTotal);
          console.log(selectedPreviousTotal, "selectedPreviousTotal");
        }
          async function callFun() {
            const result =  await loanStore.calculateLoanAmounts({
                loan: formData,
                // prevLoanTotal: overlapMode ? selectedPreviousLoanTotal : 0,
                prevLoanTotal:selectedPreviousTotal,
                calculate: true,
              });
             const {subtotal, total, remaining}:any = result
               console.log(result, "result");
          console.log(selectedPreviousTotal, "selectedPreviousTotal");

            setSubTotal(subtotal);
            setModalTotal(total);
            setModalRemaining(remaining);
          }

        callFun2();

        callFun();  
    }, [formData])

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

   
    const handleCompanyChange = (selectedCompany: any) => {
      if (!selectedCompany) {
        setFormData((prev) => {
          const issueDate = prev?.issueDate || moment().format("MM-DD-YYYY");
          const defaultTerm = 24;
          const tenures = buildTenures(issueDate, [defaultTerm], "iso");

          return {
            ...prev,
            company: "",
            companyName: "",
            backgroundColor: "#555555",
            fees: {
              administrativeFee: { value: 0, type: "flat" },
              applicationFee: { value: 0, type: "flat" },
              attorneyReviewFee: { value: 0, type: "flat" },
              brokerFee: { value: 0, type: "flat" },
              annualMaintenanceFee: { value: 0, type: "flat" },
            },
            interestType: "flat",
            monthlyRate: 0,
            loanTermMonths: defaultTerm,
            loanTerms: [defaultTerm],
            tenures,
          };
        });
        setCompanyData(null);
        return;
      }

      const mapFee = (fee: any) => ({
        value: fee?.value || 0,
        type: fee?.type === "percentage" ? "percentage" : "flat",
      });

      const defaultLoanTerm =
        selectedCompany.loanTerms?.[selectedCompany.loanTerms.length - 1] || 24;

      setFormData((prev) => {
        const issueDate = prev?.issueDate || moment().format("MM-DD-YYYY");
        const tenures = buildTenures(
          issueDate,
          selectedCompany.loanTerms || [defaultLoanTerm],
          "iso"
        );

        return {
          ...prev,
          company: selectedCompany._id,
          companyName: selectedCompany.companyName || "",
          backgroundColor: selectedCompany.backgroundColor || "#555555",
          fees: {
            administrativeFee: mapFee(selectedCompany.fees?.administrativeFee),
            applicationFee: mapFee(selectedCompany.fees?.applicationFee),
            attorneyReviewFee: mapFee(selectedCompany.fees?.attorneyReviewFee),
            brokerFee: mapFee(selectedCompany.fees?.brokerFee),
            annualMaintenanceFee: mapFee(
              selectedCompany.fees?.annualMaintenanceFee
            ),
          },
          interestType: selectedCompany.interestRate?.interestType || "flat",
          monthlyRate: selectedCompany.interestRate?.monthlyRate || 0,
          loanTermMonths: defaultLoanTerm,
          loanTerms: defaultLoanTerm,
          tenures,
          status: "Active",
        };
      });

      setCompanyData(selectedCompany);
    };
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
                      handleCompanyChange(selectedCompany);
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
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DatePicker
                      value={moment(formData.issueDate, "MM-DD-YYYY")}
                      onChange={handleIssueDateChange}
                      slotProps={{ textField: { size: "small" } }}
                    />
                  </LocalizationProvider>
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
                <div className="flex items-center justify-between mt-4 p-2 border-l-4 border-yellow-500 rounded">
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
                  <PreviousLoan
                    activeLoans={activeLoans}
                    formData={formData}
                    selectedLoanIds={selectedLoanIds}
                    previousToggleDisabled={previousToggleDisabled}
                    setSelectedLoanIds={setSelectedLoanIds}
                    handleView={handleView}
                  />
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
                        <span>
                          {convertToUsd.format(selectedPreviousLoanTotal)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>
                        {overlapMode && selectedPreviousLoanTotal > 0
                          ? "Loan Amount (Base + Additional Fees + Previous Loan)"
                          : "Loan Amount (Base + Additional Fees)"}
                      </span>
                      <span className="text-md text-green-700 px-2 rounded-md bg-white">
                        {convertToUsd.format(subTotal + selectedPreviousLoanTotal)}
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
                    <LoanTermsCard
                      formData={formData}
                      setFormData={setFormData}
                      overlapMode={overlapMode}
                      selectedPreviousLoanTotal={selectedPreviousLoanTotal}
                    />
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
          <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/60 overflow-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl mx-3 sm:mx-6 relative flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center border-b px-6 py-3">
                <h2 className="font-semibold text-xl text-green-700">
                  Loan Details
                </h2>
                <button
                  onClick={handleCloseView}
                  className="text-gray-600 hover:text-red-500 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-800 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Client
                    </p>
                    <p className="font-semibold">
                      {clientStore.clients.find(
                        (c) =>
                          c?._id === (viewLoan.client?._id || viewLoan.client)
                      )?.fullName || "-"}
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
                      {modalTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
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
                        : modalRemaining
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Status
                    </p>
                    <p
                      className={`font-bold ${
                        viewLoan.status === "Paid Off"
                          ? "text-gray-500"
                          : viewLoan.status === "Merged"
                          ? "text-green-600"
                          : viewLoan.status === "Active"
                          ? "text-green-600"
                          : "text-yellow-600"
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
              </div>

              <div className="flex justify-end border-t px-6 py-3">
                <button
                  onClick={handleCloseView}
                  className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </LocalizationProvider>
    );
  }
);

export default EditLoanModal;
