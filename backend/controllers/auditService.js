const AuditLog = require("../models/AuditLog");
const createAuditLog = require("../utils/auditLog");

exports.getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("userId", "name email userRole ")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

