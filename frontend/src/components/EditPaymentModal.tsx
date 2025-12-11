import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { paymentStore } from "../store/PaymentStore";
import { loanStore } from "../store/LoanStore";
import { toast } from "react-toastify";
import { calculateLoanAmounts } from "../utils/loanCalculations";
import { clientStore } from "../store/ClientStore";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import moment, { type Moment } from "moment";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

interface EditPaymentModalProps {
  open: boolean;
  onClose: () => void;
  loan: any;
  clientId: string;
  payment?: any;
  onPaymentSuccess?: () => void;
}

const EditPaymentModal = observer(
  ({
    open,
    onClose,
    loan,
    payment,
    clientId,
    onPaymentSuccess,
  }: EditPaymentModalProps) => {
    const [amount, setAmount] = useState<string>("");
    const [checkNumber, setCheckNumber] = useState("");
    const [payoffLetter, setPayoffLetter] = useState("");
    const [loading, setLoading] = useState(false);
    const [outstanding, setOutstanding] = useState(0);
    const [errors, setErrors] = useState<{ amount?: string }>({});
    const [payOffDate, setPayOffDate] = useState<Moment>(moment());
    const [currentTerm, setCurrentTerm] = useState(loan?.loanTerms || 0);

    useEffect(() => {
      if (!loan || !payment) return;
      const loanData = calculateLoanAmounts(loan);
      const remaining = loanData?.remaining || 0;
      const adjustedOutstanding = remaining + payment?.paidAmount;
      console.log(adjustedOutstanding);
      setOutstanding(adjustedOutstanding);
      setAmount(payment.paidAmount.toString());
      setCheckNumber(payment.checkNumber || "");
      setPayoffLetter(payment.payoffLetter || "");
      setPayOffDate(moment(payment.paidDate));
      setErrors({});
    }, [loan, payment]);

    if (!open || !loan || !payment) return null;

    const formattedOutstanding = outstanding.toFixed(2);

    const validate = () => {
      const newErrors: typeof errors = {};
      const numAmount = Number(amount);
      const originalAmount = payment?.paidAmount || 0;

      if (!amount || isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Paid Amount is required and must be greater than 0";
      } else if (numAmount < originalAmount) {
        newErrors.amount = `Amount cannot be less than original payment: $${originalAmount.toFixed(2)}`;
      } 
      // else if (numAmount > Number(formattedOutstanding)) {
      //   newErrors.amount = `Cannot pay more than outstanding: $${formattedOutstanding}`;
      // }

      setErrors(newErrors);
      Object.values(newErrors).forEach((msg) => toast.error(msg));

      return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (!loan || !payOffDate) return;

        const fetchUpdatedAmount = async () => {
          try {
            //@ts-ignore
            const { remaining , dynamicTerm } =
              await loanStore.calculateLoanAmounts({
                loan,
                date: payOffDate,
                calculate: true,
                calcType: "prevLoans",
              });
              setCurrentTerm(dynamicTerm);
             const totalRemaining = remaining + payment?.paidAmount;
            setOutstanding(totalRemaining);
            setErrors({});
          } catch (err) {
            console.error("Recalculation error:", err);
          }
        };

        fetchUpdatedAmount();
      }, [payOffDate]);
    const handleEditPayment = async () => {
      if (!validate()) return;

      setLoading(true);
      try {
        await paymentStore.editPayment(payment._id, {
          loanId: loan._id,
          clientId,
          paidAmount: Number(amount),
          paidDate: payOffDate,
          checkNumber,
          payoffLetter,
          currentTerm,
        });

        await loanStore.fetchActiveLoans(clientId);
        await clientStore.refreshDataTable();
        onPaymentSuccess?.();
        toast.success("Payment updated successfully");
       onClose();
      } catch (err) {
        console.error("Edit Payment Error:", err);
        toast.error(
          err?.response?.data?.message || "Payment update failed. Try again."
        );
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Payment</h2>

          <div className="flex flex-col gap-4">
             {/* Payoff Date */}
            <div className="flex flex-col text-left py-1 z-20">
              <label className="mb-1 font-medium text-gray-700">
                Payoff Date
              </label>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  value={payOffDate}
                  onChange={(date) => date && setPayOffDate(moment(date))}
                />
              </LocalizationProvider>
            </div>
            {/* Paid Amount */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Paid Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                min={0}
                step="0.01"
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => validate()}
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
                Outstanding: ${Number(formattedOutstanding).toLocaleString()}
              </p>
            </div>

            {/* Check Number */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Check Number
              </label>
              <input
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
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
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              title="Cancel"
              disabled={loading}
              className="px-4 py-2 font-bold bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleEditPayment}
              disabled={loading}
              title="Update"
              className="px-4 py-2 font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition"
            >
              {loading ? "Processing..." : "Update"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default EditPaymentModal;
