const AuditLog = require("../models/AuditLog");
const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const moment = require("moment");
const createAuditLog = require("../utils/auditLog");
const User = require("../models/User");
exports.Clientstore = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      ssn,
      dob,
      accidentDate,
      address,
      attorneyName,
      memo,
      customFields,
    } = req.body;


    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: "Full name are required",
      });
    }

    const trimEmail = email?.trim().toLowerCase();
    let exist_record = null;
    if (trimEmail) {
     exist_record = await Client.findOne({ email: trimEmail });
      if (exist_record) {
        return res.status(400).json({
          success: false,
          error: "Customer with this email already exists",
        });
      }
    }

    if (exist_record) {
      return res.status(400).json({
        success: false,
        error: "Customer with this email already exists",
      });
    }

    const dobStr = dob ? moment(dob).format("MM-DD-YYYY") : "";
    const accidentDateStr = accidentDate ? moment(accidentDate).format("MM-DD-YYYY") : "";

    const newClient = await Client.create({
      fullName: fullName.trim(),
      email: trimEmail,
      phone: phone?.trim(),
      ssn: ssn || "",
      dob: dobStr,
      accidentDate: accidentDateStr,
      address: address || "",
      attorneyName: attorneyName || "",
      memo: memo || "",

      customFields: Array.isArray(customFields) ? customFields : [],
      createdBy: req.user ? req.user.id : null,
    });
    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Create Customer (${newClient.fullName ? newClient.fullName : ""})`,
      "Customer",
      newClient._id,
      { after: newClient }
    );
    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      client: newClient,
    });
  } catch (error) {
    console.error("Error in Clientstore:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.searchClients = async (req, res) => {
  try {
    const { query, issueDate, page = 0, limit = 10 } = req.query;
    const matchStage = {};

    if (query && query.trim() !== "") {
      const regex = new RegExp(query, "i");
      matchStage.$or = [
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { attorneyName: regex },
        { ssn: regex },
        { dob: regex },
        { accidentDate: regex },
        { "customFields.name": regex },
        { "customFields.value": regex },
      ];
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "loans",
          let: { clientId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$client", "$$clientId"] },
              },
            },
            {
              $addFields: {
                issueDateParsed: {
                  $dateFromString: {
                    dateString: "$issueDate",
                    format: "%m-%d-%Y",
                    onError: null,
                    onNull: null,
                  },
                },
              },
            },
            { $sort: { issueDateParsed: -1 } },
          ],
          as: "allLoans",
        },
      },
      {
        $addFields: {
          loanSummary: {
            $let: {
              vars: {
                validLoans: {
                  $filter: {
                    input: "$allLoans",
                    as: "loan",
                    cond: { $ne: ["$$loan.status", "Merged"] },
                  },
                },
              },
              in: {
                totalSubTotal: { $sum: "$$validLoans.subTotal" },
                totalPaid: { $sum: "$$validLoans.paidAmount" },
                totalLoan: { $sum: "$$validLoans.totalLoan" },
                totalPending: {
                  $subtract: [
                    { $sum: "$$validLoans.totalLoan" },
                    { $sum: "$$validLoans.paidAmount" },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          latestLoan: {
            $ifNull: [{ $arrayElemAt: ["$allLoans", 0] }, null],
          },
        },
      },
      ...(issueDate
        ? [
            {
              $match: {
                "latestLoan.issueDate": issueDate,
              },
            },
          ]
        : []),

      { $sort: { createdAt: -1 } },
      { $skip: Number(page) * Number(limit) },
      { $limit: Number(limit) },
    ];

    const clients = await Client.aggregate(pipeline);
    let total;
    if (query || issueDate) {
      const countPipeline = pipeline.filter(
        (stage) => !("$skip" in stage) && !("$limit" in stage)
      );
      const filteredClients = await Client.aggregate(countPipeline);
      total = filteredClients.length;
    } else {
      total = await Client.countDocuments();
    }

    res.status(200).json({
      success: true,
      count: clients.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      clients,
    });
  } catch (error) {
    console.error("Error in searchClients:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Format dates
    if (updates.dob) {
      updates.dob = moment(updates.dob).format("MM-DD-YYYY");
    }
    if (updates.accidentDate) {
      updates.accidentDate = moment(updates.accidentDate).format("MM-DD-YYYY");
    }

    // Normalize email
    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();

      // Check if another client already has this email
      const exist_record = await Client.findOne({
        email: updates.email,
        _id: { $ne: id }, // string id is fine
      });

      if (exist_record) {
        return res.status(400).json({
          success: false,
          error: "Another Customer with this email already exists",
        });
      }
    }

    // Update client
    const client = await Client.findByIdAndUpdate(id, updates, { new: true });
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });
    }

    // Audit log
    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Customer Updated (${client.fullName ? client.fullName : ""})`,
      "Customer",
      client._id,
      { before: client, after: client }
    );

    res.status(200).json({ success: true, message: "Client updated", client });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const clientPromise = Client.findByIdAndDelete(id);
    const loansPromise = Loan.deleteMany({ client: id });
    const [client, deletedLoans] = await Promise.all([
      clientPromise,
      loansPromise,
    ]);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }
    res.status(200).json({
      success: true,
      message: `Customer deleted successfully along with ${deletedLoans.deletedCount} related loan(s)`,
    });
    (async () => {
      try {
    const user = await User.findById(req.user?.id).select("name email");
    const deletedBy = user?.name || user?.email || "-";
  await createAuditLog(
    req.user?.id || null,
    req.user?.userRole || null,
    `Customer "${client.fullName || "-"}" and ${
      deletedLoans.deletedCount
    } related loan(s) deleted by ${deletedBy}`,
    "Customer",
    client._id,
    {
      message: `Customer "${client.fullName || "-"}" and ${
        deletedLoans.deletedCount
      } related loan(s) deleted`,
      deletedClient: client,
      deletedLoansCount: deletedLoans.deletedCount,
    }
  );
    } catch (err) {
        console.error("Audit log failed:", err);
      }
    })();
  } catch (error) {
    console.error("Error deleting customer and loans:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getClietsLoan = async (req, res) => {
  try {
    const { id } = req.params
    const loans = await Loan.find({ client: id })
      .sort({ createdAt: -1 })
      .populate("client") 
      .populate("company", "companyName");

    res.status(200).json({ success: true, loans });
  } catch (error) {
    console.error("Error fetching Customer loans:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.toggleClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client)
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });

    client.isActive = !client.isActive;
    await client.save();
    res.status(200).json({
      success: true,
      message: `Customer "${client.fullName}" ${
        client.isActive ? "activated" : "deactivated"
      } successfully.`,
      newStatus: client.isActive,
    });

    const newLoanStatus = client.isActive ? "Active" : "Deactivated";

    const updateLoansPromise = Loan.updateMany(
      { client: id },
      { loanStatus: newLoanStatus }
    ).exec();

  (async () => {
    try {
    const [user, updatedLoans] = await Promise.all([
      User.findById(req.user?.id).select("name email"),
      updateLoansPromise,
    ]);
    const actionBy = user?.name || user?.email || "-";

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Customer "${client.fullName}" marked as "${
        client.isActive ? "Active" : "Inactive"
      }" by ${actionBy}`,
      "Customer",
      client._id,
      {
        message: `Customer "${client.fullName}" was marked as "${
          client.isActive ? "Active" : "Inactive"
        }" and ${
          updatedLoans.modifiedCount
        } related loan(s) were set to "${newLoanStatus}".`,
        updatedClient: client,
        updatedLoansCount: updatedLoans.modifiedCount,
        performedBy: actionBy,
      }
    );
  } catch (err) {
        console.error("Audit log failed:", err);
      }
    })();
  } catch (error) {
    console.error("Error toggling client status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client)
      return res.status(404).json({ success: false, error: "Client not found" });
    res.status(200).json({ success: true, client });
  } catch (error) {
    console.error("Error fetching client by ID:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


