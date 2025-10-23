const mongoose = require("mongoose");

const customFieldSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  name: { type: String, required: true },
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
  ssn: String,
  dob: String,
  accidentDate: String,
  address: String,
  attorneyName: String,
  memo: String,
  customFields: [customFieldSchema],
},
{ timestamps: true }
);
module.exports.Client = mongoose.model("Client", ClientSchema);