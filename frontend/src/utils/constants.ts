    export const LOAN_TERMS = [6, 12, 18, 24, 30, 36, 48];
    export const ALLOWED_TERMS = LOAN_TERMS;
    export const getAllowedTerms = (loanTerm: number) => {
        return LOAN_TERMS.filter(term => term <= loanTerm);
    };
    export const LOAN_STATUS_OPTIONS = [
        "All",
        "Partial Payment",
        "Paid Off",
        "Fraud",
        "Lost",
        "Denied",
        "Merged",
    ];
    export const todayMMDDYYYY = () => {
        const d = new Date();
        return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}-${d.getFullYear()}`;
    };

    export const isValidMMDDYYYY = (v: string) =>
        /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])-\d{4}$/.test(v);
