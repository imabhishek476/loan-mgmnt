import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, TextField } from "@mui/material";

interface FraudulentLoanReportProps {
  companies: any[];
  years: number[];
}

const smallLabel = {
  sx: { fontSize: 13 }
}; 

const compactFieldSx = {
  "& .MuiInputBase-root": { height: 40, backgroundColor: "#fff!important" },
  "& .MuiInputBase-input": { padding: "4px 6px", fontSize: 12.5 },
  "& .MuiInputLabel-root": { fontSize: 13 },
  "& .MuiInputAdornment-root": { margin: 0 },
  "& .MuiSvgIcon-root": { fontSize: 16 },
  "& .MuiIconButton-root": { padding: 1 },
  "& .MuiPickersInputBase-root":{ backgroundColor: "#fff!important" }
};

const FraudulentLoanReport: React.FC<FraudulentLoanReportProps> = ({
  companies,
  years,
}) => {
  const navigate = useNavigate();

  // Filter state
  const [company, setCompany] = useState("all");
  const [status, setStatus] = useState("all");
  const [year, setYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleReset = () => {
    setCompany("all");
    setStatus("all");
    setYear("");
    setStartDate("");
    setEndDate("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate("/reports/fraud-result", {
      state: { company, status, year, startDate, endDate }
    });
  };

  return (
    <div className="rounded-lg mb-3">
      <div className="px-2 rounded-b-lg p-3">
        <h2 className="text-lg font-bold text-gray-800 mb-2 text-left">Status Report Filters</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 mb-1 pt-2">
            <div>
              <Autocomplete
                size="small"
                options={[{_id: "all", companyName: "All Companies"}, ...companies]}
                getOptionLabel={(option) => option.companyName || ""}
                value={
                  company === "all" 
                    ? { _id: "all", companyName: "All Companies" } 
                    : companies.find((c) => c._id === company) || null
                }
                onChange={(_, value) => setCompany(value?._id || "all")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company"
                    color="success"
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
                options={["All Statuses", "Active", "Paid Off", "Partial Payment", "Fraud", "Lost", "Denied", "Merged"]}
                value={status === "all" ? "All Statuses" : status}
                onChange={(_, value) => setStatus(value === "All Statuses" || !value ? "all" : value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Status"
                    color="success"
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
                freeSolo
                options={years.map(y => y.toString())}
                value={year || ""}
                onChange={(_, value) => setYear(value || "")}
                onInputChange={(_, value) => setYear(value || "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Year"
                    color="success"
                    sx={compactFieldSx}
                    slotProps={{ inputLabel: smallLabel }}
                    fullWidth
                  />
                )}
              />
            </div>
            
            <div>
              <TextField
                type="date"
                label="Start Date"
                size="small"
                color="success"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={compactFieldSx}
                slotProps={{ inputLabel: { shrink: true, ...smallLabel.sx } }}
                fullWidth
              />
            </div>

            <div>
              <TextField
                type="date"
                label="End Date"
                size="small"
                color="success"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={compactFieldSx}
                slotProps={{ inputLabel: { shrink: true, ...smallLabel.sx } }}
                fullWidth
              />
            </div>

            <div className="gap-2 flex sm:col-span-1">
              <button
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
};

export default FraudulentLoanReport;

