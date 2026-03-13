import { Skeleton } from "@mui/material";
import { formatUSD } from "../../../utils/loanCalculations";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { fetchAllPaymentsForClient } from "../../../services/LoanPaymentServices";
import { fetchCompanies } from "../../../services/CompaniesServices";
import { statusStyles } from "../../../utils/helpers";
import { BarChart3 } from "lucide-react";

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
      issueTs: loan.issueDate ? moment(loan.issueDate, "MM-DD-YYYY").valueOf() : 0,
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


  /** ✅ Prevent Loader Freeze */
 useEffect(() => {
  loadMeta();
}, [client?._id]);

if(loadingMeta){
    return <LoanSummarySkeleton/>
}
const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
      statusStyles[status] || "bg-gray-100 text-gray-700"
    }`}
  >
    {status}
  </span>
);
return (
  <div className="bg-white rounded-lg shadow-sm border flex flex-col h-full overflow-hidden">

    {/* Header */}
    <div className="flex items-center gap-3 p-2 shrink-0">
  <div className="bg-green-200 p-2 rounded-lg">
    <BarChart3 size={18} className="text-green-700" />
  </div>
  <h3 className="font-semibold text-gray-800 text-lg">
    Loan Summary
  </h3>
</div>

    {/* Table Wrapper */}
    <div className="flex-1 min-h-0">

      {allLoanSummary.length === 0 ? (
        <p className="text-gray-500 italic text-sm p-4">
          No loans found for this client.
        </p>
      ) : (
     <div className="p-2 pt-0 bg-gray-50">
  <div className="bg-white rounded-xl shadow-sm  ">
<div className="max-h-[600px] overflow-y-auto rounded-xl">
  <table className="w-full text-sm border-separate border-spacing-0">

            {/* Sticky Header */}
        <thead className="sticky top-0 z-20">
  <tr className="text-left text-xs uppercase tracking-wide bg-[#14532d] text-white">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Loan #</th>
                <th className="px-2 py-2">Broker Fee</th>
                <th className="px-2 py-2">Total Base</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Paid Dates</th>
                <th className="px-2 py-2">Total Paid</th>
                <th className="px-2 py-2">Profit</th>
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

                    const payments =
                      loanPayments[String(loan._id)] ||
                      loanPayments[String(loan.loanId)] ||
                      [];

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
                    const brokerFee = (() => {
                    const fee = loan?.fees?.brokerFee;
                    if (!fee) return 0;

                    const base = Number(loan.baseAmount || 0);
                    const value = Number(fee.value || 0);

                    return fee.type === "percentage"
                      ? (base * value) / 100
                      : value;
                  })();

                    return (
                      <tr
                        key={loan._id}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="px-3 py-2 text-gray-700 font-medium">
                            {moment(loan.issueDate, "MM-DD-YYYY").format("D MMM YYYY")}
                         </td>

                        <td className="px-3 py-2 font-semibold">
                          {displayLoanNumber}
                        </td>

                        <td className="px-3 py-2">
                          {formatUSD(brokerFee || 0)}
                        </td>
                         <td className="px-3 py-2 text-blue-600 font-medium">
                          {formatUSD(loan.baseAmount || 0 )}
                        </td>

                        <td className="px-3 py-2">
                         <StatusBadge status={loan.status} />
                        </td>

                        <td className="px-3 py-2 text-gray-700 font-medium">
                          {paidDates.map((date, i) => (
                            <div key={i}> {moment(date).format("D MMM YYYY")}</div>
                          ))}
                        </td>

                        {/* <td className="px-3 py-2">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            {loan.loanStatus}
                          </span>
                        </td> */}

                        <td className="px-3 py-2 font-medium text-green-600">
                          {formatUSD(paidAmount)}
                        </td>

                        <td className="px-3 py-2 font-semibold text-green-600">
                          {formatUSD(profitValue)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals Row */}
                  <tr className="bg-green-100 font-semibold">
                    <td></td>
                    <td></td>
                    <td className="px-3 py-2">
                      <span className="bg-green-700 text-white text-xs px-3 py-1 rounded-full">
                        TOTAL
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {formatUSD(group.totals.base)}
                    </td>
                    <td></td>
                    <td></td>
                    <td className="px-3 py-2 text-green-700">
                      {formatUSD(group.totals.paid)}
                    </td>
                    <td className="px-3 py-2 text-green-700">
                      {formatUSD(group.totals.profit)}
                    </td>
                  </tr>

                </tbody>
              );
            })}

          </table>
        </div>
      </div>
      </div>

      )}
    </div>
  </div>
);
};

export default LoanSummary;