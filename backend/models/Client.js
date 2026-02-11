const mongoose = require("mongoose");

const customFieldSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  name: { type: String, required: false },
  value: mongoose.Schema.Types.Mixed,
  type: {
    type: String,
    enum: ["string", "number", "boolean"],
    default: "string"
  }
}, { _id: false });

const ClientSchema = new mongoose.Schema(
{
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  underwriter: String,
  uccFiled: Boolean,
  medicalParalegal: String,
  caseId: String,
  indexNumber: String,
  caseType: String,
  ssn: String,
  dob: String,
  accidentDate: String,
  address: String,
  attorneyName: String,
  memo: String,
   isActive: { type: Boolean, default: true },
  customFields: [customFieldSchema],
},
{ timestamps: true }
);
ClientSchema.index({ fullName: 1 },{unique:true});
ClientSchema.index({ email: 1 });
ClientSchema.index({ dob: 1 });
ClientSchema.index({ phone: 1 });
ClientSchema.index({ ssn: 1 });
ClientSchema.index({ accidentDate: 1 });
ClientSchema.index({ address: 1 });
ClientSchema.index({ attorneyName: 1 });
ClientSchema.index({ underwriter: 1 });
ClientSchema.index({ medicalParalegal: 1 });
ClientSchema.index({ caseType: 1 });
ClientSchema.index({ caseId: 1 });
ClientSchema.index({ indexNumber: 1 });
ClientSchema.index({ uccFiled: 1 });
ClientSchema.index({ memo: 1 });
ClientSchema.index({ isActive: 1 });
module.exports.Client = mongoose.model("Client", ClientSchema);