const express = require("express");
const {
  Clientstore,
  searchClients,
  updateClient,
  deleteClient,
  getClietsLoan,
  toggleClientStatus,
  getClientById,
} = require("../controllers/clientsService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const clientRouter = express.Router();

clientRouter.route("/store").post(isAuthenticated, isAdmin, Clientstore);
clientRouter.route("/search").get(isAuthenticated, isAdmin, searchClients);
clientRouter.route("/loans/:id").get(isAuthenticated, isAdmin, getClietsLoan);
clientRouter.route("/:id").put(isAuthenticated, isAdmin, updateClient);
clientRouter.route("/:id").delete(isAuthenticated, isAdmin, deleteClient);
clientRouter.route("/toggle/:id").put(isAuthenticated, isAdmin, toggleClientStatus);
clientRouter.route("/:id").get(isAuthenticated, isAdmin, getClientById);
module.exports = clientRouter;
