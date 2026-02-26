const mongoose = require("mongoose");

const TemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    htmlData: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Indexes (like LoanPayment)
TemplateSchema.index({ title: 1 });
TemplateSchema.index({ currentUser: 1 });
TemplateSchema.index({ createdAt: 1 });

module.exports.Template = mongoose.model("Template", TemplateSchema);