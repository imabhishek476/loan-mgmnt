import React, { useState, useEffect } from "react";
import "./Reports.css";
import FraudulentLoanReport from "./components/FraudulentLoanReport";
import YearlyReport from "./components/YearlyReport";
import BrokerFeeReport from "./components/BrokerFeeReport";
import reportService from "../../api/reportService";

type TabType = "fraudulent" | "yearly" | "brokerFee";

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("fraudulent");
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

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports</h1>
        <p>View detailed reports on loans, fees, and financial metrics</p>
      </div>

      <div className="reports-tabs">
        <button
          className={`tab-button ${activeTab === "fraudulent" ? "active" : ""}`}
          onClick={() => setActiveTab("fraudulent")}
        >
          Fraudulent Loan Report
        </button>
        <button
          className={`tab-button ${activeTab === "yearly" ? "active" : ""}`}
          onClick={() => setActiveTab("yearly")}
        >
          Yearly Reports
        </button>
        <button
          className={`tab-button ${activeTab === "brokerFee" ? "active" : ""}`}
          onClick={() => setActiveTab("brokerFee")}
        >
          Broker Fee Report
        </button>
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
