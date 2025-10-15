const express = require("express");
const {
  LoansCreate,
  AllLoans,
  updateLoan,
  // deleteLoan,
} = require("../controllers/loanService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const loanRouter = express.Router();

loanRouter.get("/", isAuthenticated, isAdmin, AllLoans);
loanRouter.post("/", isAuthenticated, isAdmin, LoansCreate);
loanRouter.put("/:id", isAuthenticated, isAdmin, updateLoan);
// loanRouter.delete("/:id", isAuthenticated, isAdmin, deleteLoan);

module.exports = loanRouter;
