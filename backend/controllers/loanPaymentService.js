const { Loan } = require("../models/loan");
const { LoanPayment } = require("../models/LoanPayment");
const createAuditLog = require("../utils/auditLog");

exports.addPayment = async (req, res) => {
  try {
    const { loanId, clientId, paidAmount, paidDate, checkNumber, payoffLetter } = req.body;

    if (!loanId || !clientId || !paidAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    const outstanding = (loan.totalLoan || 0) - (loan.paidAmount || 0);
    if (Number(paidAmount) > outstanding) {
      return res.status(400).json({ message: "Paid amount exceeds outstanding balance" });
    }
    const payment = await LoanPayment.create({
      loanId,
      clientId,
      paidAmount: Number(paidAmount),
      paidDate: paidDate || new Date(),
      checkNumber: checkNumber || "",
      payoffLetter: payoffLetter || "",
    });

    loan.paidAmount = (loan.paidAmount || 0) + Number(paidAmount);
    if (loan.paidAmount >= loan.totalLoan) {
      loan.status = "Paid Off"; 
    } else {
      loan.status = "Partial Payment";
    }
    await loan.save();
    await createAuditLog(
      req.user?.id || null, 
      req.user?.userRole || null, 
      "Create", 
      "Loan Payment", 
      payment._id, 
      { after: payment }
    );
    res.status(201).json({ success: true, message: "Payment recorded successfully", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const payments = await LoanPayment.find({ loanId }).sort({ paidDate: -1 });
    res.status(200).json({ success: true, payments }); // ✅ JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

