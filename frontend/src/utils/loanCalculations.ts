import moment from "moment";

export const calculateLoanAmounts = (loan: any) => {
    if (!loan) return null;

    const interestType = loan.interestType || "flat";
    const monthlyRate = loan.monthlyRate || 0;
    const originalTerm = loan.loanTerms || 0;
    const issueDate = moment(loan.issueDate, "MM-DD-YYYY");
    const paidAmount = loan.paidAmount || 0;
    const subtotal = loan.subTotal || 0;
    const today = moment();
    const monthsPassed = today.diff(issueDate, "months") + 1;

    const allowedTerms = [6, 12, 18, 24, 30, 36, 48];
    const dynamicTerm =
        originalTerm && allowedTerms.includes(originalTerm)
            ? originalTerm
            : allowedTerms.find((t) => t >= monthsPassed) || originalTerm;

    const rate = monthlyRate / 100;
    let interestAmount = 0;

    if (interestType === "flat") {
        interestAmount = subtotal * rate * dynamicTerm;
    } else if (interestType === "compound") {
        interestAmount = subtotal * (Math.pow(1 + rate, dynamicTerm) - 1);
    }

    const total = subtotal + interestAmount;
    const remaining = Math.max(0, total - paidAmount);

    return {
        subtotal,
        interestAmount,
        total,
        paidAmount,
        remaining,
        monthsPassed,
        currentTerm: dynamicTerm,
        dynamicTerm,
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