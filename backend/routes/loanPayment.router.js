const express = require("express");
const { addPayment, getPayments ,deletePayment,editPayment} = require("../controllers/loanPaymentService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/store", isAuthenticated, isAdmin, addPayment);
router.get("/:loanId", isAuthenticated, isAdmin, getPayments);
router.put("/edit/:paymentId", isAuthenticated, isAdmin, editPayment);
router.delete("/delete/:paymentId", isAuthenticated, isAdmin, deletePayment);

module.exports = router;
