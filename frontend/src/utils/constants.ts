export const LOAN_TERMS = [6, 12, 18, 24, 30, 36, 48];
export const ALLOWED_TERMS = LOAN_TERMS;
export const getAllowedTerms = (loanTerm: number) => {
    return LOAN_TERMS.filter(term => term <= loanTerm);
};
export const LOAN_STATUS_OPTIONS = [
    "All",
    "Active",
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

export const DocTypes = [
  // =========================
  // CONTRACT AGREEMENTS
  // =========================
  {
    key: "contract",
    label: "Contract / Plus Contract",
    companies: [
      {
        companyName: "Capital First Group",
        fileName: "Capital First Contract",
        value: "CAPITAL_FIRST_CONTRACT_LINK",
      },
      {
        companyName: "Capital First Group",
        fileName: "Capital First Plus Contract",
        value: "CAPITAL_FIRST_PLUS_LINK",
      },

      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Contract",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Plus Contract",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",

      },

      {
        companyName: "Gemini Fund",
        fileName: "Gemini Contract",
        value: "GEMINI_CONTRACT_LINK",
      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Plus Contract",
        value: "GEMINI_PLUS_LINK",
      },
    ],
  },

  // =========================
  // PAYOFF LETTER
  // =========================
  {
    key: "payoff",
    label: "Pay Off Letters",
    companies: [
      {
        companyName: "Capital First Group",
        fileName: "Capital First payoff letter",
        value: "CAPITAL_FIRST_PAYOFF_LINK",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance payoff letter",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",

      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund payoff letter",
        value: "GEMINI_PAYOFF_LINK",
      },
    ],
  },

  // =========================
  // REDUCTION LETTER
  // =========================
  {
    key: "reduction",
    label: "Reduction Letters",
    companies: [
      {
        companyName: "Capital First Group",
        fileName: "Capital First Reduction letter",
        value: "CAPITAL_FIRST_REDUCTION_LINK",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Reduction Letter",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",

      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund Reduction letter",
        value: "GEMINI_REDUCTION_LINK",
      },
    ],
  },
];