import { observer } from "mobx-react-lite";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { companyStore } from "../../../store/CompanyStore";

interface LoanSearchProps {
  filters: {
    customer: string;
    company: string;
    issueDate: any;
    paymentStatus: string;
    loanStatus: string;
  };
  setFilters: (data: any) => void;
  handleSearch: () => void;
  handleReset: () => void;
}

export const LoanSearch = observer(
  ({ filters, setFilters, handleSearch, handleReset }: LoanSearchProps) => {
    return (
      <div className="bg-gray-200 p-2 rounded-lg shadow-md mb-4">
        <div className="mb-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="font-semibold text-gray-800">Customer</label>
            <input
              type="search"
              placeholder="Customer name..."
              className="border rounded px-2 py-1.5 text-sm w-full focus:ring-1 focus:ring-blue-400 h-[38px]"
              value={filters.customer}
              onChange={(e) =>
                setFilters({ ...filters, customer: e.target.value })
              }
            />
          </div>
          <div>
            <label className="font-semibold text-gray-800">Company</label>
            <Autocomplete
              size="small"
              options={companyStore.companies}
              getOptionLabel={(option) => option.companyName}
              value={
                companyStore.companies.find((c) => c._id === filters.company) ||
                null
              }
              //@ts-ignore
              onChange={(event, value) =>
                setFilters({ ...filters, company: value?._id || "" })
              }
              className="border bg-white rounded text-sm w-full h-10"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select company"
                  sx={{
                    "& .MuiInputBase-root": { height: 38, fontSize: "0.85rem" },
                    "& .MuiInputBase-input": { padding: "6px" },
                  }}
                />
              )}
            />
          </div>
          <div>
            <label className="font-semibold text-gray-800">Issue Date</label>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                value={filters.issueDate}
                onChange={(v) => setFilters({ ...filters, issueDate: v })}
                className="border bg-white rounded text-sm w-full h-10"
                slotProps={{
                  textField: {
                    size: "small",
                    sx: {
                      "& .MuiInputBase-root": {
                        height: 38,
                        padding: "0px 6px",
                      },
                      "& .MuiInputBase-input": {
                        padding: "6px 0",
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
          <div>
            <label className="font-semibold text-gray-800">
              Payment Status
            </label>

            <Autocomplete
              size="small"
              options={[
                "Active",
                "Partial Payment",
                "Paid Off",
                "Merged",
                "Fraud",
                "Lost",
                "Denied",
              ]}
              className="border bg-white rounded text-sm w-full h-10"
              value={filters.paymentStatus || null}
              //@ts-ignore
              onChange={(e, val) =>
                setFilters({ ...filters, paymentStatus: val || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select status"
                  sx={{
                    "& .MuiInputBase-root": { height: 38, fontSize: "0.85rem" },
                  }}
                />
              )}
            />
          </div>
          <div>
            <label className="font-semibold text-gray-800">Loan Status</label>

            <Autocomplete
              size="small"
              options={["Active", "Deactivated"]}
              className="border bg-white rounded text-sm w-full h-10"
              value={filters.loanStatus || null}
              //@ts-ignore
              onChange={(e, val) =>
                setFilters({ ...filters, loanStatus: val || "" })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select loan status"
                  sx={{
                    "& .MuiInputBase-root": { height: 38, fontSize: "0.85rem" },
                  }}
                />
              )}
            />
          </div>
          <div className="flex gap-2 items-end">
            <button
              title="Submit"
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-2.5 text-sm rounded w-full font-semibold"
              onClick={handleSearch}
            >
              Submit
            </button>

            <button
              title="Reset"
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2.5 text-sm rounded w-full font-semibold"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default LoanSearch;
