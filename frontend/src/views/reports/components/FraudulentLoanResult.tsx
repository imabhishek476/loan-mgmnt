import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MaterialTable from "@material-table/core";
import { Box, Button, Typography, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import reportService from "../../../api/reportService";

const FraudulentLoanResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { company: any[]; status: string[]; year: string; startDate: string; endDate: string } | null;
  const tableRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [summary, setSummary] = useState<{ totalAmount: number; totalLoans: number } | null>(null);

  useEffect(() => {
    if (!state) {
      navigate("/reports?tab=fraudulent");
    }
  }, [state, navigate]);

  if (!state) return null;

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await reportService.exportFraudulentReportExcel({
        company: state.company && state.company.length > 0 ? state.company.map(c => c._id).join(",") : undefined,
        status: state.status && state.status.length > 0 ? state.status.join(",") : undefined,
        year: state.year || undefined,
        startDate: state.startDate || undefined,
        endDate: state.endDate || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Error exporting report");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await reportService.exportFraudulentReportPdf({
        company: state.company && state.company.length > 0 ? state.company.map(c => c._id).join(",") : undefined,
        status: state.status && state.status.length > 0 ? state.status.join(",") : undefined,
        year: state.year || undefined,
        startDate: state.startDate || undefined,
        endDate: state.endDate || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Error exporting report to PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const columns = [
    { title: "Loan ID", field: "loanId" },
    { title: "Client Name", field: "clientName" },
    { title: "Company", field: "companyName" },
    { title: "Base Amount", render: (rd: any) => `$${parseFloat(rd.baseAmount || 0).toFixed(2)}` },
    { title: "Total Fees", render: (rd: any) => `$${rd.totalFees}` },
    {
      title: "Status",
      render: (rd: any) => (
        <Box
          component="span"
          sx={{
            backgroundColor: rd.status === "Fraud" ? "#fee" : rd.status === "Lost" ? "#ffd" : "#eee",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {rd.status}
        </Box>
      )
    },
    { title: "Issue Date", field: "issueDate" }
  ];

  return (
    <Box sx={{ p: 1, width: '100%', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/reports?tab=fraudulent")} variant="outlined">
            Back to Filters
          </Button>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Status Report Results
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<FileDownloadIcon />} 
            onClick={handleExportExcel}
            disabled={exportingExcel || exportingPdf || !hasData}
          >
            {exportingExcel ? "Exporting..." : "Excel Export"}
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<PictureAsPdfIcon />} 
            onClick={handleExportPdf}
            disabled={exportingExcel || exportingPdf || !hasData} 
            title="PDF Export"
          >
            {exportingPdf ? "Exporting..." : "PDF Export"}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {summary && hasData && (
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            minWidth: 200,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
              Total Amount
            </Typography>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              ${(summary.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            minWidth: 200,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom>
              Affected Loans
            </Typography>
            <Typography variant="h5" color="primary.main" fontWeight="bold">
              {summary.totalLoans}
            </Typography>
            <span style={{fontSize: "12px", color: "#64748b"}}>(Fraud, Lost, Denied)</span>
          </Box>
        </Box>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white mt-4">
        <MaterialTable
          tableRef={tableRef}
          title={null}
          columns={columns}
          data={(query) =>
            new Promise(async (resolve) => {
               try {
                 const response = await reportService.getFraudulentReport({
                   company: state.company && state.company.length > 0 ? state.company.map(c => c._id).join(",") : undefined,
                   status: state.status && state.status.length > 0 ? state.status.join(",") : undefined,
                   year: state.year || undefined,
                   startDate: state.startDate || undefined,
                   endDate: state.endDate || undefined,
                   page: query.page + 1,
                   pageSize: query.pageSize,
                 });
                 if (response.data.success) {
                   setHasData(response.data.data.length > 0);
                   if (response.data.summary) {
                     setSummary(response.data.summary);
                   }
                   resolve({
                     data: response.data.data,
                     page: query.page,
                     totalCount: response.data.pagination?.totalRecords || 0,
                   });
                 } else {
                   setError("Failed to fetch report data");
                   setHasData(false);
                   resolve({ data: [], page: 0, totalCount: 0 });
                 }
               } catch (err: any) {
                 setError(err.message || "Error fetching report");
                 setHasData(false);
                 resolve({ data: [], page: 0, totalCount: 0 });
               }
            })
          }
          options={{
            paging: true,
            pageSize: 20,
            pageSizeOptions: [10, 20, 50, 100],
            sorting: false,
            search: false,
            headerStyle: {
              position: "sticky",
              fontWeight: "600",
              backgroundColor: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              height: 36,
              padding: "6px 8px",
              borderBottom: "1px solid #e5e7eb",
              whiteSpace: "nowrap",
              top: 0,
              zIndex: 30,
            },
            maxBodyHeight: "calc(100vh - 250px)",
            minBodyHeight: "calc(100vh - 250px)",
            rowStyle: {
              fontSize: "13px",
              height: 38,
              borderBottom: "1px solid #f1f1f1",
              transition: "background 0.2s",
            },
            padding: "dense" as any,
            toolbar: false,
          }}
          localization={{
            body: { emptyDataSourceMessage: "No records found matching criteria." },
          }}
        />
      </div>
    </Box>
  );
};

export default FraudulentLoanResult;
