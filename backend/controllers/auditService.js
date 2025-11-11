const AuditLog = require("../models/AuditLog");

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

