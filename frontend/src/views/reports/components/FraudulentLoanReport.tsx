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
  "& .MuiInputBase-root": { minHeight: 40, backgroundColor: "#fff!important" },
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
  const [company, setCompany] = useState<any[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleReset = () => {
    setCompany([]);
    setStatus([]);
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
                multiple
                size="small"
                options={companies}
                getOptionLabel={(option) => option.companyName || ""}
                value={company}
                onChange={(_, value) => setCompany(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Companies"
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
                multiple
                size="small"
                options={["Active", "Paid Off", "Partial Payment", "Fraud", "Lost", "Denied", "Merged"]}
                value={status}
                onChange={(_, value) => setStatus(value)}
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
                disabled={!!startDate || !!endDate}
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
                disabled={!!year}
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
                disabled={!!year}
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

