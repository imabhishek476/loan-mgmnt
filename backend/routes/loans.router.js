const express = require("express");
const {
  LoansCreate,
  AllLoans,
  deleteLoan,
} = require("../controllers/loanService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const loanRouter = express.Router();

loanRouter.get("/", isAuthenticated, isAdmin, AllLoans);
loanRouter.post("/", isAuthenticated, isAdmin, LoansCreate);
loanRouter.delete("/:id", isAuthenticated, isAdmin, deleteLoan);

module.exports = loanRouter;
