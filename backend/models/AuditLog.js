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
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entity: 1 });
auditLogSchema.index({ entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ data: 1 });
auditLogSchema.index({ message: 1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
