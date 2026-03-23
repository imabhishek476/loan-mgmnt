const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { calculateLoanAmounts } = require("../utils/loanCalculation");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const moment = require("moment");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const calculateFeeAmount = (fee, baseAmount) => {
  if (!fee || !fee.value) return 0;
  if (fee.type === "percentage") {
    return (baseAmount * fee.value) / 100;
  }
  return fee.value;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
};

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

const calculateTotalFees = (loan) => {
  return (
    calculateFeeAmount(loan.fees?.administrativeFee, loan.baseAmount) +
    calculateFeeAmount(loan.fees?.applicationFee, loan.baseAmount) +
    calculateFeeAmount(loan.fees?.attorneyFee, loan.baseAmount) +
    calculateFeeAmount(loan.fees?.brokerFee, loan.baseAmount) +
    calculateFeeAmount(loan.fees?.annualMaintenanceFee, loan.baseAmount)
  );
};

// --- QUERY BUILDERS ---

const buildFraudulentQuery = async (company, status, year) => {
  const query = { status: { $in: ["Fraud", "Lost", "Denied"] } };

  if (company && company !== "all") query.company = company;
  if (status && status !== "all") query.status = status;

  if (year) {
    const yearNum = parseInt(year, 10);
    const loansInYear = await Loan.find({}).populate("company", "companyName").populate("client", "fullName");
    const filteredLoans = loansInYear.filter((loan) => {
      const monthYear = getMonthYearFromDate(loan.issueDate);
      return monthYear && monthYear.year === yearNum;
    });
    query._id = { $in: filteredLoans.map((l) => l._id) };
  }
  return query;
};

const buildYearlyReportData = async (company, years) => {
  let yearArray = [];
  if (years) {
    yearArray = Array.isArray(years) ? years.map((y) => parseInt(y, 10)) : [parseInt(years, 10)];
  }

  const allLoans = await Loan.find({}).populate("company", "companyName").lean();
  const reportMap = {};

  allLoans.forEach((loan) => {
    const monthYear = getMonthYearFromDate(loan.issueDate);
    if (!monthYear) return;
    const { year } = monthYear;
    const companyId = loan.company?._id?.toString();
    const companyName = loan.company?.companyName || "Unknown";

    if (yearArray.length > 0 && !yearArray.includes(year)) return;
    if (company && company !== "all" && companyId !== company) return;

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

    const loanAmounts = calculateLoanAmounts(loan);
    const totalFees = calculateTotalFees(loan);
    // Explicitly fallback to 0 if loanAmounts is null or interestAmount is missing
    const interestAmount = loanAmounts && loanAmounts.interestAmount ? loanAmounts.interestAmount : 0;

    reportMap[key].totalLoans += 1;
    reportMap[key].totalBaseAmount += loan.baseAmount || 0;
    reportMap[key].totalFees += totalFees;
    reportMap[key].totalInterest += interestAmount;
    if (loan.status === "Active") reportMap[key].activeLoanCount += 1;
    if (loan.status === "Paid Off") reportMap[key].paidOffCount += 1;
  });

  return Object.values(reportMap).sort(
    (a, b) => b.year - a.year || a.companyName.localeCompare(b.companyName)
  );
};

const buildBrokerFeeReportData = async (company, startDate, endDate) => {
  const query = {};
  if (company && company !== "all") {
    query.company = company;
  }

  let loans = await Loan.find(query).populate("company", "companyName").populate("client", "fullName").lean();

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
      reportMap[companyName] = { companyName, totalBrokerFees: 0, loanCount: 0, averageFeePerLoan: 0 };
    }
    reportMap[companyName].totalBrokerFees += brokerFee;
    reportMap[companyName].loanCount += 1;
  });

  const reportArray = Object.values(reportMap);
  reportArray.forEach((item) => {
    item.averageFeePerLoan = item.loanCount > 0 ? (item.totalBrokerFees / item.loanCount).toFixed(2) : "0.00";
    item.totalBrokerFees = item.totalBrokerFees.toFixed(2);
  });

  return reportArray.sort((a, b) => b.totalBrokerFees - a.totalBrokerFees);
};

// ==========================================
// API ENDPOINTS
// ==========================================

// --- Fraudulent Loans ---
exports.getFraudulentReport = async (req, res) => {
  try {
    const { company, status = "Fraud", year, page = 1, pageSize = 20, export: isExport = false } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const query = await buildFraudulentQuery(company, status, year);
    const totalCount = await Loan.countDocuments(query);
    const loans = await Loan.find(query).populate("company", "companyName").populate("client", "fullName").sort({ issueDate: -1 }).skip(skip).limit(pageSizeNum).lean();

    const reportData = loans.map((loan) => ({
      _id: loan._id,
      loanId: loan._id.toString().slice(-8).toUpperCase(),
      clientName: loan.client?.fullName || "N/A",
      companyName: loan.company?.companyName || "N/A",
      baseAmount: loan.baseAmount,
      status: loan.status,
      issueDate: loan.issueDate,
      totalFees: calculateTotalFees(loan).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      data: reportData,
      pagination: { page: pageNum, pageSize: pageSizeNum, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSizeNum) },
    });
  } catch (error) {
    console.error("Error in getFraudulentReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportFraudulentReportExcel = async (req, res) => {
  try {
    const { company, status = "Fraud", year } = req.query;
    const query = await buildFraudulentQuery(company, status, year);
    const loans = await Loan.find(query).populate("company", "companyName").populate("client", "fullName").lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fraudulent Loans");

    worksheet.columns = [
      { header: "Loan ID", key: "loanId", width: 12 },
      { header: "Client Name", key: "clientName", width: 20 },
      { header: "Company", key: "companyName", width: 20 },
      { header: "Base Amount", key: "baseAmount", width: 15 },
      { header: "Total Fees", key: "totalFees", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Issue Date", key: "issueDate", width: 15 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

    loans.forEach((loan) => {
      worksheet.addRow({
        loanId: loan._id.toString().slice(-8).toUpperCase(),
        clientName: loan.client?.fullName || "N/A",
        companyName: loan.company?.companyName || "N/A",
        baseAmount: parseFloat(loan.baseAmount || 0).toFixed(2),
        totalFees: calculateTotalFees(loan).toFixed(2),
        status: loan.status,
        issueDate: loan.issueDate,
      });
    });

    worksheet.getColumn("baseAmount").numFmt = '"$"#,##0.00';
    worksheet.getColumn("totalFees").numFmt = '"$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Fraudulent_Loans_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting fraudulent report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportFraudulentReportPdf = async (req, res) => {
  try {
    const { company, status = "Fraud", year } = req.query;
    const query = await buildFraudulentQuery(company, status, year);
    const loans = await Loan.find(query).populate("company", "companyName").populate("client", "fullName").lean();

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Fraudulent_Loans_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Fraudulent Loans Report", { align: "center" });
    doc.moveDown();

    if (loans.length === 0) {
      doc.fontSize(12).text("No records found.", { align: "center" });
    } else {
      loans.forEach((loan) => {
        const totalFees = calculateTotalFees(loan);
        doc.fontSize(12).text(`Loan ID: ${loan._id.toString().slice(-8).toUpperCase()} | Client: ${loan.client?.fullName || "N/A"}`);
        doc.fontSize(12).text(`Company: ${loan.company?.companyName || "N/A"} | Date: ${loan.issueDate}`);
        doc.fontSize(10).text(`Amount: $${parseFloat(loan.baseAmount || 0).toFixed(2)} | Fees: $${totalFees.toFixed(2)} | Status: ${loan.status}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      });
    }
    doc.end();
  } catch (error) {
    console.error("Error exporting fraudulent PDF:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Yearly Reports ---
exports.getYearlyReport = async (req, res) => {
  try {
    const { company, years, page = 1, pageSize = 20, export: isExport = false } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const reportArray = await buildYearlyReportData(company, years);
    const totalCount = reportArray.length;
    const paginatedData = reportArray.slice(skip, skip + pageSizeNum);

    const formattedData = paginatedData.map((item) => ({
      companyName: item.companyName,
      year: item.year,
      totalLoans: item.totalLoans,
      totalBaseAmount: parseFloat(item.totalBaseAmount || 0).toFixed(2),
      totalFees: parseFloat(item.totalFees || 0).toFixed(2),
      totalInterest: parseFloat(item.totalInterest || 0).toFixed(2),
      netProfit: parseFloat(item.totalFees + item.totalInterest - (item.totalBaseAmount * 0.02)).toFixed(2),
      activeLoanCount: item.activeLoanCount,
      paidOffCount: item.paidOffCount,
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
      pagination: { page: pageNum, pageSize: pageSizeNum, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSizeNum) },
    });
  } catch (error) {
    console.error("Error in getYearlyReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportYearlyReportExcel = async (req, res) => {
  try {
    const { company, years } = req.query;
    const reportArray = await buildYearlyReportData(company, years);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Yearly Report");

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
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF70AD47" } };

    reportArray.forEach((item) => {
      const netProfit = item.totalFees + item.totalInterest - item.totalBaseAmount * 0.02;
      worksheet.addRow({
        companyName: item.companyName,
        year: item.year,
        totalLoans: item.totalLoans,
        totalBaseAmount: parseFloat(item.totalBaseAmount || 0).toFixed(2),
        totalFees: parseFloat(item.totalFees || 0).toFixed(2),
        totalInterest: parseFloat(item.totalInterest || 0).toFixed(2),
        netProfit: parseFloat(netProfit || 0).toFixed(2),
        activeLoanCount: item.activeLoanCount,
        paidOffCount: item.paidOffCount,
      });
    });

    worksheet.getColumn("totalBaseAmount").numFmt = '"$"#,##0.00';
    worksheet.getColumn("totalFees").numFmt = '"$"#,##0.00';
    worksheet.getColumn("totalInterest").numFmt = '"$"#,##0.00';
    worksheet.getColumn("netProfit").numFmt = '"$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Yearly_Report_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting yearly report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportYearlyReportPdf = async (req, res) => {
  try {
    const { company, years } = req.query;
    const reportArray = await buildYearlyReportData(company, years);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Yearly_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Yearly Report", { align: "center" });
    doc.moveDown();

    if (reportArray.length === 0) {
      doc.fontSize(12).text("No records found.", { align: "center" });
    } else {
      reportArray.forEach((item) => {
        const netProfit = item.totalFees + item.totalInterest - item.totalBaseAmount * 0.02;
        doc.fontSize(12).text(`Company: ${item.companyName} (${item.year})`);
        doc.fontSize(10).text(`Total Loans: ${item.totalLoans} | Active: ${item.activeLoanCount} | Paid Off: ${item.paidOffCount}`);
        doc.fontSize(10).text(`Base Amount: $${parseFloat(item.totalBaseAmount || 0).toFixed(2)} | Fees: $${parseFloat(item.totalFees || 0).toFixed(2)}`);
        doc.fontSize(10).text(`Interest: $${parseFloat(item.totalInterest || 0).toFixed(2)} | Net Profit: $${parseFloat(netProfit || 0).toFixed(2)}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      });
    }
    doc.end();
  } catch (error) {
    console.error("Error exporting yearly PDF:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Broker Fee Reports ---
exports.getBrokerFeeReport = async (req, res) => {
  try {
    const { company, startDate, endDate, page = 1, pageSize = 20, export: isExport = false } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const reportArray = await buildBrokerFeeReportData(company, startDate, endDate);
    const totalCount = reportArray.length;
    const paginatedData = reportArray.slice(skip, skip + pageSizeNum);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: { page: pageNum, pageSize: pageSizeNum, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSizeNum) },
    });
  } catch (error) {
    console.error("Error in getBrokerFeeReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportBrokerFeeReportExcel = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;
    const reportArray = await buildBrokerFeeReportData(company, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Broker Fees");

    worksheet.columns = [
      { header: "Company Name", key: "companyName", width: 20 },
      { header: "Total Broker Fees", key: "totalBrokerFees", width: 18 },
      { header: "Loan Count", key: "loanCount", width: 12 },
      { header: "Average Fee Per Loan", key: "averageFeePerLoan", width: 18 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFED7D31" } };

    reportArray.forEach((item) => {
      worksheet.addRow({
        companyName: item.companyName,
        totalBrokerFees: parseFloat(item.totalBrokerFees || 0).toFixed(2),
        loanCount: item.loanCount,
        averageFeePerLoan: parseFloat(item.averageFeePerLoan || 0).toFixed(2),
      });
    });

    worksheet.getColumn("totalBrokerFees").numFmt = '"$"#,##0.00';
    worksheet.getColumn("averageFeePerLoan").numFmt = '"$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Broker_Fee_Report_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting broker fee report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportBrokerFeeReportPdf = async (req, res) => {
  try {
    const { company, startDate, endDate } = req.query;
    const reportArray = await buildBrokerFeeReportData(company, startDate, endDate);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Broker_Fee_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Broker Fee Report", { align: "center" });
    doc.moveDown();

    if (reportArray.length === 0) {
      doc.fontSize(12).text("No records found.", { align: "center" });
    } else {
      reportArray.forEach((item) => {
        doc.fontSize(12).text(`Company: ${item.companyName}`);
        doc.fontSize(10).text(`Loan Count: ${item.loanCount}`);
        doc.fontSize(10).text(`Total Broker Fees: $${parseFloat(item.totalBrokerFees || 0).toFixed(2)} | Avg Fee/Loan: $${parseFloat(item.averageFeePerLoan || 0).toFixed(2)}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      });
    }
    doc.end();
  } catch (error) {
    console.error("Error exporting broker fee PDF:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Filters Data ---
exports.getCompaniesForFilter = async (req, res) => {
  try {
    const companies = await Company.find({}, "_id companyName").lean();
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error("Error in getCompaniesForFilter:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getYearsForFilter = async (req, res) => {
  try {
    const loans = await Loan.find({}, "issueDate").lean();
    const yearSet = new Set();
    loans.forEach((loan) => {
      const monthYear = getMonthYearFromDate(loan.issueDate);
      if (monthYear) yearSet.add(monthYear.year);
    });
    res.status(200).json({ success: true, data: Array.from(yearSet).sort((a, b) => b - a) });
  } catch (error) {
    console.error("Error in getYearsForFilter:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
