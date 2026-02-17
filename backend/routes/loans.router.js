const express = require("express");
const {
  LoansCreate,
  AllLoans,
  updateLoan,
  deactivateLoan,
  recoverLoan,
  activeLoans,
  getLoanById,
  searchLoans,
  deleteLoan,
  updateLoanStatus,
  getProfitByLoanId, 
} = require("../controllers/loanService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const loanRouter = express.Router();

loanRouter.get("/", isAuthenticated, isAdmin, AllLoans);
loanRouter.post("/", isAuthenticated, isAdmin, LoansCreate);
loanRouter.put("/:id", isAuthenticated, isAdmin, updateLoan);
loanRouter.delete("/delete/:id", isAuthenticated, isAdmin, deleteLoan);
loanRouter.delete("/:id", isAuthenticated, isAdmin, deactivateLoan);
loanRouter.get("/search", isAuthenticated, isAdmin, searchLoans);
loanRouter.get("/edit/:id", isAuthenticated, isAdmin, getLoanById);
loanRouter.put("/:id/recover", isAuthenticated, isAdmin, recoverLoan); 
loanRouter.get("/activeLoans", isAuthenticated, isAdmin, activeLoans);
loanRouter.put("/:id/status", isAuthenticated, isAdmin, updateLoanStatus);
loanRouter.get("/:id/profit", isAuthenticated, isAdmin, getProfitByLoanId);
module.exports = loanRouter;
