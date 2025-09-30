const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyCode: { type: String, required: true, unique: true },
  description: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  address: { type: String },
  activeCompany: { type: Boolean},

 
  interestRate: {
    monthlyRate: { type: Number, required: true }, 
    interestType: { type: String, enum: ["flat", "compound"], required: true }
  },

  fees: {
    administrativeFee: { type: Number, default: 0 },
    applicationFee: { type: Number, default: 0 },
    attorneyReviewFee: { type: Number, default: 0 },
    brokerFee: { type: Number, default: 0 },
    annualMaintenanceFee: { type: Number, default: 0 }
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

module.exports = mongoose.model("Compaines", companySchema);
