const express = require("express");
const { getLoansByCompanyByDate, getDashboardStats } = require("../controllers/dashboardService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const dashboardRoutes = express.Router();

dashboardRoutes.get("/stats", isAuthenticated, isAdmin, getDashboardStats);
dashboardRoutes.get("/stats/filter", isAuthenticated, isAdmin, getLoansByCompanyByDate);

module.exports = dashboardRoutes;
