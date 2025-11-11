import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

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
  confirmAlert({
    customUI: ({ onClose }) => (
      <div className="bg-white rounded-xl shadow-xl p-6 w-[90%]  mx-auto text-center  ">
        <h2 className="text-lg font-semibold mb-2 text-red-600">
          {title}
        </h2>
        <p className="mb-5 text-sm">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            className="px-4 py-2 font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2">
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold bg-red-500 text-white rounded-lg hover:bg-red-700 transition"
          >
            {cancelText}
          </button>
        </div>
      </div>
    ),
  });
};

export default Confirm;
