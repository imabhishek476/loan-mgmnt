const { Client } = require("../models/Client");
const Company = require("../models/companies");
const { Loan } = require("../models/loan");
const User = require("../models/User");
const createAuditLog = require("../utils/auditLog");
const mongoose = require("mongoose");
const moment = require("moment"); 
const { LoanPayment } = require("../models/LoanPayment");
exports.LoansCreate = async (req, res) => {
  try {
    const body = req.body;

    if (!body.baseAmount || Number(body.baseAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Base amount must be greater than 0",
      });
    }
      if (!body.issueDate) {
        return res.status(400).json({
          success: false,
          message: "Issue date is required",
        });
      }
    let issueDate = body.issueDate;

    if (issueDate instanceof Date) {
      const mm = String(issueDate.getMonth() + 1).padStart(2, "0");
      const dd = String(issueDate.getDate()).padStart(2, "0");
      const yyyy = issueDate.getFullYear();
      issueDate = `${mm}-${dd}-${yyyy}`;
    }

    const newLoan = await Loan.create({
      issueDate: issueDate,
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
    });
    if (Array.isArray(body.mergeLoanIds) && body.mergeLoanIds.length > 0) {
      await Loan.updateMany(
        { _id: { $in: body.mergeLoanIds } },
        { $set: { status: "Merged", parentLoanId: newLoan._id } }
      );
    }
    const [client, company, user] = await Promise.all([
      Client.findById(body.client).select("fullName"),
      Company.findById(body.company).select("companyName"),
      User.findById(req.user?.id).select("name email"),
    ]);
    await createAuditLog(
      req.user?.id,
      req.user?.userRole,
      `Loan created for ${client?.fullName || ""} under ${company?.companyName || ""} by ${
        user?.name || user?.email
      }`,
      "Loan",
      newLoan._id,
      { after: newLoan }
    );
    return res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: newLoan,
    });
  } catch (error) {
    console.error("Error in LoansCreate:", error);
    return res.status(500).json({
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
exports.activeLoansData = async (req, res) => {
  try {
    const { clientId, page , limit } = req.query;
    if(!clientId &&  !page && !limit ){
      return res.status(400).json({
        success: false,
        message: "Missing parameters to get Loans"
      });
    }
    const query = { loanStatus: { $in: ["Active", "Deactivated"] } };
    if (clientId) {
      query.client = new mongoose.Types.ObjectId(clientId);
    }
    let loans, total;
    if (clientId) {
      loans = await Loan.find(query).sort({ createdAt: -1 });
      total = loans.length;
    } else {
      const skip = (parseInt(page || 1 ) - 1) * parseInt(limit || 10 );
      [loans, total] = await Promise.all([
        Loan.find(query)
          .populate("client")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit || 10)),
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

    const loan = await Loan.findByIdAndUpdate(id, updates, { new: true,runValidators: true,
  context: "query"});
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }
    if (
      Array.isArray(updates.mergeLoanIds) &&
      updates.mergeLoanIds.length > 0
    ) {
      const mergeResult = await Loan.updateMany(
        { _id: { $in: updates.mergeLoanIds } },
        {
          $set: {
            status: "Merged",
            parentLoanId: loan._id,
          },
        }
      );
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
    return res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: loan,
    });
  } catch (error) {
    console.error("🔥 Error in updateLoan:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
exports.searchLoans = async (req, res) => {
  try {
    const {
      customer,
      company,
      issueDate,
      paymentStatus,
      loanStatus,
      clientId,
      page = 0,
      limit = 10,
    } = req.query;

    const matchStage = {};
    if (clientId) {
      matchStage.client = new mongoose.Types.ObjectId(clientId);
    }
    if (loanStatus) {
      matchStage.loanStatus = loanStatus;
    }
    if (paymentStatus) {
      matchStage.status = paymentStatus;
    }
    if (issueDate) {
      const formattedDate = moment(issueDate, [
        "MM-DD-YYYY",
        "YYYY-MM-DD",
      ]).format("MM-DD-YYYY");
      matchStage.issueDate = formattedDate;
    }
    const pipeline = [{ $match: matchStage }];
    pipeline.push(
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      { $unwind: { path: "$clientInfo", preserveNullAndEmptyArrays: true } }
    );
    pipeline.push(
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "companyInfo",
        },
      },
      { $unwind: { path: "$companyInfo", preserveNullAndEmptyArrays: true } }
    );
    if (customer && customer.trim() !== "") {
      pipeline.push({
        $match: {
          "clientInfo.fullName": new RegExp(customer, "i"),
        },
      });
    }
    if (company && company.trim() !== "") {
      pipeline.push({
        $match: {
          "companyInfo._id": new mongoose.Types.ObjectId(company),
        },
      });
    }
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: Number(page) * Number(limit) },
      { $limit: Number(limit) }
    );
      pipeline.push({
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
          loanTerms: 1,
          client: {
            _id: "$clientInfo._id",
            fullName: "$clientInfo.fullName",
          },
          company: {
            _id: "$companyInfo._id",
            companyName: "$companyInfo.companyName",
            backgroundColor: "$companyInfo.backgroundColor",
          },
        },
      });
    const loans = await Loan.aggregate(pipeline);
    const total = await Loan.countDocuments(matchStage);
    res.json({
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
exports.deactivateLoan = async (req, res) => {
  try {
    const { id } = req.params;


    const loan = await Loan.findByIdAndUpdate(
      id,
      { loanStatus: "Deactivated" },
      { new: true, runValidators: true, context: "query" }
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
    console.error("Error in deactivateLoan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }
    const isMergedLoan = !!loan.parentLoanId; 
    let rootLoan = loan;
    while (rootLoan.parentLoanId) {
      rootLoan = await Loan.findById(rootLoan.parentLoanId);
      if (!rootLoan) break;
    }
    const chainLoanIds = [];
    let currentId = rootLoan._id;
    while (currentId) {
      const currentLoan = await Loan.findById(currentId);
      if (!currentLoan) break;

      chainLoanIds.push(currentLoan._id);

      const child = await Loan.findOne({
        parentLoanId: currentId,
      }).select("_id");
      currentId = child ? child._id : null;
    }
    await LoanPayment.deleteMany({
      loanId: { $in: chainLoanIds }, });
    await Loan.deleteMany({
      _id: { $in: chainLoanIds },
    });

    res.status(200).json({
      success: true,
      message: "Loan and related payments deleted successfully",
      deletedLoanIds: chainLoanIds,
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

        const logMessage = isMergedLoan
          ? `Merged loan deleted. Entire loan chain removed for ${clientName} under ${companyName} by ${deletedBy}`
          : `Loan and its payment history deleted for ${clientName} under ${companyName} by ${deletedBy}`;
        return createAuditLog(
          req.user?.id || null,
          req.user?.userRole || null,
          logMessage,
          "Loan",
          loan._id,
          { before: loan },
          {
            deletedLoanIds: chainLoanIds,
            deletedType: isMergedLoan ? "MERGED_LOAN" : "ACTIVE_LOAN",
          }
        );
      })
      .catch((err) => console.error("Audit log failed:", err));
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
exports.updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }
    const loan = await Loan.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

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
      `Loan status updated to "${status}" for ${clientName} under ${companyName} by ${updatedBy}`,
      "Loan",
      loan._id,
      { after: loan, statusChangedTo: status }
    );

    return res.status(200).json({
      success: true,
      message: "Loan status updated successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Error in updateLoanStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.getProfitByLoanId = async (req, res) => {
  try {
    const { id: loanId } = req.params;

    const loan = await Loan.findOne({
      _id: loanId,
      $or: [{ status: "Paid Off" }],
    });

    if (!loan) {
      return res.json({
        success: true,
        data: {
          loanId,
          totalBaseAmount: 0,
          totalPaid: 0,
          totalProfit: 0,
        },
      });
    }

    const rootLoanId = loan.parentLoanId || loan._id;

    // AGGREGATION 
    const [result] = await Loan.aggregate([
      {
        $match: { _id: rootLoanId },
      },
      {
        $graphLookup: {
          from: "loans",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentLoanId",
          as: "mergedLoans",
        },
      },
      {
        $project: {
          allLoans: {
            $concatArrays: [
              ["$$ROOT"],
              "$mergedLoans",
            ],
          },
        },
      },
      {
        $unwind: "$allLoans",
      },
      {
        $group: {
          _id: null,
          loanIds: { $addToSet: "$allLoans._id" },
          totalBaseAmount: {
            $sum: { $ifNull: ["$allLoans.baseAmount", 0] },
          },
        },
      },
    ]);

    const loanIds = result?.loanIds || [];
    const totalBaseAmount = result?.totalBaseAmount || 0;

    const payments = await LoanPayment.aggregate([
      { $match: { loanId: { $in: loanIds } } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paidAmount" },
        },
      },
    ]);

    const totalPaid = payments[0]?.totalPaid || 0;
    const totalProfit = Math.max(0, totalPaid - totalBaseAmount);

    return res.json({
      success: true,
      data: {
        loanId,
        rootLoanId,
        totalBaseAmount, 
        totalPaid,       
        totalProfit,    
      },
    });

  } catch (err) {
    console.error("Loan profit error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

