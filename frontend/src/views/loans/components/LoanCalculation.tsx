// src/views/loans/components/LoanCalculation.tsx
import React from "react";
import { Calculator } from "lucide-react";
import { Switch, FormControlLabel } from "@mui/material";

type Fee = {
  value: number;
  type: "flat" | "percentage";
};

type LoanCalculationProps = {
  baseAmount: number | string;
  fees: Record<string, Fee>;
  company?: {
    name?: string;
    backgroundColor?: string;
  };
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
    totalLoan: number;
  }) => void;
};

const parseNumberInput = (value: string): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const calculateLoan = (
  base: number | string,
  fees: Record<string, Fee>,
  type: "flat" | "compound",
  rate: number | string,
  term: number | string
) => {
  const num = (val: any): number => {
    if (typeof val === "string") return parseFloat(val) || 0;
    return typeof val === "number" && !isNaN(val) ? val : 0;
  };

  const baseNum = num(base);
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
    if (fee.type === "percentage") {
      return sum + (baseNum * value) / 100;
    } else {
      return sum + value;
    }
  }, 0);

  const subtotal = baseNum + feeTotal;

  let interest = 0;
  if (termNum > 0 && rateNum > 0) {
    const r = rateNum / 100;
    interest =
      type === "flat"
        ? subtotal * r * termNum
        : subtotal * (Math.pow(1 + r, termNum) - 1);
  }

  return {
    subtotal,
    interestAmount: interest,
    totalWithInterest: subtotal + interest,
  };
};

const LoanCalculation: React.FC<LoanCalculationProps> = ({
  baseAmount: baseProp,
  fees: feesProp,
  company,
  interestType: interestTypeProp,
  monthlyRate: rateProp,
  loanTermMonths: termProp,
  loanTermsOptions,
  onChange,
}) => {
  const bgStyle = company?.backgroundColor
    ? { backgroundColor: company.backgroundColor }
    : { backgroundColor: "#555555" };

  const [baseInput, setBaseInput] = React.useState<string>(baseProp?.toString() || "");
  const [rateInput, setRateInput] = React.useState<string>(rateProp?.toString() || "");
  const [fees, setFees] = React.useState<Record<string, Fee>>({ ...feesProp });
  const [interestType, setInterestType] = React.useState<"flat" | "compound">(interestTypeProp);
  const [loanTerm, setLoanTerm] = React.useState<number>(termProp || loanTermsOptions[0] || 12);

  React.useEffect(() => {
    setBaseInput(baseProp?.toString() || "");
    setRateInput(rateProp?.toString() || "");
    setFees({ ...feesProp });
    setInterestType(interestTypeProp);
    setLoanTerm(termProp || loanTermsOptions[0] || 12);
  }, [baseProp, feesProp, interestTypeProp, rateProp, termProp, loanTermsOptions]);

  const currentBase = baseInput === "" ? 0 : parseNumberInput(baseInput);
  const currentRate = rateInput === "" ? 0 : parseNumberInput(rateInput);

  const { subtotal, interestAmount, totalWithInterest } = calculateLoan(
    currentBase,
    fees,
    interestType,
    currentRate,
    loanTerm
  );

  const emitChange = (
    newBase: number,
    newFees: Record<string, Fee>,
    newType: "flat" | "compound",
    newRate: number,
    newTerm: number
  ) => {
    const result = calculateLoan(newBase, newFees, newType, newRate, newTerm);
    onChange({
      baseAmount: newBase,
      fees: newFees,
      interestType: newType,
      monthlyRate: newRate,
      loanTermMonths: newTerm,
      totalLoan: result.totalWithInterest,
    });
  };

  const handleBaseChange = (value: string) => {
    setBaseInput(value);
    emitChange(parseNumberInput(value), fees, interestType, currentRate, loanTerm);
  };

  const handleRateChange = (value: string) => {
    setRateInput(value);
    emitChange(currentBase, fees, interestType, parseNumberInput(value), loanTerm);
  };

  const handleFeeValueChange = (key: string, value: string) => {
    const num = parseNumberInput(value);
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

  const handleInterestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as "flat" | "compound";
    setInterestType(type);
    emitChange(currentBase, fees, type, currentRate, loanTerm);
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const term = parseInt(e.target.value, 10);
    if (isNaN(term)) return;
    setLoanTerm(term);
    emitChange(currentBase, fees, interestType, currentRate, term);
  };

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
          <label className="w-36 text-sm text-white">Interest Type</label>
          <select
            value={interestType}
            onChange={handleInterestChange}
            className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800"
          >
            <option value="flat">Flat Interest</option>
            <option value="compound">Compound Interest</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-36 text-sm text-white">Monthly Interest Rate (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={rateInput}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800"
            placeholder="0"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="w-36 text-sm text-white">Loan Terms <br />(No. of Months)</label>
          <select
            value={loanTerm}
            onChange={handleTermChange}
            className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800"
          >
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
          const isPercentage = fee.type === "percentage";
          return (
            <div key={item.key} className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-white font-medium">{item.label}</label>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPercentage}
                      onChange={() => handleFeeTypeToggle(item.key)}
                      size="small"
                    />
                  }
                  label={isPercentage ? "Percentage" : "Flat"}
                  labelPlacement="start"
                  sx={{
                    margin: 0,
                    color: "white",
                    fontSize: "0.75rem",
                    ".MuiFormControlLabel-label": { fontSize: "0.75rem" },
                    ".MuiSwitch-thumb": { bgcolor: "white" },
                    ".MuiSwitch-track": {
                      bgcolor: isPercentage ? "#4CAF50" : "#ccc",
                    },
                  }}
                />
              </div>
              <input
                type="number"
                min="0"
                step={isPercentage ? "0.01" : "any"}
                value={fee.value}
                onChange={(e) => handleFeeValueChange(item.key, e.target.value)}
                className="w-full px-2 py-1 border rounded-lg text-left bg-white text-gray-800"
                placeholder={isPercentage ? "0.00%" : "0.00"}
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
          <span>
            {interestType.charAt(0).toUpperCase() + interestType.slice(1)} Interest ({loanTerm} months):
          </span>
          <span className="text-red-600 bg-white px-5 text-gray-800">${interestAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between border-t border-b text-green bg-white rounded-lg pt-2 font-bold px-4 py-2 text-gray-800">
        <span>Total Loan Amount</span>
        <span>${totalWithInterest.toFixed(2)}</span>
      </div>

      <div className="mt-4">
        <h4 className="text-white font-semibold mb-2">Interest Across Loan Tenures</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {loanTermsOptions.map((term) => {
            const interestForTerm = calculateLoan(currentBase, fees, interestType, currentRate, term);
            const isSelected = term === loanTerm;
            return (
              <div
                key={term}
                className={`p-2 rounded-lg shadow-md cursor-pointer transition-all duration-200 ${isSelected
                    ? "bg-red-700 text-white transform scale-105"
                    : "bg-white text-gray-700 hover:shadow-lg"
                  }`}
                onClick={() => {
                  setLoanTerm(term);
                  emitChange(currentBase, fees, interestType, currentRate, term);
                }}
              >
                <div className="text-sm font-medium">Term: {term} months</div>
                <div className="text-sm font-bold mt-1">
                  Interest: ${interestForTerm.interestAmount.toFixed(2)}
                </div>
                <div className="text-sm mt-1">
                  Total: ${interestForTerm.totalWithInterest.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoanCalculation;