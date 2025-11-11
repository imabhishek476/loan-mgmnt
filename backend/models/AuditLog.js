const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    data: { type: Object },
    message: { type: String },
    expireAt: {
      type: Date,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);
auditLogSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
