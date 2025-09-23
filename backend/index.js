const express = require("express");
const connectDB = require("./database"); 
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Connect DB
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Seed admin user
const seedAdmin = require("./admin");
seedAdmin();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
