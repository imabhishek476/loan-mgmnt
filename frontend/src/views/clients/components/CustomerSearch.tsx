import { Autocomplete, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { LOAN_STATUS_OPTIONS } from "../../../utils/constants";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

export const CustomerSearch = ({ tableRef, filters, setFilters }) => {
  const handleReset = () => {
    setFilters({
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
    });
    tableRef.current?.onQueryChange();
  };
  const handleSearch = () => {
    tableRef.current?.onQueryChange();
  };
  return (
    <div className="bg-gray-200 p-2 rounded-lg shadow-md mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-2">
        <div>
          <label className="font-semibold text-gray-800">Name</label>
          <input
            className="border rounded text-sm w-full h-10 px-3"
            placeholder="Search Name"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>

        <div>
          <label className="font-semibold text-gray-800">Email</label>
          <input
            className="border rounded text-sm w-full h-10 px-3"
            placeholder="Search Email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
          />
        </div>
        <div>
          <label className="font-semibold text-gray-800">Phone</label>
          <input
            className="border rounded text-sm w-full h-10 px-3"
            placeholder="Search Phone"
            value={filters.phone}
            onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="font-semibold text-gray-800">Attorney</label>
          <input
            className="border rounded text-sm w-full h-10 px-3"
            placeholder="Search Attorney"
            value={filters.attorneyName}
            onChange={(e) =>
              setFilters({ ...filters, attorneyName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="font-semibold text-gray-800">SSN</label>
          <input
            className="border rounded text-sm w-full h-10 px-3"
            placeholder="Search SSN"
            value={filters.ssn}
            onChange={(e) => setFilters({ ...filters, ssn: e.target.value })}
          />
        </div>
        <div>
          <label className="font-semibold text-gray-800">Payment  Status</label>
          <Autocomplete
            size="small"
            options={LOAN_STATUS_OPTIONS}
            value={filters.loanStatus || "All"}
            onChange={(_, value) =>
              setFilters({
                ...filters,
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
          <label className="font-semibold text-gray-800">Status</label>
          <Autocomplete
            size="small"
            options={["Active", "Inactive"]}
            value={filters.status || null}
            onChange={(_, value) =>
              setFilters({ ...filters, status: value || "" })
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
          <label className="font-semibold text-gray-800">Issue Date</label>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border bg-white  rounded text-sm w-full h-10",
                  inputProps: { className: "p-0 h-10 text-sm" },
                },
              }}
              value={filters.issueDate}
              onChange={(v) => setFilters({ ...filters, issueDate: v })}
            />
          </LocalizationProvider>
        </div>
        <div>
          <label className="font-semibold text-gray-800">Date Of Birth</label>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border bg-white  rounded text-sm w-full h-10",
                  inputProps: { className: "p-0 h-10 text-sm" },
                },
              }}
              value={filters.dob}
              onChange={(v) => setFilters({ ...filters, dob: v })}
            />
          </LocalizationProvider>
        </div>
        <div>
          <label className="font-semibold text-gray-800">Accident Date</label>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              slotProps={{
                textField: {
                  size: "small",
                  className: "border bg-white  rounded text-sm w-full h-10",
                  inputProps: { className: "p-0 h-10 text-sm" },
                },
              }}
              value={filters.accidentDate}
              onChange={(v) => setFilters({ ...filters, accidentDate: v })}
            />
          </LocalizationProvider>
        </div>
        <div className="gap-4 mt-6 flex">
          <button
            onClick={handleSearch}
            title="Submit"
            className="bg-green-700 hover:bg-green-800 transition-all duration-200 text-white px-3 py-2 rounded text-sm font-semibold h-10 w-full"
          >
            Submit
          </button>

          <button
            title="Reset"
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 transition-all duration-200 text-white px-3 py-2 rounded text-sm font-semibold h-10 w-full"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomerSearch;
