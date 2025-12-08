export const LOAN_TERMS = [6, 12, 18, 24, 30, 36, 48];
export const ALLOWED_TERMS = LOAN_TERMS;
export const getAllowedTerms = (loanTerm: number) => {
    return LOAN_TERMS.filter(term => term <= loanTerm);
};