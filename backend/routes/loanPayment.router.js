const express = require("express");
const { addPayment, getPayments } = require("../controllers/loanPaymentService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/store", isAuthenticated, isAdmin, addPayment);
router.get("/:loanId", isAuthenticated, isAdmin, getPayments);

module.exports = router;
