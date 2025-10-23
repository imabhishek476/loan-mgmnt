const express = require("express");
const {
  LoansCreate,
  AllLoans,
  updateLoan,
  deleteLoan,
  recoverLoan,
  activeLoans,
} = require("../controllers/loanService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const loanRouter = express.Router();

loanRouter.get("/", isAuthenticated, isAdmin, AllLoans);
loanRouter.post("/", isAuthenticated, isAdmin, LoansCreate);
loanRouter.put("/:id", isAuthenticated, isAdmin, updateLoan);
loanRouter.delete("/:id", isAuthenticated, isAdmin, deleteLoan);
loanRouter.put("/:id/recover", isAuthenticated, isAdmin, recoverLoan); 
loanRouter.get("/activeLoans", isAuthenticated, isAdmin, activeLoans);
module.exports = loanRouter;
