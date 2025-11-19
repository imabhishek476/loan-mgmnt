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
    tenures: [
      {
        term: {
          type: Number,
          enum: [6, 12, 18, 24, 30, 36, 48],
          required: true,
        },
        endDate: {
          type: String,
          required: true,
        },
      },
    ],
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
    parentLoanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
    },
  },
  { timestamps: true }
);
LoanSchema.index({ client: 1 });
LoanSchema.index({ issueDate: 1 });
LoanSchema.index({ subTotal: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ parentLoanId: 1 });
LoanSchema.index({ loanStatus: 1 });
LoanSchema.index({ checkNumber: 1 });
LoanSchema.index({ previousLoanAmount: 1 });
LoanSchema.index({ baseAmount: 1 });

module.exports.Loan = mongoose.model("Loan", LoanSchema);
