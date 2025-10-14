const { Loan } = require("../models/loan");
const createAuditLog = require("../utils/auditLog");


exports.LoansCreate = async (req, res) => {
  try {
    const body = req.body;

    if (!body.baseAmount || Number(body.baseAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Base amount must be greater than 0",
      });
    }

    const loanData = {
      issueDate: body.issueDate || new Date(),
      client: body.client,
      company: body.company,
      loanTerms: Number(body.loanTerms ?? 12),
      baseAmount: Number(body.baseAmount),
      fees: body.fees || {},
      interestType: body.interestType ?? "flat",
      monthlyRate: Number(body.monthlyRate ?? 0),
      totalLoan: Number(body.totalLoan ?? 0),
      checkNumber: body.checkNumber || "",
      previousLoanAmount: Number(body.previousLoanAmount ?? 0),
      subTotal: Number(body.subTotal ?? 0),
      endDate: body.endDate || null,
      status: body.status || "Fresh Loan Issued",
    };

    const newLoan = await Loan.create(loanData);
    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      "Loan Created ",
      "Loan",
      newLoan._id,
      { after: newLoan }
    );
    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: newLoan,
    });
  } catch (error) {
    console.error("Error in LoansCreate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.AllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: loans,
      message: "Loans fetched successfully",
    });
  } catch (error) {
    console.error("Error in AllLoans:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// exports.updateLoan = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updates = req.body;

//     const loan = await Loan.findByIdAndUpdate(id, updates, { new: true });
//     if (!loan) {
//       return res.status(404).json({
//         success: false,
//         message: "Loan not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Loan updated successfully",
//       data: loan,
//     });
//   } catch (error) {
//     console.error("Error in updateLoan:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.deleteLoan = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const loan = await Loan.findByIdAndDelete(id);

//     if (!loan)
//       return res.status(404).json({
//         success: false,
//         message: "Loan not found",
//       });

//     res.status(200).json({
//       success: true,
//       message: "Loan deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error in deleteLoan:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
