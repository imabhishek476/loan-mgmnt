const { Client } = require("../models/Client");
const Company = require("../models/companies");
const { Loan } = require("../models/loan");
const User = require("../models/User");
const createAuditLog = require("../utils/auditLog");
const mongoose = require("mongoose");
const moment = require("moment"); 

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
      tenures: body.tenures || [{}],
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
    const { clientId, page = 1, limit = 10 } = req.query;
    const query = { loanStatus: { $in: ["Active", "Deactivated"] } };
    if (clientId) {
      query.client = new mongoose.Types.ObjectId(clientId);
    }
    let loans, total;
    if (clientId) {
      loans = await Loan.find(query).sort({ createdAt: -1 });
      total = loans.length;
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      [loans, total] = await Promise.all([
        Loan.find(query)
          .populate("client")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Loan.countDocuments(query),
      ]);
    }
    res.status(200).json({
      success: true,
      data: loans,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      message: "Active loans fetched successfully",
    });
  } catch (error) {
    console.error("Error in activeLoans:", error);
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
exports.searchLoans = async (req, res) => {
  try {
    const {
      query,
      issueDate,
      clientId,
      loanStatus,
      page = 0,
      limit = 10,
    } = req.query;

    const matchStage = {};
    if (clientId) matchStage.client = new mongoose.Types.ObjectId(clientId);
    if (loanStatus) matchStage.loanStatus = loanStatus; 
    if (issueDate) {
      const formattedDate = moment(issueDate, [
        "MM-DD-YYYY",
        "YYYY-MM-DD",
      ]).format("MM-DD-YYYY");
      matchStage.issueDate = formattedDate;
    }
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      { $unwind: { path: "$clientInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "companyInfo",
        },
      },
      { $unwind: { path: "$companyInfo", preserveNullAndEmptyArrays: true } },
    ];
    if (query && query.trim() !== "") {
      const regex = new RegExp(query, "i");
      pipeline.push({
        $match: {
          $or: [
            { "clientInfo.fullName": regex },
            { "companyInfo.companyName": regex },
            { loanNumber: regex },
            { status: regex },
          ],
        },
      });
    }
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: Number(page) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          loanNumber: 1,
          issueDate: 1,
          status: 1,
          subTotal: 1,
          paidAmount: 1,
          loanStatus: 1,
          monthlyRate: 1,
          interestType: 1,
          client: { _id: "$clientInfo._id", fullName: "$clientInfo.fullName" },
          company: {
            _id: "$companyInfo._id",
            companyName: "$companyInfo.companyName",
            backgroundColor: "$companyInfo.backgroundColor",
          },
        },
      }
    );
    const loans = await Loan.aggregate(pipeline);
    const total = await Loan.countDocuments(matchStage);
    res.status(200).json({
      success: true,
      loans,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error in searchLoans:", error);
    res.status(500).json({ success: false, error: error.message });
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

    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }
    res.status(200).json({
      success: true,
      message: "Loan status set to Deactivated",
      data: loan,
    });
   Promise.all([
    Client.findById(loan.client).select("fullName"),
    Company.findById(loan.company).select("companyName"),
    User.findById(req.user?.id).select("name email"),
  ])
      .then(([client, company, user]) => {
        const clientName = client?.fullName || "";
        const companyName = company?.companyName || "";
        const deletedBy = user?.name || user?.email || "";
        return createAuditLog(
    req.user?.id || null,
    req.user?.userRole || null,
    `Loan deactivated for ${clientName} under ${companyName} by ${deletedBy}`,
    "Loan",
    loan._id,
    { after: loan }
  );
      })
      .catch((err) => console.error("Audit log failed:", err));
  } catch (error) {
    console.error("Error in deleteLoan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.recoverLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLoan = await Loan.findById(id).populate("client");
    if (!existingLoan)
      return res
        .status(404)
        .json({ success: false, message: "Loan not found." });
    const client = existingLoan.client;
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found." });
    if (!client.isActive) {
      return res.status(400).json({
        success: false,
        message: `Client "${client.fullName}" is inactive. Activate client before recovering loan.`,
      });
    }
    const recoveredLoan = await Loan.findByIdAndUpdate(
      id,
      { loanStatus: "Active" },
      { new: true }
    );

    if (!recoveredLoan) {
      return res.status(400).json({
        success: false,
        message: "Failed to update loan status.",
      });
    }
    res.status(200).json({
      success: true,
      message: `Loan for client "${client.fullName}" recovered successfully.`,
      data: recoveredLoan,
    });
    (async () => {
      try {
        const [company, user] = await Promise.all([
          Company.findById(recoveredLoan.company).select("companyName"),
          User.findById(req.user?.id).select("name email"),
        ]);

        await createAuditLog(
          req.user?.id || null,
          req.user?.userRole || null,
          `Loan for client "${client.fullName}" under "${
            company?.companyName || "Unknown Company"
          }" was recovered by ${user?.name || user?.email || "System"}`,
          "Loan",
          recoveredLoan._id,
          { after: recoveredLoan }
        );
      } catch (err) {
        console.error("Audit log failed:", err);
      }
    })();
  } catch (error) {
    console.error("Recover Loan Error:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred while recovering the loan.",
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

