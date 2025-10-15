const User = require("./models/User");
const { Client } = require("./models/Client");// make sure you have a Client model
const bcrypt = require("bcrypt");

module.exports = async function seedAdmin() {
  try {
    const adminEmail = "vinnovate@gmail.com";
    const adminPassword = "admin123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({ email: adminEmail, password: hashedPassword, userRole: "admin", name: "Admin"});
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin already exists");
    }

    // Sample clients
    const sampleClients = [
      {
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "1234567890",
        ssn: "111-22-3333",
        dob: "01-15-1997",
        accidentDate: "09-26-2023",
        address: "123 Main St, Springfield",
        attorneyName: "Jane Smith",
        memo:"This is memo",
        customFields: [
          { name: "Case Number", value: "C001", type: "string" },
          { name: "Claim Amount", value: 5000, type: "number" },
        ],
      },
      {
        fullName: "Arun Patil",
        email: "arun.patil@example.com",
        phone: "657894587",
        ssn: "111-22-3333",
        dob: "06-20-1994",
        accidentDate: "06-22-2022",
        address: "458 Main St, New-york",
        attorneyName: "Jane Smith",
        memo:"This is memo",
        customFields: [
          { name: "Case Number", value: "6321", type: "string" },
          { name: "Claim Amount", value: 4000, type: "number" },
        ],
      },
      {
        fullName: "Alice Johnson",
        email: "alice.johnson@example.com",
        phone: "9876543210",
        ssn: "222-33-4444",
        dob: "07-19-1993",
        accidentDate: "04-12-2014",
        address: "456 Oak Ave, Metropolis",
        attorneyName: "Robert Brown",
        memo:"This is memo",

        customFields: [
          { name: "Case Number", value: "C002", type: "string" },
          { name: "Is Active", value: true, type: "boolean" },
        ],
      },
    ];

    for (const client of sampleClients) {
      const existingClient = await Client.findOne({ email: client.email });
      if (!existingClient) {
        await Client.create(client);
        console.log(`✅ Client ${client.fullName} created`);
      } else {
        console.log(`ℹ️ Client ${client.fullName} already exists`);
      }
    }
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  }
};
