const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { calculateLoanAmounts } = require("../utils/loanCalculation");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const moment = require("moment");
const { LoanPayment } = require("../models/LoanPayment");

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

const buildFraudulentQuery = async (company, status, year, startDate, endDate) => {
  const query = {};

  if (company && company !== "all") query.company = company;
  if (status && status !== "all") query.status = status;

  if (startDate || endDate) {
    query.issueDate = {};
    if (startDate) query.issueDate.$gte = startDate;
    if (endDate) query.issueDate.$lte = endDate;
  }

  if (year) {
    const yearNum = parseInt(year, 10);
    const loansInYear = await Loan.find(query).populate("company", "companyName").populate("client", "fullName");
    const filteredLoans = loansInYear.filter((loan) => {
      const monthYear = getMonthYearFromDate(loan.issueDate);
      return monthYear && monthYear.year === yearNum;
    });
    query._id = { $in: filteredLoans.map((l) => l._id) };
  }
  return query;
};

const buildYearlyReportData = async (company, year, startDate, endDate) => {
  const yearArray = year ? [parseInt(year, 10)] : [];

  const query = {};
  if (company && company !== "all") {
    query.company = company;
  }

  if (startDate || endDate) {
    query.issueDate = {};
    if (startDate) query.issueDate.$gte = startDate;
    if (endDate) query.issueDate.$lte = endDate;
  }

  const allLoans = await Loan.find(query)
    .populate("company", "companyName")
    .populate("client", "fullName")
    .lean();

  const loanIds = allLoans.map((l) => l._id);
  const payments = await LoanPayment.find({ loanId: { $in: loanIds } }).lean();

  // Fetch loan profit and total paid data
  // Aggregating by rootLoanId to match LoanSummary.tsx logic exactly
  const loanProfits = await Loan.aggregate([
    { $match: { _id: { $in: loanIds } } },
    { $addFields: { rootLoanId: { $ifNull: ["$parentLoanId", "$_id"] } } },
    {
      $graphLookup: {
        from: "loans",
        startWith: "$rootLoanId",
        connectFromField: "_id",
        connectToField: "parentLoanId",
        as: "mergedLoans",
      },
    },
    {
      $project: {
        loanId: "$_id",
        allLoans: { $concatArrays: [[{ _id: "$_id", baseAmount: "$baseAmount" }], "$mergedLoans"] },
      },
    },
    { $unwind: "$allLoans" },
    {
      $group: {
        _id: "$loanId",
        loanIds: { $addToSet: "$allLoans._id" },
        totalBaseAmount: { $sum: { $ifNull: ["$allLoans.baseAmount", 0] } },
      },
    },
    {
      $lookup: {
        from: "loanpayments",
        localField: "loanIds",
        foreignField: "loanId",
        as: "payments",
      },
    },
    { $addFields: { totalPaid: { $sum: "$payments.paidAmount" } } },
    {
      $addFields: {
        totalProfit: { $max: [0, { $subtract: ["$totalPaid", "$totalBaseAmount"] }] },
      },
    },
  ]);

  const profitMap = {};
  loanProfits.forEach((p) => {
    profitMap[p._id.toString()] = p; 
  });

  const flatTransactions = [];

  allLoans.forEach((loan) => {
    // Filter out loans that do not match the selected year
    const monthYear = getMonthYearFromDate(loan.issueDate);
    if (!monthYear) return;
    if (yearArray.length > 0 && !yearArray.includes(monthYear.year)) return;

    const loanIdStr = loan._id.toString();
    const loanPayments = payments.filter((p) => p.loanId.toString() === loanIdStr);
    const profitData = profitMap[loanIdStr] || { totalProfit: 0 };
    
    // Total debt computation placeholder - usually totalLoan or computed subTotal
    const totalToPay = loan.totalLoan || loan.subTotal || 0;

    // If no payments, still show the loan with 0 paid amount
    if (loanPayments.length === 0) {
      flatTransactions.push({
        loan: loan, 
        clientName: loan.client?.fullName || "Unknown",
        baseDate: loan.issueDate,
        amount: loan.baseAmount || 0,
        totalToPay: totalToPay,
        paidDate: null,
        amountPaid: 0,
        totalProfit: profitData.totalProfit,
      });
    } else {
      loanPayments.forEach((payment) => {
        flatTransactions.push({
          loan: loan,
          clientName: loan.client?.fullName || "Unknown",
          baseDate: loan.issueDate,
          amount: loan.baseAmount || 0,
          totalToPay: totalToPay,
          paidDate: payment.paidDate,
          amountPaid: payment.paidAmount || 0,
          totalProfit: profitData.totalProfit,
        });
      });
    }
  });

  return flatTransactions.sort((a, b) => {
    const nameA = a.clientName || "";
    const nameB = b.clientName || "";
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    return new Date(a.baseDate).getTime() - new Date(b.baseDate).getTime();
  });
};

const buildBrokerFeeReportData = async (company, startDate, endDate, feeType = "brokerFee") => {
  const query = {};
  if (company && company !== "all") {
    query.company = company;
  }

  if (startDate || endDate) {
    query.issueDate = {};
    if (startDate) query.issueDate.$gte = startDate;
    if (endDate) query.issueDate.$lte = endDate; 
    if (Object.keys(query.issueDate).length === 0) delete query.issueDate;
  }

  const allLoans = await Loan.find(query)
    .populate("company", "companyName")
    .populate("client", "fullName")
    .lean();
    
  const reportArray = [];

  allLoans.forEach((loan) => {
    const feeObj = loan.fees?.[feeType];
    let feeAmount = 0;
    
    if (feeObj && feeObj.value > 0) {
      if (feeObj.type === "percentage") {
        feeAmount = ((loan.baseAmount || 0) * feeObj.value) / 100;
      } else {
        feeAmount = feeObj.value;
      }
    }

    if (feeAmount > 0) {
      reportArray.push({
        _id: loan._id,
        date: loan.issueDate,
        companyName: loan.company?.companyName || "Unknown",
        clientName: loan.client?.fullName || "Unknown",
        feeAmount: feeAmount,
      });
    }
  });

  // Sort by date descending
  return reportArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ==========================================
// API ENDPOINTS
// ==========================================

// --- Status Reports (formerly Fraudulent) ---
exports.getFraudulentReport = async (req, res) => {
  try {
    const { company, status, year, startDate, endDate, page = 1, pageSize = 20, export: isExport = false } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const query = await buildFraudulentQuery(company, status, year, startDate, endDate);
    const totalCount = await Loan.countDocuments(query);
    
    // Calculate global summaries
    const allFraudulentLoans = await Loan.find(query, "baseAmount").lean();
    const totalFraudulentAmount = allFraudulentLoans.reduce((sum, loan) => sum + (loan.baseAmount || 0), 0);

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
      summary: {
        totalAmount: totalFraudulentAmount,
        totalLoans: totalCount
      },
      pagination: { page: pageNum, pageSize: pageSizeNum, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSizeNum) },
    });
  } catch (error) {
    console.error("Error in getFraudulentReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportFraudulentReportExcel = async (req, res) => {
  try {
    const { company, status, year, startDate, endDate } = req.query;
    const query = await buildFraudulentQuery(company, status, year, startDate, endDate);
    const loans = await Loan.find(query).populate("company", "companyName").populate("client", "fullName").lean();

    const totalFraudulentAmount = loans.reduce((sum, loan) => sum + (loan.baseAmount || 0), 0);
    const totalLoansCount = loans.length;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Status Report");

    worksheet.columns = [
      { header: "Loan ID", key: "loanId", width: 12 },
      { header: "Client Name", key: "clientName", width: 20 },
      { header: "Company", key: "companyName", width: 20 },
      { header: "Base Amount", key: "baseAmount", width: 15 },
      { header: "Total Fees", key: "totalFees", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Issue Date", key: "issueDate", width: 15 },
    ];

    // Insert 3 empty rows at the top for our summary
    worksheet.spliceRows(1, 0, [], [], []);

    // Add Summary Title
    worksheet.getCell('A1').value = "Status Report Summary";
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add Summary Data
    worksheet.getCell('A2').value = "Total Amount:";
    worksheet.getCell('A2').font = { bold: true };
    worksheet.getCell('B2').value = totalFraudulentAmount;
    worksheet.getCell('B2').numFmt = '"$"#,##0.00';
    worksheet.getCell('B2').font = { bold: true };

    worksheet.getCell('D2').value = "Total Affected Loans:";
    worksheet.getCell('D2').font = { bold: true };
    worksheet.getCell('E2').value = totalLoansCount;
    worksheet.getCell('E2').font = { bold: true };

    // Format the column header row (which is now row 4)
    worksheet.getRow(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

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
    res.setHeader("Content-Disposition", `attachment; filename="Status_Report_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting fraudulent report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportFraudulentReportPdf = async (req, res) => {
  try {
    const { company, status, year, startDate, endDate } = req.query;
    const query = await buildFraudulentQuery(company, status, year, startDate, endDate);
    const loans = await Loan.find(query).populate("company", "companyName").populate("client", "fullName").lean();

    const totalFraudulentAmount = loans.reduce((sum, loan) => sum + (loan.baseAmount || 0), 0);
    const totalLoansCount = loans.length;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Status_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Status Report", { align: "center" });
    doc.moveDown();

    // Add Summary Section
    doc.fontSize(14).text("Summary", { underline: true });
    doc.fontSize(12).text(`Total Amount: $${totalFraudulentAmount.toFixed(2)}`);
    doc.text(`Total Affected Loans: ${totalLoansCount}`);
    doc.moveDown(2);

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

// --- Annual Reports (formerly Yearly) ---
exports.getYearlyReport = async (req, res) => {
  try {
    const { company, year, startDate, endDate, page = 1, pageSize = 20, export: isExport = false } = req.query;
    if (!company || company === "all") {
      return res.status(400).json({ success: false, message: "Company is compulsory for Annual Report." });
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const reportArray = await buildYearlyReportData(company, year, startDate, endDate);
    const totalCount = reportArray.length;
    const paginatedData = reportArray.slice(skip, skip + pageSizeNum);
    
    // Global summary calculation
    const summary = reportArray.reduce((acc, curr) => {
      acc.totalAmount += curr.amount; // total amounts across identical payments is technically redundant, but following exact logic
      acc.totalPaid += curr.amountPaid;
      return acc;
    }, { totalAmount: 0, totalPaid: 0, totalProfit: 0 });

    // Deduplicate totalProfit at the loan level for summary accuracy
    const uniqueLoanProfits = {};
    reportArray.forEach(curr => {
      uniqueLoanProfits[curr.loan._id.toString()] = curr.totalProfit || 0;
    });
    summary.totalProfit = Object.values(uniqueLoanProfits).reduce((sum, amount) => sum + amount, 0);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      summary,
      pagination: { page: pageNum, pageSize: pageSizeNum, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSizeNum) },
    });
  } catch (error) {
    console.error("Error in getYearlyReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportYearlyReportExcel = async (req, res) => {
  try {
    const { company, year, startDate, endDate } = req.query;
    if (!company || company === "all") {
      return res.status(400).json({ success: false, message: "Company is compulsory for Annual Report." });
    }
    const reportArray = await buildYearlyReportData(company, year, startDate, endDate);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Annual Report");

    const headerKeys = ["Base Date(Loan Date)", "Amount", "Total(To Pay)", "Name (Client Name)", "Paid Date(amount date)", "Amount Paid(how much we paid)", "Total Profit"];
    worksheet.addRow(headerKeys);
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
    
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 25;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 20;
    worksheet.getColumn(7).width = 15;

    let lastClientName = null;

    reportArray.forEach((row) => {
      const displayClientName = row.clientName === lastClientName ? "-" : (row.clientName || "-");
      lastClientName = row.clientName;

      worksheet.addRow([
        row.baseDate || "-",
        parseFloat(row.amount || 0).toFixed(2),
        parseFloat(row.totalToPay || 0).toFixed(2),
        displayClientName,
        row.paidDate ? new Date(row.paidDate).toLocaleDateString() : "-",
        parseFloat(row.amountPaid || 0).toFixed(2),
        parseFloat(row.totalProfit || 0).toFixed(2)
      ]);
    });

    worksheet.getColumn(2).numFmt = '"$"#,##0.00';
    worksheet.getColumn(3).numFmt = '"$"#,##0.00';
    worksheet.getColumn(6).numFmt = '"$"#,##0.00';
    worksheet.getColumn(7).numFmt = '"$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Annual_Report_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting yearly report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportYearlyReportPdf = async (req, res) => {
  try {
    const { company, year, startDate, endDate } = req.query;
    if (!company || company === "all") {
      return res.status(400).json({ success: false, message: "Company is compulsory for Annual Report." });
    }
    const reportArray = await buildYearlyReportData(company, year, startDate, endDate);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Annual_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Annual Transactions Report", { align: "center" });
    doc.moveDown();

    if (reportArray.length === 0) {
      doc.fontSize(12).text("No transactions found.", { align: "center" });
    } else {
      let lastClientName = null;

      reportArray.forEach((row) => {
        const displayClientName = row.clientName === lastClientName ? "-" : row.clientName;
        lastClientName = row.clientName;

        doc.fontSize(12).font("Helvetica-Bold").text(`Client: ${displayClientName} | Date: ${row.baseDate}`);
        doc.fontSize(10).font("Helvetica").text(`Amount: $${parseFloat(row.amount || 0).toFixed(2)} | Total To Pay: $${parseFloat(row.totalToPay || 0).toFixed(2)}`);
        doc.fontSize(10).text(`Paid Date: ${row.paidDate ? new Date(row.paidDate).toLocaleDateString() : '-'} | Paid: $${parseFloat(row.amountPaid || 0).toFixed(2)} | Profit: $${parseFloat(row.totalProfit || 0).toFixed(2)}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#eeeeee").stroke();
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    console.error("Error exporting yearly PDF:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Fee Reports (formerly Broker Fee) ---
exports.getBrokerFeeReport = async (req, res) => {
  try {
    const { company, startDate, endDate, feeType, page = 1, pageSize = 20, export: isExport = false } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = isExport ? 999999 : parseInt(pageSize, 10) || 20;
    const skip = (pageNum - 1) * pageSizeNum;

    const reportArray = await buildBrokerFeeReportData(company, startDate, endDate, feeType);
    const totalCount = reportArray.length;
    const paginatedData = reportArray.slice(skip, skip + pageSizeNum);
    
    const summary = reportArray.reduce((acc, curr) => {
      acc.totalFees += curr.feeAmount;
      acc.totalTransactions += 1;
      return acc;
    }, { totalFees: 0, totalTransactions: 0 });

    return res.status(200).json({
      success: true,
      data: paginatedData,
      summary,
      pagination: { page: pageNum, pageSize: pageSizeNum, totalRecords: totalCount, totalPages: Math.ceil(totalCount / pageSizeNum) },
    });
  } catch (error) {
    console.error("Error in getBrokerFeeReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportBrokerFeeReportExcel = async (req, res) => {
  try {
    const { company, startDate, endDate, feeType } = req.query;
    const reportArray = await buildBrokerFeeReportData(company, startDate, endDate, feeType);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Fee Report");

    worksheet.columns = [
      { header: "DATE", key: "date", width: 15 },
      { header: "Company", key: "companyName", width: 20 },
      { header: "Name", key: "clientName", width: 30 },
      { header: "Fee Amount", key: "feeAmount", width: 15 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

    reportArray.forEach((item) => {
      worksheet.addRow({
        date: item.date,
        companyName: item.companyName,
        clientName: item.clientName,
        feeAmount: parseFloat(item.feeAmount || 0).toFixed(2),
      });
    });

    worksheet.getColumn("feeAmount").numFmt = '"$"#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Fee_Report_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error exporting broker fee report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportBrokerFeeReportPdf = async (req, res) => {
  try {
    const { company, startDate, endDate, feeType } = req.query;
    const reportArray = await buildBrokerFeeReportData(company, startDate, endDate, feeType);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Fee_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text("Fee Report", { align: "center" });
    doc.moveDown();

    if (reportArray.length === 0) {
      doc.fontSize(12).text("No records found.", { align: "center" });
    } else {
      reportArray.forEach((item) => {
        doc.fontSize(12).text(`Date: ${item.date} | Company: ${item.companyName}`);
        doc.fontSize(10).text(`Client: ${item.clientName} | Fee: $${parseFloat(item.feeAmount || 0).toFixed(2)}`);
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#cccccc").stroke();
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
