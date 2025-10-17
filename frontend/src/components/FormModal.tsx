import React, { useState, useEffect, type ReactNode } from "react";
import { toast } from "react-toastify";
import { X, Plus, DollarSign, Percent } from "lucide-react";
import {
  TextField as MuiTextField,
  Switch,
  // FormGroup,
  FormControlLabel,
  Autocomplete,
  Slider,
  Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import type { Moment } from "moment";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export interface FieldConfig {
  label: string;
  key: string;
  type:
    | "text"
    | "email"
    | "number"
    | "date"
    | "textarea"
    | "toggle"
    | "select"
    | "array"
    | "section"
    | "color";
  required?: boolean;
  fullWidth?: boolean;
  options?: { label: string; value: any }[];
  icon?: ReactNode;
  inlineToggle?: { key: string; label: string }; // for inline toggle in section
  onChange?: (value: any) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<any>;
  onFormDataChange?: (data: Record<string, any>) => void;
  renderToggle?: (
    key: string,
    value: boolean,
    onChange: (key: string, value: boolean) => void
  ) => JSX.Element;
  renderLoanTerms?: () => JSX.Element;
  customFields?: {
    id: number;
    name: string;
    value: string | number | boolean;
    type: "string" | "number";
  }[];
  submitButtonText?: any;
  children?: React.ReactNode;
}

// const loanTermOptions = [6, 12, 18, 24, 30, 36];

const FormModal = ({
  open,
  onClose,
  title,
  fields,
  initialData = {},
  onSubmit,
  onFormDataChange,
  renderToggle,
  // renderLoanTerms,
  customFields: initialCustomFields,
  submitButtonText,
  children,
}: FormModalProps) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [customFields, setCustomFields] = useState<any[]>(
    initialCustomFields || []
  );
  const [fieldCounter, setFieldCounter] = useState(
    initialCustomFields?.length || 1
  );

  useEffect(() => {
    setFormData(initialData || {});
    if (initialData?.customFields && Array.isArray(initialData.customFields)) {
      setCustomFields(initialData.customFields);
      setFieldCounter(initialData.customFields.length + 1);
    }
  }, [initialData]);

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: fieldCounter, name: "", value: "", type: "string" },
    ]);
    setFieldCounter(fieldCounter + 1);
  };

  const removeCustomField = (id: number) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleCustomFieldChange = (id: number, key: string, value: any) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
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
      if (field.required && !formData[field.key])
        newErrors[field.key] = "required";
      if (field.type === "email" && formData[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key]))
          newErrors[field.key] = "Invalid email address";
      }
      if (field.type === "number" && formData[field.key] !== undefined) {
        if (isNaN(Number(formData[field.key])))
          newErrors[field.key] = "Must be a number";
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
      <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/70 overflow-auto z-[9999]">
        <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg relative mx-2 sm:mx-6 max-h-[90vh] flex flex-col transition-transform duration-300">
          <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto px-4 py-2 flex-1 flex flex-col gap-3 "
          >
            <div className="grid sm:grid-cols-4 gap-2">
              {fields.map((field) => {
                // --- SECTION ---
                if (field.type === "section") {
                  // Special Fee Section
                  if (field.key === "feeStructure") {
                    const feeFields = [
                      {
                        key: "adminFee",
                        label: "Administrative Fee",
                        typeKey: "adminFeeType",
                      },
                      {
                        key: "applicationFee",
                        label: "Application Fee",
                        typeKey: "applicationFeeType",
                      },
                      {
                        key: "attorneyFee",
                        label: "Attorney Fee",
                        typeKey: "attorneyFeeType",
                      },
                      {
                        key: "brokerFee",
                        label: "Broker Fee",
                        typeKey: "brokerFeeType",
                      },
                      {
                        key: "maintenanceFee",
                        label: "Maintenance Fee",
                        typeKey: "maintenanceFeeType",
                      },
                    ];

                    return (
                     <div key={field.key} className="mt-0 mb-0 col-span-full">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-green-800 border-b pb-0">
                  {field.icon && <span className="text-green-700">{field.icon}</span>}
                  {field.label}
                </h3>

                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {feeFields.map(({ key, label, typeKey }) => {
                    const feeType = formData[typeKey] || "flat";
                    const feeValue = formData[key] || "";

                    const handleFeeChange = (e) => {
                      let value = e.target.value;
                      if (value && isNaN(Number(value))) return;
                      let numValue = Number(value);
                      // if (feeType === "percentage" && numValue > 100) numValue = 100;
                      handleChange(key, numValue);
                    };

                    const toggleFeeType = (newType) => {
                      handleChange(typeKey, newType);
                      // if (newType === "percentage" && Number(formData[key] || 0) > 100) {
                      //   handleChange(key, 100);
                      // }
                    };

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between border rounded-lg px-4 py-2 gap-2 bg-white shadow-sm"
                      >
                        {/* Label */}
                        <label className="font-medium text-gray-700 flex-1 text-sm sm:text-base">
                          {label}
                        </label>

                        {/* Amount Input */}
                        <input
                          type="number"
                          value={feeValue}
                          onChange={handleFeeChange}
                          min={0}
                          // max={feeType === "percentage" ? 100 : undefined}
                          className="border rounded-md px-3 py-2 w-28 text-left focus:ring-2 focus:ring-green-500 focus:outline-none transition no-spinner"
                        />

                        <div className="flex items-center  rounded-md overflow-hidden w-28 h-10 flex-shrink-0 ">
                          {/* Flat */}
                          <div
                            onClick={() => toggleFeeType("flat")}
                            className={`flex-1 flex items-center justify-center border px-2 py-2 cursor-pointer transition ${
                              feeType === "flat"
                                ? "bg-green-700 text-white"
                                : "text-green-700"
                            }`}
                          >
                            <DollarSign className="w-5 h-5 " />
                          </div>

                          {/* Percentage */}
                          <div
                            onClick={() => toggleFeeType("percentage")}
                            className={`flex-1 flex items-center justify-center border px-2 py-2 cursor-pointer transition ${
                              feeType === "percentage"
                                ? "bg-green-700 text-white"
                                : "text-green-700"
                            }`}
                          >
                            <Percent className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

                    );
                  }
                  return (
                    <div
                      key={field.label}
                      className="w-full mt-0 mb-0 col-span-full"
                    >
                      <div className="flex gap-3 items-center text-lg font-semibold text-green-800 border-b border-gray-300 pb-1">
                        <div className="flex items-center gap-3">
                          {field.icon && (
                            <span className="text-green-700">{field.icon}</span>
                          )}
                          {field.label}
                        </div>
                        {field.inlineToggle && (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={!!formData[field.inlineToggle.key]}
                                onChange={(e) =>
                                  handleChange(
                                    field.inlineToggle!.key,
                                    e.target.checked
                                  )
                                }
                                color="success"
                              />
                            }
                            label={field.inlineToggle.label}
                          />
                        )}
                      </div>
                    </div>
                  );
                }

                // --- TOGGLE ---
                if (field.type === "toggle") {
                  if (field.key === "feeType") return null; // skip feeType here

                  // Inside your component:
                  if (field.key === "loanTerms") {
                    const loanTermOptions = [6, 12, 18, 24, 30, 36, 48];

                    // Convert stored array to get the current max selected
                    const maxSelected =
                      Array.isArray(formData.loanTerms) &&
                      formData.loanTerms.length > 0
                        ? Math.max(...formData.loanTerms)
                        : loanTermOptions[0];

                    const currentIndex = Math.max(
                      0,
                      loanTermOptions.indexOf(maxSelected)
                    );

                    const handleSliderChange = (
                      //@ts-ignore
                      event: Event,
                      value: number | number[]
                    ) => {
                      if (typeof value === "number") {
                        const index = Math.round(value);
                        //@ts-ignore
                        const selected = loanTermOptions[index];

                        // Store all values up to the selected index
                        const selectedTerms = loanTermOptions.slice(
                          0,
                          index + 1
                        );

                        handleChange("loanTerms", selectedTerms);
                      }
                    };

                    return (
                      <div
                        key={field.key}
                        className="col-span-full flex flex-col items-start gap-3 px-0 text-sm font-bold text-green-800 border-b border-gray-300 relative mr-5"
                        style={{ overflow: "visible" }}
                      >
                        <Typography className="font-bold text-gray-800 ml-0 pl-0 w-full">
                          {field.label}
                        </Typography>

                        <Slider
                          value={currentIndex}
                          onChange={handleSliderChange}
                          step={0.01}
                          min={0}
                          max={loanTermOptions.length - 1}
                          marks={loanTermOptions.map((month, idx) => ({
                            value: idx,
                            label: `${month}m`,
                          }))}
                          valueLabelDisplay="on"
                          valueLabelFormat={(idx) => `${loanTermOptions[idx]}m`}
                          sx={{
                            color: "green",
                            height: 5,
                            "& .MuiSlider-thumb": {
                              backgroundColor: "white",
                              border: "2px solid green",
                            },
                            "& .MuiSlider-valueLabel": {
                              backgroundColor: "green",
                              color: "white",
                              fontSize: "10px",
                              borderRadius: "10px",
                              top: -2,
                            },
                            "& .MuiSlider-track": { border: "none" },
                            "& .MuiSlider-markLabel": {
                              fontSize: "10px",
                              color: "#374151",
                              paddingLeft: "0px",
                            },
                          }}
                        />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <span className="font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-600">*</span>
                        )}
                      </span>
                      {renderToggle ? (
                        renderToggle(
                          field.key,
                          !!formData[field.key],
                          handleChange
                        )
                      ) : (
                        <Switch
                          checked={!!formData[field.key]}
                          onChange={(e) =>
                            handleChange(field.key, e.target.checked)
                          }
                          color="success"
                        />
                      )}
                      {errors[field.key] && (
                        <span className="text-red-600 text-sm">
                          {errors[field.key]}
                        </span>
                      )}
                    </div>
                  );
                }

                // --- TEXTAREA ---
                if (field.type === "textarea") {
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col sm:col-span-2"
                    >
                      <label className="mb-2 font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <textarea
                        placeholder={field.label}
                        value={formData[field.key] || ""}
                        onChange={(e) =>
                          handleChange(field.key, e.target.value)
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none resize-none w-full"
                        rows={3}
                      />
                      {errors[field.key] && (
                        <span className="text-red-600 text-sm">
                          {errors[field.key]}
                        </span>
                      )}
                    </div>
                  );
                }

                // --- DATE ---
                if (field.type === "date") {
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col text-left py-0"
                    >
                      <label className="mb-2 font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <DatePicker
                        value={
                          formData[field.key]
                            ? moment(formData[field.key], "MM-DD-YYYY")
                            : null
                        }
                        onChange={(date: Moment | null) =>
                          handleChange(
                            field.key,
                            date ? date.format("MM-DD-YYYY") : ""
                          )
                        }
                        // slotProps={{
                        //   textField: {
                        //     error: !!errors[field.key],
                        //     helperText: errors[field.key],
                        //     size: "small",
                        //   },
                        // }}
                      />
                      {errors[field.key] && (
                        <span className="text-red-600 text-sm">
                          {errors[field.key]}
                        </span>
                      )}
                    </div>
                  );
                }

                // --- SELECT ---
                if (field.type === "select" && field.options) {
                  return (
                    <div key={field.key} className="flex flex-col text-left">
                      <label className="mb-2 font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <Autocomplete
                        disablePortal
                        disabled={field.disabled}
                        options={field.options}
                        getOptionLabel={(option) => option.label || ""}
                        value={
                          field.options.find(
                            (opt) => opt.value === formData[field.key]
                          ) || null
                        }
                        //@ts-ignore
                        onChange={(e, newValue) => {
                          handleChange(
                            field.key,
                            newValue ? newValue?.["value"] : ""
                          );
                          field.onChange?.(newValue?.["value"]);
                        }}
                        renderInput={(params) => (
                          <MuiTextField
                            {...params}
                            placeholder={`Select ${field.label}`}
                            error={!!errors[field.key]}
                            helperText={errors[field.key]}
                            size="small"
                          />
                        )}
                      />
                    </div>
                  );
                }
                if (field.type === "color") {
                  return (
                    <div key={field.key} className="flex flex-col text-left">
                      <label className="mb-2 font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <input
                        type="color"
                        value={formData[field.key] || "#777777"}
                        onChange={(e) =>
                          handleChange(field.key, e.target.value)
                        }
                        className="h-10 rounded-lg rounded-lg  focus:ring-2 focus:ring-green-500 focus:outline-none resize-none w-20 p-1"
                      />
                      {errors[field.key] && (
                        <span className="text-red-600 text-sm">
                          {errors[field.key]}
                        </span>
                      )}
                    </div>
                  );
                }
                if (field.type === "number" && field.key === "interestRate") {
                  const interestType = formData.interestType || "flat";
                  const interestValue = formData.interestRate ?? "";

                  const handleInterestChange = (
                    e: React.ChangeEvent<HTMLInputElement>
                  ) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleChange("interestRate", "");
                      return;
                    }
                    const num = Number(value);
                    if (!isNaN(num)) {
                      handleChange("interestRate", num);
                    }
                  };

                  const handleInterestBlur = () => {
                    let num = Number(formData.interestRate);
                    if (isNaN(num)) num = 0;
                    if (num > 100) num = 100;
                    if (num < 0) num = 0;
                    handleChange("interestRate", num);
                  };

                  return (
                    <div
                      key={field.key}
                      className="flex flex-col sm:flex-row  gap-2 items-center"
                    >
                      <div className="flex flex-col flex-2">
                        <label className="font-medium text-gray-700 whitespace-nowrap pb-2">
                          Interest Rate (%){" "}
                          {field.required && (
                            <span className="text-red-600 text-sm">*</span>
                          )}
                        </label>
                        <input
                          type="number"
                          value={interestValue}
                          onChange={handleInterestChange}
                          onBlur={handleInterestBlur}
                          min={0}
                          max={100}
                          step={0.01}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none w-full"
                        />
                        {errors[field.key] && (
                          <span className="text-red-600 text-sm">
                            {errors[field.key]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col flex-2  ">
                        <label className="font-medium text-gray-700 whitespace-nowrap pb-2">
                          Interest Type
                        </label>
                        <select
                          value={interestType}
                          onChange={(e) =>
                            handleChange("interestType", e.target.value)
                          }
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none w-full"
                        >
                          <option value="flat">Flat</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={field.key} className="flex flex-col text-left">
                      <label className="mb-2 font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      {field.type === "password" ? (
                        <div className="relative w-full">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder={field.label}
                            value={formData[field.key] || ""}
                            onChange={(e) =>
                              handleChange(field.key, e.target.value)
                            }
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-green-500 focus:outline-none transition pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </button>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.label}
                          value={formData[field.key] || ""}
                          onChange={(e) =>
                            handleChange(field.key, e.target.value)
                          }
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
                        />
                      )}

                      {errors[field.key] && (
                        <span className="text-red-600 text-sm">
                          {errors[field.key]}
                        </span>
                      )}
                    </div>
                  );
                }
              })}
            
            </div>

            <div className="flex flex-col text-left pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                {children?.[0] && (
                  <div className="sm:col-span-1">{children[0]}</div>
                )}

                {children?.[1] && (
                  <div className="sm:col-span-2">{children[1]}</div>
                )}
              </div>
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
                        handleCustomFieldChange(
                          field.id,
                          "name",
                          e.target.value
                        )
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:ring-2 focus:ring-green-500 transition"
                    />

                    <input
                      type={field.type === "number" ? "number" : "text"}
                      placeholder="Value"
                      value={field.value as string | number}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          field.id,
                          "value",
                          e.target.value
                        )
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:ring-2 focus:ring-green-500 transition"
                    />

                    <select
                      value={field.type}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          field.id,
                          "type",
                          e.target.value
                        )
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 font-bold bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
              ) : null}
              {loading ? "Saving..." : submitButtonText || "Save"}
            </button>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default FormModal;
