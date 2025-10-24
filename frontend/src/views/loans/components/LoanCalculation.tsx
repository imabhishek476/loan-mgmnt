import React, { useEffect, useState } from "react";
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
    loanTerms?: number[];
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
  term: number | string,
  previousLoanTotal: number = 0
) => {
  const num = (val: any): number =>
    typeof val === "string" ? parseFloat(val) || 0 : val || 0;

  const baseNum = num(base) + num(previousLoanTotal); // include previous loan
  if (baseNum <= 0)
    return { subtotal: 0, interestAmount: 0, totalWithInterest: 0 };

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
    return fee.type === "percentage"
      ? sum + (baseNum * value) / 100
      : sum + value;
  }, 0);

  const subtotal = baseNum + feeTotal;
  const interest =
    termNum > 0 && rateNum > 0
      ? type === "flat"
        ? subtotal * (rateNum / 100) * termNum
        : subtotal * (Math.pow(1 + rateNum / 100, termNum) - 1)
      : 0;

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
  // loanTermMonths: termProp,
  // loanTermsOptions,
  includePreviousLoans = false,
  previousLoanTotal = 0,
  endDate,
  onChange,
  issueDate,
}) => {
  const bgStyle = { backgroundColor: company?.backgroundColor || "#555555" };

  const [baseInput, setBaseInput] = useState(baseProp?.toString() || "");
  const [rateInput, setRateInput] = useState(rateProp?.toString() || "");
  const [fees, setFees] = useState<Record<string, Fee>>({ ...feesProp });
  const [interestType, setInterestType] = useState<"flat" | "compound">(
    interestTypeProp
  );
  const defaultTermSet = React.useRef<{ [companyName: string]: boolean }>({});
  const [loanTerm, setLoanTerm] = useState<number>(24);
  const ALL_LOAN_TERMS = [6, 12, 18, 24, 30, 36, 48];

  const currentBase = parseNumberInput(baseInput);
  const currentRate = parseNumberInput(rateInput);

  React.useEffect(() => {
    setBaseInput(baseProp?.toString() || "");
    setRateInput(rateProp?.toString() || "");
    setFees({ ...feesProp });
    setInterestType(interestTypeProp);
  }, [baseProp, feesProp, interestTypeProp, rateProp]);

  //@ts-ignore
  const { subtotal, interestAmount, totalWithInterest } = calculateLoan(
    currentBase,
    fees,
    interestType,
    currentRate,
    loanTerm,
    includePreviousLoans ? previousLoanTotal : 0
  );

  const emitChange = (
    newBase: number,
    newFees: Record<string, Fee>,
    newType: "flat" | "compound",
    newRate: number,
    newTerm: number
  ) => {
    const result = calculateLoan(
      newBase,
      newFees,
      newType,
      newRate,
      newTerm,
      includePreviousLoans ? previousLoanTotal : 0
    );

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
      totalLoan: result.totalWithInterest,
      previousLoanTotal: includePreviousLoans ? previousLoanTotal : 0,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  };
useEffect(() => {
  const defaultTerm = company?.loanTerms?.at(-1) || 24;
  if (!company || !company.loanTerms?.length) return;
  setLoanTerm(defaultTerm);
  emitChange(parseNumberInput(baseInput), fees, interestType, parseNumberInput(rateInput), defaultTerm);
  //@ts-ignore
  defaultTermSet.current[company.name || "Claim Advance"] = defaultTerm;
}, [company?.name, company?.loanTerms]);



  const handleBaseChange = (value: string) => {
    setBaseInput(value);
    emitChange(
      parseNumberInput(value),
      fees,
      interestType,
      currentRate,
      loanTerm
    );
  };

  const handleRateChange = (value: string) => {
    setRateInput(value);
    emitChange(
      currentBase,
      fees,
      interestType,
      parseNumberInput(value),
      loanTerm
    );
  };

  const handleFeeValueChange = (key: string, value: string) => {
    let num = parseNumberInput(value);
    if (fees[key].type === "percentage") num = Math.max(num, 0);
    const newFees = { ...fees, [key]: { ...fees[key], value: num } };
    setFees(newFees);
    emitChange(currentBase, newFees, interestType, currentRate, loanTerm);
  };

  const handleFeeTypeToggle = (key: string) => {
    const newFees = {
      ...fees,
      [key]: {
        ...fees[key],
        type: fees[key].type === "percentage" ? "flat" : "percentage",
      },
    };
    //@ts-ignore
    setFees(newFees);
    //@ts-ignore
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

  const start = issueDate ? new Date(issueDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start);
  if (!endDate) end.setMonth(end.getMonth() + loanTerm);

  return (
    <div className="rounded-xl shadow-sm px-0 min-w-0" style={bgStyle}>
      {" "}
      {/* Header */}
      <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
        {/* <Calculator className="w-5 h-5 text-white" /> */}
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
          <label className="text-sm text-white mb-1 font-medium">
            Base Amount
          </label>
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
          <label className="text-sm text-white mb-1 font-medium">
            Interest Type
          </label>
          <select
            value={interestType}
            onChange={handleInterestChange}
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
            value={rateInput}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full h-8 px-2 py-2 border rounded-lg bg-white text-gray-800"
            placeholder="0"
          />
        </div>
      </div>
      {/* Fees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-0 px-2">
        {feeItems.map((item) => {
          const fee = fees[item.key];
          if (!fee) return null;
          const isPercentage = fee.type === "percentage";
          const displayValue =
            fee.value === null || fee.value === undefined ? "" : fee.value;
          const contribution = isPercentage
            ? (currentBase * fee.value) / 100
            : fee.value;

          return (
            <div key={item.key} className="flex flex-col gap-2 pr-3 ">
              <div className="flex items-center justify-between w-2/2">
                <span className="text-sm text-white font-medium whitespace-nowrap">
                  {item.label}
                </span>
                <span className="text-md font-semibold text-green-700 bg-white  px-1 py-0 rounded-md shadow-md">
                  +${contribution.toFixed(2)}
                </span>
              </div>
              <div className="relative flex items-center  gap-2 w-2/2">
                <input
                  type="text"
                  inputMode="decimal"
                  min="0"
                  step={isPercentage ? "0.01" : "any"}
                  value={displayValue}
                  onChange={(e) =>
                    handleFeeValueChange(item.key, e.target.value)
                  }
                  className=" w-full h-8 px-3 py-2 border rounded-md bg-white text-gray-800 no-spinner"
                  placeholder={isPercentage ? "0.00 %" : "0.00 $"}
                />
                <span className="absolute right-[70px] top-1/2 transform -translate-y-1/2 text-red-400 font-semibold">
                  {isPercentage ? "%" : "$"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPercentage}
                    onChange={() => handleFeeTypeToggle(item.key)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 rounded-full peer-checked:bg-gray-400 transition-colors relative">
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ${
                        isPercentage ? "translate-x-7" : ""
                      }`}
                    >
                      {isPercentage ? (
                        <span className="text-sm font-bold text-gray-700">
                          %
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-gray-700">
                          $
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-sm text-white mt-2 font-semibold px-2">
        <div className="flex justify-between mr-2">
          {/* <span>Total (Base + Fees):</span>
          <span>${subtotal.toFixed(2)}</span> */}
        </div>
        {includePreviousLoans && previousLoanTotal > 0 && (
          <div className="flex justify-between text-yellow-300">
            <span>Previous Loan Amount Carry Forward:</span>
            <span>${previousLoanTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex   justify-between ">
          <span>Loan Amount :</span>
          <span className="text-md text-green-700 px-2 rounded-md text-md bg-white">
            ${subtotal.toFixed(2)}
          </span>
        </div>
      </div>
      {/* Loan Term Slider */}
      <div className="mt-2 relative max-w-full">
        <label className="text-sm font-semibold text-white mb-2 block px-2">
          Select Loan Term (<span className="font-bold">{loanTerm}</span>{" "}
          Months)
        </label>

        <div className="flex justify-between px-2">
          {ALL_LOAN_TERMS.map((term) => (
            <span
              key={term}
              className={`text-sm font-semibold ${
                term === loanTerm ? "text-yellow-300 font-bold" : "text-white"
              }`}
            >
              {term}
            </span>
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={ALL_LOAN_TERMS.length - 1}
          step={1}
          value={Math.max(0, ALL_LOAN_TERMS.indexOf(loanTerm))}
          onChange={(e) => {
            const selectedIndex = parseInt(e.target.value, 10);
            const selectedTerm =
              ALL_LOAN_TERMS[selectedIndex] || ALL_LOAN_TERMS[0];
            setLoanTerm(selectedTerm);
            emitChange(
              currentBase,
              fees,
              interestType,
              currentRate,
              selectedTerm
            );
          }}
          className="w-full accent-white cursor-pointer px-2"
        />
        <div className="px-2 py-2">
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex space-x-2 min-w-max">
              {ALL_LOAN_TERMS.map((term) => {
                const termResult = calculateLoan(
                  currentBase,
                  fees,
                  interestType,
                  currentRate,
                  term,
                  includePreviousLoans ? previousLoanTotal : 0
                );
                const isSelected = term <= loanTerm;
                const start = issueDate ? new Date(issueDate) : new Date();
                const termEnd = new Date(start);
                termEnd.setMonth(start.getMonth() + term);
                return (
                  <div
                    key={term}
                    className={`flex-shrink-0 w-32 p-2 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer
            ${
              isSelected
                ? "bg-red-700 border-red-800 text-white shadow-lg scale-105"
                : "bg-white border-gray-200 text-gray-700"
            }`}
                    onClick={() => {
                      setLoanTerm(term);
                      emitChange(
                        currentBase,
                        fees,
                        interestType,
                        currentRate,
                        term
                      );
                    }}
                  >
                    <div className="font-medium text-sm font-semibold">
                      {term} months
                    </div>
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isSelected ? "text-yellow-300" : "text-gray-700"
                      }`}
                    >
                      Interest: ${termResult.interestAmount.toFixed(2)}
                    </div>
                    <div
                      className={`text-xs font-medium mb-1 ${
                        isSelected ? "text-yellow-300" : "text-gray-700"
                      }`}
                    >
                      Total: $
                      {(termResult.interestAmount + subtotal).toFixed(2)}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Date: {formatDate(termEnd)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculation;
