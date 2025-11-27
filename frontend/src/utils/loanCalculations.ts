import moment from "moment";
import { ALLOWED_TERMS } from "./constants";

export const calculateLoanAmounts = (loan: any, mergedLoans = null, calcType: string = null) => {
    if (!loan) return null;

    const interestType = loan.interestType || "flat";
    const monthlyRate = loan.monthlyRate || 0;
    // const originalTerm = loan.loanTerms || 0;
    let issueDate = moment(loan.issueDate, "MM-DD-YYYY");
    const paidAmount = loan.paidAmount || 0;
    const subtotal = loan.subTotal || 0;
    let today = moment();
    const originalTerm = loan.loanTerms || 0;
    if (calcType === "mergedDate" && mergedLoans) {
        mergedLoans.forEach((merged: any) => {
            if (merged._id === loan.parentLoanId) {
                issueDate = moment(loan.issueDate, "MM-DD-YYYY");
                today = moment(merged.issueDate);
            }
        });
    }
    const monthsPassed = Math.floor(today.diff(issueDate, "days") / 30) || 1 ;
    let dynamicTerm =originalTerm && ALLOWED_TERMS.includes(originalTerm) ? originalTerm : ALLOWED_TERMS.find((t) => t >= monthsPassed) || originalTerm;
    if (calcType === "mergedDate" && mergedLoans) {
        mergedLoans.forEach((merged: any) => {
            if (merged._id === loan.parentLoanId) {
                dynamicTerm = ALLOWED_TERMS.find((t) => t >= monthsPassed && t <= originalTerm) ||originalTerm;
            }
        });
    }
    let total = subtotal;
    let interestAmount = 0;
    const rate = monthlyRate / 100;

    if (interestType === "flat") {
        for (let i = 6; i <= dynamicTerm; i += 6) {
            const stepInterest = (total * rate) * 6; 
            total += stepInterest;
            if (i === 18 || i === 30) total += 200;
        }
        interestAmount = total - subtotal;
    } else if (interestType === "compound") {
        for (let i = 1; i <= dynamicTerm; i++) {
            total *= 1 + rate; 
            if (i === 18 || i === 30) total += 200;
        }
        interestAmount = total - subtotal;
    }

    const remaining = Math.max(0, total - paidAmount);
    const obj = {
        issueDate,
        today,
        subtotal,
        interestAmount,
        total,
        paidAmount,
        remaining,
        monthsPassed,
        currentTerm: dynamicTerm,
        dynamicTerm,
    } 
    return obj;
};
export const formatUSD = (amount: number | string = 0) => {
    const num = Number(amount) || 0;
    return num.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const calculateDynamicTermAndPayment = (loan: any, selectedIssueDate = null) => {
    const start = moment(loan.issueDate, "MM-DD-YYYY");
    const today = selectedIssueDate ? moment(selectedIssueDate) : moment();
    const monthsPassed = today.diff(start, "months") + 1;

    const originalTerm = loan.loanTerms || 0;
    const allowedTerms = [6, 12, 18, 24, 30, 36, 48];
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