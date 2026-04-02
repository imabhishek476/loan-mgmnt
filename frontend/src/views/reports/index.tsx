import React, { useState, useEffect } from "react";
import "./Reports.css";
import FraudulentLoanReport from "./components/FraudulentLoanReport";
import YearlyReport from "./components/YearlyReport";
import BrokerFeeReport from "./components/BrokerFeeReport";
import reportService from "../../api/reportService";
import { Autocomplete, TextField } from "@mui/material";
import { AlertTriangle, Calendar, DollarSign, Files } from "lucide-react";

type TabType = "fraudulent" | "yearly" | "brokerFee";

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    return tab as TabType || "fraudulent";
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [companiesRes, yearsRes] = await Promise.all([
        reportService.getCompanies(),
        reportService.getYears(),
      ]);

      if (companiesRes.data.success) {
        setCompanies(companiesRes.data.data);
      }
      if (yearsRes.data.success) {
        setYears(yearsRes.data.data);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const tabs = [
    { key: "fraudulent", label: "Status Report", icon: <AlertTriangle size={18} /> },
    { key: "yearly", label: "Annual Report", icon: <Calendar size={18} /> },
    { key: "brokerFee", label: "Fee Report", icon: <DollarSign size={18} /> },
  ];

  return (
    <div className="flex flex-col transition-all duration-300">
      <div className="mb-1 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-800 font-bold flex items-center gap-1">
              <Files size={25} className="text-green-600" />
                  Reports
          </h1>
          <p className="text-gray-600 text-base text-left">
            View detailed reports on loans, fees, and financial metrics
          </p>
        </div>
      </div>

      <div className="mt-2 mb-6">
        {/* Mobile Dropdown Tab Selector */}
        <div className="sm:hidden">
          <Autocomplete
            size="small"
            options={tabs}
            getOptionLabel={(option) => option.label}
            value={tabs.find((t) => t.key === activeTab) || null}
            onChange={(_, newValue) => {
              if (newValue) {
                setActiveTab(newValue.key as TabType);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Select Tab" variant="outlined" />
            )}
          />
        </div>

        {/* Desktop Sliding Tabs */}
        <div className="hidden sm:flex justify-start">
          <div
            className="relative grid bg-gray-200 border border-gray-300 rounded-lg p-1 shadow-sm w-full"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {/* Active Slider */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-green-800 transition-all duration-300 ease-in-out"
              style={{
                width: `calc(100% / ${tabs.length})`,
                transform: `translateX(${
                  tabs.findIndex((t) => t.key === activeTab) * 100
                }%)`,
              }}
            />

            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  urlParams.set("tab", tab.key);
                  window.history.pushState({}, "", `?${urlParams.toString()}`);
                  setActiveTab(tab.key as TabType)
                }}
                className={`relative z-10 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
                  activeTab === tab.key
                    ? "text-white"
                    : "text-gray-700 hover:text-green-700"
                }`}
              >
                {tab.icon}
                <span className="text-sm whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="reports-content">
        {!isLoadingFilters ? (
          <>
            {activeTab === "fraudulent" && (
              <FraudulentLoanReport companies={companies} years={years} />
            )}
            {activeTab === "yearly" && (
              <YearlyReport companies={companies} years={years} />
            )}
            {activeTab === "brokerFee" && (
              <BrokerFeeReport companies={companies} years={years} />
            )}
          </>
        ) : (
          <div className="loading-spinner">
            <p>Loading reports...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
