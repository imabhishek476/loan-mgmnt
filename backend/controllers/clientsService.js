const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const moment = require("moment");

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
      customFields
    } = req.body;

    console.log("request coming to controller", req.body);


    if (!fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: "Full name, email, and phone are required",
      });
    }

    const trimEmail = email.trim().toLowerCase();
    console.log("normalized email =>", trimEmail);


    const exist_record = await Client.findOne({ email: trimEmail });
    console.log("exist_record", exist_record);

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
      phone: phone.trim(),
      ssn: ssn || "",
      dob: dobStr,
      accidentDate: accidentDateStr,
      address: address || "",
      attorneyName: attorneyName || "",
      customFields: Array.isArray(customFields) ? customFields : [],
      createdBy: req.user ? req.user._id : null,
    });

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

    if (updates.dob) {
      updates.dob = moment(updates.dob).format("MM-DD-YYYY");
    }
    if (updates.accidentDate) {
      updates.accidentDate = moment(updates.accidentDate).format("MM-DD-YYYY");
    }

    const client = await Client.findByIdAndUpdate(id, updates, { new: true });
    if (!client) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

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
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    res.status(200).json({ success: true, message: "Client deleted" });
  } catch (error) {
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



