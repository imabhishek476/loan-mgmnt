const { Loan } = require("../models/loan");
const { LoanPayment } = require("../models/LoanPayment");
const createAuditLog = require("../utils/auditLog");
const moment = require("moment");

// function recalculateLoan(loan) {
//   const issueDate = moment(loan.issueDate, "MM-DD-YYYY");
//   const monthsPassed = moment().diff(issueDate, "months") + 1;
//   const monthlyRate = loan.monthlyRate || 0;
//   const baseAmount = loan.baseAmount || 0;
//   const subTotal = loan.subTotal || 0;

//   const interestAmount = (baseAmount * monthlyRate * monthsPassed) / 100;
//   const newTotal = baseAmount + subTotal + interestAmount;
//   console.log(newTotal);
//   return { newTotal };
// }

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
    // console.log(currentTerm, "currentTerm");
    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    let totalLoan= null;
    if (loan.interestType === "flat") {
      totalLoan =
        loan.subTotal +
        loan.subTotal * (loan.monthlyRate / 100) * Number(currentTerm);
    } else {
      totalLoan =
        loan.subTotal *
        Math.pow(1 + loan.monthlyRate / 100, Number(currentTerm));
    }
    const remainingAmount = totalLoan - (loan.paidAmount || 0);
    if (Number(paidAmount) > remainingAmount) {
      return res
        .status(400)
        .json({ message: "Paid amount exceeds outstanding balance" });
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
    loan.status =
      loan.paidAmount >= totalLoan ? "Paid Off" : "Partial Payment";
    await loan.save();

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      "Create",
      "Loan Payment",
      payment._id,
      {
        after: payment,
      }
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Payment recorded successfully",
        payment,
      remaining: totalLoan - loan.paidAmount,
      });
  } catch (error) {
    console.error(error);
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
