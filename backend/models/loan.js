const mongoose = require("mongoose");

const FeeSchema = new mongoose.Schema({
  value: { type: Number, default: 0 },
  type: { type: String, enum: ["flat", "percentage"], default: "flat" },
});

const LoanSchema = new mongoose.Schema(
  {
    issueDate: { type: String, default: Date.now },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    loanTerms: { type: Number, default: 12 },
    baseAmount: { type: Number, required: true },
    previousLoanAmount: { type: Number, default: 0 },
    subTotal: { type: Number, default: 0 },
    totalLoan: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    fees: {
      administrativeFee: { type: FeeSchema, default: () => ({}) },
      applicationFee: { type: FeeSchema, default: () => ({}) },
      attorneyReviewFee: { type: FeeSchema, default: () => ({}) },
      brokerFee: { type: FeeSchema, default: () => ({}) },
      annualMaintenanceFee: { type: FeeSchema, default: () => ({}) },
    },
    interestType: { type: String, enum: ["flat", "compound"], default: "flat" },
    monthlyRate: { type: Number, default: 0 },
    endDate: { type: String },
    checkNumber: { type: String },
    status: {
      type: String,
      enum: ["Active", "Paid Off", "Partial Payment", "Merged"],
      default: "Active",
    },
    loanStatus: {
      type: String,
      enum: ["Active", "Deactivated"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports.Loan = mongoose.model("Loan", LoanSchema);
