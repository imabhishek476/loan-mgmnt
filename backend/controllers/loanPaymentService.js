const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const { LoanPayment } = require("../models/LoanPayment");
const User = require("../models/User");
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
    totalLoan = to2(totalLoan);
    const previousLoan = await LoanPayment.find({ loanId }).lean();
    const alreadyPaid = previousLoan.reduce((total, item) => {
      return total + (Number(item.paidAmount) || 0);
    }, 0);
    const remainingAmount = to2(totalLoan - alreadyPaid);
    if (Number(paidAmount) > remainingAmount) {
      return res
        .status(400)
        .json({  message: `Paid amount exceeds outstanding balance ${remainingAmount} `, });
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
    const user = await User.findById(req.user?.id).select("name email");
    const client = await Client.findById(clientId).select("fullName");

    const createdBy = user.name || user.email || "Unknown User";
    const clientName = client?.fullName || "";

    await createAuditLog(
      user?.id || null,
      user?.userRole || null,
      ` Create Loan Payment done for ${clientName} by ${createdBy}`,
      "Create",
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
exports.editPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paidAmount, paidDate, checkNumber, payoffLetter, currentTerm } = req.body;

    const to2 = (num) => parseFloat(Number(num).toFixed(2));
    const payment = await LoanPayment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const loan = await Loan.findById(payment.loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    const subTotal = to2(loan.subTotal || 0);
    const monthlyRate = to2(loan.monthlyRate || 0);
    const term = Number(currentTerm || loan.loanTerms);
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

    const previousPayments = await LoanPayment.find({
      loanId: loan._id,
      _id: { $ne: paymentId },
    }).lean();

    const alreadyPaid = previousPayments.reduce(
      (sum, p) => sum + (Number(p.paidAmount) || 0),
      0
    );

    const remainingAmount = to2(totalLoan - alreadyPaid);
    if (paidAmount !== undefined && Number(paidAmount) > remainingAmount) {
      return res.status(400).json({
        message: `Paid amount exceeds outstanding balance ${remainingAmount}`,
      });
    }

    if (paidAmount !== undefined) payment.paidAmount = to2(paidAmount);
    if (paidDate !== undefined) payment.paidDate = paidDate;
    if (checkNumber !== undefined) payment.checkNumber = checkNumber;
    if (payoffLetter !== undefined) payment.payoffLetter = payoffLetter;

    await payment.save();
    loan.paidAmount = to2(alreadyPaid + Number(payment.paidAmount));
    loan.status = loan.paidAmount >= totalLoan ? "Paid Off" : "Partial Payment";
    await loan.save();
   const user = await User.findById(req.user?.id).select("name email");
   const createdBy = user?.name || user?.email || "Unknown User";

   await createAuditLog(
     user?.id || null,
     user?.userRole || null,
     `Updated Loan Payment by ${createdBy}`,
     "Update",
     payment._id,
     { after: payment }
   );

    return res.json({
      success: true,
      message: "Payment updated successfully",
      payment,
      remaining: to2(totalLoan - loan.paidAmount),
      totalLoan,
      totalPaid: loan.paidAmount,
    });
  } catch (error) {
    console.error("editPayment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await LoanPayment.findById(paymentId);
     if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }
    const loan = await Loan.findById(payment.loanId);
    if (loan) {
      const updatedPaidAmount =
        Number(loan.paidAmount || 0) - Number(payment.paidAmount || 0);
      loan.paidAmount = updatedPaidAmount < 0 ? 0 : updatedPaidAmount; 
      await loan.save();
    }
    await LoanPayment.findByIdAndDelete(paymentId);
  const user = await User.findById(req.user?.id).select("name email");
  const createdBy = user?.name || user?.email || "Unknown User";

  await createAuditLog(
    user?.id || null,
    user?.userRole || null,
    `Deleted Loan Payment by ${createdBy}`,
    "Delete",
    payment._id,
    { after: payment }
  );
    return res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (err) {
    console.error("Delete Payment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting payment",
    });
  }
};
exports.getLastPaymentDate = async (req, res) => {
  try {
    const { loanId } = req.params;

    const lastPayment = await LoanPayment.find({ loanId })
      .sort({ createdAt: -1 }) 
      .limit(1);

    if (!lastPayment.length) {
      return res.status(200).json({
        success: true,
        lastPaidDate: null, 
      });
    }
    return res.status(200).json({
      success: true,
      lastPaidDate: lastPayment[0].paidDate,
    });
  } catch (error) {
    console.error("getLastPaymentDate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
