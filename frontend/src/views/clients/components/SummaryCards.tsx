import { DollarSign, TrendingUp, Wallet, Activity, TrendingDown } from "lucide-react";
import { formatUSD } from "../../../utils/loanCalculations";

const SummaryCards = ({ clientLoans }: { clientLoans: any[] }) => {
  const totalBase = clientLoans.reduce(
    (sum, l) => sum + Number(l.baseAmount || 0),
    0
  );

  const totalPaid = clientLoans.reduce(
    (sum, l) => sum + Number(l.paidAmount || 0),
    0
  );

const totalProfit = totalPaid - totalBase;
const isLoss = totalProfit < 0;
const formattedProfit = isLoss
  ? `(${formatUSD(Math.abs(totalProfit))})`
  : formatUSD(totalProfit);
  const activeLoans = clientLoans.filter(
    (l) => l.status === "Active" || l.status === "Partial Payment"
  ).length;

  const Card = ({ title, value, icon, color }: any) => (
    <div className="bg-white shadow-lg rounded-lg py-3 px-2 flex justify-between items-center border">
      <div>
        <p className="text-xs text-gray-800 font-semibold uppercase">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2 px-4 py-2">
      <Card
        title="Total Base"
        value={formatUSD(totalBase)}
        icon={<Wallet size={18} className="text-green-700" />}
        color="bg-green-700 bg-opacity-20"
      />
      <Card
        title="Total Paid"
        value={formatUSD(totalPaid)}
        icon={<DollarSign size={18} className="text-green-700" />}
        color="bg-green-700  bg-opacity-20"
      />
<Card
  title="Total Profit"
  value={
    <span className={isLoss ? "text-red-600" : "text-green-700"}>
      {formattedProfit}
    </span>
  }
  icon={
    isLoss ? (
      <TrendingDown
        size={18}
        className="text-red-600"
      />
    ) : (
      <TrendingUp
        size={18}
        className="text-green-700"
      />
    )
  }
  color={isLoss ? "bg-red-200" : "bg-green-100"}
/>
        
      <Card
        title="Active Loans"
        value={activeLoans}
        icon={<Activity size={18} className="text-green-600" />}
        color="bg-green-700  bg-opacity-20"
      />
    </div>
  );
};

export default SummaryCards;