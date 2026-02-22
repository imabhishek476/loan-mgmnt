const mongoose = require("mongoose");

const ClientNoteSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    text: {                    
      type: String,
      required: true,
      trim: true,
    },
    date: {                    
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

ClientNoteSchema.index({ text: "text" });

module.exports.ClientNote = mongoose.model(
  "ClientNote",
  ClientNoteSchema
);