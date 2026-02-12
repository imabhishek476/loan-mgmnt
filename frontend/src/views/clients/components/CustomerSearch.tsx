import { useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { LOAN_STATUS_OPTIONS } from "../../../utils/constants";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import moment from "moment";
import { clientStore } from "../../../store/ClientStore";
import { observer } from "mobx-react-lite";

export const CustomerSearch = observer(({ tableRef,open, setOpen }:any) => {
  
    const { clientFilters } = clientStore;
    const [localFilters, setLocalFilters] = useState(clientFilters);
    const [filterActive, setFilterActive] = useState(false);
  const handleReset = () => {
  setFilterActive(false);
    const emptyFilters = {
      name: "",
      email: "",
      phone: "",
      attorneyName: "",
      status: "",
      loanStatus: "",
      issueDate: null,
      dob: null,
      accidentDate: null,
      ssn: "",
      underwriter: "",
      medicalParalegal: "",
      caseId: "",
      caseType: "",
      indexNumber: "",
      uccFiled: "",
    };
    setLocalFilters(emptyFilters);
    clientStore.setClientFilters(emptyFilters);
    tableRef.current?.onQueryChange();
  };
  const onChange = (e: any) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  const FILTER_LABELS = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  attorneyName: "Attorney",
  status: "Customer Status",
  loanStatus: "Payment Status",
  issueDate: "Issue Date",
  dob: "Date Of Birth",
  accidentDate: "Accident Date",
  ssn: "SSN",
  underwriter: "Underwriter",
  medicalParalegal: "Medical Paralegal",
  caseId: "Case ID",
  caseType: "Case Type",
  indexNumber: "Index #",
  uccFiled: "UCC Filed",
};  
  const handleSearch = () => {
    setFilterActive(true);
    clientStore.setClientFilters(localFilters);
    tableRef.current?.onQueryChange();
  };
  return (
    <div className="bg-gray-200  rounded-lg shadow-md mb-4">
      <div className="relative bg-gray-300 px-4 rounded-t-lg border-b-2 border-green-700">
        {filterActive && (
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 ">
            <span className="text-sm text-black font-medium">
              Active Filters : 
            </span>
            {Object.entries(clientFilters).filter(
              ([_, value]) =>
                value !== "" && value !== null && value !== undefined
            ).map(([key, value]) => (
              <span
                key={key}
                className="
                bg-green-700 text-white
                px-1.5 py-0.5
                rounded
                text-xs
                font-semibold
                leading-tight">                 
                {FILTER_LABELS[key] || key} :{" "}

                {key === "uccFiled"
                  ? value === "yes"
                    ? "Yes"
                    : value === "no"
                      ? "No"
                      : value
                  : ["issueDate", "dob", "accidentDate"].includes(key)
                    ? moment(value).format("MM/DD/YYYY")
                    : String(value)}
              </span>
            ))}
          </div>
        )}
        <div className="absolute left-1/2 top-full -translate-x-1/2 translate-y-[-60%]">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="
        w-8 h-8 rounded-full
        bg-green-700 border shadow
        flex items-center justify-center
        hover:bg-green-500 transition
      "
          >
            {open ? (
              <ChevronsUp size={16} className="text-white" />
            ) : (
              <ChevronsDown size={16} className="text-white" />
            )}
          </button>
        </div>

      </div>
        <div className={`bg-gray-200 p-2 rounded-b-lg ${open ? "block" : "hidden"}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2 mb-2">
            <div>
              <label className="font-semibold text-gray-800 text-sm">Name</label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Name"
                name="name"
                value={localFilters.name}
                onChange={onChange}
              />
            </div>

            <div>
              <label className="font-semibold text-gray-800 text-sm">Email</label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Email"
                name="email"
                value={localFilters.email}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">Phone</label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Phone"
                name="phone"
                value={localFilters.phone}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">Attorney</label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Attorney"
                name="attorneyName"
                value={localFilters.attorneyName}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">SSN</label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search SSN"
                name="ssn"
                value={localFilters.ssn}
                onChange={onChange}
              />
            </div>
            <div>
          <label className="font-semibold text-gray-800 text-sm">Payment  Status</label>
              <Autocomplete
                size="small"
                options={LOAN_STATUS_OPTIONS}
                value={localFilters.loanStatus || "All"}
                onChange={(_, value) =>
                  setLocalFilters({
                    ...localFilters,
                    loanStatus: value === "All" ? "" : value || "",
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Loan Status"
                className="border bg-white rounded text-sm w-full h-10"
                InputProps={{
                  ...params.InputProps,
                  className: "p-0 h-10 text-sm",
                }}
                  />
                )}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                Customer Status
              </label>
              <Autocomplete
                size="small"
                options={["Active", "Inactive"]}
                value={localFilters.status || null}
                onChange={(_, value) =>
                  setLocalFilters({ ...localFilters, status: value || "" })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Status"
                className="border bg-white  rounded text-sm w-full h-10"
                InputProps={{
                  ...params.InputProps,
                  className: "p-0 h-10 text-sm", // remove extra padding, same height
                }}
                  />
                )}
              />
            </div>
            <div>
          <label className="font-semibold text-gray-800 text-sm">Issue Date</label>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border bg-white  rounded text-sm w-full h-10",
                  inputProps: { className: "p-0 h-10 text-sm" },
                },
              }}
                value={localFilters.issueDate}
                onChange={(v) => setLocalFilters({ ...localFilters, issueDate: v })}
                />
              </LocalizationProvider>
            </div>
            <div>
          <label className="font-semibold text-gray-800 text-sm">Date Of Birth</label>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border bg-white  rounded text-sm w-full h-10",
                  inputProps: { className: "p-0 h-10 text-sm" },
                },
              }}
                value={localFilters.dob}
                onChange={(v) => setLocalFilters({ ...localFilters, dob: v })}
                />
              </LocalizationProvider>
            </div>
            <div>
          <label className="font-semibold text-gray-800 text-sm">Accident Date</label>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border bg-white  rounded text-sm w-full h-10",
                  inputProps: { className: "p-0 h-10 text-sm" },
                },
              }}
                value={localFilters.accidentDate}
                onChange={(v) => setLocalFilters({ ...localFilters, accidentDate: v })}
                />
              </LocalizationProvider>
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                Underwriter
              </label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Underwriter"
                name="underwriter"
                value={localFilters.underwriter}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                Medical Paralegal
              </label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Medical Paralegal"
                name="medicalParalegal"
                value={localFilters.medicalParalegal}
                 onChange={onChange}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                Case ID
              </label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Case ID"
                name="caseId"
                value={localFilters.caseId}
                onChange={onChange}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                Index #
              </label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Index #"
                name="indexNumber"
                value={localFilters.indexNumber}
                onChange={onChange}

              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                Case Type
              </label>
              <input
                className="border rounded text-sm w-full h-10 px-3"
                placeholder="Search Case Type"
                name="caseType"
                value={localFilters.caseType}
                onChange={onChange}

              />
            </div>
            <div>
              <label className="font-semibold text-gray-800 text-sm">
                UCC Filed
              </label>
              <Autocomplete
                size="small"
                options={["Yes", "No"]}
                value={
                  localFilters.uccFiled === "yes"
                    ? "Yes"
                    : localFilters.uccFiled === "no"
                    ? "No"
                    : null
                }
                onChange={(_, value) =>
                  setLocalFilters({
                    ...localFilters,
                    uccFiled:
                      value === "Yes"
                        ? "yes"
                        : value === "No"
                        ? "no"
                        : "",
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="UCC Filed"
                    className="border bg-white rounded text-sm w-full"
                  />
                )}
              />
            </div>
            <div className="gap-4 mt-6 flex sm:col-span-2">
              <button
                onClick={handleSearch}
                  type="submit"
            title="Submit"
            className="bg-green-700 hover:bg-green-800 transition-all duration-200 text-white px-3 py-2 rounded text-sm font-semibold h-10 w-full"
              >
                Submit
              </button>

              <button
                type="button"
               title="Reset"
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600 transition-all duration-200 text-white px-3 py-2 rounded text-sm font-semibold h-10 w-full"
              >
                Reset
              </button>
            </div>
          </div>
          </form>
        </div>
    </div>
  );
});
export default CustomerSearch;
