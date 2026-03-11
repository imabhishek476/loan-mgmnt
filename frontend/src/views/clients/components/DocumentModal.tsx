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
  onSubmit: (doc: any, selectDate?: string,reductionAmount?: number,endDate?:string) => void;
  title: string;
  isPaidOff?: boolean;
  isReduction?: boolean;
  dynamicTerm?: number;
  totalAmount?: number;
  loan?: any;
  defaultDate?: any;
  endDate?:any;
}
const DocumentModal = ({
  open,
  onClose,
  documents,
  onSubmit,
  title,
  isPaidOff,
  isReduction,
  defaultDate,  
  endDate,
 loan  
}: Props) => {
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [calculatedLoan, setCalculatedLoan] = useState<any>(null);
  const [reductionAmount,setReductionAmount] = useState<number>(null);
  const [selectDate, setSelectDate] = useState<any>(defaultDate || moment());
  const [endDateValue, setEndDateValue] = useState<any>(endDate || moment());
  if (!open) return null;

  const handleSubmit = () => {
    if (!selectedValue) return;
    const selectedDoc = documents.find(
      (doc) => doc.value === selectedValue
    );
    if (selectedDoc) {
    onSubmit(
      selectedDoc,
        (isPaidOff || isReduction)
          ? moment(selectDate).format("MMM DD, YYYY")
          : undefined,
        isReduction ? reductionAmount : undefined,
        isReduction ? moment(endDateValue).format("MMM DD, YYYY") : undefined,
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
  useEffect(() => {
    setSelectDate(defaultDate ? moment(defaultDate) : moment());
    setEndDateValue(endDate ? moment(endDate) : null);
  },[defaultDate,endDate])
  useEffect(()=>{
    if(documents?.length === 1){
      setSelectedValue(documents[0].value)
    }
  },[documents])
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
      {(isPaidOff || isReduction) && (
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
          {(isPaidOff || isReduction) && (
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">
              {isReduction ? "Select Date" : "Paid Date"}
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
          {isReduction && (
          <>
              {/* <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  End Date
                </label>

                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    value={endDateValue}
                    onChange={(date:any) => setEndDateValue(date)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </div> */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Reduction Amount
                </label>

                <input
                  type="number"
                  value={reductionAmount}
                  onChange={(e)=>setReductionAmount(Number(e.target.value))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Enter reduction amount"
                />
            </div>
            </>
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