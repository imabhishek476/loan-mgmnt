
const mongoose = require("mongoose");

const LoanPaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  paidAmount: { type: Number, required: true },
  paidDate: { type: Date, default: Date.now },
  checkNumber: { type: String },
  payoffLetter: { type: String },
}, { timestamps: true });
LoanPaymentSchema.index({ loanId: 1 });
LoanPaymentSchema.index({ clientId: 1 });
LoanPaymentSchema.index({ paidAmount: 1 });
LoanPaymentSchema.index({ checkNumber: 1 });
LoanPaymentSchema.index({ paidDate: 1 });

module.exports.LoanPayment = mongoose.model("LoanPayment", LoanPaymentSchema);
