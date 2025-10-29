import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import { Plus, Save, Wallet, RefreshCw, X, Eye } from "lucide-react";
import LoanCalculation from "./components/LoanCalculation";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import { loanStore } from "../../store/LoanStore";
import moment from "moment";
import type { Moment } from "moment";
import LoanTable from "./components/LoanTable";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import {
 calculateLoanAmounts,
calculateDynamicTermAndPayment,
} from "../../utils/loanCalculations";
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
} from "@mui/material";
import { fetchPaymentsByLoan } from "../../services/LoanPaymentServices";

const Loans = observer(
  ({
    defaultClient,
    onClose,
    showTable = true,
    fromClientPage = false,
  }: {
    defaultClient?: any;
    onClose?: () => void;
    showTable?: boolean;
    fromClientPage?: boolean;
  }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<any | null>(null);
    // const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [loanTermsOptions, setLoanTermsOptions] = useState<
      { label: string; value: number }[]
    >([]);
    const [activeLoans, setActiveLoans] = useState<any[]>([]);
    const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
    const [overlapMode, setOverlapMode] = useState(false);
    const [calculatedSubTotal, setCalculatedSubTotal] = useState(0);
    const [previousLoanAmount, setPreviousLoanAmount] = useState(0);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
    // const [loanPayments, setLoanPayments] = useState<any[]>([]);

    const [saving, setSaving] = useState(false);
    const getInitialFormData = () => ({
      client: "",
      company: "",
      baseAmount: 0,
      subtotal: 0,
      loanTerms: 24,
      issueDate: moment().format("MM-DD-YYYY"),
      checkNumber: "",
      fees: {
        administrativeFee: { value: 0, type: "flat" },
        applicationFee: { value: 0, type: "flat" },
        attorneyReviewFee: { value: 0, type: "flat" },
        brokerFee: { value: 0, type: "flat" },
        annualMaintenanceFee: { value: 0, type: "flat" },
      },
      interestType: "flat" as "flat" | "compound",
      monthlyRate: 0,
      totalLoan: 0,
    });

    const [formData, setFormData] = useState<Record<string, any>>(
      getInitialFormData()
    );

    const handleView = async (loan: any) => {
      setSelectedLoan(loan);
      try {
        //@ts-ignore
        const payments = await fetchPaymentsByLoan(loan._id);
        // setLoanPayments(payments);
      } catch {
        // setLoanPayments([]);
      }
    };

    const handleClose = () => setSelectedLoan(null);

    const loadInitialData = async () => {
      try {
        await Promise.all([
          companyStore.fetchCompany(),
          clientStore.fetchClients(),
          loanStore.fetchLoans(),
        ]);
      } catch {
        toast.error("Failed to load data");
      }
    };

    useEffect(() => {
      if (defaultClient && companyStore.companies?.length) {
        setFormData((prev) => ({ ...prev, client: defaultClient._id }));

        const defaultCompany = companyStore.companies.find(
          (c) => c.activeCompany && c.companyName === "Claim Advance"
        );

        if (defaultCompany) {
          handleCompanyChange(defaultCompany._id);
        }

        setModalOpen(true);
      }
    }, [defaultClient]);

    const handleCompanyChange = (companyId: string) => {
      // setSelectedCompany(companyId);
      const company = companyStore.companies?.find(
        (c) => c._id === companyId && c.activeCompany // ensure active
      );

      const terms = company?.loanTerms?.length ? company.loanTerms : [12];
      setLoanTermsOptions(
        terms.map((t) => ({ label: `${t} months`, value: t }))
      );
      const defaultTerm = terms.includes(24) ? 24 : terms[0] || 12;

      const mapFee = (fee: any) => ({
        value: fee?.value || 0,
        type: fee?.type === "percentage" ? "percentage" : "flat",
      });

      setFormData((prev) => ({
        ...prev,
        company: companyId,
        companyobj: company,
        fees: {
          administrativeFee: mapFee(company?.fees?.administrativeFee),
          applicationFee: mapFee(company?.fees?.applicationFee),
          attorneyReviewFee: mapFee(company?.fees?.attorneyReviewFee),
          brokerFee: mapFee(company?.fees?.brokerFee),
          annualMaintenanceFee: mapFee(company?.fees?.annualMaintenanceFee),
        },
        interestType: company?.interestRate?.interestType || "flat",
        monthlyRate: company?.interestRate?.monthlyRate || 0,
        loanTerms: defaultTerm,
        status: "Active",
      }));
    };

    useEffect(() => {
      if (formData?.client && formData?.company) {
        const loans =
          loanStore.loans?.filter(
            (loan) =>
              loan?.client === formData.client &&
              // loan?.company === formData.company &&
              loan?.status !== "Paid Off" &&
              loan?.status !== "Merged" &&
              loan?.loanStatus !== "Deactivated"
          ) || [];
        setActiveLoans(loans);
        setSelectedLoanIds([]);
        setOverlapMode(false);
      } else {
        setActiveLoans([]);
        setSelectedLoanIds([]);
        setOverlapMode(false);
      }
    }, [formData.client, formData.company]);

    const resetForm = () => {
      setFormData(getInitialFormData());
      setCalculatedSubTotal(0);
      setPreviousLoanAmount(0);
      setEndDate(null);
      setSelectedLoanIds([]);
      setOverlapMode(false);
      setEditingLoan(null);
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
    const selectedPreviousLoanTotal =
      activeLoans
        ?.filter((loan) => selectedLoanIds.includes(loan?._id))
        ?.reduce(
          (sum, loan) => sum + getLoanRunningDetails(loan).remaining,
          0
        ) || 0;
useEffect(() => {
  const total =
    activeLoans
      ?.filter((loan) => selectedLoanIds.includes(loan._id))
      ?.reduce((sum, loan) => sum + getLoanRunningDetails(loan).remaining, 0) ||
    0;

  setPreviousLoanAmount(total);
}, [selectedLoanIds, activeLoans]);
    let runningTenure = 0;
    let remaining = 0;
    let total = 0;
    if (selectedLoan) {
      const details = getLoanRunningDetails(selectedLoan);
      runningTenure = details.runningTenure;
      remaining = details.remaining;
      total = details.total;
    }

    const handleSave = async (data: any) => {
      try {
        if (saving) return;
        setSaving(true);
        if (!data.client) {
          toast.error("Please select a client");
          return;
        }
        if (!data.company) {
          toast.error("Please select a company");
          return;
        }
        if (!data.baseAmount || data.baseAmount <= 0) {
          toast.error("Base amount must be greater than 0");
          return;
        }
        if (!data.loanTerms || data.loanTerms <= 0) {
          toast.error("Please enter valid loan terms");
          return;
        }
      const payload = {
        ...data,
        baseAmount: (formData.baseAmount + previousLoanAmount).toFixed(2),
        checkNumber: formData.checkNumber || null,
        fees: formData.fees,
        interestType: formData.interestType,
        monthlyRate: formData.monthlyRate,
        loanTerms: formData.loanTerms,
        totalLoan: formData.totalLoan,
        endDate,
        subTotal: (calculatedSubTotal + previousLoanAmount).toFixed(2),
        previousLoanAmount,
        status: "Active",
      };
        if (!editingLoan) {
          await loanStore.createLoan(payload);
          const selectedIds =
            activeLoans
              ?.filter((loan) => selectedLoanIds.includes(loan._id))
              ?.map((loan) => loan._id) || [];

          for (const id of selectedIds) {
            await loanStore.updateLoan(id, { status: "Merged" });
          }
          await loanStore.fetchLoans();

          toast.success("Loan created successfully");
          loadInitialData();
        }
        setModalOpen(false);
        resetForm();
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save loan";
        toast.error(message);
        console.error("Error saving loan:", error);
      } finally {
        setSaving(false);
      }
    };
 useEffect(() => {
     loadInitialData();
 }, []);
    const handleDelete = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this loan?")) return;
      try {
        await loanStore.deleteLoan(id);
        toast.success("Loan deleted successfully");
      } catch {
        toast.error("Failed to delete loan");
      }
    };

    const loanFields = [
      {
        label: "Client",
        key: "client",
        type: "autocomplete",
        options:
          clientStore.clients?.map((c) => ({
            label: c.fullName,
            value: c._id,
          })) || [],
        required: true,
        onChange: (value: string) =>
          setFormData((prev) => ({ ...prev, client: value })),
      },
      {
        label: "Company",
        key: "company",
        type: "autocomplete",
        options:
          companyStore.companies
            ?.filter((c) => c?.activeCompany) // only active companies
            .map((c) => ({
              label: c.companyName,
              value: c._id,
            })) || [],
        required: true,
        onChange: handleCompanyChange,
      },
      { label: "Issue Date", key: "issueDate", type: "date", required: true },
      { label: "Check Number", key: "checkNumber", type: "number" },
    ];

    return (
      <div className="flex flex-col bg-white rounded-lg text-left p-2">
        {/* Header & Table */}
        {!fromClientPage && showTable && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Wallet size={20} /> Loans ({loanStore.loans?.length || 0})
                </h1>
                <p className="text-gray-600 text-base">
                  Manage loan origination, fresh loans, and tracking
                </p>
              </div>
              <Button
                variant="contained"
                startIcon={<Plus />}
                sx={{
                  backgroundColor: "#145A32",
                  "&:hover": { backgroundColor: "#0f3f23" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 1,
                  px: 3,
                  py: 1,
                }}
                onClick={() => {
                  setEditingLoan(null);
                  setModalOpen(true);
                  resetForm();
                  const defaultCompany = companyStore.companies.find(
                    (c) => c.activeCompany && c.companyName === "Claim Advance"
                  );
                  if (defaultCompany) {
                    setFormData((prev) => ({
                      ...prev,
                      company: defaultCompany._id,
                    }));
                    handleCompanyChange(defaultCompany._id);
                  }

                  setModalOpen(true);
                }}
              >
                New Loan
              </Button>
            </div>
            <LoanTable
              onEdit={(loan) => {
                setEditingLoan(loan);
                setFormData(loan);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              //@ts-ignore
              onView={handleView}
            />
          </>
        )}

        {/* Loan Modal */}
        {modalOpen && (
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
              <div className="bg-white shadow-lg w-full max-w-6xl flex flex-col rounded-lg">
                <div className="flex justify-between items-center p-3 border-b bg-white sticky top-0 z-10 rounded-md">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingLoan
                      ? "Edit Loan"
                      : fromClientPage && formData.client
                      ? `Create New Loan - ${
                          clientStore.clients.find(
                            (c) => c._id === formData.client
                          )?.fullName || "Unknown"
                        }`
                      : "Create New Loan"}
                  </h2>
                  <button
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() => {
                      setModalOpen(false);
                      onClose?.();
                    }}
                  >
                    <X />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-col sm:flex-row gap-3 overflow-y-auto overflow-x-hidden px-4 pt-1 flex-1">
                  {/* Left Fields */}
                  <div className="flex-1 space-y-3">
                    {loanFields.map((field) => {
                      if (field.key === "client" && fromClientPage) return null;

                      if (field.type === "date") {
                        return (
                          <div
                            key={field.key}
                            className="flex flex-col text-left py-1 z-20 "
                          >
                            <label className="mb-1 font-medium text-gray-700">
                              {field.label}
                            </label>
                            <DatePicker
                              value={
                                formData[field.key]
                                  ? moment(formData[field.key], "MM-DD-YYYY")
                                  : null
                              }
                              onChange={(date: Moment | null) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  [field.key]: date
                                    ? date.format("MM-DD-YYYY")
                                    : "",
                                }))
                              }
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </div>
                        );
                      }

                      if (field.type === "autocomplete") {
                        return (
                          <div
                            key={field.key}
                            className="flex flex-col text-left py-1"
                          >
                            <label className="mb-1 font-medium text-gray-700">
                              {field.label}
                            </label>
                            <Autocomplete
                              disablePortal
                              options={field.options}
                              getOptionLabel={(option) => option.label || ""}
                              value={
                                field.options.find(
                                  (opt) => opt.value === formData[field.key]
                                ) || null
                              }
                              //@ts-ignore
                              onChange={(e, newValue) => {
                                const value = newValue ? newValue.value : "";
                                setFormData((prev) => ({
                                  ...prev,
                                  [field.key]: value,
                                }));
                                field.onChange?.(value);
                              }}
                              renderInput={(params) => (
                                <MuiTextField
                                  {...params}
                                  placeholder={`Select ${field.label}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={field.key}
                          className="flex flex-col text-left py-1 "
                        >
                          <label className="mb-1 font-medium text-gray-700">
                            {field.label}
                          </label>
                          <input
                            type={field.type}
                            value={formData[field.key] || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [field.key]:
                                  field.type === "number"
                                    ? parseFloat(e.target.value) || 0
                                    : e.target.value,
                              }))
                            }
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      );
                    })}
                    {/* 🆕 Overlap Mode */}
                    {formData?.company && activeLoans.length > 0 && (
                      <div className="mt-4 p-2 bg-green-100 border-l-4  border-yellow-500 rounded ">
                        <div className="flex gap-3 mb-3 items-center">
                          <Switch
                            checked={overlapMode}
                            onChange={(e) => {
                              setOverlapMode(e.target.checked);
                              if (!e.target.checked) setSelectedLoanIds([]);
                            }}
                            color="success"
                            size="small"
                          />
                          <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <RefreshCw size={14} className="text-gray-500" />{" "}
                            Previous Loan
                          </label>
                        </div>
                        <div
                          className={`transition-all duration-700 ease-in-out overflow-auto ${
                            overlapMode
                              ? "max-h-40 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        {overlapMode &&
                          activeLoans.map((loan) => {
                            const { runningTenure, total, remaining } =
                              getLoanRunningDetails(loan);
                            const isSelected = selectedLoanIds.includes(
                              loan._id
                            );

                            return (
                              <div
                                key={loan._id}
                                onClick={() =>
                                  setSelectedLoanIds((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== loan._id)
                                      : [...prev, loan._id]
                                  )
                                }
                                className={`flex justify-between  items-center p-3  border rounded-lg shadow-sm cursor-pointer transition
    ${
      isSelected ? "bg-green-100 border-green-400" : "bg-white hover:bg-gray-50"
    }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col text-xs sm:text-xs">
                                    <span className="font-semibold text-white px-1 py-0 rounded-md bg-green-600 w-fit">
                                      Issue Date:{" "}
                                      {moment(loan.issueDate).format(
                                        "MMM DD, YYYY"
                                      )}
                                    </span>
                                    <span className="font-semibold">
                                      Current Tenure:{" "}
                                      <b>{runningTenure} Months</b>
                                    </span>
                                    <span className="text-green-700 font-bold ">
                                      Total: $
                                      {total.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      ({" "} 
                                      <span className="text-red-600 font-bold">
                                        Remaining: $
                                        {remaining.toLocaleString(undefined, {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      )
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="flex flex-col text-right text-xs sm:text-sm"></div>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleView(loan);
                                    }}
                                  >
                                    <Eye size={18} />
                                  </IconButton>
                                </div>

                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    setSelectedLoanIds((prev) =>
                                      isSelected
                                        ? prev.filter((id) => id !== loan._id)
                                        : [...prev, loan._id]
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 m-0 accent-green-600 cursor-pointer"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Loan Calculation */}
                  {formData.company &&
                    companyStore?.companies?.length > 0 &&
                    (() => {
                      const selected = companyStore.companies.find(
                        (c) => c._id === formData.company
                      );
                      if (!selected) return null;
                      return (
                        <div className="flex max-w-3xl">
                          <LoanCalculation
                            baseAmount={formData.baseAmount}
                            fees={formData.fees}
                            interestType={formData.interestType}
                            company={{
                              name: selected.companyName,
                              backgroundColor:
                                selected.backgroundColor || "#555555",
                              loanTerms: selected.loanTerms,
                            }}
                            issueDate={formData.issueDate}
                            monthlyRate={formData.monthlyRate}
                            loanTermMonths={formData.loanTerms}
                            loanTermsOptions={loanTermsOptions.map(
                              (opt) => opt.value
                            )}
                            includePreviousLoans={overlapMode}
                            previousLoanTotal={selectedPreviousLoanTotal}
                            onChange={(updated) => {
                              setFormData((prev) => ({
                                ...prev,
                                baseAmount: updated.baseAmount,
                                subtotal: updated.subtotal,
                                fees: updated.fees,
                                interestType: updated.interestType,
                                monthlyRate: updated.monthlyRate,
                                loanTerms: updated.loanTermMonths,
                                totalLoan: updated.totalLoan,
                                previousLoanAmount: updated.previousLoanTotal,
                              }));
                              setCalculatedSubTotal(updated.subtotal);
                              setPreviousLoanAmount(
                                updated.previousLoanTotal || 0
                              );
                              setEndDate(
                                moment(updated.endDate).format("MM-DD-YYYY")
                              );
                            }}
                          />
                        </div>
                      );
                    })()}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-4 bg-white sticky bottom-0 z-10 rounded-md">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      onClose?.();
                    }}
                    className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSave(formData)}
                    className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 w-fit"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="loader-button border-t-2 border-white border-solid rounded-full w-4 h-4 animate-spin"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save size={16} />
                        {editingLoan ? "Update Loan" : "Create Loan"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </LocalizationProvider>
        )}
        {/* View Loan Modal */}
        {selectedLoan && (
          <Dialog
            open={!!selectedLoan}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              className:
                "rounded-2xl shadow-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50",
            }}
          >
            <DialogTitle className="font-semibold text-xl text-green-700 border-b pb-2">
              Loan Details
            </DialogTitle>
            <DialogContent className="p-6">
                <div className="grid grid-cols-1 mt-5 sm:grid-cols-2 gap-4 text-gray-800 text-sm">
                  {/* Client Info */}
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">Customer</p>
                    <p className="font-medium">
                      {clientStore.clients.find(
                        (c) => c._id === selectedLoan.client
                      )?.fullName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Company
                  </p>
                    <p className="font-medium">
                      {companyStore.companies.find(
                        (c) => c._id === selectedLoan.company
                      )?.companyName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Base Amount
                  </p>
                    <p className="font-semibold text-green-700">
                      $
                    {Number(selectedLoan.subTotal || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Total Loan
                  </p>
                    <p className="font-semibold text-green-700">
                      $
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Paid Amount
                  </p>
                  <p className="font-semibold text-blue-700">
                    $
                    {Number(selectedLoan.paidAmount || 0).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                      Remaining Amount
                  </p>
                   <p className="font-semibold text-red-700">
                    $
                    {remaining.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    </p>
                  </div>
                  <div className="sm:col-span-2 mt-2">
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Progress
                  </p>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{
                          width: `${
                          ((selectedLoan.paidAmount || 0) / (total || 1)) * 100
                        }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Interest Type
                  </p>
                    <p className="font-medium capitalize">
                    {selectedLoan.interestType || "N/A"}
                  </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Monthly Rate
                  </p>
                    <p className="font-medium">{selectedLoan.monthlyRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Loan Term
                    </p>
                    <p className="font-medium">
                      <b>{runningTenure} Months</b>
                      </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase mb-1">
                    Issue Date
                  </p>
                  <p className="font-medium">
                    {moment(selectedLoan.issueDate).format("MMM DD, YYYY")}
                  </p>
                  </div>
                  <div className="sm:col-span-2 border-t border-gray-200 pt-3 mt-2">
                    <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
                    <p
                      className={`font-semibold ${
                        selectedLoan.status === "Paid Off"
                          ? "text-green-700"
                          : selectedLoan.status === "Partial Payment"
                          ? "text-blue-700"
                          : "text-yellow-700"
                      }`}
                    >
                      {selectedLoan.status}
                    </p>
                  </div>
                </div>
            </DialogContent>
            <DialogActions className="px-6 pb-4">
              <Button
                onClick={handleClose}
                variant="contained"
                color="success"
                className="px-4 py-2 font-bold bg-green-400 text-white rounded-lg hover:bg-green-700 transition"
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </div>
    );
  }
);

export default Loans;