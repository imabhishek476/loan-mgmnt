const express = require("express");
const { getDashboardStats} = require("../controllers/dashboardService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/stats", isAuthenticated, isAdmin, getDashboardStats);

module.exports = router;
