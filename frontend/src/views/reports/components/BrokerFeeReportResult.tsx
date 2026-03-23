import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MaterialTable from "@material-table/core";
import { Box, Button, Typography, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import reportService from "../../../api/reportService";

const BrokerFeeReportResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { company: string; startDate: string; endDate: string } | null;
  const tableRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (!state) {
      navigate("/reports");
    }
  }, [state, navigate]);

  if (!state) return null;

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await reportService.exportBrokerFeeReportExcel({
        company: state.company !== "all" ? state.company : undefined,
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
      await reportService.exportBrokerFeeReportPdf({
        company: state.company !== "all" ? state.company : undefined,
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
    { title: "Company Name", field: "companyName" },
    { 
      title: "Total Broker Fees", 
      render: (rd: any) => (
        <Box component="span" sx={{ fontWeight: 600, color: "#ed7d31" }}>
          ${parseFloat(rd.totalBrokerFees || 0).toFixed(2)}
        </Box>
      )
    },
    { title: "Loan Count", field: "loanCount" },
    { title: "Average Fee Per Loan", render: (rd: any) => `$${parseFloat(rd.averageFeePerLoan || 0).toFixed(2)}` }
  ];

  return (
    <Box sx={{ p: 1, width: '100%', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/reports?tab=brokerFee")} variant="outlined">
            Back to Filters
          </Button>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Broker Fee Report Results
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

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white mt-4">
        <MaterialTable
          tableRef={tableRef}
          title={null}
          columns={columns}
          data={(query) =>
            new Promise(async (resolve) => {
               try {
                 const response = await reportService.getBrokerFeeReport({
                   company: state.company !== "all" ? state.company : undefined,
                   startDate: state.startDate || undefined,
                   endDate: state.endDate || undefined,
                   page: query.page + 1,
                   pageSize: query.pageSize,
                 });
                 if (response.data.success) {
                   setHasData(response.data.data.length > 0);
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

export default BrokerFeeReportResult;
