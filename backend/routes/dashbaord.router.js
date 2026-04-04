const express = require("express");
const {
  getFilteredStats,
  getDashboardStats,
  getPayoffStats,
  exportPayoffStats
} = require("../controllers/dashboardService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const dashboardRoutes = express.Router();
dashboardRoutes.get("/payoff-stats", isAuthenticated, isAdmin, getPayoffStats);
dashboardRoutes.get("/stats", isAuthenticated, isAdmin, getDashboardStats);
dashboardRoutes.get("/stats/filtered",isAuthenticated,isAdmin, getFilteredStats); 
dashboardRoutes.get("/payoff-stats/export",isAuthenticated, exportPayoffStats);
module.exports = dashboardRoutes;
