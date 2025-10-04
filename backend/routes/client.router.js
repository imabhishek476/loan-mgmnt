const express = require("express");
const {
  Clientstore,
  searchClients,
  updateClient,
  deleteClient,
} = require("../controllers/clientsService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const clientRouter = express.Router();

clientRouter.route("/store").post(isAuthenticated, isAdmin, Clientstore);
clientRouter.route("/search").get(isAuthenticated, isAdmin, searchClients);
clientRouter.route("/:id").put(isAuthenticated, isAdmin, updateClient);
clientRouter.route("/:id").delete(isAuthenticated, isAdmin, deleteClient);

module.exports = clientRouter;
