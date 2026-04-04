const express = require("express");
const {
  AddClients,
  searchClients,
  updateClient,
  deleteClient,
  getClietsLoan,
  toggleClientStatus,
  getClientById,
  fixCaseIds,
  checkDuplicateClient,
  formatSSNs,
  formatAddresses
} = require("../controllers/clientsService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const clientRouter = express.Router();

clientRouter.get("/format-ssn", isAuthenticated, formatSSNs);
clientRouter.route("/fixCaseIds").get(isAuthenticated, fixCaseIds);
clientRouter.route("/add").post(isAuthenticated, AddClients);
clientRouter.get("/format-address", isAuthenticated,  formatAddresses);
clientRouter.route("/search").get(isAuthenticated, searchClients);
clientRouter.route("/loans/:id").get(isAuthenticated, getClietsLoan);
clientRouter.route("/:id").put(isAuthenticated,  updateClient);
clientRouter.route("/:id").delete(isAuthenticated, isAdmin, deleteClient);
clientRouter.route("/toggle/:id").put(isAuthenticated, toggleClientStatus);
clientRouter.route("/:id").get(isAuthenticated, getClientById);
clientRouter.route("/checkDuplicate").post(isAuthenticated, checkDuplicateClient);
module.exports = clientRouter;
