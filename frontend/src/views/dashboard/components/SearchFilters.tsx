// components/filters/SearchFilters.tsx
import {
  Autocomplete,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { companyStore } from "../../../store/CompanyStore";

const SearchFilters = ({
  filters,
  setFilters,
  viewMode,
  handleSearch,
  handleReset,
}: any) => {
  const companyOptions = companyStore.companies.map((c) => ({
    label: c.companyName,
    value: c._id,
  }));

  return (
    <>
      {/* Filters */}
      {viewMode === "graph" && (
        <div className="p-4 rounded-xl mb-4 flex flex-wrap gap-6">
          {/* Company */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-800 mb-1">Company</label>
            <Autocomplete
              options={companyOptions}
              sx={{ width: 250 }}
              value={
                companyOptions.find((c: any) => c.value === filters.company) ||
                null
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select Company"
                  size="small"
                />
              )}
              onChange={(_, newVal) =>
                setFilters({ ...filters, company: newVal?.value || "" })
              }
            />
          </div>

          {/* From Date */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-800 mb-1">
              From Date
            </label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={filters.fromDate}
                maxDate={filters.toDate}
                onChange={(v) => setFilters({ ...filters, fromDate: v })}
                slotProps={{
                  textField: {
                    size: "small",
                    className: "border bg-white rounded text-sm h-10",
                    inputProps: { className: "p-0 h-10 text-sm" },
                  },
                }}
              />
            </LocalizationProvider>
          </div>

          {/* To Date */}
          <div className="flex flex-col">
            <label className="font-semibold text-gray-800 mb-1">To Date</label>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={filters.toDate}
                minDate={filters.fromDate}
                onChange={(v) => setFilters({ ...filters, toDate: v })}
                slotProps={{
                  textField: {
                    size: "small",
                    className: "border bg-white rounded text-sm h-10",
                    inputProps: { className: "p-0 h-10 text-sm" },
                  },
                }}
              />
            </LocalizationProvider>
          </div>

          {/* Search */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleSearch}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-semibold text-sm h-10"
            >
              Submit
            </button>
          </div>

          {/* Reset */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold text-sm h-10"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchFilters;
