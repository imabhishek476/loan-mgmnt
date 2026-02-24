const express = require("express");
const { addPayment, getPayments ,deletePayment,editPayment,getAllPaymentsForClient} = require("../controllers/loanPaymentService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/store", isAuthenticated, isAdmin, addPayment);
router.get("/:loanId", isAuthenticated, isAdmin, getPayments);
router.get("/client/:clientId", isAuthenticated, isAdmin, getAllPaymentsForClient);
router.put("/edit/:paymentId", isAuthenticated, isAdmin, editPayment);
router.delete("/delete/:paymentId", isAuthenticated, isAdmin, deletePayment);

module.exports = router;
