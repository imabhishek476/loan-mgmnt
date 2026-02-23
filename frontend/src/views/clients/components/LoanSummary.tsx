import { Skeleton } from "@mui/material";
import { Pencil } from "lucide-react";
import { observer } from "mobx-react-lite";
import { formatUSD } from "../../../utils/loanCalculations";
import moment from "moment";
import { useMemo } from "react";
import { loanStore } from "../../../store/LoanStore";
import { companyStore } from "../../../store/CompanyStore";

interface LoanSummaryProps {
    clientLoans: any[];
    loading: boolean;
    loanPayments: {};
}

const LoanSummary = observer(({ clientLoans, loading, loanPayments }: LoanSummaryProps) => {

        const LoanSummarySkeleton = () => {
            return (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="rounded-xl border bg-white shadow-sm overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 py-2">
                                <Skeleton width="40%" height={20} />
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left */}
                                <div className="space-y-2">
                                    <Skeleton width="30%" height={16} />
                                    {[1, 2, 3].map((j) => (
                                        <Skeleton key={j} height={50} className="rounded-lg" />
                                    ))}
                                </div>

                                {/* Right */}
                                <div className="space-y-2">
                                    <Skeleton width="30%" height={16} />
                                    <div className="grid grid-cols-2 gap-3">
                                        {[1, 2, 3, 4].map((k) => (
                                            <Skeleton key={k} height={40} className="rounded-lg" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        };

        const loansWithTs = useMemo(() => {
            return clientLoans.map((loan) => ({
                ...loan,
                issueTs: moment(loan.issueDate, "MM-DD-YYYY").valueOf(),
            }));
        }, [clientLoans]);
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
                        const profit =
                            loanStore.loanProfitMap[String(loan._id)];

                        const paid = Number(
                            profit?.totalPaid ?? loan.paidAmount ?? 0
                        );

                        const profitValue = Number(
                            profit?.totalProfit ?? 0
                        );

                        acc.base += Number(loan.baseAmount || 0);
                        acc.paid += paid;
                        acc.profit += profitValue;

                        return acc;
                    },
                    { base: 0, paid: 0, profit: 0 }
                );

                const company =
                    companyStore.companies.find(
                        (c) => c._id === parent.company
                    );

                return {
                    parent,
                    loans: allLoans.sort(
                        (a, b) => a.issueTs - b.issueTs
                    ), // ⚡ FAST
                    totals,
                    companyName: company?.companyName || "—",
                };
            });
        }, [loansWithTs, mergeMap, loanStore.loanProfitMap]);

        const latestActiveLoanId = useMemo(() => {
            if (!loansWithTs.length) return null;
            const activeLoans = loansWithTs;

            if (!activeLoans.length) return null;
            return activeLoans.sort(
                (a, b) => b.issueTs - a.issueTs
            )[0]._id;
        }, [loansWithTs]);

        return (
            <div className="overflow-hidden h-full flex flex-col min-h-0">

                {/* ✅ Sticky Header */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                    <div className="flex items-center gap-3 pt-2 pb-1 px-2">
                        <h3 className="font-bold text-gray-800 ">
                            Loan Summary
                        </h3>
                    </div>
                </div>

                {/* ✅ Scrollable Area */}
                <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">

                    {loading ? (
                        <LoanSummarySkeleton />
                    ) : allLoanSummary.length === 0 ? (
                        <p className="text-gray-500 italic text-sm p-3">
                            No loans found for this client.
                        </p>
                    ) : (
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-gray-200 sticky top-0 z-10">
                                <tr className="text-black">
                                    <th className="border px-0 text-left">Date</th>
                                    <th className="border px-0 text-left">Loan #</th>
                                    <th className="border px-0 text-left">Total Base</th>
                                    <th className="border px-0 text-left">Payment Status</th>
                                    <th className="border px-0 text-left">Paid Dates</th>
                                    <th className="border px-0 text-left">Loan Status</th>
                                    <th className="border px-0 text-left">Total Paid</th>
                                    <th className="border px-0 text-left">Profit</th>
                                </tr>
                            </thead>
                            {allLoanSummary.map((group, groupIndex) => {
                                const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

                                // ✅ Sort loans correctly
                                const sortedLoans = [...group.loans].sort((a, b) => {
                                    const isActiveA =
                                        a.status === "Active" || a.status === "Partial Payment";

                                    const isActiveB =
                                        b.status === "Active" || b.status === "Partial Payment";

                                    // ✅ Active always last
                                    if (isActiveA && !isActiveB) return 1;
                                    if (!isActiveA && isActiveB) return -1;

                                    return a.issueTs - b.issueTs;
                                });


                                return (
                                    <tbody key={group.parent._id}>
                                        {sortedLoans.map((loan, index) => {
                                            const displayLoanNumber =
                                                index === 0
                                                    ? `${groupIndex + 1}`
                                                    : `${groupIndex + 1}${alphabet[index - 1]}`;

                                            const payments = loanPayments[loan._id] || [];

                                            const paidAmount = payments.reduce(
                                                (sum, p) => sum + Number(p.paidAmount || 0),
                                                0
                                            );

                                            const paidDates = payments.map(p =>
                                                moment(p.paidDate).format("MM/DD/YYYY")
                                            );

                                            const profitValue = Number(
                                                loanStore.loanProfitMap[loan._id]?.totalProfit ?? 0
                                            );

                                            const isLatest = loan._id === latestActiveLoanId;

                                            return (
                                                <tr key={loan._id} className={isLatest ? "bg-green-50 font-semibold" : ""}>
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
                                                            "—"
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

                                        {/* ✅ Totals */}
                                        <tr className="bg-green-700 text-white font-semibold">
                                            <td className="border px-2 py-1 text-right">
                                            </td>
                                            <td className="border px-2 py-1">
                                                Totals:
                                            </td>
                                            <td className="border px-2 py-1">  {formatUSD(group.totals.base)}</td>
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
});
export default LoanSummary;