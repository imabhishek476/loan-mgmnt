const express = require("express");
const { addPayment, getPayments ,deletePayment,editPayment,getAllPaymentsForClient} = require("../controllers/loanPaymentService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/store", isAuthenticated, addPayment);
router.get("/:loanId", isAuthenticated, getPayments);
router.get("/client/:clientId", isAuthenticated, getAllPaymentsForClient);
router.put("/edit/:paymentId", isAuthenticated, editPayment);
router.delete("/delete/:paymentId", isAuthenticated, isAdmin, deletePayment);

module.exports = router;
