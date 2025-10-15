const express = require("express");
const router = express.Router();
const { getLogs } = require("../controllers/auditService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");
const auditRouter = express.Router();

auditRouter.route("/audit-logs").get(isAuthenticated, isAdmin, getLogs);
auditRouter.get("/api/logs/test", (req, res) =>
  res.send("Audit log route works!")
);

module.exports = auditRouter;

