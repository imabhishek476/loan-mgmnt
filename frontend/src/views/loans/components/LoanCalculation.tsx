import React from "react";
import { Calculator } from "lucide-react";

export type Fee = {
  value: number;
  type: "flat" | "percentage";
};

type LoanCalculationProps = {
  baseAmount: number;
  fees: Record<string, Fee>;
  company?: { name?: string; backgroundColor?: string };
  interestType: "flat" | "compound";
  monthlyRate: number;
  loanTermMonths: number;
  loanTermsOptions: number[];
  onChange: (updated: {
    baseAmount: number;
    fees: Record<string, Fee>;
    interestType: "flat" | "compound";
    monthlyRate: number;
    loanTermMonths: number;
    subtotal: number;
    totalLoan: number;
  }) => void;
};

const parseNumber = (val: string | number) => (typeof val === "string" ? parseFloat(val) || 0 : val || 0);

const calculateLoan = (
  base: number,
  fees: Record<string, Fee>,
  interestType: "flat" | "compound",
  rate: number,
  term: number
) => {
  const feeTotal = Object.values(fees).reduce((sum, fee) => {
    return sum + (fee.type === "percentage" ? (base * fee.value) / 100 : fee.value);
  }, 0);

  const subtotal = base + feeTotal;

  let interest = 0;
  if (rate > 0 && term > 0) {
    const r = rate / 100;
    interest = interestType === "flat" ? subtotal * r * term : subtotal * (Math.pow(1 + r, term) - 1);
  }

  return { subtotal, interestAmount: interest, totalWithInterest: subtotal + interest };
};

const LoanCalculation: React.FC<LoanCalculationProps> = ({
  baseAmount,
  fees: feesProp,
  company,
  interestType: interestTypeProp,
  monthlyRate,
  loanTermMonths,
  loanTermsOptions,
  onChange,
}) => {
  const [baseInput, setBaseInput] = React.useState(baseAmount.toString());
  const [fees, setFees] = React.useState<Record<string, Fee>>({ ...feesProp });
  const [interestType, setInterestType] = React.useState<"flat" | "compound">(interestTypeProp);
  const [loanTerm, setLoanTerm] = React.useState(loanTermMonths);

  React.useEffect(() => {
    setBaseInput(baseAmount.toString());
    setFees({ ...feesProp });
    setInterestType(interestTypeProp);
    setLoanTerm(loanTermMonths);
  }, [baseAmount, feesProp, interestTypeProp, loanTermMonths]);

  const currentBase = parseNumber(baseInput);
  const currentRate = parseNumber(monthlyRate);

  const { subtotal, interestAmount, totalWithInterest } = calculateLoan(
    currentBase,
    fees,
    interestType,
    currentRate,
    loanTerm
  );

  const emitChange = (newBase: number, newFees: Record<string, Fee>, newInterestType: "flat" | "compound", newRate: number, newTerm: number) => {
    const { subtotal, totalWithInterest } = calculateLoan(newBase, newFees, newInterestType, newRate, newTerm);
    onChange({ baseAmount: newBase, fees: newFees, interestType: newInterestType, monthlyRate: newRate, loanTermMonths: newTerm, subtotal, totalLoan: totalWithInterest });
  };

  const handleBaseChange = (value: string) => {
    setBaseInput(value);
    emitChange(parseNumber(value), fees, interestType, currentRate, loanTerm);
  };

  const handleFeeChange = (key: string, value: string) => {
    const num = parseNumber(value);
    const newFees = { ...fees, [key]: { ...fees[key], value: num } };
    setFees(newFees);
    emitChange(currentBase, newFees, interestType, currentRate, loanTerm);
  };

  const handleFeeTypeToggle = (key: string) => {
    const newType = fees[key].type === "percentage" ? "flat" : "percentage";
    const newFees = { ...fees, [key]: { ...fees[key], type: newType } };
    setFees(newFees);
    emitChange(currentBase, newFees, interestType, currentRate, loanTerm);
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const term = parseInt(e.target.value, 10) || 0;
    setLoanTerm(term);
    emitChange(currentBase, fees, interestType, currentRate, term);
  };

  const bgStyle = { backgroundColor: company?.backgroundColor || "#555555" };
  const feeItems = [
    { key: "applicationFee", label: "Application Fee" },
    { key: "brokerFee", label: "Broker Fee" },
    { key: "administrativeFee", label: "Administrative Fee" },
    { key: "attorneyReviewFee", label: "Attorney Review Fee" },
    { key: "annualMaintenanceFee", label: "Annual Maintenance Fee" },
  ];

  return (
    <div className="rounded-xl shadow-sm p-4 w-full" style={bgStyle}>
      <div className="flex items-center rounded-lg gap-2 px-4 py-2 mb-3">
        <Calculator className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white">
          Loan Calculation {company?.name ? `- ${company.name}` : ""}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <label className="w-36 text-sm text-white">Base Amount</label>
          <input
            type="number"
            min="0"
            step="any"
            value={baseInput}
            onChange={(e) => handleBaseChange(e.target.value)}
            className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800"
            placeholder="0"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="w-36 text-sm text-white">Loan Terms</label>
          <select value={loanTerm} onChange={handleTermChange} className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800">
            {loanTermsOptions.map((term) => (
              <option key={term} value={term}>
                {term} months
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        {feeItems.map((item) => {
          const fee = fees[item.key];
          return (
            <div key={item.key} className="flex flex-col">
              <div className="flex justify-left items-center mb-1">
                <span className="text-sm text-white font-medium">{item.label}</span>
                <span className="ml-2 text-lg font-bold text-green-300">{fee.type === "percentage" ? "%" : "$"}</span>
              </div>
              <input
                type="number"
                min="0"
                step={fee.type === "percentage" ? 0.01 : "any"}
                value={fee.value || ""}
                onChange={(e) => handleFeeChange(item.key, e.target.value)}
                className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800 text-lg"
              />
            </div>
          );
        })}
      </div>

      <div className="text-sm text-white space-y-1 mb-3 font-semibold">
        <div className="flex justify-between">
          <span>Subtotal (Base + Fees):</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>{interestType.charAt(0).toUpperCase() + interestType.slice(1)} Interest ({loanTerm} months):</span>
          <span className="text-red-600 bg-white px-5 text-gray-800">${interestAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between border-t border-b text-green bg-white rounded-lg pt-2 font-bold px-4 py-2 text-gray-800">
        <span>Total Loan Amount</span>
        <span>${totalWithInterest.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default LoanCalculation;
