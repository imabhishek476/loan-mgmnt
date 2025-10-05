// src/views/loans/Loans.tsx
import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import Button from "@mui/material/Button";
import { Plus, Save, Wallet } from "lucide-react";
import FormModal, { FieldConfig } from "../../components/FormModal";
import { clientStore } from "../../store/ClientStore";
import { companyStore } from "../../store/CompanyStore";
import { loanStore } from "../../store/LoanStore";
import moment from "moment";
import { toast } from "react-toastify";
import LoanCalculation from "../loans/components/LoanCalculation";

const Loans = observer(() => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any | null>(null);
  const hasLoaded = useRef(false);

  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loanTermsOptions, setLoanTermsOptions] = useState<{ label: string; value: number }[]>([]);

  const [formData, setFormData] = useState<Record<string, any>>({
    issueDate: moment().format("MM-DD-YYYY"),
    baseAmount: 0,
    loanTerms: null,
    fees: {
      administrativeFee: { value: 0, type: "flat" },
      applicationFee: { value: 0, type: "flat" },
      attorneyReviewFee: { value: 0, type: "flat" },
      brokerFee: { value: 0, type: "flat" },
      annualMaintenanceFee: { value: 0, type: "flat" },
    },
    interestType: "flat",
    monthlyRate: 0,
    totalLoan: 0,
  });

  const getClientsCompanies = async () => {
    try {
      await companyStore.fetchCompany();
      await clientStore.fetchClients();
    } catch {
      toast.error("Failed to fetch companies and clients");
    }
  };

  useEffect(() => {
    if (!hasLoaded.current) {
      getClientsCompanies();
      hasLoaded.current = true;
    }
  }, []);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    const company = companyStore.companies.find(c => c._id === companyId);
    if (!company) return;

    const terms = company.loanTerms || [12];
    setLoanTermsOptions(terms.map(t => ({ label: `${t} months`, value: t })));

    const mapFee = (fee: any) => ({
      value: fee?.value ?? 0,
      type: fee?.type === "percentage" ? "percentage" : "flat",
    });

    setFormData(prev => ({
      ...prev,
      fees: {
        administrativeFee: mapFee(company.fees?.administrativeFee),
        applicationFee: mapFee(company.fees?.applicationFee),
        attorneyReviewFee: mapFee(company.fees?.attorneyReviewFee),
        brokerFee: mapFee(company.fees?.brokerFee),
        annualMaintenanceFee: mapFee(company.fees?.annualMaintenanceFee),
      },
      interestType: company.interestRate?.interestType || "flat",
      monthlyRate: company.interestRate?.monthlyRate || 0,
      loanTerms: terms[0],
    }));
  };

  const loanFields: FieldConfig[] = [
    {
      label: "Client",
      key: "client",
      type: "select",
      options: clientStore.clients.length
        ? clientStore.clients.map(c => ({ label: c.fullName, value: c._id }))
        : [{ label: "No clients available", value: "" }],
      required: true,
    },
    {
      label: "Company",
      key: "company",
      type: "select",
      options: companyStore.companies.length
        ? companyStore.companies.map(c => ({ label: c.companyName, value: c._id }))
        : [{ label: "No Companies available", value: "" }],
      onChange: handleCompanyChange,
      required: true,
    },
    { label: "Base Amount ($)", key: "baseAmount", type: "number", required: true },
    { label: "Loan Terms", key: "loanTerms", type: "select", options: loanTermsOptions, required: true },
    { label: "Issue Date", key: "issueDate", type: "date", required: true },
    { label: "Check Number", key: "checkNumber", type: "number", required: false },
  ];

  const handleSave = async (data: any) => {
    try {
      const payload = {
        ...data,
        baseAmount: formData.baseAmount,
        fees: formData.fees,
        interestType: formData.interestType,
        monthlyRate: formData.monthlyRate,
        loanTermMonths: formData.loanTerms,
        totalLoan: formData.totalLoan,
      };

      if (editingLoan) {
        await loanStore.updateLoan(editingLoan._id, payload);
        toast.success("Loan updated successfully");
      } else {
        await loanStore.createLoan(payload);
        toast.success("Loan created successfully");
      }

      setModalOpen(false);
      setEditingLoan(null);
    } catch (error) {
      toast.error("Failed to save loan");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-lg text-left transition-all duration-300">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-800 font-bold">Loans</h1>
          <p className="text-gray-600 text-base">Manage loan origination, fresh loans, and tracking</p>
        </div>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#145A32",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "14px",
            boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
            "&:hover": { backgroundColor: "#0f3f23" },
          }}
          startIcon={<Plus />}
          onClick={() => {
            setEditingLoan(null);
            setModalOpen(true);
            setFormData(prev => ({
              ...prev,
              issueDate: moment().format("MM-DD-YYYY"),
              loanTerms: loanTermsOptions[0]?.value || 12,
            }));
          }}
        >
          New Loan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <Wallet size={20} className="text-green-700" />
              Loans Portfolio <span className="text-gray-500">(0 Loans)</span>
            </h2>
          </div>
        </div>
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLoan(null);
        }}
        title={editingLoan ? "Edit Loan" : "Create New Loan"}
        fields={loanFields}
        initialData={editingLoan || { ...formData, issueDate: formData.issueDate }}
        onFormDataChange={(updated) => {
          setFormData(prev => ({ ...prev, ...updated }));
          if (updated.company && updated.company !== selectedCompany) handleCompanyChange(updated.company);
        }}
        submitButtonText={editingLoan ? "Update Loan" : <><Save size={16} className="inline mr-1" /> Create Loan</>}
        onSubmit={handleSave}
      >
        {formData.company && (() => {
          const selected = companyStore.companies.find(c => c._id === formData.company);
          if (!selected) return null;
          return (
            <div className="mt-4 rounded-lg border w-full">
              <LoanCalculation
                baseAmount={formData.baseAmount}
                fees={formData.fees}
                company={{
                  name: selected.companyName,
                  backgroundColor: selected.backgroundColor || "#555555",
                }}
                interestType={formData.interestType}
                monthlyRate={formData.monthlyRate}
                loanTermMonths={formData.loanTerms}
                loanTermsOptions={loanTermsOptions.map(opt => opt.value)}
                onChange={(updated) => setFormData(prev => ({ ...prev, ...updated }))}
              />
            </div>
          );
        })()}
      </FormModal>
    </div>
  );
});

export default Loans;