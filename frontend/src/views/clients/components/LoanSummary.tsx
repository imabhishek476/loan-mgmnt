import { Skeleton } from "@mui/material";
import { formatUSD } from "../../../utils/loanCalculations";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { fetchAllPaymentsForClient } from "../../../services/LoanPaymentServices";
import { fetchCompanies } from "../../../services/CompaniesServices";

interface LoanProfit {
  loanId: string;
  rootLoanId: string;
  totalBaseAmount: number;
  totalPaid: number;
  totalProfit: number;
}

interface LoanSummaryProps {
  client: any;
  clientLoans: any[];
}

const LoanSummary = ({
  client,
  clientLoans,
}: LoanSummaryProps) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loanProfitMap, setLoanProfitMap] = useState<Record<string, LoanProfit>>(
    {}
  );
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loanPayments, setLoanPayments] = useState<Record<string, any[]>>({});

  /** ✅ Load ProfitMap + Companies */

const loadMeta = async () => {
  if (!client?._id) return;

  try {
    setLoadingMeta(true);

    const [paymentRes, companyRes]: any = await Promise.all([
      fetchAllPaymentsForClient(client._id),
      fetchCompanies(),
    ]);

    console.log("LoanSummary paymentRes →", paymentRes);

    /** ✅ FIXED */
    setLoanProfitMap(paymentRes.profits || {});
    setLoanPayments(paymentRes.payments || {});
    setCompanies(companyRes.data || companyRes || []);

  } catch (err) {
    console.error(err);
    toast.error("Failed to load summary data");
  } finally {
    setLoadingMeta(false);
  }
};
  /** ✅ Skeleton */
  const LoanSummarySkeleton = () => (
    <div className="space-y-4 p-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-2">
            <Skeleton width="40%" height={20} />
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton height={50} />
            <Skeleton height={50} />
          </div>
        </div>
      ))}
    </div>
  );

  /** ✅ Safer Timestamp */
  const loansWithTs = useMemo(() => {
    return clientLoans.map((loan) => ({
      ...loan,
      issueTs: moment(loan.issueDate).valueOf(),
    }));
  }, [clientLoans]);

  /** ✅ Merge Map */
  const mergeMap = useMemo(() => {
    const map: Record<string, any[]> = {};

    loansWithTs.forEach((loan) => {
      if (!loan.parentLoanId) return;

      if (!map[loan.parentLoanId]) {
        map[loan.parentLoanId] = [];
      }

      map[loan.parentLoanId].push(loan);
    });

    return map;
  }, [loansWithTs]);

  /** ✅ Build Merge Chain */
  const buildMergeChain = (loanId: string): any[] => {
    const chain: any[] = [];
    const stack = [...(mergeMap[loanId] || [])];

    while (stack.length) {
      const loan = stack.pop();
      chain.push(loan);

      if (mergeMap[loan._id]) {
        stack.push(...mergeMap[loan._id]);
      }
    }

    return chain;
  };

  /** ✅ Grouped Summary */
  const allLoanSummary = useMemo(() => {
    if (!loansWithTs.length) return [];

    const parentLoans = loansWithTs.filter(
      (loan) => !loan.parentLoanId
    );

    return parentLoans.map((parent) => {
      const mergedLoans = buildMergeChain(parent._id);
      const allLoans = [parent, ...mergedLoans];

      const totals = allLoans.reduce(
        (acc, loan) => {
      const profit = loanProfitMap[String(loan._id)] || loanProfitMap[String(loan.loanId)];
      const paid = Number(profit?.totalPaid ?? loan.paidAmount ?? 0);
      const profitValue = Number(profit?.totalProfit ?? 0);                        
          acc.base += Number(loan.baseAmount || 0);
          acc.paid += paid;
          acc.profit += profitValue;

          return acc;
        },
        { base: 0, paid: 0, profit: 0 }
      );

      const company = companies.find((c) => c._id === parent.company);

      return {
        parent,
        loans: [...allLoans].sort((a, b) => a.issueTs - b.issueTs),
        totals,
        companyName: company?.companyName || "—",
      };
    });
  }, [loansWithTs, mergeMap, loanProfitMap, companies]);

  /** ✅ Latest Loan */
  const latestActiveLoanId = useMemo(() => {
    if (!loansWithTs.length) return null;

    return [...loansWithTs].sort(
      (a, b) => b.issueTs - a.issueTs
    )[0]?._id;
  }, [loansWithTs]);

  /** ✅ Prevent Loader Freeze */
 useEffect(() => {
  loadMeta();
}, [client?._id]);

if(loadingMeta){
    return <LoanSummarySkeleton/>
}
  return (
    <div className="overflow-hidden h-full flex flex-col min-h-0">
      <div className="sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center gap-3 pt-2 pb-1 px-2">
          <h3 className="font-bold text-gray-800">Loan Summary</h3>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {allLoanSummary.length === 0 ? (
          <p className="text-gray-500 italic text-sm p-3">
            No loans found for this client.
          </p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="border px-2 py-1 text-left">Date</th>
                <th className="border px-2 py-1 text-left">Loan #</th>
                <th className="border px-2 py-1 text-left">Total Base</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Paid Dates</th>
                <th className="border px-2 py-1 text-left">Loan Status</th>
                <th className="border px-2 py-1 text-left">Total Paid</th>
                <th className="border px-2 py-1 text-left">Profit</th>
              </tr>
            </thead>

            {allLoanSummary.map((group, groupIndex) => {
              const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

              return (
                <tbody key={group.parent._id}>
                  {group.loans.map((loan, index) => {
                    const displayLoanNumber =
                      index === 0
                        ? `${groupIndex + 1}`
                        : `${groupIndex + 1}${alphabet[index - 1]}`;

                    /** ✅ FIXED payments lookup */
                    const payments =
                      loanPayments[String(loan._id)] ||
                      loanPayments[String(loan.loanId)] ||
                      [];
                    console.log(payments,'payments');
                    const paidAmount = payments.reduce(
                      (sum, p) => sum + Number(p.paidAmount ?? 0),
                      0
                    );

                    const paidDates = payments
                        .filter(p => p.paidDate)
                        .map(p => moment(p.paidDate).format("MM/DD/YYYY"));

                    const profitValue = Number(
                      loanProfitMap[String(loan._id)]?.totalProfit ?? 0
                    );

                    const isLatest = loan._id === latestActiveLoanId;

                    return (
                      <tr
                        key={loan._id}
                        className={
                          isLatest ? "bg-green-50 font-semibold" : ""
                        }
                      >
                        <td className="border px-2 py-1">
                          {moment(loan.issueDate).format("MM/DD/YYYY")}
                        </td>
                        <td className="border px-2 py-1">
                          {displayLoanNumber}
                        </td>
                        <td className="border px-2 py-1">
                          {formatUSD(loan.baseAmount)}
                        </td>
                        <td className="border px-2 py-1">
                          {loan.status}
                        </td>
                        <td className="border px-2 py-1">
                        {paidDates.length ? (
                            <div className="flex flex-col">
                            {paidDates.map((date, i) => (
                                <span key={i}>{date}</span>
                            ))}
                            </div>
                        ) : (
                            ""
                        )}
                        </td>
                        <td className="border px-2 py-1">
                          {loan.loanStatus}
                        </td>
                        <td className="border px-2 py-1 text-blue-600">
                          {formatUSD(paidAmount)}
                        </td>
                        <td className="border px-2 py-1 text-green-600">
                          {formatUSD(profitValue)}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-green-700 text-white font-semibold">
                    <td className="border px-2 py-1"></td>
                    <td className="border px-2 py-1">Totals</td>
                    <td className="border px-2 py-1">
                      {formatUSD(group.totals.base)}
                    </td>
                    <td className="border px-2 py-1"></td>
                    <td className="border px-2 py-1"></td>
                    <td className="border px-2 py-1"></td>
                    <td className="border px-2 py-1">
                      {formatUSD(group.totals.paid)}
                    </td>
                    <td className="border px-2 py-1">
                      {formatUSD(group.totals.profit)}
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
        )}
      </div>
    </div>
  );
};

export default LoanSummary;