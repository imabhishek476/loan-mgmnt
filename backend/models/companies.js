const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["flat", "percentage"],
    default: "flat"
  },
  value: {
    type: Number,
    default: 0
  }
}, { _id: false });

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyCode: { type: String, required: false, unique: false },
  description: String,
  phone: String,
  email: String,
  website: String,
  address: String,
  activeCompany: { type: Boolean, default: true },
  backgroundColor: { type: String, default: "#ffffff" },
  interestRate: {
    monthlyRate: { type: Number, required: true },
    interestType: { type: String, enum: ["flat", "compound"], required: true }
  },

  fees: {
    administrativeFee: { type: feeSchema, default: () => ({}) },
    applicationFee: { type: feeSchema, default: () => ({}) },
    attorneyReviewFee: { type: feeSchema, default: () => ({}) },
    brokerFee: { type: feeSchema, default: () => ({}) },
    annualMaintenanceFee: { type: feeSchema, default: () => ({}) }
  },

  loanTerms: [{ type: Number, enum: [6, 12, 18, 24, 30, 36] }],

  freshLoanRules: {
    enabled: { type: Boolean, default: false },
    minMonthsBetweenLoans: { type: Number, default: 0 },
    allowOverlappingLoans: { type: Boolean, default: false },
    requireFullPayoff: { type: Boolean, default: false }
  },

  payoffSettings: {
    allowEarlyPayoff: { type: Boolean, default: false },
    earlyPayoffPenalty: { type: Number, default: 0 },
    earlyPayoffDiscount: { type: Number, default: 0 },
    gracePeriodDays: { type: Number, default: 0 },
    lateFeeAmount: { type: Number, default: 0 },
    lateFeeGraceDays: { type: Number, default: 0 }
  }
}, { timestamps: true });


module.exports = mongoose.model("Company", companySchema);