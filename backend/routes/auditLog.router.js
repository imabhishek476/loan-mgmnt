const express = require("express");
const auditRouter = express.Router();
const { getLogs, logFrontendError } = require("../controllers/auditService");
const { isAuthenticated } = require("../middleware/auth.middleware");

auditRouter.get("/audit-logs", isAuthenticated, getLogs);
auditRouter.post("/frontend-error", isAuthenticated, logFrontendError);

module.exports = auditRouter;

