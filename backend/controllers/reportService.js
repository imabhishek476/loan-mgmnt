const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { Client } = require("../models/Client");
const calculateLoanAmounts = require("../utils/loanCalculation");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const moment = require("moment");

// Helper function to calculate fee amount
const calculateFeeAmount = (fee, baseAmount) => {
  if (!fee || !fee.value) return 0;
  if (fee.type === "percentage") {
    return (baseAmount * fee.value) / 100;
  }
  return fee.value;
};

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
};

// Helper function to get month and year from issueDate
const getMonthYearFromDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[2], 10);
    return { month, year };
  }
  return null;
};

// Get fraudulent loans report
exports.getFraudulentReport = async (req, res) => {
  try {
    const {
      company,
      status = "Fraud",
      year,
      page = 1,
      pageSize = 20,
      export: isExport = false,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Build query
    const query = { status: { $in: ["Fraud", "Lost", "Denied"] } };

    if (company && company !== "all") {
      query.company = company;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (year) {
      const yearNum = parseInt(year, 10);
      // Filter by year from issueDate
      const loansInYear = await Loan.find({})
        .populate("company", "companyName")
        .populate("client", "fullName");
      const filteredLoans = loansInYear.filter((loan) => {
        const monthYear = getMonthYearFromDate(loan.issueDate);
        return monthYear && monthYear.year === yearNum;
      });

      const loanIds = filteredLoans.map((l) => l._id);
      query._id = { $in: loanIds };
    }

    // Get total count for pagination
    const totalCount = await Loan.countDocuments(query);

    // Fetch loans with pagination
    const loans = await Loan.find(query)
      .populate("company", "companyName")
      .populate("client", "fullName")
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(pageSizeNum)
      .lean();

    // Format response data
    const reportData = loans.map((loan) => ({
      _id: loan._id,
      loanId: loan._id.toString().slice(-8).toUpperCase(),
      clientName: loan.client?.fullName || "N/A",
      companyName: loan.company?.companyName || "N/A",
      baseAmount: loan.baseAmount,
      status: loan.status,
      issueDate: loan.issueDate,
      totalFees: (
        calculateFeeAmount(loan.fees?.administrativeFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.applicationFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.attorneyFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.brokerFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.annualMaintenanceFee, loan.baseAmount)
      ).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      data: reportData,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum),
      },
    });
  } catch (error) {
    console.error("Error in getFraudulentReport:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get yearly report
exports.getYearlyReport = async (req, res) => {
  try {
    const { company, years, page = 1, pageSize = 20, export: isExport = false } =
      req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Parse years parameter
    let yearArray = [];
    if (years) {
      yearArray = Array.isArray(years)
        ? years.map((y) => parseInt(y, 10))
        : [parseInt(years, 10)];
    }

    // Get all loans
    const allLoans = await Loan.find({})
      .populate("company", "companyName")
      .lean();

    // Group loans by company and year
    const reportMap = {};

    allLoans.forEach((loan) => {
      const monthYear = getMonthYearFromDate(loan.issueDate);
      if (!monthYear) return;

      const { month, year } = monthYear;
      const companyId = loan.company?._id?.toString();
      const companyName = loan.company?.companyName || "Unknown";

      // Filter by selected years if provided
      if (yearArray.length > 0 && !yearArray.includes(year)) {
        return;
      }

      // Filter by selected company if provided
      if (company && company !== "all" && companyId !== company) {
        return;
      }

      const key = `${companyName}|${year}`;
      if (!reportMap[key]) {
        reportMap[key] = {
          companyName,
          year,
          totalLoans: 0,
          totalBaseAmount: 0,
          totalFees: 0,
          totalInterest: 0,
          activeLoanCount: 0,
          paidOffCount: 0,
        };
      }

      const monthsPassed = calculateMonthsPassed(loan.issueDate);
      const loanAmounts = calculateLoanAmounts(
        loan.baseAmount,
        loan.monthlyRate,
        loan.interestType,
        monthsPassed
      );

      const totalFees =
        calculateFeeAmount(loan.fees?.administrativeFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.applicationFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.attorneyFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.brokerFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.annualMaintenanceFee, loan.baseAmount);

      reportMap[key].totalLoans += 1;
      reportMap[key].totalBaseAmount += loan.baseAmount;
      reportMap[key].totalFees += totalFees;
      reportMap[key].totalInterest += loanAmounts.interest;
      if (loan.status === "Active") reportMap[key].activeLoanCount += 1;
      if (loan.status === "Paid Off") reportMap[key].paidOffCount += 1;
    });

    // Convert map to array and sort
    const reportArray = Object.values(reportMap).sort(
      (a, b) => b.year - a.year || a.companyName.localeCompare(b.companyName)
    );

    const totalCount = reportArray.length;
    const paginatedData = reportArray.slice(skip, skip + pageSizeNum);

    // Format response
    const formattedData = paginatedData.map((item) => ({
      companyName: item.companyName,
      year: item.year,
      totalLoans: item.totalLoans,
      totalBaseAmount: parseFloat(item.totalBaseAmount).toFixed(2),
      totalFees: parseFloat(item.totalFees).toFixed(2),
      totalInterest: parseFloat(item.totalInterest).toFixed(2),
      netProfit: parseFloat(
        item.totalFees + item.totalInterest - item.totalBaseAmount * 0.02 // Assume 2% cost
      ).toFixed(2),
      activeLoanCount: item.activeLoanCount,
      paidOffCount: item.paidOffCount,
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum),
      },
    });
  } catch (error) {
    console.error("Error in getYearlyReport:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get broker fee report
exports.getBrokerFeeReport = async (req, res) => {
  try {
    const {
      company,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      export: isExport = false,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    // Build query
    const query = {};

    if (company && company !== "all") {
      query.company = company;
    }

    // Get loans and filter by date range
    let loans = await Loan.find(query)
      .populate("company", "companyName")
      .populate("client", "fullName")
      .lean();

    // Filter by date range if provided
    if (startDate || endDate) {
      loans = loans.filter((loan) => {
        const loanDate = moment(loan.issueDate, "MM-DD-YYYY");
        if (startDate && loanDate.isBefore(moment(startDate))) return false;
        if (endDate && loanDate.isAfter(moment(endDate))) return false;
        return true;
      });
    }

    const totalCount = loans.length;

    // Group by company and calculate broker fees
    const reportMap = {};
    loans.forEach((loan) => {
      const companyName = loan.company?.companyName || "Unknown";
      const brokerFee = calculateFeeAmount(
        loan.fees?.brokerFee,
        loan.baseAmount
      );

      if (!reportMap[companyName]) {
        reportMap[companyName] = {
          companyName,
          totalBrokerFees: 0,
          loanCount: 0,
          averageFeePerLoan: 0,
        };
      }

      reportMap[companyName].totalBrokerFees += brokerFee;
      reportMap[companyName].loanCount += 1;
    });

    // Calculate averages
    Object.keys(reportMap).forEach((key) => {
      reportMap[key].averageFeePerLoan = (
        reportMap[key].totalBrokerFees / reportMap[key].loanCount
      ).toFixed(2);
      reportMap[key].totalBrokerFees = reportMap[key].totalBrokerFees.toFixed(
        2
      );
    });

    // Convert to array and sort
    const reportArray = Object.values(reportMap).sort(
      (a, b) => b.totalBrokerFees - a.totalBrokerFees
    );

    const paginatedData = reportArray.slice(skip, skip + pageSizeNum);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum),
      },
    });
  } catch (error) {
    console.error("Error in getBrokerFeeReport:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export fraudulent report to Excel
exports.exportFraudulentReportExcel = async (req, res) => {
  try {
    const { company, status = "Fraud", year } = req.query;

    // Build query (same as getFraudulentReport but without pagination)
    const query = { status: { $in: ["Fraud", "Lost", "Denied"] } };

    if (company && company !== "all") {
      query.company = company;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (year) {
      const yearNum = parseInt(year, 10);
      const loansInYear = await Loan.find({});
      const filteredLoans = loansInYear.filter((loan) => {
        const monthYear = getMonthYearFromDate(loan.issueDate);
        return monthYear && monthYear.year === yearNum;
      });

      const loanIds = filteredLoans.map((l) => l._id);
      query._id = { $in: loanIds };
    }

    const loans = await Loan.find(query)
      .populate("company", "companyName")
      .populate("client", "fullName")
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fraudulent Loans");

    // Add headers
    worksheet.columns = [
      { header: "Loan ID", key: "loanId", width: 12 },
      { header: "Client Name", key: "clientName", width: 20 },
      { header: "Company", key: "companyName", width: 20 },
      { header: "Base Amount", key: "baseAmount", width: 15 },
      { header: "Total Fees", key: "totalFees", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Issue Date", key: "issueDate", width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };

    // Add data
    loans.forEach((loan) => {
      const totalFees =
        calculateFeeAmount(loan.fees?.administrativeFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.applicationFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.attorneyFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.brokerFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.annualMaintenanceFee, loan.baseAmount);

      worksheet.addRow({
        loanId: loan._id.toString().slice(-8).toUpperCase(),
        clientName: loan.client?.fullName || "N/A",
        companyName: loan.company?.companyName || "N/A",
        baseAmount: parseFloat(loan.baseAmount).toFixed(2),
        totalFees: parseFloat(totalFees).toFixed(2),
        status: loan.status,
        issueDate: loan.issueDate,
      });
    });

    // Format currency columns
    worksheet.getColumn("baseAmount").numFmt = '"$"#,##0.00';
    worksheet.getColumn("totalFees").numFmt = '"$"#,##0.00';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Fraudulent_Loans_${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting fraudulent report:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export yearly report to Excel
exports.exportYearlyReportExcel = async (req, res) => {
  try {
    const { company, years } = req.query;

    // Parse years
    let yearArray = [];
    if (years) {
      yearArray = Array.isArray(years)
        ? years.map((y) => parseInt(y, 10))
        : [parseInt(years, 10)];
    }

    // Get all loans
    const allLoans = await Loan.find({})
      .populate("company", "companyName")
      .lean();

    // Group loans by company and year
    const reportMap = {};

    allLoans.forEach((loan) => {
      const monthYear = getMonthYearFromDate(loan.issueDate);
      if (!monthYear) return;

      const { month, year } = monthYear;
      const companyId = loan.company?._id?.toString();
      const companyName = loan.company?.companyName || "Unknown";

      if (yearArray.length > 0 && !yearArray.includes(year)) {
        return;
      }

      if (company && company !== "all" && companyId !== company) {
        return;
      }

      const key = `${companyName}|${year}`;
      if (!reportMap[key]) {
        reportMap[key] = {
          companyName,
          year,
          totalLoans: 0,
          totalBaseAmount: 0,
          totalFees: 0,
          totalInterest: 0,
          activeLoanCount: 0,
          paidOffCount: 0,
        };
      }

      const monthsPassed = calculateMonthsPassed(loan.issueDate);
      const loanAmounts = calculateLoanAmounts(
        loan.baseAmount,
        loan.monthlyRate,
        loan.interestType,
        monthsPassed
      );

      const totalFees =
        calculateFeeAmount(loan.fees?.administrativeFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.applicationFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.attorneyFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.brokerFee, loan.baseAmount) +
        calculateFeeAmount(loan.fees?.annualMaintenanceFee, loan.baseAmount);

      reportMap[key].totalLoans += 1;
      reportMap[key].totalBaseAmount += loan.baseAmount;
      reportMap[key].totalFees += totalFees;
      reportMap[key].totalInterest += loanAmounts.interest;
      if (loan.status === "Active") reportMap[key].activeLoanCount += 1;
      if (loan.status === "Paid Off") reportMap[key].paidOffCount += 1;
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Yearly Report");

    // Add headers
    worksheet.columns = [
      { header: "Company Name", key: "companyName", width: 20 },
      { header: "Year", key: "year", width: 10 },
      { header: "Total Loans", key: "totalLoans", width: 12 },
      { header: "Total Base Amount", key: "totalBaseAmount", width: 18 },
      { header: "Total Fees", key: "totalFees", width: 15 },
      { header: "Total Interest", key: "totalInterest", width: 15 },
      { header: "Net Profit", key: "netProfit", width: 15 },
      { header: "Active Loans", key: "activeLoanCount", width: 12 },
      { header: "Paid Off", key: "paidOffCount", width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF70AD47" },
    };

    // Add data
    Object.values(reportMap).forEach((item) => {
      const netProfit = item.totalFees + item.totalInterest - item.totalBaseAmount * 0.02;
      worksheet.addRow({
        companyName: item.companyName,
        year: item.year,
        totalLoans: item.totalLoans,
        totalBaseAmount: parseFloat(item.totalBaseAmount).toFixed(2),
        totalFees: parseFloat(item.totalFees).toFixed(2),
        totalInterest: parseFloat(item.totalInterest).toFixed(2),
        netProfit: parseFloat(netProfit).toFixed(2),
        activeLoanCount: item.activeLoanCount,
        paidOffCount: item.paidOffCount,
      });
    });

    // Format currency columns
    worksheet.getColumn("totalBaseAmount").numFmt = '"$"#,##0.00';
    worksheet.getColumn("totalFees").numFmt = '"$"#,##0.00';
    worksheet.getColumn("totalInterest").numFmt = '"$"#,##0.00';
    worksheet.getColumn("netProfit").numFmt = '"$"#,##0.00';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Yearly_Report_${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting yearly report:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export broker fee report to Excel
exports.exportBrokerFeeReportExcel = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;

    const query = {};

    if (company && company !== "all") {
      query.company = company;
    }

    let loans = await Loan.find(query)
      .populate("company", "companyName")
      .lean();

    if (startDate || endDate) {
      loans = loans.filter((loan) => {
        const loanDate = moment(loan.issueDate, "MM-DD-YYYY");
        if (startDate && loanDate.isBefore(moment(startDate))) return false;
        if (endDate && loanDate.isAfter(moment(endDate))) return false;
        return true;
      });
    }

    const reportMap = {};
    loans.forEach((loan) => {
      const companyName = loan.company?.companyName || "Unknown";
      const brokerFee = calculateFeeAmount(loan.fees?.brokerFee, loan.baseAmount);

      if (!reportMap[companyName]) {
        reportMap[companyName] = {
          companyName,
          totalBrokerFees: 0,
          loanCount: 0,
          averageFeePerLoan: 0,
        };
      }

      reportMap[companyName].totalBrokerFees += brokerFee;
      reportMap[companyName].loanCount += 1;
    });

    Object.keys(reportMap).forEach((key) => {
      reportMap[key].averageFeePerLoan = (
        reportMap[key].totalBrokerFees / reportMap[key].loanCount
      ).toFixed(2);
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Broker Fees");

    // Add headers
    worksheet.columns = [
      { header: "Company Name", key: "companyName", width: 20 },
      { header: "Total Broker Fees", key: "totalBrokerFees", width: 18 },
      { header: "Loan Count", key: "loanCount", width: 12 },
      { header: "Average Fee Per Loan", key: "averageFeePerLoan", width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFED7D31" },
    };

    // Add data
    Object.values(reportMap).forEach((item) => {
      worksheet.addRow({
        companyName: item.companyName,
        totalBrokerFees: parseFloat(item.totalBrokerFees).toFixed(2),
        loanCount: item.loanCount,
        averageFeePerLoan: parseFloat(item.averageFeePerLoan).toFixed(2),
      });
    });

    // Format currency columns
    worksheet.getColumn("totalBrokerFees").numFmt = '"$"#,##0.00';
    worksheet.getColumn("averageFeePerLoan").numFmt = '"$"#,##0.00';

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Broker_Fee_Report_${Date.now()}.xlsx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting broker fee report:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper: Calculate months passed since issue date
function calculateMonthsPassed(dateStr) {
  if (!dateStr) return 0;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return 0;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  const issueDate = new Date(year, month - 1, day);
  const now = new Date();

  const months = (now.getFullYear() - issueDate.getFullYear()) * 12 +
    (now.getMonth() - issueDate.getMonth());

  return Math.max(0, months);
}

// Get available companies for filter
exports.getCompaniesForFilter = async (req, res) => {
  try {
    const companies = await Company.find({}, "_id companyName").lean();
    res.status(200).json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error("Error in getCompaniesForFilter:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get available years for filter
exports.getYearsForFilter = async (req, res) => {
  try {
    const loans = await Loan.find({}, "issueDate").lean();
    const yearSet = new Set();

    loans.forEach((loan) => {
      const monthYear = getMonthYearFromDate(loan.issueDate);
      if (monthYear) {
        yearSet.add(monthYear.year);
      }
    });

    const years = Array.from(yearSet).sort((a, b) => b - a);

    res.status(200).json({
      success: true,
      data: years,
    });
  } catch (error) {
    console.error("Error in getYearsForFilter:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
