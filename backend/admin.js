const User = require("./models/User");
const bcrypt = require("bcrypt");

module.exports = async function seedAdmin() {
  try {
    const email = "vinnovate@gmail.com";
    const existing = await User.findOne({ email });
    if (!existing) {
      const hashed = await bcrypt.hash("admin123", 10); 
      const admin = new User({
        name: "Cristin jenfar",
        email,
        password: hashed,
        userRole: "admin",
      });
      await admin.save();
      console.log(admin,'response');
    } else {
      console.log(`ℹ️ Admin already exists: ${email}`);
    }
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  }
};
