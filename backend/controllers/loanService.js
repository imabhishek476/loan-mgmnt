const Loan = require("../models/loan");

exports.LoansCreate = async (req, res) => {
  try {
    const body = req.body;

    if (!body.baseAmount || Number(body.baseAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Base amount must be greater than 0",
      });
    }

    // ✅ Build loan data safely
    const loanData = {
      issueDate: body.issueDate || new Date(),
      client: body.client,
      company: body.company,
      loanTerms: Number(body.loanTerms ?? 12),
      baseAmount: Number(body.baseAmount),
      fees: {
        administrativeFee: body.fees?.administrativeFee || { value: 0, type: "flat" },
        applicationFee: body.fees?.applicationFee || { value: 0, type: "flat" },
        attorneyReviewFee: body.fees?.attorneyReviewFee || { value: 0, type: "flat" },
        brokerFee: body.fees?.brokerFee || { value: 0, type: "flat" },
        annualMaintenanceFee: body.fees?.annualMaintenanceFee || { value: 0, type: "flat" },
      },
      interestType: body.interestType ?? "flat",
      monthlyRate: Number(body.monthlyRate ?? 0),
      totalLoan: Number(body.totalLoan ?? 0),
      checkNumber: body.checkNumber || "",
      customFields: body.customFields ?? [],
    };

    const newLoan = await Loan.create(loanData);

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
    const loans = await Loan.find();
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

exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findByIdAndDelete(id);

    if (!loan)
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });

    res.status(200).json({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
