const AuditLog = require("../models/AuditLog");
const createAuditLog = require("../utils/auditLog");

exports.getLogs = async (req, res) => {
  try {
    const { page = 0, limit = 10, query } = req.query;

    const matchStage = {};

    if (query && query.trim() !== "") {
      const regex = new RegExp(query.trim(), "i");
      matchStage.$or = [
        { action: regex },
        { message: regex },
        { userName: regex },
      ];
    }

    const skip = Math.max(Number(page) * Number(limit), 0);
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users", 
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userName: { $ifNull: ["$user.name", "Deleted User"] },
          userEmail: "$user.email",
          userRole: "$user.userRole",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ];

    const logs = await AuditLog.aggregate(pipeline);
    const total = await AuditLog.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      data: logs, 
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error in getLogs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.logFrontendError = async (req, res) => {
  console.log(req.user?._id);
  try {
    await createAuditLog(
      req.user?._id || null,
      req.user?.userRole || "Guest",
      req.body.message || "Frontend error",
      "FrontendError",
      null,
      {
        stack: req.body.stack,
        url: req.body.url,
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Frontend error log failed:", error);
    res.status(500).json({ success: false });
  }
};

