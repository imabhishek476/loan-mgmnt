const { Loan } = require("../models/loan");
const { LoanPayment } = require("../models/LoanPayment");
const createAuditLog = require("../utils/auditLog");

exports.addPayment = async (req, res) => {
  try {
    const {
      loanId,
      clientId,
      paidAmount,
      paidDate,
      checkNumber,
      payoffLetter,
      currentTerm,
    } = req.body;
      if (!loanId || !clientId || !paidAmount || !currentTerm) {
     return res.status(400).json({ message: "Missing required fields" });
    }
    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    const to2 = (num) => parseFloat(Number(num).toFixed(2));
    const subTotal = to2(loan.subTotal || 0);
    const monthlyRate = to2(loan.monthlyRate || 0);
    const term = Number(currentTerm);
    let totalLoan = subTotal;
    if (loan.interestType === "flat") {
      for (let i = 6; i <= term; i += 6) {
        const stepInterest = totalLoan * (monthlyRate / 100) * 6;
        totalLoan += stepInterest;
        if (i === 18 || i === 30) totalLoan += 200;
      }
    } else {
      for (let i = 1; i <= term; i++) {
        totalLoan *= 1 + monthlyRate / 100;
        if (i === 18 || i === 30) totalLoan += 200;
      }
    }
    const previousLoan = await LoanPayment.find({ loanId }).lean();
    const alreadyPaid = previousLoan.reduce((total, item) => {
      return total + (Number(item.paidAmount) || 0);
    }, 0);
    const remainingAmount = to2(totalLoan - alreadyPaid);
    if (Number(paidAmount) > remainingAmount) {
      return res
        .status(400)
        .json({ message: "Paid amount exceeds outstanding balance" });
    }
    const payment = await LoanPayment.create({
      loanId,
      clientId,
      paidAmount: to2(paidAmount),
      paidDate: paidDate || new Date(),
      checkNumber: checkNumber || "",
      payoffLetter: payoffLetter || "",
    });

    loan.paidAmount = to2(alreadyPaid + Number(paidAmount));
    loan.status = loan.paidAmount >= totalLoan ? "Paid Off" : "Partial Payment";
    await loan.save();

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      "Create",
      "Loan Payment",
      payment._id,
      { after: payment }
    );

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      payment,
      remaining: to2(totalLoan - loan.paidAmount),
      totalLoan,
      totalPaid: loan.paidAmount,
    });
  } catch (error) {
    console.error("addPayment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const payments = await LoanPayment.find({ loanId }).sort({ paidDate: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
