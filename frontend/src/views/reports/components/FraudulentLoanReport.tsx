import React, { useState, useEffect } from "react";
import reportService from "../../../api/reportService";

interface FraudulentLoanReportProps {
  companies: any[];
  years: number[];
}

interface ReportRow {
  _id: string;
  loanId: string;
  clientName: string;
  companyName: string;
  baseAmount: number;
  status: string;
  issueDate: string;
  totalFees: string;
}

const FraudulentLoanReport: React.FC<FraudulentLoanReportProps> = ({
  companies,
  years,
}) => {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [company, setCompany] = useState("all");
  const [status, setStatus] = useState("Fraud");
  const [year, setYear] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  // Exporting state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [company, status, year, page, pageSize]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportService.getFraudulentReport({
        company: company !== "all" ? company : undefined,
        status: status !== "all" ? status : undefined,
        year: year || undefined,
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
      await reportService.exportFraudulentReportExcel({
        company: company !== "all" ? company : undefined,
        status: status !== "all" ? status : undefined,
        year: year || undefined,
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
    setStatus("Fraud");
    setYear("");
    setPage(1);
  };

  return (
    <div className="report-section">
      <h2>Fraudulent Loan Report</h2>
      <p className="report-description">
        View loans marked as fraudulent, lost, or denied with detailed information
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
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Fraud">Fraud</option>
            <option value="Lost">Lost</option>
            <option value="Denied">Denied</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
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
                  <th>Loan ID</th>
                  <th>Client Name</th>
                  <th>Company</th>
                  <th>Base Amount</th>
                  <th>Total Fees</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row._id}>
                    <td>{row.loanId}</td>
                    <td>{row.clientName}</td>
                    <td>{row.companyName}</td>
                    <td>${parseFloat(row.baseAmount as any).toFixed(2)}</td>
                    <td>${row.totalFees}</td>
                    <td>
                      <span
                        style={{
                          backgroundColor:
                            row.status === "Fraud"
                              ? "#fee"
                              : row.status === "Lost"
                              ? "#ffd"
                              : "#eee",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.issueDate}</td>
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
          No fraudulent loans found with the selected filters
        </div>
      )}
    </div>
  );
};

export default FraudulentLoanReport;
