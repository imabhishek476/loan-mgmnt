import React, { useState, useEffect } from "react";
import reportService from "../../../api/reportService";

interface BrokerFeeReportProps {
  companies: any[];
  years: number[];
}

interface BrokerFeeReportRow {
  companyName: string;
  totalBrokerFees: string;
  loanCount: number;
  averageFeePerLoan: string;
}

const BrokerFeeReport: React.FC<BrokerFeeReportProps> = ({ companies, years }) => {
  const [data, setData] = useState<BrokerFeeReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [company, setCompany] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Exporting state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [company, startDate, endDate, page, pageSize]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportService.getBrokerFeeReport({
        company: company !== "all" ? company : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
      await reportService.exportBrokerFeeReportExcel({
        company: company !== "all" ? company : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Error exporting report");
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleReset = () => {
    setCompany("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="report-section">
      <h2>Broker Fee Report</h2>
      <p className="report-description">
        Track broker fees by company with date range filtering and fee analytics
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
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
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
                  <th>Total Broker Fees</th>
                  <th>Loan Count</th>
                  <th>Average Fee Per Loan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={`${row.companyName}-${idx}`}>
                    <td>{row.companyName}</td>
                    <td style={{ fontWeight: 600, color: "#ed7d31" }}>
                      ${parseFloat(row.totalBrokerFees).toFixed(2)}
                    </td>
                    <td>{row.loanCount}</td>
                    <td>${parseFloat(row.averageFeePerLoan).toFixed(2)}</td>
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
          No broker fees found with the selected filters
        </div>
      )}
    </div>
  );
};

export default BrokerFeeReport;
