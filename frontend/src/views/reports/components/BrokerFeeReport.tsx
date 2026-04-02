import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

interface BrokerFeeReportProps {
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

const BrokerFeeReport: React.FC<BrokerFeeReportProps> = ({ companies }) => {
  const navigate = useNavigate();

  // Filter state
  const [company, setCompany] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<any>(null);
  const [endDate, setEndDate] = useState<any>(null);
  const [feeType, setFeeType] = useState<any[]>([]);

  const feeOptions = [
    { value: "brokerFee", label: "Broker Fee" },
    { value: "applicationFee", label: "Application Fee" },
    { value: "administrativeFee", label: "Administrative Fee" },
    { value: "attorneyReviewFee", label: "Attorney Review Fee" },
    { value: "annualMaintenanceFee", label: "Annual Maint. Fee" }
  ];

  const handleReset = () => {
    setCompany([]);
    setStartDate(null);
    setEndDate(null);
    setFeeType([]);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate("/reports/broker-fee-result", {
      state: { 
        company, 
        feeType,
        startDate: startDate ? moment(startDate).format("YYYY-MM-DD") : "", 
        endDate: endDate ? moment(endDate).format("YYYY-MM-DD") : "" 
      }
    });
  };

  return (
    <div className="rounded-lg mb-3">
      <div className="px-2 rounded-b-lg p-3">
        <h2 className="text-lg font-bold text-gray-800 mb-2 text-left">Fee Report Filters</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 mb-1 pt-2">
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
                options={feeOptions}
                getOptionLabel={(option) => option.label || ""}
                value={feeType}
                onChange={(_, value) => setFeeType(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fee Types"
                    color="success"
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
                  label="Start Date"
                  value={startDate}
                  onChange={(v) => setStartDate(v)} 
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: compactFieldSx,
                      color: "success"
                    },
                  }}
                />
              </LocalizationProvider>
            </div>

            <div>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(v) => setEndDate(v)} 
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: compactFieldSx,
                      color: "success"
                    },
                  }}
                />
              </LocalizationProvider>
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

export default BrokerFeeReport;

