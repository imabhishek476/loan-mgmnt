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
  formatPhoneNumbers,
} = require("../controllers/clientsService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const clientRouter = express.Router();

clientRouter.route("/fixCaseIds").get(isAuthenticated, isAdmin, fixCaseIds);
clientRouter.route("/add").post(isAuthenticated, isAdmin, AddClients);
clientRouter.route("/search").get(isAuthenticated, isAdmin, searchClients);
clientRouter.route("/loans/:id").get(isAuthenticated, isAdmin, getClietsLoan);
clientRouter.route("/:id").put(isAuthenticated, isAdmin, updateClient);
clientRouter.route("/:id").delete(isAuthenticated, isAdmin, deleteClient);
clientRouter.route("/toggle/:id").put(isAuthenticated, isAdmin, toggleClientStatus);
clientRouter.route("/:id").get(isAuthenticated, isAdmin, getClientById);
clientRouter.route("/checkDuplicate").post(isAuthenticated, isAdmin, checkDuplicateClient);
module.exports = clientRouter;
