import moment from "moment";

export const calculateLoanAmounts = (loan: any) => {
    if (!loan) return null;

    const base = loan.baseAmount || 0;
    const fees = loan.fees || {};
    const interestType = loan.interestType || "flat";
    const monthlyRate = loan.monthlyRate || 0;
    const originalTerm = loan.loanTerms || 0;
    const issueDate = moment(loan.issueDate, "MM-DD-YYYY").toDate();
    const paidAmount = loan.paidAmount || 0;

    const feeKeys = [
        "administrativeFee",
        "applicationFee",
        "attorneyReviewFee",
        "brokerFee",
        "annualMaintenanceFee",
    ];
    const feeTotal = feeKeys.reduce((sum, key) => {
        const fee = fees[key];
        if (!fee) return sum;
        return fee.type === "percentage"
            ? sum + (base * (fee.value || 0)) / 100
            : sum + (fee.value || 0);
    }, 0);

    const subtotal = base + feeTotal;
    const today = moment();
    const start = moment(issueDate);
    const monthsPassed = Math.max(1, today.diff(start, "months") + 1);

    let currentTerm = originalTerm;
    const allowedTerms = [6, 12, 18, 24, 30, 36, 48, 60];
    if (monthsPassed > originalTerm) {
        currentTerm =
            allowedTerms.find((t) => t >= monthsPassed) || originalTerm * 2;
    }

    const rate = monthlyRate / 100;
    let interestAmount = 0;
    if (interestType === "flat") {
        interestAmount = subtotal * rate * currentTerm;
    } else if (interestType === "compound") {
        interestAmount = subtotal * (Math.pow(1 + rate, currentTerm) - 1);
    }

    const total = subtotal + interestAmount;
    const remaining = Math.max(0, total - paidAmount);
    const suggestedPayment = remaining;

    return {
        subtotal,
        interestAmount,
        total,
        paidAmount,
        remaining,
        monthsPassed,
        currentTerm,
        suggestedPayment,
    };
};

export const calculateDynamicTermAndPayment = (loan: any) => {
    const start = moment(loan.issueDate, "MM-DD-YYYY");
    const today = moment();
    const monthsPassed = today.diff(start, "months") + 1;

    const originalTerm = loan.loanTerms || 0;
    const allowedTerms = [6, 12, 18, 24, 30, 36, 48, 60];
    let dynamicTerm = originalTerm;
    if (monthsPassed > originalTerm) {
        dynamicTerm =
            allowedTerms.find((t) => t >= monthsPassed) || originalTerm * 2;
    }

    const monthlyInstallment = dynamicTerm
        ? (loan.totalLoan || 0) / dynamicTerm
        : 0;
    const monthsPaid = Math.floor((loan.paidAmount || 0) / monthlyInstallment);
    const monthsDue = Math.max(0, monthsPassed - monthsPaid);
    const suggestedPayment = monthlyInstallment * monthsDue;

    return { dynamicTerm, monthsPassed, suggestedPayment, monthsDue };
};