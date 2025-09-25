const express = require("express");
const { Clientstore, searchClients } = require("../controllers/clientsService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const clientRouter = express.Router();

clientRouter.route("/store").post(isAuthenticated, isAdmin, Clientstore);
clientRouter.route("/search").get(isAuthenticated, isAdmin, searchClients); 

module.exports = clientRouter;
