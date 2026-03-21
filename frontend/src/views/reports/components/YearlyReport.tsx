import React, { useState, useEffect } from "react";
import reportService from "../../../api/reportService";

interface YearlyReportProps {
  companies: any[];
  years: number[];
}

interface YearlyReportRow {
  companyName: string;
  year: number;
  totalLoans: number;
  totalBaseAmount: string;
  totalFees: string;
  totalInterest: string;
  netProfit: string;
  activeLoanCount: number;
  paidOffCount: number;
}

const YearlyReport: React.FC<YearlyReportProps> = ({ companies, years }) => {
  const [data, setData] = useState<YearlyReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [company, setCompany] = useState("all");
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Exporting state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [company, selectedYears, page, pageSize]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportService.getYearlyReport({
        company: company !== "all" ? company : undefined,
        years: selectedYears.length > 0 ? selectedYears : undefined,
        page,
        pageSize,
      });

      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 0);
        setTotalRecords(response.data.pagination?.totalRecords || 0);
      } else {
        setError("Failed to fetch report data");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching report");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await reportService.exportYearlyReportExcel({
        company: company !== "all" ? company : undefined,
        years: selectedYears.length > 0 ? selectedYears : undefined,
      });
    } catch (err: any) {
      setError(err.message || "Error exporting report");
    } finally {
      setExporting(false);
    }
  };

  const handleYearToggle = (year: number) => {
    setSelectedYears((prev) => {
      const yearStr = year.toString();
      if (prev.includes(yearStr)) {
        return prev.filter((y) => y !== yearStr);
      } else {
        return [...prev, yearStr];
      }
    });
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleReset = () => {
    setCompany("all");
    setSelectedYears([]);
    setPage(1);
  };

  return (
    <div className="report-section">
      <h2>Yearly Reports</h2>
      <p className="report-description">
        Analyze company-wise yearly financial performance and loan metrics
      </p>

      {/* Filters */}
      <div className="report-filters">
        <div className="filter-group">
          <label>Company</label>
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="all">All Companies</option>
            {companies.map((comp) => (
              <option key={comp._id} value={comp._id}>
                {comp.companyName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Years (Select Multiple)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {years.map((year) => (
              <label key={year} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="checkbox"
                  checked={selectedYears.includes(year.toString())}
                  onChange={() => handleYearToggle(year)}
                />
                {year}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="filter-actions">
        <button className="btn btn-primary" onClick={handleReset}>
          Reset Filters
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleExport}
          disabled={exporting || data.length === 0}
        >
          {exporting ? "Exporting..." : "Export to Excel"}
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Loading State */}
      {loading && <div className="loading-message">Loading report data...</div>}

      {/* Table */}
      {!loading && data.length > 0 && (
        <>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Year</th>
                  <th>Total Loans</th>
                  <th>Total Base Amount</th>
                  <th>Total Fees</th>
                  <th>Total Interest</th>
                  <th>Net Profit</th>
                  <th>Active Loans</th>
                  <th>Paid Off</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={`${row.companyName}-${row.year}-${idx}`}>
                    <td>{row.companyName}</td>
                    <td>{row.year}</td>
                    <td>{row.totalLoans}</td>
                    <td>${parseFloat(row.totalBaseAmount).toFixed(2)}</td>
                    <td>${parseFloat(row.totalFees).toFixed(2)}</td>
                    <td>${parseFloat(row.totalInterest).toFixed(2)}</td>
                    <td
                      style={{
                        color: parseFloat(row.netProfit) >= 0 ? "#27ae60" : "#e74c3c",
                        fontWeight: 600,
                      }}
                    >
                      ${parseFloat(row.netProfit).toFixed(2)}
                    </td>
                    <td>{row.activeLoanCount}</td>
                    <td>{row.paidOffCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalRecords)} of {totalRecords} records
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${
                      pageNum === page ? "active" : ""
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="empty-message">
          No yearly reports found with the selected filters
        </div>
      )}
    </div>
  );
};

export default YearlyReport;
