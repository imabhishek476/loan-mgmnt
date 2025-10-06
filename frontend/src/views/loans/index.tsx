// src/views/loans/Loans.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { Plus, Save, Wallet } from "lucide-react";
import Button from "@mui/material/Button";
import FormModal, { FieldConfig } from "../../components/FormModal";
import LoanCalculation from "./components/LoanCalculation";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import { loanStore } from "../../store/LoanStore";
import moment from "moment";
import LoanTable from "./components/LoanTable";

const Loans = observer(({
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

  const [search, setSearch] = useState("");
  const hasLoaded = useRef(false);

  const debouncedSearchRef = useRef(
    debounce((query: string) => setSearch(query), 300)
  );

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

  useEffect(() => {
    if (!hasLoaded.current) {
      loadInitialData();
      hasLoaded.current = true;
    }
  }, []);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    const company = companyStore.companies.find((c) => c._id === companyId);
    if (!company) return;

    const terms = company.loanTerms && company.loanTerms.length > 0 ? company.loanTerms : [12];
    setLoanTermsOptions(terms.map((t) => ({ label: `${t} months`, value: t })));

    const defaultTerm = terms.includes(24) ? 24 : terms[0] || 12;

    const mapFee = (fee: any) => ({
      value: fee?.value || 0,
      type: fee?.type === "percentage" ? "percentage" : "flat",
    });

    setFormData((prev) => ({
      ...prev,
      company: companyId,
      fees: {
        administrativeFee: mapFee(company.fees?.administrativeFee),
        applicationFee: mapFee(company.fees?.applicationFee),
        attorneyReviewFee: mapFee(company.fees?.attorneyReviewFee),
        brokerFee: mapFee(company.fees?.brokerFee),
        annualMaintenanceFee: mapFee(company.fees?.annualMaintenanceFee),
      },
      interestType: company.interestRate?.interestType || "flat",
      monthlyRate: company.interestRate?.monthlyRate || 0,
      loanTerms: defaultTerm,
      status: "Fresh Loan Issued",

    }));
  };

  const loanFields: FieldConfig[] = [
    {
      label: "Client",
      key: "client",
      type: "select",
      options: clientStore.clients.map(c => ({ label: c.fullName, value: c._id })),
      required: true,
      disabled: fromClientPage,
    },
    {
      label: "Company",
      key: "company",
      type: "select",
      options: companyStore.companies.map(c => ({ label: c.companyName, value: c._id })),
      onChange: handleCompanyChange,
      required: true,
    },
    // { label: "Base Amount ($)", key: "baseAmount", type: "number", required: true },
    {
      label: "Loan Terms",
      key: "loanTerms",
      type: "select",
      options: loanTermsOptions,
      required: true,
    },
    { label: "Issue Date", key: "issueDate", type: "date", required: true },
    { label: "Check Number", key: "checkNumber", type: "number" },
  ];

  const handleSave = async (data: any) => {
    const payload = {
      ...data,
      baseAmount: formData.subtotal,
      checkNumber: formData.checkNumber || null,
      fees: formData.fees,
      interestType: formData.interestType,
      monthlyRate: formData.monthlyRate,
      loanTerms: formData.loanTerms,
      totalLoan: formData.totalLoan,
      status: "Fresh Loan Issued",

    };

    try {
      if (editingLoan) {
        await loanStore.updateLoan(editingLoan._id, payload);
        toast.success("Loan updated successfully");
      } else {
        await loanStore.createLoan(payload);
        toast.success("Loan created successfully");
      }
      await loanStore.fetchLoans();
      setModalOpen(false);
      setEditingLoan(null);
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
  useEffect(() => {
    if (defaultClient) {
      setFormData((prev) => ({
        ...prev,
        client: defaultClient._id,
      }));
      setModalOpen(true);
    }
  }, [defaultClient]);
  return (
    <div className="flex flex-col bg-white rounded-lg text-left">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={20} /> Loans ({loanStore.loans.length})
          </h1>
          <p className="text-gray-600 text-base">Manage loan origination, fresh loans, and tracking</p>
        </div>
        <Button
          variant="contained"
          startIcon={<Plus />}
          sx={{ backgroundColor: "#145A32", "&:hover": { backgroundColor: "#0f3f23" }, textTransform: "none", fontWeight: 600, borderRadius: 1, px: 3, py: 1 }}
          onClick={() => { setEditingLoan(null); setModalOpen(true); setFormData(getInitialFormData()); }}
        >
          New Loan
        </Button>
      </div>


      {showTable && (
        <LoanTable
          onEdit={(loan) => {
            setEditingLoan(loan);
            setFormData(loan);
            setModalOpen(true);
          }}
          onDelete={(id) => {
            handleDelete(id);
          }}
        />
      )}

      {/* Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (onClose) onClose();
        }}
        title={editingLoan ? "Edit Loan" : "Create New Loan"}
        fields={loanFields}
        initialData={editingLoan || { ...formData }}
        onFormDataChange={(updated) => {
          setFormData((prev) => ({ ...prev, ...updated }));
          if (updated.company && updated.company !== selectedCompany) handleCompanyChange(updated.company);
        }}
        submitButtonText={editingLoan ? "Update Loan" : <><Save size={16} className="inline mr-1" /> Create Loan</>}
        onSubmit={handleSave}
      >
        {formData.company && companyStore.companies.length > 0 && (() => {
          const selected = companyStore.companies.find(c => c._id === formData.company);
          if (!selected) return null;
          return (
            <div className="mt-4 rounded-lg border p-3 w-full">
              <LoanCalculation
                baseAmount={formData.baseAmount || 0}
                fees={formData.fees}
                interestType={formData.interestType}
                company={{ name: selected.companyName, backgroundColor: selected.backgroundColor || "#555555" }}
                monthlyRate={formData.monthlyRate}
                loanTermMonths={formData.loanTerms}
                loanTermsOptions={loanTermsOptions.map(opt => opt.value)}
                onChange={(updated) =>
                  setFormData((prev) => ({
                    ...prev,
                    baseAmount: updated.baseAmount,
                    subtotal: updated.subtotal,
                    fees: updated.fees,
                    interestType: updated.interestType,
                    monthlyRate: updated.monthlyRate,
                    loanTerms: updated.loanTermMonths,
                    totalLoan: updated.totalLoan,
                  }))
                }
              />
            </div>
          );
        })()}
      </FormModal>
    </div>
  );
});

export default Loans;
