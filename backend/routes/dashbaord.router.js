const express = require("express");
const {
  getFilteredStats,
  getDashboardStats,
  getPayoffStats,
} = require("../controllers/dashboardService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const dashboardRoutes = express.Router();
dashboardRoutes.get("/payoff-stats", isAuthenticated, isAdmin, getPayoffStats);
dashboardRoutes.get("/stats", isAuthenticated, isAdmin, getDashboardStats);
dashboardRoutes.get("/stats/filtered",isAuthenticated,isAdmin, getFilteredStats); 

module.exports = dashboardRoutes;
