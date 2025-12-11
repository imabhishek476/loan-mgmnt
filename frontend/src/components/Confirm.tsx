import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { useState } from "react";

interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

const Confirm = ({
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
}: ConfirmOptions) => {
  const ConfirmContent = ({ onClose }: { onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const handleConfirm = async () => {
      setLoading(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    return (
      <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] mx-auto text-center">
        <h2 className="text-lg font-semibold mb-2 text-red-600">{title}</h2>
        <p className="mb-5 text-sm">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            title={confirmText}
            className="px-4 py-2 font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-bold bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition"
          >
            {cancelText}
          </button>
        </div>
      </div>
    );
  };
  confirmAlert({
    customUI: ({ onClose }) => <ConfirmContent onClose={onClose} />,
  });
};

export default Confirm;
