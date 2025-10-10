import React from "react";
import { Calculator } from "lucide-react";

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
  issueDate?: string;
  includePreviousLoans?: boolean;
  previousLoanTotal?: number;
  interestType: "flat" | "compound";
  monthlyRate: number;
  loanTermMonths: number;
  loanTermsOptions: number[];
  endDate?: string;

  onChange: (updated: {
    baseAmount: number;
    fees: Record<string, Fee>;
    interestType: "flat" | "compound";
    monthlyRate: number;
    loanTermMonths: number;
    totalLoan: number;
    subtotal: number;
    previousLoanTotal?: number;
    startDate?: string;
    endDate?: string;
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
  const num = (val: any): number => (typeof val === "string" ? parseFloat(val) || 0 : val || 0);
  const baseNum = num(base);
  if (baseNum <= 0) return { subtotal: 0, interestAmount: 0, totalWithInterest: 0 };

  const rateNum = num(rate);
  const termNum = Math.max(0, Math.floor(num(term)));

  const feeKeys = ["administrativeFee", "applicationFee", "attorneyReviewFee", "brokerFee", "annualMaintenanceFee"];
  const feeTotal = feeKeys.reduce((sum, key) => {
    const fee = fees[key];
    if (!fee) return sum;
    const value = num(fee.value);
    return fee.type === "percentage" ? sum + (baseNum * value) / 100 : sum + value;
  }, 0);

  const subtotal = baseNum + feeTotal;
  const interest =
    termNum > 0 && rateNum > 0
      ? type === "flat"
        ? subtotal * (rateNum / 100) * termNum
        : subtotal * (Math.pow(1 + rateNum / 100, termNum) - 1)
      : 0;

  return { subtotal, interestAmount: interest, totalWithInterest: subtotal + interest };
};

const LoanCalculation: React.FC<LoanCalculationProps> = ({
  baseAmount: baseProp,
  fees: feesProp,
  company,
  interestType: interestTypeProp,
  monthlyRate: rateProp,
  loanTermMonths: termProp,
  loanTermsOptions,
  includePreviousLoans = false,
  previousLoanTotal = 0,
  endDate,
  onChange,
  issueDate,
}) => {
  const bgStyle = { backgroundColor: company?.backgroundColor || "#555555" };

  const [baseInput, setBaseInput] = React.useState(baseProp?.toString() || "");
  const [rateInput, setRateInput] = React.useState(rateProp?.toString() || "");
  const [fees, setFees] = React.useState<Record<string, Fee>>({ ...feesProp });
  const [interestType, setInterestType] = React.useState<"flat" | "compound">(interestTypeProp);

  const defaultTerm = loanTermsOptions.includes(24) ? 24 : loanTermsOptions[0] || 12;
  const [loanTerm, setLoanTerm] = React.useState<number>(termProp || defaultTerm);

  React.useEffect(() => {
    setBaseInput(baseProp?.toString() || "");
    setRateInput(rateProp?.toString() || "");
    setFees({ ...feesProp });
    setInterestType(interestTypeProp);
  }, [baseProp, feesProp, interestTypeProp, rateProp]);

  const currentBase = parseNumberInput(baseInput);
  const currentRate = parseNumberInput(rateInput);

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

    const start = issueDate ? new Date(issueDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start);
    if (!endDate) end.setMonth(end.getMonth() + newTerm);
    onChange({
      baseAmount: newBase,
      fees: newFees,
      interestType: newType,
      monthlyRate: newRate,
      loanTermMonths: newTerm,
      subtotal: result.subtotal,
      totalLoan: result.totalWithInterest + (includePreviousLoans ? previousLoanTotal : 0),
      previousLoanTotal: includePreviousLoans ? previousLoanTotal : 0,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
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
    let num = parseNumberInput(value);
    if (fees[key].type === "percentage") num = Math.min(Math.max(num, 0), 100);
    const newFees = { ...fees, [key]: { ...fees[key], value: num } };
    setFees(newFees);
    emitChange(currentBase, newFees, interestType, currentRate, loanTerm);
  };

  const handleFeeTypeToggle = (key: string) => {
    const newFees = { ...fees, [key]: { ...fees[key], type: fees[key].type === "percentage" ? "flat" : "percentage" } };
    setFees(newFees);
    emitChange(currentBase, newFees, interestType, currentRate, loanTerm);
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as "flat" | "compound";
    setInterestType(type);
    emitChange(currentBase, fees, type, currentRate, loanTerm);
  };

  const feeItems = [
    { key: "applicationFee", label: "Application Fee" },
    { key: "brokerFee", label: "Broker Fee" },
    { key: "administrativeFee", label: "Administrative Fee" },
    { key: "attorneyReviewFee", label: "Attorney Review Fee" },
    { key: "annualMaintenanceFee", label: "Annual Maintenance Fee" },
  ];

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",   // 👈 gives "Oct"
    day: "2-digit",   // 👈 gives "15"
    year: "numeric",  // 👈 gives "2026"
  });

  // Calculate start and end date for display
  const start = issueDate ? new Date(issueDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start);
  if (!endDate) end.setMonth(end.getMonth() + loanTerm);

  return (
    <div className="rounded-xl shadow-sm px-0" style={bgStyle}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
        <Calculator className="w-5 h-5 text-white" />
        <h3 className="text-sm font-semibold text-white flex flex-col">
          Loan Calculation {company?.name ? `- ${company.name}` : ""}
          {/* <span className="text-sm mt-1 font-normal">
            Total Loan Amount:{" "}
            <span className="font-bold text-green-600 bg-white px-5 rounded-md ml-2">
              ${(totalWithInterest + (includePreviousLoans ? previousLoanTotal : 0)).toFixed(2)}
            </span>
          </span> */}
        </h3>
      </div>

      {/* Base, Interest, Rate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 px-2">
        <div className="flex flex-col">
          <label className="text-xs text-white mb-1">Base Amount</label>
          <input
            type="number"
            min="0"
            step="any"
            value={baseInput}
            onChange={(e) => handleBaseChange(e.target.value)}
            className="w-full px-2 h-8 py-2 border rounded-lg bg-white text-gray-800"
            placeholder="0"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-white mb-1">Interest Type</label>
          <select
            value={interestType}
            onChange={handleInterestChange}
            className="w-full h-8 px-2 border rounded-lg text-gray-800"
          >
            <option value="flat">Flat Interest</option>
            <option value="compound">Compound Interest</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-white mb-1">Monthly Interest (%)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={rateInput}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full h-8 px-2 py-2 border rounded-lg bg-white text-gray-800"
            placeholder="0"
          />
        </div>
      </div>

      {/* Fees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-0 px-2">
        {feeItems.map((item) => {
          const fee = fees[item.key];
          if (!fee) return null;
          const isPercentage = fee.type === "percentage";
          const displayValue = fee.value === 0 ? "" : fee.value;
          const contribution = isPercentage ? (currentBase * fee.value) / 100 : fee.value;

          return (
            <div key={item.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{item.label}</span>
                  {/* <label className="relative inline-flex items-center no-wrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPercentage}
                      onChange={() => handleFeeTypeToggle(item.key)}
                      className="sr-only w-20"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isPercentage ? "translate-x-5" : ""
                        }`}
                    ></div>
                  </label> */}
                </div>
                <span className="text-sm font-semibold text-white pr-16">
                  +${contribution.toFixed(2)}
                </span>
              </div>
              <div className="relative flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step={isPercentage ? "0.01" : "any"}
                  value={displayValue}
                  onChange={(e) => handleFeeValueChange(item.key, e.target.value)}
                  className="w-full h-8 px-3 py-2 border rounded-md bg-white text-gray-800  no-spinner"
                  placeholder="0.00"
                />
                <span className="absolute right-[60px] top-1/2 transform -translate-y-1/2 text-red-400 font-semibold">
                  {isPercentage ? "%" : "$"}
                </span>
                  <label className="relative inline-flex items-center no-wrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPercentage}
                      onChange={() => handleFeeTypeToggle(item.key)}
                      className="sr-only w-20"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors"></div>
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isPercentage ? "translate-x-5" : ""
                        }`}
                    ></div>
                  </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="text-sm text-white mb-0 font-semibold px-2">
        {/* <div className="flex justify-between mr-2">
          <span>Total (Base + Fees):</span>
          <span>${subtotal.toFixed(2)}</span>
        </div> */}
        <div className="flex justify-between">
          <span> Total Loan Amount:</span>
          <span>${(totalWithInterest + (includePreviousLoans ? previousLoanTotal : 0)).toFixed(2)}</span>
        </div>
     
        {includePreviousLoans && previousLoanTotal > 0 && (
          <div className="flex justify-between text-yellow-300">
            <span>Previous Loan Amount Carry Forward:</span>
            <span>${previousLoanTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Loan Term Slider */}
      <div className="mt-2 relative  max-w-full ">
        <label className="text-xs font-semibold text-white mb-2 block px-2">
          Select Loan Term (<span className="font-bold">{loanTerm}</span> Months)
        </label>

        <div className="flex justify-between px-2">
          {loanTermsOptions.map((term) => (
            <span
              key={term}
              className={`text-xs font-semibold ${term === loanTerm ? "text-white" : "text-white"}`}
            >
              {term}
            </span>
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={loanTermsOptions.length - 1}
          step={1}
          value={loanTermsOptions.indexOf(loanTerm)}
          onChange={(e) => {
            const selectedIndex = parseInt(e.target.value);
            const selectedTerm = loanTermsOptions[selectedIndex];
            setLoanTerm(selectedTerm);
            emitChange(currentBase, fees, interestType, currentRate, selectedTerm);
          }}
          className="w-full accent-white cursor-pointer px-2"
        />
 <div className="px-2 py-2">
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
    {loanTermsOptions.map((term) => {
      const termResult = calculateLoan(currentBase, fees, interestType, currentRate, term);
      const isSelected = term === loanTerm;

      return (
        <div
          key={term}
          className={`group px-2 py-3 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer
            ${isSelected
              ? "bg-red-700 border-red-800 text-white shadow-lg scale-105"
              : "bg-white border-gray-200 text-gray-700 hover:border-red-400 hover:shadow-md"
            }`}
          onClick={() => {
            setLoanTerm(term);
            emitChange(currentBase, fees, interestType, currentRate, term);
          }}
        >
          <div className="text-base font-semibold mb-0  transition-colors duration-200">
            {term} months
          </div>

          <div className={`text-sm font-medium mb-1 ${isSelected ? "text-yellow-300" : "text-gray-700"}`}>
            Interest: ${termResult.interestAmount.toFixed(2)}
          </div>

          <div className={`text-xs ${isSelected ? "text-white" : "text-gray-700"}`}>
           Date: {formatDate(end)}
          </div>
        </div>
      );
    })}
  </div>
</div>

      </div>
    </div>
  );
};

export default LoanCalculation;
