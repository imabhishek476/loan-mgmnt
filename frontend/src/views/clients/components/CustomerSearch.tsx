import { useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { LOAN_STATUS_OPTIONS } from "../../../utils/constants";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { clientStore } from "../../../store/ClientStore";
import { observer } from "mobx-react-lite";

export const CustomerSearch = observer(({ tableRef }:any) => {

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
      latestLoanStatus: "",
      allLoanStatus: "",
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
  status: "Client Status",
  allLoanStatus: "All Payment Status",
  latestLoanStatus: "Latest Payment Status",
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
  const smallLabel = {
    sx: { fontSize: 13 }
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
    <div className=" bg-gray-300 rounded-lg mb-3">
      <div className="relative  px-2 rounded-t-lg ">
        <div
          className={`
    transition-all duration-300 ease-in-out
    overflow-hidden
    ${filterActive ? "h-7 opacity-100" : "h-0 opacity-0"}
  `}
        >
          <div className="flex flex-wrap items-center gap-2 px-2 py-1">
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
            px-1 
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
        </div>
      </div>
      <div className={` px-2  rounded-b-lg`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
         <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 mb-1 pt-2">
  <div>
    <TextField
      size="small"
      label="Name"
      name="name"
      color="success"
      value={localFilters.name}
      onChange={onChange}
      fullWidth
      sx={compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
    />
  </div>

  <div>
    <TextField
      size="small"
      label="Email"
      name="email"
      color="success"
      value={localFilters.email}
      onChange={onChange}
      sx={compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      label="Phone"
      color="success"
      name="phone"
      value={localFilters.phone}
      onChange={onChange}
      sx={compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      label="Attorney"
      color="success"
      name="attorneyName"
      value={localFilters.attorneyName}
      onChange={onChange}
      sx={compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      label="SSN"
      name="ssn"
      color="success"
      value={localFilters.ssn}
      onChange={onChange}
      sx={compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <Autocomplete
      size="small"
      color="success"
      options={LOAN_STATUS_OPTIONS}
      value={localFilters.allLoanStatus || ""}
      onChange={(_, value) =>
        setLocalFilters({
          ...localFilters,
          allLoanStatus: value === "All" ? "" : value || "",
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="All Payment Status"
          sx={compactFieldSx}
          slotProps={{ inputLabel: smallLabel }}
          fullWidth
        />
      )}
    />
  </div>
   <div>
    <Autocomplete
      size="small"
      color="success"
      options={LOAN_STATUS_OPTIONS}
      value={localFilters.loanStatus || ""}
       onChange={(_, value) =>
        setLocalFilters({
          ...localFilters,
          latestLoanStatus: value === "All" ? "" : value || "",
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Latest Payment Status"
          sx={compactFieldSx}
          slotProps={{ inputLabel: smallLabel }}
          fullWidth
        />
      )}
    />
  </div>
  <div>
    <Autocomplete
      size="small"
      color="success"
      options={["Active", "Inactive"]}
      value={localFilters.status || null}
      onChange={(_, value) =>
        setLocalFilters({ ...localFilters, status: value || "" })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Client Status"
          sx={compactFieldSx}
          slotProps={{ inputLabel: smallLabel }}
          fullWidth
        />
      )}
    />
  </div>
  <div>
    <LocalizationProvider dateAdapter={AdapterMoment}>
     <DatePicker
      label="Issue Date"
      value={localFilters.issueDate}
      onChange={(v) =>
        setLocalFilters({ ...localFilters, issueDate: v })
      } 
       slotProps={{
      textField: {
        size: "small",
        fullWidth: true,
        sx: compactFieldSx,
      },
    }}
/>
    </LocalizationProvider>
  </div>
  <div>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        label="Date Of Birth"
        value={localFilters.dob}
        onChange={(v) =>
          setLocalFilters({ ...localFilters, dob: v })
        }
        slotProps={{
          textField: {
            color: "success",
            size: "small",
            sx: compactFieldSx,            
            slotProps: { inputLabel: smallLabel },
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  </div>
  <div>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        label="Accident Date"        
        value={localFilters.accidentDate}
        onChange={(v) =>
          setLocalFilters({ ...localFilters, accidentDate: v })
        }
        slotProps={{
          textField: {
            color: "success",
            size: "small",
            sx: compactFieldSx,
            slotProps: { inputLabel: smallLabel },
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  </div>
  <div>
    <TextField
      size="small"
      color="success"
      label="Underwriter"
      name="underwriter"
      value={localFilters.underwriter}
      onChange={onChange}
      sx = {compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      color="success"
      label="Medical Paralegal"
      name="medicalParalegal"
      value={localFilters.medicalParalegal}
      onChange={onChange}
      sx = {compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      color="success"
      label="Case ID"
      name="caseId"
      value={localFilters.caseId}
      onChange={onChange}
      sx = {compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      color="success"
      label="Index #"
      name="indexNumber"
      value={localFilters.indexNumber}
      onChange={onChange}
      sx = {compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <TextField
      size="small"
      color="success"
      label="Case Type"
      name="caseType"
      value={localFilters.caseType}
      onChange={onChange}
      sx = {compactFieldSx}
      slotProps={{ inputLabel: smallLabel }}
      fullWidth
    />
  </div>
  <div>
    <Autocomplete
      size="small"
      color="success"
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
          size="small"
          color="success"
          label="UCC Filed"
          sx = {compactFieldSx}
          slotProps={{ inputLabel: smallLabel }}
          fullWidth
        />
      )}
    />
  </div>
  <div className="gap-2 mt-0 flex sm:col-span-1">
    <button
      onClick={handleSearch}
      type="submit"
      title="Submit"
      className="bg-green-700 hover:bg-green-800 transition-all duration-200 text-white px-2 py-2 rounded text-sm font-semibold h-10 w-full"
    >
      Submit
    </button>

    <button
      type="button"
      title="Reset"
      onClick={handleReset}
      className="bg-gray-500 hover:bg-gray-600 transition-all duration-200 text-white px-1 py-2 rounded text-sm font-semibold h-10 w-full"
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
