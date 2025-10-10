import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import { Plus, Save, Wallet, RefreshCw, Eye } from "lucide-react";
import LoanCalculation from "./components/LoanCalculation";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import { loanStore } from "../../store/LoanStore";
import moment, { Moment } from "moment";
import LoanTable from "./components/LoanTable";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { Button, Switch } from "@mui/material";

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
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [loanTermsOptions, setLoanTermsOptions] = useState<{ label: string; value: number }[]>([]);
    const [activeLoans, setActiveLoans] = useState<any[]>([]);
    const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);
    const [overlapMode, setOverlapMode] = useState(false);
    const [calculatedSubTotal, setCalculatedSubTotal] = useState(0);
    const [previousLoanAmount, setPreviousLoanAmount] = useState(0);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [viewLoan, setViewLoan] = useState<any | null>(null); 
    const hasLoaded = useRef(false);

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

    const [formData, setFormData] = useState<Record<string, any>>(getInitialFormData());

    const loadInitialData = async () => {
      try {
        await Promise.all([companyStore.fetchCompany(), clientStore.fetchClients(), loanStore.fetchLoans()]);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load data");
      }
    };

    useEffect(() => {
      if (!hasLoaded.current) {
        loadInitialData();
        hasLoaded.current = true;
      }
    }, []);

    useEffect(() => {
      if (defaultClient) {
        setFormData((prev) => ({ ...prev, client: defaultClient._id }));
        setModalOpen(true);
      }
    }, [defaultClient]);

    const handleCompanyChange = (companyId: string) => {
      setSelectedCompany(companyId);
      const company = companyStore.companies?.find((c) => c?._id === companyId);
      if (!company) return;

      const terms = company?.loanTerms?.length ? company.loanTerms : [12];
      setLoanTermsOptions(terms.map((t) => ({ label: `${t} months`, value: t })));

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
        status: "Fresh Loan Issued",
      }));
    };

    useEffect(() => {
      if (formData?.client && formData?.company) {
        const loans =
          loanStore.loans?.filter(
            (loan) =>
              loan?.client === formData.client &&
              loan?.company === formData.company &&
              loan?.status !== "Paid Off"
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

    const selectedPreviousLoanTotal =
      activeLoans
        ?.filter((loan) => selectedLoanIds.includes(loan?._id))
        ?.reduce((sum, loan) => sum + (loan?.totalLoan || 0), 0) || 0;

    const handleSave = async (data: any) => {
      const payload = {
        ...data,
        baseAmount: formData.baseAmount,
        checkNumber: formData.checkNumber || null,
        fees: formData.fees,
        interestType: formData.interestType,
        monthlyRate: formData.monthlyRate,
        loanTerms: formData.loanTerms,
        totalLoan: formData.totalLoan,
        endDate,
        subTotal: calculatedSubTotal,
        previousLoanAmount,
        status: "Active",
      };

      try {
        if (!editingLoan) {
          await loanStore.createLoan(payload);
          const selectedIds = activeLoans
            ?.filter((loan) => selectedLoanIds.includes(loan._id))
            ?.map((loan) => loan._id) || [];

          for (const id of selectedIds) {
            if (!id) continue;
            await loanStore.updateLoan(id, { status: "Paid Off" });
          }

          toast.success("Loan created successfully");
        }
        await loanStore.fetchLoans();
        setModalOpen(false);
        setEditingLoan(null);
        setOverlapMode(false);
        setSelectedLoanIds([]);
        resetForm();
      } catch (error) {
        console.error(error);
        toast.error("Failed to save loan");
      }
    };

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
        label: "Company",
        key: "company",
        type: "select",
        options: companyStore.companies?.map((c) => ({ label: c.companyName, value: c._id })) || [],
        onChange: handleCompanyChange,
        required: true,
      },
      { label: "Issue Date", key: "issueDate", type: "date", required: true },
      { label: "Check Number", key: "checkNumber", type: "number" },
    ];

    const bgStyle = { backgroundColor: formData?.companyobj?.backgroundColor || "#555555" };

    return (
      <div className="flex flex-col bg-white rounded-lg text-left">
        {/* Only show header & table if NOT from client page */}
        {!fromClientPage && showTable && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Wallet size={20} /> Loans ({loanStore.loans?.length || 0})
                </h1>
                <p className="text-gray-600 text-base">Manage loan origination, fresh loans, and tracking</p>
              </div>
              <Button
                variant="contained"
                startIcon={<Plus />}
                sx={{ backgroundColor: "#145A32", "&:hover": { backgroundColor: "#0f3f23" }, textTransform: "none", fontWeight: 600, borderRadius: 1, px: 3, py: 1 }}
                onClick={() => { setEditingLoan(null); setModalOpen(true); resetForm(); }}
                
              >
                New Loan
              </Button>
            </div>
            <LoanTable onEdit={(loan) => { setEditingLoan(loan); setFormData(loan); setModalOpen(true); }} onDelete={handleDelete} onView={(loan) => setViewLoan(loan)}  />
          </>
        )}

        {/* Loan Modal */}
        {modalOpen && (
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
              <div className="bg-white shadow-lg w-full max-w-5xl flex flex-col rounded-lg">
                <div className="flex justify-between items-center p-3 border-b bg-white sticky top-0 z-10 rounded-md">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingLoan
                      ? "Edit Loan"
                      : fromClientPage && formData.client
                        ? `Create New Loan - ${clientStore.clients.find((c) => c._id === formData.client)?.fullName || "Unknown"}`
                        : "Create New Loan"}
                  </h2>
                  <button className="text-gray-500 hover:text-gray-800" onClick={() => { setModalOpen(false); onClose?.(); }}>✕</button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-col sm:flex-row gap-2 overflow-y-auto overflow-x-hidden px-3 pt-1 flex-1">
                  {/* Left Fields */}
                  <div className="flex-1 space-y-2">
                    {loanFields.map((field) => {
                      if (field.type === "date") {
                        return (
                          <div key={field.key} className="flex flex-col text-left py-1">
                            <label className="mb-1 font-medium text-gray-700">{field.label}</label>
                            <DatePicker
                              value={formData[field.key] ? moment(formData[field.key], "MM-DD-YYYY") : null}
                              onChange={(date: Moment | null) =>
                                setFormData((prev) => ({ ...prev, [field.key]: date ? date.format("MM-DD-YYYY") : "" }))
                              }
                              slotProps={{ textField: { size: "small" } }}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={field.key} className="flex flex-col text-left py-1">
                          <label className="mb-1 font-medium text-gray-700">{field.label}</label>
                          {field.type === "select" ? (
                            <select
                              value={formData[field.key] || ""}
                              onChange={(e) => { const value = e.target.value; setFormData(prev => ({ ...prev, [field.key]: value })); field.onChange?.(value); }}
                              className="w-full border rounded px-3 py-2"
                            >
                              <option value="">Select</option>
                              {field.options?.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={formData[field.key] || ""}
                              onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                              className="w-full border rounded px-3 py-2"
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Overlap Toggle */}
                    {formData?.company && (
                      <div className="mt-4 p-2 bg-green-50 border-l-4 border-yellow-500 rounded">
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
                            <RefreshCw size={14} className="text-gray-500" /> Fresh Loan (overlapping loan)
                          </label>
                        </div>

                        {overlapMode && activeLoans.length > 0 ? (
                          activeLoans.map((loan) => {
                            const isSelected = selectedLoanIds.includes(loan._id);
                            const ExpiryDate = loan?.endDate || null;
                            const totalLoan = loan?.totalLoan || 0;

                            return (
                              <div
                                key={loan._id}
                                onClick={() => {
                                  if (isSelected)
                                    setSelectedLoanIds(selectedLoanIds.filter((id) => id !== loan._id));
                                  else setSelectedLoanIds([...selectedLoanIds, loan._id]);
                                }}
                                className={`flex justify-between items-center p-3 border rounded-lg shadow-sm cursor-pointer transition ${isSelected ? "bg-green-100 border-green-400" : "bg-white hover:bg-gray-50"}`}
                              >
                                <div className="flex flex-col gap-1 text-xs sm:text-sm">
                                  <span className="font-semibold text-white px-2 py-1 rounded-md" style={bgStyle}>
                                    Issue Date: {moment(loan.issueDate).format("MMM DD, YYYY")}
                                  </span>
                                  <span>
                                    Terms: <b>{loan.loanTerms} Months</b><br />
                                    {moment(ExpiryDate).format("MMM DD, YYYY")}
                                  </span>
                                  <span className="text-green-700 font-bold text-sm">
                                    Total: ${(totalLoan || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); }} className="text-blue-600 hover:text-blue-800 flex-shrink-0" title="View Details">
                                  <Eye size={18} />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          overlapMode && <div className="text-sm text-gray-500 italic text-center py-4">No active loans available for this client.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Loan Calculation */}
                  {formData.company && companyStore?.companies?.length > 0 && (() => {
                    const selected = companyStore.companies.find(c => c._id === formData.company);
                    if (!selected) return null;
                    return (
                      <div className="flex max-w-3xl">
                        <LoanCalculation
                          baseAmount={formData.baseAmount}
                          fees={formData.fees}
                          interestType={formData.interestType}
                          company={{ name: selected.companyName, backgroundColor: selected.backgroundColor || "#555555" }}
                          issueDate={formData.issueDate}
                          monthlyRate={formData.monthlyRate}
                          loanTermMonths={formData.loanTerms}
                          loanTermsOptions={loanTermsOptions.map(opt => opt.value)}
                          includePreviousLoans={overlapMode}
                          previousLoanTotal={selectedPreviousLoanTotal}
                          onChange={(updated) => {
                            setFormData(prev => ({
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
                            setPreviousLoanAmount(updated.previousLoanTotal || 0);
                            setEndDate(moment(updated.endDate).format("MM-DD-YYYY"));
                          }}
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-4 bg-white sticky bottom-0 z-10 rounded-md">
                  <button onClick={() => { setModalOpen(false); onClose?.(); }} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Cancel</button>
                  <button onClick={() => handleSave(formData)} className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 flex items-center font-bold gap-1">
                    <Save size={16} /> {editingLoan ? "Update Loan" : "Create Loan"}
                  </button>
                </div>
              </div>
            </div>
          </LocalizationProvider>
        )}
          {/* View Loan Modal */}
        {viewLoan && (
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
              <div className="bg-white shadow-lg w-full max-w-2xl flex flex-col rounded-lg">
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b bg-white sticky top-0 z-10 rounded-md">
                  <h2 className="text-xl font-bold text-gray-800">View Loan Details</h2>
                  <button className="text-gray-500 hover:text-gray-800" onClick={() => setViewLoan(null)}>✕</button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <p><strong>Client:</strong> {clientStore.clients.find(c => c._id === viewLoan.client)?.fullName || "Unknown"}</p>
                  <p><strong>Company:</strong> {companyStore.companies.find(c => c._id === viewLoan.company)?.companyName || "Unknown"}</p>
                  <p><strong>Issue Date:</strong> {moment(viewLoan.issueDate).format("MMM DD, YYYY")}</p>
                  <p><strong>Loan Terms:</strong> {viewLoan.loanTerms} months</p>
                  <p><strong>Total Loan:</strong> ${viewLoan.totalLoan?.toLocaleString()}</p>
                  <p><strong>Status:</strong> {viewLoan.status}</p>
                  <p><strong>Check Number:</strong> {viewLoan.checkNumber || "N/A"}</p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 bg-white sticky bottom-0 z-10 rounded-md">
                  <button onClick={() => setViewLoan(null)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
                </div>
              </div>
            </div>
          </LocalizationProvider>
        )}
      </div>
    );
  }
);

export default Loans;
