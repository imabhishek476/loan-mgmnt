import { useState, useEffect, ReactNode } from "react";
import { toast } from "react-toastify";
import { X, Plus } from "lucide-react";
import { TextField, Switch, FormGroup, FormControlLabel } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
export interface FieldConfig {
  label: string;
  key: string;
  type: "text" | "email" | "number" | "date" | "textarea" | "toggle" | "select" | "array" | "section";
  required?: boolean;
  fullWidth?: boolean;
  options?: { label: string; value: any }[];
  icon?: ReactNode;
}
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<any>;
  onFormDataChange?: (data: Record<string, any>) => void;
  renderToggle?: (key: string, value: boolean, onChange: (key: string, value: boolean) => void) => JSX.Element;
  renderLoanTerms?: (selectedTerms: number[], onChange: (terms: number[]) => void) => JSX.Element;
  customFields?: {
    id: number;
    name: string;
    value: string | number | boolean;
    type: "string" | "number";
  }[];
  submitButtonText?: string;

}
const loanTermOptions = [6, 12, 18, 24, 30, 36];

const FormModal = ({
  open,
  onClose,
  title,
  fields,
  initialData = {},
  onSubmit,
  onFormDataChange,
  renderToggle,
  renderLoanTerms,
  customFields: initialCustomFields,
  submitButtonText
}: FormModalProps) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [customFields, setCustomFields] = useState<any[]>(initialCustomFields || []);
  const [fieldCounter, setFieldCounter] = useState(initialCustomFields?.length || 1);

  useEffect(() => {
    setFormData(initialData || {});
    if (initialData?.customFields && Array.isArray(initialData.customFields)) {
      setCustomFields(initialData.customFields);
      setFieldCounter(initialData.customFields.length + 1);
    }
  }, [initialData]);

  const addCustomField = () => {
    setCustomFields([...customFields, { id: fieldCounter, name: "", value: "", type: "string" }]);
    setFieldCounter(fieldCounter + 1);
  };

  const removeCustomField = (id: number) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleCustomFieldChange = (id: number, key: string, value: any) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const handleChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onFormDataChange?.(updated);
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.key]) {
        // newErrors[field.key] = `${field.label} is required`;
        newErrors[field.key] = `required`;

      }
      if (field.type === "email" && formData[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key])) newErrors[field.key] = "Invalid email address";
      }
      if (field.type === "number" && formData[field.key] !== undefined) {
        if (isNaN(Number(formData[field.key]))) newErrors[field.key] = "Must be a number";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...formData, customFields });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50 overflow-auto">
        <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg relative mx-4 sm:mx-6 max-h-[90vh] flex flex-col transition-transform duration-300">
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto px-2 py-2 flex-1 flex flex-col gap-6">
            <div className="grid sm:grid-cols-2 gap-2">

              {fields.map((field) => {
                if (field.type === "section") {
                  return (
                    <div key={field.label} className="w-full mt-0 mb-0 col-span-full">
                      <h3 className="flex items-center gap-3 text-lg font-semibold text-green-800 border-b border-gray-300 pb-1">
                        {field.icon && <span className="text-green-700">{field.icon}</span>}
                        {field.label}
                      </h3>
                    </div>
                  );
                }
                if (field.type === "toggle") {
                  if (field.key === "loanTerms") {
                    return (
                      <div key={field.key} className="sm:col-span-2 flex flex-col gap-0">
                        <span className="font-medium text-gray-700">{field.label}</span>
                        <FormGroup row>
                          {loanTermOptions.map((month) => (
                            <FormControlLabel
                              key={month}
                              control={
                                <Switch
                                  checked={(formData.loanTerms || []).includes(month)}
                                  onChange={(e) => {
                                    const updated = e.target.checked
                                      ? [...(formData.loanTerms || []), month]
                                      : (formData.loanTerms || []).filter((m: number) => m !== month);
                                    handleChange("loanTerms", updated);
                                  }}
                                  color="success"
                                />
                              }
                              label={`${month} months`}
                            />
                          ))}
                        </FormGroup>
                      </div>
                    );
                  }
                  return (
                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium text-gray-700">{field.label}</span>
                      {renderToggle ? renderToggle(field.key, !!formData[field.key], handleChange) : (
                        <Switch
                          checked={!!formData[field.key]}
                          onChange={(e) => handleChange(field.key, e.target.checked)}
                          color="success"
                        />
                      )}
                    </div>
                  );
                }

                if (field.type === "array" && field.key === "loanTerms") {
                  return (
                    <div key={field.key} className="sm:col-span-2">
                      <span className="font-medium text-gray-700">{field.label}</span>
                      {renderLoanTerms ? renderLoanTerms(formData[field.key] || [], (val) => handleChange(field.key, val)) : null}
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.key} className="flex flex-col sm:col-span-2">
                      <label className="mb-2 font-medium text-gray-700">{field.label}</label>
                      <textarea
                        placeholder={field.label}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none w-full"
                        rows={3}
                      />
                      {errors[field.key] && <span className="text-red-600 text-sm">{errors[field.key]}</span>}
                    </div>
                  );
                }

                if (field.type === "date") {
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="mb-2 font-medium text-gray-700">{field.label}</label>
                      <DatePicker
                        value={formData[field.key] ? moment(formData[field.key], "MM/DD/YYYY") : null}
                        onChange={(date: Moment | null) => handleChange(field.key, date ? date.format("MM/DD/YYYY") : "")}
                        renderInput={(params) => (
                          <TextField {...params} error={!!errors[field.key]} helperText={errors[field.key]} />
                        )}
                      />
                      {errors[field.key] && <span className="text-red-600 text-sm">{errors[field.key]}</span>}

                    </div>
                  );
                }

                if (field.type === "select" && field.options) {
                  return (
                    <div key={field.key} className="flex flex-col">
                      <label className="mb-2 font-medium text-gray-700">{field.label}</label>
                      <select
                        value={formData[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 transition"
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={field.key} className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-700">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.label}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                    />
                    {errors[field.key] && <span className="text-red-600 text-sm">{errors[field.key]}</span>}
                  </div>
                );
              })}
            </div>
            {initialCustomFields && (
              <div className="sm:col-span-2 flex flex-col gap-3">
                <h3 className="font-semibold text-gray-800">Custom Fields</h3>
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                  >
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={field.name}
                      onChange={(e) =>
                        handleCustomFieldChange(field.id, "name", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:ring-2 focus:ring-green-500 transition"
                    />

                    <input
                      type={field.type === "number" ? "number" : "text"}
                      placeholder="Value"
                      value={field.value as string | number}
                      onChange={(e) =>
                        handleCustomFieldChange(field.id, "value", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:ring-2 focus:ring-green-500 transition"
                    />

                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleCustomFieldChange(field.id, "type", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-green-500 transition"
                    >
                      <option value="string">Text</option>
                      <option value="number">Number</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}


                <button
                  type="button"
                  onClick={addCustomField}
                  className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1 w-fit"
                >
                  <Plus className="w-4 h-4" /> Add Custom Field
                </button>
              </div>
            )}
          </form>

          <div className="flex justify-end gap-3 p-4 border-t sticky bottom-0 bg-white z-10">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Cancel
            </button>
            <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition">
              {submitButtonText || "Save"}
            </button>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default FormModal;
