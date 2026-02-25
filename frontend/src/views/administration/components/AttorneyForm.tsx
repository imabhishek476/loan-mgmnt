/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const AttorneyForm = ({ initialData, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    firmName: "",
    address: "",
    memo: "",
    // isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        firmName: initialData.firmName || "",
        address: initialData.address || "",
        memo: initialData.memo || "",
        // isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
<div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
      <div className="flex justify-between items-left border-b px-2 py-3">
        <h2 className="text-lg font-semibold text-gray-800">
          {initialData ? "Edit Attorney" : "Add New Attorney"}
        </h2>

        <button
          onClick={onClose}
          className="text-gray-500 hover:text-red-500 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-2 space-y-4 text-left">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
            placeholder="Enter full name"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
            placeholder="Enter email"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
            placeholder="Enter phone number"
          />
        </div>

        {/* Firm Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Firm Name
          </label>
          <input
            type="text"
            value={formData.firmName}
            onChange={(e) => handleChange("firmName", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
            placeholder="Enter firm name"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
            rows={2}
            placeholder="Enter address"
          />
        </div>

        {/* Memo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Memo
          </label>
          <textarea
            value={formData.memo}
            onChange={(e) => handleChange("memo", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none"
            rows={2}
            placeholder="Enter memo / notes"
          />
        </div>

        {/* Active Toggle */}
        {/* <div className="flex items-center justify-between border rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 font-medium">
            Active Attorney
          </span>

          <button
            type="button"
            onClick={() =>
              handleChange("isActive", !formData.isActive)
            }
            className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
              formData.isActive ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow transform transition ${
                formData.isActive ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div> */}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
          >
            {initialData ? "Update Attorney" : "Create Attorney"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AttorneyForm;