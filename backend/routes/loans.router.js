const express = require("express");
const {
  LoansCreate,
  AllLoans,
  updateLoan,
  // deactivateLoan,
  recoverLoan,
  // activeLoansData,
  getLoanById,
  searchLoans,
  deleteLoan,
  updateLoanStatus,
  getProfitByLoanId, 
  getProfitByClientId,
  getLoanByClientId
} = require("../controllers/loanService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const loanRouter = express.Router();

loanRouter.get("/", isAuthenticated, AllLoans);
loanRouter.post("/", isAuthenticated, LoansCreate);
loanRouter.put("/:id", isAuthenticated, updateLoan);
loanRouter.delete("/delete/:id", isAuthenticated, isAdmin, deleteLoan);
// loanRouter.delete("/:id", isAuthenticated, isAdmin, deactivateLoan);
loanRouter.get("/search", isAuthenticated,searchLoans);
loanRouter.get("/edit/:id", isAuthenticated,getLoanById);
loanRouter.put("/:id/recover", isAuthenticated,recoverLoan); 
// loanRouter.get("/activeLoans", isAuthenticated, isAdmin, activeLoansData);
loanRouter.put("/:id/status", isAuthenticated,updateLoanStatus);
loanRouter.get("/:id/profit", isAuthenticated,getProfitByLoanId);
loanRouter.get("/:clientId/profits",isAuthenticated,getProfitByClientId);
loanRouter.get("/:id/client-loans",isAuthenticated,getLoanByClientId);
module.exports = loanRouter;
