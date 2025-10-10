const express = require("express");
const connectDB = require("./database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const clientRouter = require("./routes/client.router");
const companiesRouter = require("./routes/companies.router");
const loanRouter = require("./routes/loans.router");
const loanPaymentRouter = require("./routes/loanPayment.router");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,          // allow any origin dynamically
    credentials: true,     // allow cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
// Handle preflight requests globally
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Connect DB
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth.router"));
app.use("/api/client", clientRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/loans", loanRouter);

app.use("/api/payments", loanPaymentRouter);
// Seed admin user
const seedAdmin = require("./admin");
seedAdmin();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
