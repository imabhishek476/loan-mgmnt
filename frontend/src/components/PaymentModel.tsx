import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { paymentStore } from "../store/PaymentStore";
import { loanStore } from "../store/LoanStore";
import { toast } from "react-toastify";
import moment from "moment";

const calculateDynamicTotal = (loan: any) => {
  if (!loan) return { dynamicTotal: 0, currentTerm: 0 };

  const base = loan.baseAmount || 0;
  const fees = loan.fees || {};
  const interestType = loan.interestType || "flat";
  const monthlyRate = loan.monthlyRate || 0;
  const originalTerm = loan.loanTerms || 0;
  const issueDate = moment(loan.issueDate, "MM-DD-YYYY").toDate();

  if (base <= 0 || originalTerm <= 0) {
    return { dynamicTotal: loan.totalLoan || 0, currentTerm: originalTerm };
  }

 
  const today = moment();
  const start = moment(issueDate);
  const monthsPassed = Math.max(1, today.diff(start, "months") + 1);

  let currentTerm = originalTerm;
  if (monthsPassed > originalTerm) {
    const extendedTerms = [6, 12, 18, 24, 30, 36, 48, 60];
    const nextTerm =
      extendedTerms.find((t) => t > originalTerm) || originalTerm * 2;
    currentTerm = Math.max(nextTerm, monthsPassed);
  }

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
    return fee.type === "percentage"
      ? sum + (base * (fee.value || 0)) / 100
      : sum + (fee.value || 0);
  }, 0);

  const subtotal = base + feeTotal;
  const rate = monthlyRate / 100;
  let interest = 0;

  if (interestType === "flat") {
    interest = subtotal * rate * currentTerm;
  } else {
    interest = subtotal * (Math.pow(1 + rate, currentTerm) - 1);
  }

  return {
    dynamicTotal: subtotal + interest,
    currentTerm,
  };
};

interface LoanPaymentModalProps {
  open: boolean;
  onClose: () => void;
  loan: any;
  clientId: string;
  onPaymentSuccess?: () => void;
}

const LoanPaymentModal = observer(
  ({
    open,
    onClose,
    loan,
    clientId,
    onPaymentSuccess,
  }: LoanPaymentModalProps) => {
    const [amount, setAmount] = useState<string>("");
    const [checkNumber, setCheckNumber] = useState("");
    const [payoffLetter, setPayoffLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [outstanding, setOutstanding] = useState(0);
    const [errors, setErrors] = useState<{
      amount?: string;
      checkNumber?: string;
    }>({});

    useEffect(() => {
      if (loan) {
       const { dynamicTotal, currentTerm } = calculateDynamicTotal(loan);
        const paidAmount = loan.paidAmount || 0;
        const outstanding = Math.max(0, dynamicTotal - paidAmount);

       const perMonth = currentTerm > 0 ? dynamicTotal / currentTerm : 0;
        const startDate = moment(loan.issueDate, "MM-DD-YYYY");
        const currentDate = moment();
        let monthsPassed = currentDate.diff(startDate, "months") + 1;
        if (monthsPassed > currentTerm) monthsPassed = currentTerm;
        const monthsPaid = perMonth > 0 ? Math.floor(paidAmount / perMonth) : 0;
        const monthsDue = Math.max(0, monthsPassed - monthsPaid);
        const defaultPayment = outstanding;

        setOutstanding(outstanding);
        setAmount(defaultPayment > 0 ? defaultPayment.toFixed(2) : "");
        setCheckNumber("");
        setPayoffLetter("");
        setErrors({});
      }
    }, [loan]);

    if (!open || !loan) return null;

    const validate = () => {
      const newErrors: typeof errors = {};
      const numAmount = Number(amount);

      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Paid Amount is required and must be greater than 0";
      } else if (numAmount > outstanding) {
        newErrors.amount = `Cannot pay more than outstanding: $${outstanding.toFixed(
          2
        )}`;
      }

      if (!checkNumber.trim()) {
        newErrors.checkNumber = "Check Number is required";
      }

      setErrors(newErrors);
      Object.values(newErrors).forEach((msg) => toast.error(msg));
      return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async () => {
      if (!validate()) return;

      setLoading(true);
      try {
        await paymentStore.addPayment({
          loanId: loan._id,
          clientId,
          paidAmount: Number(amount),
          paidDate: new Date(),
          checkNumber,
          payoffLetter,
        });

        await loanStore.fetchLoans();
        onPaymentSuccess?.();
        toast.success("Payment recorded successfully");
        onClose();
      } catch (err) {
        console.error(err);
        toast.error("Payment failed. Try again.");
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
              <label className="block text-gray-700 font-medium mb-1">
                Paid Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                min={0}
                step="0.01"
                onChange={(e) => {
                  setAmount(e.target.value);
                  const num = Number(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    amount:
                      !e.target.value || num <= 0
                        ? "Paid Amount is required and must be greater than 0"
                        : num > outstanding
                        ? `Cannot pay more than outstanding: $${outstanding.toFixed(
                            2
                          )}`
                        : "",
                  }));
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                  errors.amount
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-green-300"
                }`}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Outstanding: ${outstanding.toFixed(2)}
              </p>
            </div>

            {/* Check Number */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Check Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={checkNumber}
                onChange={(e) => {
                  setCheckNumber(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    checkNumber: e.target.value.trim()
                      ? ""
                      : "Check Number is required",
                  }));
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring ${
                  errors.checkNumber
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-green-300"
                }`}
              />
              {errors.checkNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.checkNumber}
                </p>
              )}
            </div>

            {/* Payoff Letter */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Payoff Letter
              </label>
              <input
                type="text"
                value={payoffLetter}
                onChange={(e) => setPayoffLetter(e.target.value)}
                placeholder="Enter payoff letter"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              {loading ? "Processing..." : "Pay"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default LoanPaymentModal;
