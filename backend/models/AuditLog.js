const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    data: { type: Object },
    message: { type: String }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
