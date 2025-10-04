const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
   userRole: {
        type: String,
        required:true,
        enum: ["admin"]
    },
});

module.exports = mongoose.model("User", UserSchema);
