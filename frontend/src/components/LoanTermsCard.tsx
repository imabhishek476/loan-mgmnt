import moment from 'moment';
import React, { useEffect, useState } from 'react'
import { ALLOWED_TERMS } from '../utils/constants';
import { loanStore } from '../store/LoanStore';
import { convertToUsd } from '../utils/helpers';

export const LoanTermsCard = ({ formData,setFormData, overlapMode,selectedPreviousLoanTotal }) => {
  const start = moment(formData.issueDate, "MM-DD-YYYY");
    const [loanResults, setLoanResults] = useState([]);

const buildTenure = (
  issueDateStr: string,
  terms: number[],
  outFormat: "iso" | "mm-dd-yyyy" = "mm-dd-yyyy" 
) => {
  const start = moment(issueDateStr, "MM-DD-YYYY").startOf("day");
  return terms.map((t) => {
    const end = start.clone().add(t * 30, "days");
    return {
      term: t,
      endDate:
        outFormat === "iso"
          ? end.format("YYYY-MM-DD")
          : end.format("MM-DD-YYYY"),
    };
  });
}; 
useEffect(() => {
  const calculate = async () => {
    const results: any[] = [];

    for (const term of ALLOWED_TERMS) {
      const result = await loanStore.calculateLoanAmounts({
        loan: formData,
        date: null,
        selectedTerm: term,
        prevLoanTotal: overlapMode ? selectedPreviousLoanTotal : 0,
        calculate: true,
      });

      results.push({
        term,
        result,
      });
    }
    setLoanResults(results);
    console.log(results, 'loanResults');
  };

  calculate();
}, [formData, overlapMode, selectedPreviousLoanTotal]);
  return (
    <div className="px-2 py-2">
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex space-x-2 min-w-max">
          {loanResults.map(({term,result}) => {
           
            const isSelected = term <= formData.loanTerms;
            const totalDays = term * 30;
            const termEnd = start.clone().add(totalDays, "days");

            return (
              <div
                key={term}
                className={`flex-shrink-0 w-36 p-2 rounded-xl shadow-sm border transition-all duration-300 cursor-pointer
                      ${
                        isSelected
                          ? "bg-red-700 border-red-800 text-white shadow-lg scale-105"
                          : "bg-white border-gray-200 text-gray-700"
                      }`}
                onClick={() => {
                  const updatedTenures = buildTenure(
                    formData.issueDate,
                    ALLOWED_TERMS,
                    "iso"
                  );
                  setFormData((prev) => ({
                    ...prev,
                    loanTerms: term,
                    tenures: updatedTenures,
                  }));
                }}
              >
                <div className="font-medium text-sm font-semibold">
                  {term} months
                </div>
                <div
                  className={`text-xs whitespace-nowrap font-medium mb-1 ${
                    isSelected ? "text-yellow-300" : "text-gray-700"
                  }`}
                >
                  Month Int. : {convertToUsd.format(result.monthInt || 0)}
                </div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    isSelected ? "text-yellow-300" : "text-gray-700"
                  }`}
                >
                  Interest: {convertToUsd.format(result.interestAmount)}
                </div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    isSelected ? "text-yellow-300" : "text-gray-700"
                  }`}
                >
                  Total: {convertToUsd.format(result.totalWithInterest)}
                </div>
                <div
                  className={`text-xs ${
                    isSelected ? "text-white" : "text-gray-700"
                  }`}
                >
                  Date: {termEnd.format("MMM DD, YYYY")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
