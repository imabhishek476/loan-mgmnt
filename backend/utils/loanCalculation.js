const moment = require("moment");

exports.calculateLoanAmounts = (loan) => {
  if (!loan) return null;

  const interestType = loan.interestType || "flat";
  const monthlyRate = loan.monthlyRate || 0;
  const originalTerm = loan.loanTerms || 0;
  const issueDate = moment(loan.issueDate, "MM-DD-YYYY");
  const today = moment();

  const paidAmount = loan.paidAmount || 0;
  const subtotal = loan.subTotal || 0;

  // Calculate how many months have passed since issue
  const monthsPassed = Math.floor(today.diff(issueDate, "days") / 30) + 1;

  const allowedTerms = [6, 12, 18, 24, 30, 36, 48];

  // If the loan has crossed original term, dynamicTerm should cover all passed months
  const dynamicTerm =
    originalTerm && allowedTerms.includes(originalTerm)
      ? Math.max(originalTerm, monthsPassed)
      : Math.max(monthsPassed, allowedTerms[0]);

  let total = subtotal;
  let interestAmount = 0;
  const rate = monthlyRate / 100;

  if (interestType === "flat") {
    // Add interest for every 6-month step up to monthsPassed
    for (let i = 6; i <= monthsPassed; i += 6) {
      const stepInterest = subtotal * rate * 6; // flat interest on principal
      total += stepInterest;

      // Extra charges at 18 or 30 months
      if (i === 18 || i === 30) total += 200;
    }
    interestAmount = total - subtotal;
  } else if (interestType === "compound") {
    for (let i = 1; i <= monthsPassed; i++) {
      total *= 1 + rate;
      if (i === 18 || i === 30) total += 200;
    }
    interestAmount = total - subtotal;
  }

  const remaining = Math.max(0, total - paidAmount);

  const currentTerm = originalTerm || allowedTerms[0];
  const endDate = issueDate
    ? issueDate
        .clone()
        .add(Number(currentTerm) * 30, "days")
        .toDate()
    : null;

  return {
    subtotal,
    interestAmount,
    total,
    paidAmount,
    remaining,
    monthsPassed,
    endDate,
    currentTerm,
    dynamicTerm,
  };
};
