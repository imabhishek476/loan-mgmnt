import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import moment from "moment";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { loanStore } from "../../../store/LoanStore";
import { moneyFormat } from "../../../utils/constants";

interface Props {
  open: boolean;
  onClose: () => void;
  documents: any[];
  onSubmit: (doc: any, selectDate?: string) => void;
  title: string;
  isPaidOff?: boolean;
  dynamicTerm?: number;
  totalAmount?: number;
  loan?: any;
}
const DocumentModal = ({
  open,
  onClose,
  documents,
  onSubmit,
  title,
  isPaidOff,
 loan  
}: Props) => {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [selectDate, setSelectDate] = useState<any>(moment());  
  const [calculatedLoan, setCalculatedLoan] = useState<any>(null);
  if (!open) return null;

  const handleSubmit = () => {
    if (!selectedValue) return;
    const selectedDoc = documents.find(
      (doc) => doc.value === selectedValue
    );
    if (selectedDoc) {
    onSubmit(
      selectedDoc,
      isPaidOff ? moment(selectDate).format("MMM DD, YYYY") : undefined
    );
  }
  };
useEffect(() => {

  if (!loan) return;

  const result = loanStore.calculateLoans(
    loan,
    [], // empty array (not needed)
    "mergedDate",
    selectDate
  );

  setCalculatedLoan(result);

}, [selectDate, loan]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[500px] rounded-lg shadow-xl p-5 relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      {isPaidOff && (
        <div className="flex gap-4 text-sm mb-4">

          <span className="bg-gray-200 px-3 py-1 rounded-md font-semibold text-gray-700">
            Loan Term: {calculatedLoan?.dynamicTerm || 0} Months
          </span>

          <span className="bg-green-700 text-white px-3 py-1 rounded-md font-semibold">
            Total: ${moneyFormat(calculatedLoan?.total || 0)}
          </span>

        </div>
      )}
        {/* Document List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {isPaidOff && (
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
                Paid Date
              </label>

              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  value={selectDate}
                  onChange={(date:any) => setSelectDate(date)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true
                    }
                  }}
                />
              </LocalizationProvider>
            </div>
          )}
          {documents.map((doc: any) => (
            <label
              key={doc.value}
              className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition
                ${
                  selectedValue === doc.value
                    ? "bg-green-50 border-green-600"
                    : "hover:bg-gray-100"
                }`}
            >
              <input
                type="checkbox"
                checked={selectedValue === doc.value}
                onChange={() => setSelectedValue(doc.value)}
                className="w-4 h-4 accent-green-600"
              />
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FileText size={16} className="text-green-700" />
            {doc.fileName}
            </span>
            </label>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-5">
          <button
            disabled={!selectedValue}
            onClick={handleSubmit}
            className={`px-4 py-2 text-white text-sm font-medium rounded-md
              ${
                selectedValue
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Submit
          </button>
        </div>

      </div>
    </div>
  );
};

export default DocumentModal;