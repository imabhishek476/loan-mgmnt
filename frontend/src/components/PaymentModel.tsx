import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { paymentStore } from "../store/PaymentStore";
import { loanStore } from "../store/LoanStore";
import { toast } from "react-toastify";
import { calculateLoanAmounts } from "../utils/loanCalculations"; 
import { clientStore } from "../store/ClientStore";

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
    const formated_Outstanding = outstanding.toFixed(2);

useEffect(() => {
  if (!loan) return;
  const loanData = calculateLoanAmounts(loan);
  if (!loanData) return;
  const { remaining } = loanData;
  setOutstanding(remaining);
        setAmount("");
        setCheckNumber("");
        setPayoffLetter("");
        setErrors({});
}, [loan]);



    if (!open || !loan) return null;

    const validate = () => {
      const newErrors: typeof errors = {};
      const numAmount = Number(amount);

      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Paid Amount is required and must be greater than 0";
        //@ts-ignore
      } else if (numAmount > formated_Outstanding) {
        newErrors.amount = `Cannot pay more than outstanding: $${formated_Outstanding}`;
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
          formated_Outstanding,
          currentTerm: loan.loanTerms,
        });

        await loanStore.fetchLoans();
        await clientStore.refreshDataTable();
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
                        : //@ts-ignore
                        num > formated_Outstanding
                        ? `Cannot pay more than outstanding: $${formated_Outstanding}`
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
                Outstanding: ${Number(formated_Outstanding).toLocaleString()}
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
              className="px-4 py-2 font-bold bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="px-4 py-2 font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
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
