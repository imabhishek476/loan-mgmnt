import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { paymentStore } from "../store/PaymentStore";
import { loanStore } from "../store/LoanStore";
import { toast } from "react-toastify";

interface LoanPaymentModalProps {
  open: boolean;
  onClose: () => void;
  loan: any;
  clientId: string;
  onPaymentSuccess?: () => void; // callback after successful payment
}

const LoanPaymentModal = observer(({ open, onClose, loan, clientId, onPaymentSuccess }: LoanPaymentModalProps) => {
  const [amount, setAmount] = useState<string>("");
  const [checkNumber, setCheckNumber] = useState("");
  const [payoffLetter, setPayoffLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [outstanding, setOutstanding] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loan) {
      const totalLoan = loan.totalLoan || 0;
      const paidAmount = loan.paidAmount || 0;
      const remaining = totalLoan - paidAmount;
      setOutstanding(remaining);
      setAmount(remaining ? remaining.toString() : "");
      setCheckNumber("");
      setPayoffLetter("");
      setError("");
    }
  }, [loan]);

  if (!open || !loan) return null;

  const handlePayment = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (numAmount > outstanding) {
      setError(`Cannot pay more than outstanding: $${outstanding.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await paymentStore.addPayment({
        loanId: loan._id,
        clientId,
        paidAmount: numAmount,
        paidDate: new Date(),
        checkNumber,
        payoffLetter,
      });

      await loanStore.fetchLoans(); // refresh loan info

      if (onPaymentSuccess) onPaymentSuccess(); // refresh payments in parent

      toast.success("Payment recorded successfully");
      onClose();
    } catch (err) {
      console.error(err);
      setError("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Make Payment</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Paid Amount</label>
            <input
              type="number"
              value={amount}
              min={0}
              max={outstanding}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                error ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-green-300"
              }`}
            />
            <p className="text-sm text-gray-500 mt-1">Outstanding: ${outstanding.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Check Number</label>
            <input
              type="text"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Payoff Letter</label>
            <input
              type="text"
              value={payoffLetter}
              onChange={(e) => setPayoffLetter(e.target.value)}
              placeholder="Enter payoff letter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition">Cancel</button>
          <button onClick={handlePayment} disabled={loading || !amount} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
            {loading ? "Processing..." : "Pay"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default LoanPaymentModal;
