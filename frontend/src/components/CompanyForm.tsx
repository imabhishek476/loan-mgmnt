import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Home, Percent, DollarSign, FileText, Settings, Save } from "lucide-react";
import type { Company } from "../store/CompanyStore";
import FormModal, { FieldConfig } from "./FormModal";
import { Switch, FormGroup, FormControlLabel, Checkbox } from "@mui/material";

const loanTermOptions = [6, 12, 18, 24, 30, 36];

const companyFields: FieldConfig[] = [
  // Basic Info
  { label: "Basic Information", key: "basicInformation", type: "section", icon: <Home size={18} /> },
  { label: "Company Name", key: "companyName", type: "text", required: true },
  { label: "Company Code", key: "companyCode", type: "text", required: true },
  { label: "Description", key: "description", type: "textarea", fullWidth: true },
  { label: "Phone", key: "phone", type: "text" },
  { label: "Email", key: "email", type: "email" },
  { label: "Website", key: "website", type: "text" },
  { label: "Active Company", key: "activeCompany", type: "toggle" },
  { label: "Address", key: "address", type: "textarea", fullWidth: true },
  // Interest
  { label: "Interest Rate Configuration", key: "interestRateConfiguration", type: "section", icon: <Percent size={18} /> },
  { label: "Interest Rate (%)", key: "interestRate", type: "number" },
  {
    label: "Interest Type",
    key: "interestType",
    type: "select",
    options: [
      { label: "Compound", value: "compound" },
      { label: "Flat", value: "flat" },
    ],
  },
  // Loan Terms
  { label: "Available Loan Terms", key: "availableLoanTerms", type: "section", icon: <FileText size={18} /> },
  { label: "", key: "loanTerms", type: "toggle" },
  // Fees
  { label: "Fee Structure", key: "feeStructure", type: "section", icon: <DollarSign size={18} /> },
  { label: "Administrative Fee ($)", key: "adminFee", type: "number" },
  { label: "Application Fee ($)", key: "applicationFee", type: "number" },
  { label: "Attorney Fee ($)", key: "attorneyFee", type: "number" },
  { label: "Broker Fee ($)", key: "brokerFee", type: "number" },
  { label: "Maintenance Fee ($)", key: "maintenanceFee", type: "number" },
  // Loan Rules
  { label: "Fresh Loan Rules", key: "freshLoanRulesSection", type: "section", icon: <Settings size={18} /> },
  { label: "Enable Fresh Loan Rules", key: "enableFreshLoanRules", type: "toggle" },
  { label: "Allow Overlapping Loans", key: "allowOverlappingLoans", type: "toggle" },

  { label: "Minimum Months Between Loans", key: "minimumMonthsBetween", type: "number" },

  { label: "Require Full Payoff Before New Loan", key: "requireFullPayoff", type: "toggle" },
  // Payoff
  { label: "Payoff Settings", key: "payoffSettings", type: "section", icon: <DollarSign size={18} /> },
  { label: "Allow Early Payoff", key: "allowEarlyPayoff", type: "toggle" },
  { label: "Early Payoff Penalty (%)", key: "earlyPayoffPenalty", type: "number" },
  { label: "Early Payoff Discount (%)", key: "earlyPayoffDiscount", type: "number" },
  { label: "Grace Period (Days)", key: "gracePeriodDays", type: "number" },
  { label: "Late Fee Amount ($)", key: "lateFeeAmount", type: "number" },
  { label: "Late Fee Grace Days", key: "lateFeeGraceDays", type: "number" },
];

interface CompanyFormProps {
  initialData?: Company;
  onSubmit: (data: Company) => Promise<void>;
  open: boolean;
  onClose: () => void;
}

function normalizeCompany(data?: Company) {
  if (!data) return {};
  return {
    ...data,
    interestRate: data.interestRate?.monthlyRate ?? 0,
    interestType: data.interestRate?.interestType ?? "flat",

    adminFee: data.fees?.administrativeFee ?? 0,
    applicationFee: data.fees?.applicationFee ?? 0,
    attorneyFee: data.fees?.attorneyReviewFee ?? 0,
    brokerFee: data.fees?.brokerFee ?? 0,
    maintenanceFee: data.fees?.annualMaintenanceFee ?? 0,

    enableFreshLoanRules: data.freshLoanRules?.enabled ?? false,
    minimumMonthsBetween: data.freshLoanRules?.minMonthsBetweenLoans ?? 0,
    allowOverlappingLoans: data.freshLoanRules?.allowOverlappingLoans ?? false,
    requireFullPayoff: data.freshLoanRules?.requireFullPayoff ?? false,

    allowEarlyPayoff: data.payoffSettings?.allowEarlyPayoff ?? false,
    earlyPayoffPenalty: data.payoffSettings?.earlyPayoffPenalty ?? 0,
    earlyPayoffDiscount: data.payoffSettings?.earlyPayoffDiscount ?? 0,
    gracePeriodDays: data.payoffSettings?.gracePeriodDays ?? 0,
    lateFeeAmount: data.payoffSettings?.lateFeeAmount ?? 0,
    lateFeeGraceDays: data.payoffSettings?.lateFeeGraceDays ?? 0,
  };
}

function denormalizeCompany(data: any): Company {
  return {
    ...data,
    activeCompany: data.activeCompany ?? true,
    interestRate: {
      monthlyRate: data.interestRate,
      interestType: data.interestType,
    },
    fees: {
      administrativeFee: data.adminFee,
      applicationFee: data.applicationFee,
      attorneyReviewFee: data.attorneyFee,
      brokerFee: data.brokerFee,
      annualMaintenanceFee: data.maintenanceFee,
    },
    freshLoanRules: {
      enabled: data.enableFreshLoanRules,
      minMonthsBetweenLoans: data.minimumMonthsBetween,
      allowOverlappingLoans: data.allowOverlappingLoans,
      requireFullPayoff: data.requireFullPayoff,
    },
    payoffSettings: {
      allowEarlyPayoff: data.allowEarlyPayoff,
      earlyPayoffPenalty: data.earlyPayoffPenalty,
      earlyPayoffDiscount: data.earlyPayoffDiscount,
      gracePeriodDays: data.gracePeriodDays,
      lateFeeAmount: data.lateFeeAmount,
      lateFeeGraceDays: data.lateFeeGraceDays,
    },
  };
}

const CompanyForm = observer(({ initialData, onSubmit, open, onClose }: CompanyFormProps) => {
  const [formData, setFormData] = useState<any>({
    activeCompany: true,
    loanTerms: [...loanTermOptions],
    enableFreshLoanRules: true,
    allowOverlappingLoans: true,
    requireFullPayoff: true,
    allowEarlyPayoff: true,
    earlyPayoffPenalty: 0,
    earlyPayoffDiscount: 0,
    gracePeriodDays: 10,
    lateFeeAmount: 50,
    lateFeeGraceDays: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...normalizeCompany(initialData),
      }));
    }
  }, [initialData, open]);

  const handleSubmit = async (data: any) => {
    await onSubmit(denormalizeCompany(data));
  };

  const visibleFields = companyFields.filter((field) => {
    const freshLoanFields = [
      "minimumMonthsBetween",
      "allowOverlappingLoans",
      "requireFullPayoff",
    ];
    const earlyPayoffFields = [
      "earlyPayoffPenalty",
      "earlyPayoffDiscount",
      "gracePeriodDays",
      "lateFeeAmount",
      "lateFeeGraceDays",
    ];

    if (!formData.enableFreshLoanRules && freshLoanFields.includes(field.key)) {
      return false;
    }
    if (!formData.allowEarlyPayoff && earlyPayoffFields.includes(field.key)) {
      return false;
    }
    return true;
  });


  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Company" : "Add New Company"}
      submitButtonText={initialData ? "Update Company" : <>
        <Save size={16} className="inline mr-1" /> Create Company
      </>}
      fields={visibleFields}
      initialData={formData}
      onSubmit={handleSubmit}
      onFormDataChange={setFormData}
      renderToggle={(key, value, onChange) => (
        <Switch checked={!!value} onChange={(e) => onChange(key, e.target.checked)} color="success" />
      )}
      renderLoanTerms={(selectedTerms: number[], onChange: (terms: number[]) => void) => (
        <FormGroup row>
          {loanTermOptions.map((month) => (
            <FormControlLabel
              key={month}
              control={
                <Checkbox
                  checked={selectedTerms.includes(month)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...selectedTerms, month]
                      : selectedTerms.filter((m) => m !== month);
                    onChange(updated);
                  }}
                />
              }
              label={`${month} months`}
            />
          ))}
        </FormGroup>
      )}
    />
  );
});

export default CompanyForm;
