const express = require("express");
const {
  getFraudulentReport,
  getYearlyReport,
  getBrokerFeeReport,
  exportFraudulentReportExcel,
  exportYearlyReportExcel,
  exportBrokerFeeReportExcel,
  getCompaniesForFilter,
  getYearsForFilter,
} = require("../controllers/reportService");
const { isAuthenticated } = require("../middleware/auth.middleware");

const router = express.Router();

// Protect all routes with authentication
router.use(isAuthenticated);

// Get filter options
router.get("/filter/companies", getCompaniesForFilter);
router.get("/filter/years", getYearsForFilter);

// Fraudulent Loans Report
router.get("/fraudulent", getFraudulentReport);
router.get("/fraudulent/export/excel", exportFraudulentReportExcel);

// Yearly Report
router.get("/yearly", getYearlyReport);
router.get("/yearly/export/excel", exportYearlyReportExcel);

// Broker Fee Report
router.get("/broker-fees", getBrokerFeeReport);
router.get("/broker-fees/export/excel", exportBrokerFeeReportExcel);

module.exports = router;
