const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");
require("dotenv").config();
const connectDB = require("./database");

async function rehashAdmin() {
  await connectDB();

  const adminEmail = "vinnovate@gmail.com";
  const user = await User.findOne({ email: adminEmail });

  if (!user) {
    console.log("Admin not found");
    process.exit();
  }

  const newHash = await bcrypt.hash("Admin@123", 10);
  user.password = newHash;
  await user.save();

  console.log("✅ Admin password rehashed successfully");
  process.exit();
}

rehashAdmin();
