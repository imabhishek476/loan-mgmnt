import { useState } from "react";
import { FileText, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  documents: any[];
  onSubmit: (doc: any) => void;
  title: string;
}

const DocumentModal = ({
  open,
  onClose,
  documents,
  onSubmit,
  title,
}: Props) => {
  const [selectedValue, setSelectedValue] = useState<string>("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!selectedValue) return;
    const selectedDoc = documents.find(
      (doc) => doc.value === selectedValue
    );
    if (selectedDoc) {
      onSubmit(selectedDoc);
    }
  };

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

        {/* Document List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
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