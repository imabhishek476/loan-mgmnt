const AuditLog = require("../models/AuditLog");
const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const moment = require("moment");
const createAuditLog = require("../utils/auditLog");
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
          error: "Client with this email already exists",
        });
      }
    }

    if (exist_record) {
      return res.status(400).json({
        success: false,
        error: "Client with this email already exists",
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
      "Create Client", 
      "Client",
      newClient._id,
      { after: newClient }
    );
    res.status(201).json({
      success: true,
      message: "Client added successfully",
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
    const { query } = req.query;
    let matchStage = {};

    if (query) {
      const regex = new RegExp(query, "i");

      matchStage.$or = [
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { attorneyName: regex },
        { ssn: { $regex: query } },
        { dob: { $regex: query } },
        { accidentDate: { $regex: query } },
        { "customFields.name": regex },
        { "customFields.value": regex },
      ];
    }

    const clients = await Client.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          fullName: 1,
          email: 1,
          phone: 1,
          ssn: 1,
          dob: 1,
          accidentDate: 1,
          attorneyName: 1,
          memo: 1,
          address: 1,
          customFields: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({ clients });
  } catch (error) {
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
          error: "Another client with this email already exists",
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
      "Client has been Updated",
      "Client",
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
    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, error: "Client not found" });
    }
    const deletedLoans = await Loan.deleteMany({ client: id });
    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Client and related loans deleted (${deletedLoans.deletedCount} loans)`,
      "Client",
      client._id,
      { deletedClient: client, deletedLoansCount: deletedLoans.deletedCount }
    );

    res.status(200).json({
      success: true,
      message: `Client deleted successfully along with ${deletedLoans.deletedCount} related loan(s)`,
    });
  } catch (error) {
    console.error("Error deleting client and loans:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.getClietsLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const loans = await Loan.find({ client: id })
      .sort({ createdAt: -1 })
      .populate("client", "fullName")       
      .populate("company", "companyName");  

    res.status(200).json({ success: true, loans });
  } catch (error) {
    console.error("Error fetching client loans:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};



