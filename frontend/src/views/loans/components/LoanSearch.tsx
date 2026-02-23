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
    const smallLabel = {
      sx: { fontSize: 14 }
    };
    const compactFieldSx = {
      "& .MuiInputBase-root": {
        height: 40, 
        backgroundColor: "#fff!important", 
      },
      "& .MuiInputBase-input": {
        padding: "4px 6px", 
        fontSize: 12.5,
      },
      "& .MuiInputLabel-root": {
        fontSize: 13,   
      },
      "& .MuiInputAdornment-root": {
        margin: 0, 
      },
      "& .MuiSvgIcon-root": {
        fontSize: 16,
      },
      "& .MuiIconButton-root": {
        padding: 1,
      },
      "& .MuiPickersInputBase-root":{
        backgroundColor: "#fff!important",
      }
    };
    return (
      <div className="bg-gray-300  py-2 px-2 rounded-lg ">
       <div className="mb-0 grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <TextField
          size="small"
          label="Client"
          name="customer"
          color="success"
          value={filters.customer}
          onChange={(e) =>
            setFilters({ ...filters, customer: e.target.value })
          }
        fullWidth
            sx={compactFieldSx}
            slotProps={{ inputLabel: smallLabel }}  
        />
  <Autocomplete
    size="small"
    options={companyStore.companies}
    getOptionLabel={(option) => option.companyName}
    value={
      companyStore.companies.find((c) => c._id === filters.company) || null
    }
    onChange={(_event, value) =>
      setFilters({ ...filters, company: value?._id || "" })
    }
    renderInput={(params) => (
      <TextField
        {...params}
        label="Company"
        size="small"
        color="success"
        placeholder="Select company"
        sx={compactFieldSx}
        slotProps={{ inputLabel: smallLabel }}
      />
    )}
  />
  <Autocomplete
    options={[
      "Active",
      "Partial Payment",
      "Paid Off",
      "Merged",
      "Fraud",
      "Lost",
      "Denied",
    ]}
    value={filters.paymentStatus || null}
    onChange={(_e, val) =>
      setFilters({ ...filters, paymentStatus: val || "" })
    }
    renderInput={(params) => (
      <TextField
        {...params}
        size="small"
        color="success"
        label="Payment Status"
        placeholder="Select status"
        sx={compactFieldSx}
        slotProps={{ inputLabel: smallLabel }}
      />
    )}
  />

  <Autocomplete
    options={["Active", "Deactivated"]}
    value={filters.loanStatus || null}
    onChange={(_e, val) =>
      setFilters({ ...filters, loanStatus: val || "" })
    }
    renderInput={(params) => (
      <TextField
        {...params}
        color="success"
        size="small"
        label="Loan Status"
        placeholder="Select loan status"
        sx={compactFieldSx}
        slotProps={{ inputLabel: smallLabel }}
      />
    )}
  />
  <LocalizationProvider dateAdapter={AdapterMoment}>
    <DatePicker
      label="Issue Date"
      value={filters.issueDate}
      onChange={(v) => setFilters({ ...filters, issueDate: v })}
      slotProps={{
        textField: {
        size:"small",
        color:"success",
          fullWidth: true,
           sx :compactFieldSx,
        slotProps:{ inputLabel: smallLabel }
        },
      }}
    />
  </LocalizationProvider>
   <div className="flex gap-2 items-end">
            <button
              title="Submit"
              className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 text-sm rounded w-full font-semibold"
              onClick={handleSearch}
            >
              Submit
            </button>

            <button
              title="Reset"
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 text-sm rounded w-full font-semibold"
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
