import { useState } from "react";
import { toast } from "react-toastify";
import { createClient } from "../../../services/ClientServices";
import { X, Plus } from "lucide-react";
import { TextField } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment, { Moment } from "moment";

interface CustomField {
  id: number;
  name: string;
  value: string | number | boolean;
  type: "string" | "number" | "boolean";
}

interface AddClientProps {
  open: boolean;
  onClose: () => void;
  onClientAdded?: (client: any) => void;
}

const AddClient = ({ open, onClose, onClientAdded }: AddClientProps) => {
  const [loading, setLoading] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldCounter, setFieldCounter] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    ssn: "",
    dob: "",           // store formatted date string
    accidentDate: "",  // store formatted date string
    address: "",
    attorneyName: "",
  });

  const addCustomField = () => {
    setCustomFields([...customFields, { id: fieldCounter, name: "", value: "", type: "string" }]);
    setFieldCounter(fieldCounter + 1);
  };

  const removeCustomField = (id: number) =>
    setCustomFields(customFields.filter((f) => f.id !== id));

  const handleCustomFieldChange = (id: number, key: string, value: any) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const formatCustomFields = () =>
    customFields.map((f) => ({
      ...f,
      value: f.type === "number" ? Number(f.value) || 0 : f.type === "boolean" ? Boolean(f.value) : f.value,
    }));

  const handleChange = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Full name, email and phone are required");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData, customFields: formatCustomFields() };
      const response = await createClient(payload);
      toast.success(`${response.client.fullName} created successfully 🎉`);
      onClientAdded?.(response.client);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50 overflow-auto">
        <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg relative mx-4 sm:mx-6 max-h-[90vh] flex flex-col transition-transform duration-300">

          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">Add New Client</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto px-4 py-4 flex-1 flex flex-col gap-6">

            {/* Standard Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "fullName", type: "text" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone", key: "phone", type: "text" },
                { label: "SSN", key: "ssn", type: "text" },
                { label: "Attorney Name", key: "attorneyName", type: "text" },
              ].map(field => (
                <div key={field.key} className="flex flex-col">
                  <label className="mb-2 font-medium text-gray-700">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.label}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                  />
                </div>
              ))}

              {/* Date of Birth */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Date of Birth</label>
                <DatePicker
                  value={formData.dob ? moment(formData.dob, "MM/DD/YYYY") : null}
                  onChange={(date: Moment | null) => handleChange("dob", date ? date.format("MM/DD/YYYY") : "")}
                  renderInput={(params) => <TextField {...params} />}
                />
              </div>

              {/* Accident Date */}
              <div className="flex flex-col">
                <label className="mb-2 font-medium text-gray-700">Accident Date</label>
                <DatePicker
                  value={formData.accidentDate ? moment(formData.accidentDate, "MM/DD/YYYY") : null}
                  onChange={(date: Moment | null) => handleChange("accidentDate", date ? date.format("MM/DD/YYYY") : "")}
                  renderInput={(params) => <TextField {...params} />}
                />
              </div>

              {/* Address */}
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-2 font-medium text-gray-700">Address</label>
                <textarea
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none w-full"
                  rows={3}
                />
              </div>
            </div>

            {/* Custom Fields */}
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold mb-2 text-gray-800">Custom Fields</h3>
              {customFields.map(field => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="text"
                    placeholder="Field Name"
                    value={field.name}
                    onChange={(e) => handleCustomFieldChange(field.id, "name", e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:ring-2 focus:ring-green-500 transition"
                  />
                  {field.type === "boolean" ? (
                    <label className="flex items-center gap-1 mt-2 sm:mt-0">
                      <input
                        type="checkbox"
                        checked={field.value as boolean}
                        onChange={(e) => handleCustomFieldChange(field.id, "value", e.target.checked)}
                        className="w-4 h-4"
                      />
                      Value
                    </label>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      placeholder="Value"
                      value={field.value as string | number}
                      onChange={(e) => handleCustomFieldChange(field.id, "value", e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:ring-2 focus:ring-green-500 transition"
                    />
                  )}
                  <select
                    value={field.type}
                    onChange={(e) => handleCustomFieldChange(field.id, "type", e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 transition"
                  >
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <button type="button" onClick={() => removeCustomField(field.id)} className="text-red-600 hover:text-red-800 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addCustomField} className="mt-2 px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Custom Field
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white z-10">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-1">
              <Plus className="w-4 h-4" /> Create Client
            </button>
          </div>

        </div>
      </div>
    </LocalizationProvider>
  );
};

export default AddClient;
