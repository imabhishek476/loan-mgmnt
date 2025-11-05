const { Client } = require("../models/Client");
const Company = require("../models/companies");
const { Loan } = require("../models/loan");
const User = require("../models/User");
const createAuditLog = require("../utils/auditLog");
const mongoose = require("mongoose");

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
      status: body.status || "Active",
    };

    const newLoan = await Loan.create(loanData);
     const client = await Client.findById(body.client).select("fullName");
     const company = await Company.findById(body.company).select("companyName");
     const user = await User.findById(req.user?.id).select("name email");
     const clientName = client?.fullName || "";
     const companyName = company?.companyName || "";
     const createdBy = user?.name || user?.email || "";     
    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Loan created for ${clientName} under ${companyName} by ${createdBy}`,
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
exports.activeLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ loanStatus: "Active" }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      data: loans,
      message: "Active loans fetched successfully",
    });
  } catch (error) {
    console.error("Error in AllLoans:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateLoan = async (req, res) => {
  try { 
    const { id } = req.params;
    const updates = req.body;

    const loan = await Loan.findByIdAndUpdate(id, updates, { new: true });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }
   const [client, company, user] = await Promise.all([
     Client.findById(loan.client).select("fullName"),
     Company.findById(loan.company).select("companyName"),
     User.findById(req.user?.id).select("name email"),
   ]);
   const clientName = client?.fullName || "";
   const companyName = company?.companyName || "";
   const updatedBy = user?.name || user?.email || "";

   await createAuditLog(
     req.user?.id || null,
     req.user?.userRole || null,
     `Loan updated for ${clientName} under ${companyName} by ${updatedBy}`,
     "Loan",
     loan._id,
     { after: loan, changes: updates }
   );
    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Error in updateLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

 exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByIdAndUpdate(
      id,
      { loanStatus: "Deactivated" },
      { new: true }
    );

    if (!loan)
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
  const [client, company, user] = await Promise.all([
    Client.findById(loan.client).select("fullName"),
    Company.findById(loan.company).select("companyName"),
    User.findById(req.user?.id).select("name email"),
  ]);

  const clientName = client?.fullName || "";
  const companyName = company?.companyName || "";
  const deletedBy = user?.name || user?.email || "";

  await createAuditLog(
    req.user?.id || null,
    req.user?.userRole || null,
    `Loan deactivated for ${clientName} under ${companyName} by ${deletedBy}`,
    "Loan",
    loan._id,
    { after: loan }
  );
    res.status(200).json({
      success: true,
      message: "Loan status set to Deactivated",
      data: loan,
    });
  } catch (error) {
    console.error("Error in deleteLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.recoverLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLoan = await Loan.findById(id);
    if (!existingLoan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }
    const loan = await Loan.findByIdAndUpdate(
      id,
      { loanStatus: "Active" },
      { new: true } 
    );
     const [client, company, user] = await Promise.all([
       Client.findById(loan.client).select("fullName"),
       Company.findById(loan.company).select("companyName"),
       User.findById(req.user?.id).select("name email"),
     ]);

     const clientName = client?.fullName || "";
     const companyName = company?.companyName || "";
     const recoveredBy = user?.name || user?.email || "";

     await createAuditLog(
       req.user?.id || null,
       req.user?.userRole || null,
       `Loan recovered for ${clientName} under ${companyName} by ${recoveredBy}`,
       "Loan",
       loan._id,
       { after: loan }
    );
    res.status(200).json({
      success: true,
      message: "Loan recovered successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Error in recoverLoan:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
// console.log("Fetching loan with ID:", id);
    const loan = await Loan.findById(id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    const previousLoans = await Loan.find({
      parentLoanId: id,
      status: { $in: ["Merged", "Active"] },
    }).sort({ createdAt: -1 });

    const obj = { ...loan.toObject(), previousLoans };
    res.status(200).json({
      success: true,
      data: obj,
      message: "Loan fetched successfully",
    });
  } catch (error) {
    console.error("Error in getLoanById:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

