const { default: mongoose } = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

configSchema.index({ title: 1 });
module.exports = mongoose.model("Config", configSchema);
