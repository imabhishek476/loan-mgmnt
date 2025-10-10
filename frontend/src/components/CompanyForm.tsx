import{ useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Home, Percent, DollarSign, FileText } from "lucide-react";
import type { Company } from "../store/CompanyStore";
import FormModal from "./FormModal";
import type { FieldConfig } from "./FormModal";
import { Switch, FormGroup, FormControlLabel, Checkbox } from "@mui/material";

const loanTermOptions = [6, 12, 18, 24, 30, 36];

const companyFields: FieldConfig[] = [
  // { label: "Basic Information", key: "basicInformation", type: "section", icon: <Home size={18} /> },
  { label: "Company Name", key: "companyName", type: "text", required: true },
  // { label: "Company Code", key: "companyCode", type: "text", required: true },
  // { label: "Description", key: "description", type: "textarea", fullWidth: true, required: true },
  // { label: "Phone", key: "phone", type: "text", required: true },
  // { label: "Email", key: "email", type: "email", required: true },
  // { label: "Website", key: "website", type: "text", required: true },
  { label: "Active Company", key: "activeCompany", type: "toggle", required: true },

  { label: "Available Loan Terms", key: "loanTerms", type: "toggle", required: true },
  { label: "Color Code", key: "backgroundColor", type: "color", required: true },

  // { label: "Available Loan Terms", key: "availableLoanTerms", type: "section", icon: <FileText size={18} /> },
  // { label: "Address", key: "address", type: "textarea", fullWidth: true, required: true },
  { label: "Interest Rate Configuration", key: "interestRateConfiguration", type: "section", icon: <Percent size={18} /> },
  { label: "Interest Rate (%)", key: "interestRate", type: "number", min: 0, max: 100, required: true },
  {
    label: "Interest Type",
    key: "interestType",
    type: "select",
    options: [
      { label: "Compound", value: "compound" },
      { label: "Flat", value: "flat" },
    ],
    required: true,
  },

  { label: "Fee Structure", key: "feeStructure", type: "section", icon: <DollarSign size={18} /> },
  {
    label: "Payoff Settings",
    key: "payoffSettings",
    type: "section",
    icon: <DollarSign size={18} />,
    inlineToggle: { key: "allowEarlyPayoff", label: "Allow Early Payoff" },
  },
  { label: "Early Payoff Penalty (%)", key: "earlyPayoffPenalty", type: "number", min: 0, max: 100 },
  { label: "Early Payoff Discount (%)", key: "earlyPayoffDiscount", type: "number", min: 0, max: 100 },
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
    adminFee: data.fees?.administrativeFee?.value ?? 0,
    adminFeeType: data.fees?.administrativeFee?.type ?? "flat",
    applicationFee: data.fees?.applicationFee?.value ?? 0,
    applicationFeeType: data.fees?.applicationFee?.type ?? "flat",
    attorneyFee: data.fees?.attorneyReviewFee?.value ?? 0,
    attorneyFeeType: data.fees?.attorneyReviewFee?.type ?? "flat",
    brokerFee: data.fees?.brokerFee?.value ?? 0,
    brokerFeeType: data.fees?.brokerFee?.type ?? "flat",
    maintenanceFee: data.fees?.annualMaintenanceFee?.value ?? 0,
    maintenanceFeeType: data.fees?.annualMaintenanceFee?.type ?? "flat",
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
    loanTerms: data.loanTerms ?? [],
  };
}

function denormalizeCompany(data: any): Company {
  return {
    ...data,
    activeCompany: data.activeCompany ?? true,
    interestRate: {
      monthlyRate: Number(data.interestRate ?? 0),
      interestType: data.interestType ?? "flat",
    },
    fees: {
      administrativeFee: {
        value: Number(data.adminFee ?? 0),
        type: data.adminFeeType ?? "flat",
      },
      applicationFee: {
        value: Number(data.applicationFee ?? 0),
        type: data.applicationFeeType ?? "flat",
      },
      attorneyReviewFee: {
        value: Number(data.attorneyFee ?? 0),
        type: data.attorneyFeeType ?? "flat",
      },
      brokerFee: {
        value: Number(data.brokerFee ?? 0),
        type: data.brokerFeeType ?? "flat",
      },
      annualMaintenanceFee: {
        value: Number(data.maintenanceFee ?? 0),
        type: data.maintenanceFeeType ?? "flat",
      },
    },
    freshLoanRules: {
      enabled: data.enableFreshLoanRules ?? false,
      minMonthsBetweenLoans: Number(data.minimumMonthsBetween ?? 0),
      allowOverlappingLoans: data.allowOverlappingLoans ?? false,
      requireFullPayoff: data.requireFullPayoff ?? false,
    },
    payoffSettings: {
      allowEarlyPayoff: data.allowEarlyPayoff ?? false,
      earlyPayoffPenalty: Number(data.earlyPayoffPenalty ?? 0),
      earlyPayoffDiscount: Number(data.earlyPayoffDiscount ?? 0),
      gracePeriodDays: Number(data.gracePeriodDays ?? 0),
      lateFeeAmount: Number(data.lateFeeAmount ?? 0),
      lateFeeGraceDays: Number(data.lateFeeGraceDays ?? 0),
    },
    loanTerms: Array.isArray(data.loanTerms) ? data.loanTerms.map(Number) : [],
  };
}

const CompanyForm = observer(({ initialData, onSubmit, open, onClose }: CompanyFormProps) => {
  const [formData, setFormData] = useState<any>({
    activeCompany: true,
    loanTerms: [...loanTermOptions],
    enableFreshLoanRules: true,
    allowOverlappingLoans: true,
    requireFullPayoff: true,
    allowEarlyPayoff: false,
    earlyPayoffPenalty: 0,
    earlyPayoffDiscount: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev: Record<string, unknown>) => ({
        ...prev,
        ...normalizeCompany(initialData),
      }));
    }
  }, [initialData, open]);

  const handleSubmit = async (data:Record<string, unknown>) => {
    await onSubmit(denormalizeCompany(data));
  };

  const visibleFields = companyFields.filter((field) => {
    const earlyPayoffFields = ["earlyPayoffPenalty", "earlyPayoffDiscount"];
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
      submitButtonText={initialData ? "Update Company" : "Create Company"}
      fields={visibleFields}
      initialData={formData}
      onSubmit={handleSubmit}
      onFormDataChange={setFormData}
      renderToggle={(key, value, onChange) => (
        <Switch checked={!!value} onChange={(e) => onChange(key, e.target.checked)} color="success" />
      )}
      //@ts-ignore
      renderLoanTerms={(selectedTerms: number[], onChange: (terms : number[]) => void) => (
        <FormGroup row>
          {loanTermOptions.map((month) => (
            <FormControlLabel
              key={month}
              control={
                <Checkbox
                  checked={selectedTerms.includes(month)}
                  onChange={(e) => {
                    //@ts-ignore
                    const a = terms
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
