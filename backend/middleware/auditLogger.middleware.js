const AuditLog = require("../models/AuditLog");

exports.logAction = async (req, action, details = {}) => {
  try {
    const userId = req.user ? req.user._id : null;
    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress: ip,
    });
  } catch (error) {
    console.error("Failed to log audit action", error);
  }
};
