import { useEffect, useState } from "react";
import { loanStore } from "../store/LoanStore";
import { companyStore } from "../store/CompanyStore";
import { formatDate } from "../utils/helpers";
import { IconButton } from "@mui/material";
import { Eye } from "lucide-react";

export const PreviousLoan = ({
  activeLoans,
  formData,
  selectedLoanIds,
  setSelectedLoanIds,
  handleView,
}) => {
  const [loanResults, setLoanResults] = useState<any>([]);

  useEffect(() => {
    const calculate = async () => {
      const results: unknown[] = [];

      for (const loan of activeLoans) {
        const result = await loanStore.calculateLoanAmounts({
          loan: loan,
          calculate: true,
          date: formData.issueDate,
          calcType: "prevLoans",
        });
        results.push({
          ...result,
          company: loan?.company,
          client: loan?.client?._id,
          issueDate: loan?.issueDate,
          status: loan?.status,
          _id: loan?._id,
        });
      }

      setLoanResults(results);
    };

    calculate();
  }, [activeLoans, formData]);
  return (
    <div className="mt-4 p-2 bg-green-100 border-l-4 border-yellow-500 rounded">
      <div className="transition-all duration-700 ease-in-out overflow-auto max-h-40 opacity-100">
        {loanResults.map((loan) => {
          const {
            currentTerm,
            total,
            remaining,
            issueDate,
            company,
            // monthsPassed,
          } = loan;
          const loanIdStr = loan._id?.toString?.();
          const alreadyMerged = loan.status === "Merged";
          const isSelected = selectedLoanIds.includes(loanIdStr);
          const isDisabled = alreadyMerged;
          const checked = alreadyMerged ? true : isSelected;

          return (
            <div
              key={loanIdStr}
              className={`flex justify-between items-center p-3 border rounded-lg shadow-sm transition ${
                checked
                  ? "bg-green-100 border-green-400"
                  : "bg-white hover:bg-gray-50"
              } ${isDisabled ? "opacity-70 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (isDisabled) return;

                setSelectedLoanIds((prev) =>
                  prev.includes(loanIdStr)
                    ? prev.filter((id) => id !== loanIdStr)
                    : [...prev, loanIdStr]
                );
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex flex-col text-xs">
                  <span className="font-semibold text-white px-1 py-0 rounded-md bg-green-600 w-fit">
                    Issue Date: {formatDate(issueDate)}
                  </span>
                  <span className="font-semibold mt-1">
                    Company Name:{" "}
                    {companyStore.companies.find((c) => c._id === company)
                      ?.companyName || "-"}
                  </span>
                    <span className="font-semibold">
                      Current Tenure: <b>{currentTerm} Months</b>
                    </span>
                  <span className="text-green-700 font-bold">
                    Total: $
                    {Number(total).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{" "}
                  </span>
                  <span className="text-red-600 font-bold">
                    (Remaining: $
                    {Number(alreadyMerged ? 0 : remaining).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    )
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(loan);
                  }}
                >
                  <Eye size={18} />
                </IconButton>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (isDisabled) return;
                    setSelectedLoanIds((prev) =>
                      prev.includes(loanIdStr)
                        ? prev.filter((id) => id !== loanIdStr)
                        : [...prev, loanIdStr]
                    );
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-4 h-4 m-0 accent-green-600 ${
                    isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                  disabled={isDisabled}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
