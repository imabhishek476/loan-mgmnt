const mongoose = require("mongoose");

const attorneySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    firmName: { type: String, default: "" },
    address: { type: String, default: "" },
    memo: { type: String, default: "" },
    // isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
attorneySchema.index({ fullName: 1 },{unique:true});
attorneySchema.index({ email: 1 });
module.exports.Attorney = mongoose.model("Attorney", attorneySchema);