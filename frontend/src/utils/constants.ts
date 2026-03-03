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
    label: "Contract Agreement",
    companies: [
      {
        companyName: "Capital First Group",
        fileName: "CAPITAL FIRST GROUP, LLC 2024",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "CLAIM ADVANCE INC 2024 sample",
        value: "https://docs.google.com/document/d/16ok1yK_hkbvfe7ukMuNikEUfVlc4-RpV/edit?usp=sharing&ouid=109784674424040536778&rtpof=true&sd=true",
      },
      {
        companyName: "Gemini Fund",
        fileName: "GEMINI FUND LLC 2024 sample",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",
      },
    ],
  },

  // =========================
  // PAYOFF & REDUCTION
  // =========================
  {
    key: "payoff",
    label: "Payoff & Reduction",
    companies: [
      {
        companyName: "Capital First Group",
        fileName: "Capital First payoff letter",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",
      },
      {
        companyName: "Capital First Group",
        fileName: "Capital First Reduction letter",
        value: "CAPITAL_FIRST_REDUCTION_LINK",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance payoff letter",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Reduction Letter",
        value: "CLAIM_ADVANCE_REDUCTION_LINK",
      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund payoff letter",
        value: "GEMINI_PAYOFF_LINK",
      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund Reduction letter",
        value: "GEMINI_REDUCTION_LINK",
      },
    ],
  },

  // =========================
  // PLUS CONTRACT
  // =========================
  {
    key: "plus",
    label: "Plus Contract",
    companies: [
      {
        companyName: "Capital First Group",
        fileName: "Capital First Group Plus",
        value: "https://docs.google.com/document/d/1gerxng2nsxMKt-OXJq1Fux4SAdW5u7FpntMbfDVmOyc/edit?usp=sharing",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Plus",
        value: "CLAIM_ADVANCE_PLUS_LINK",
      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund Plus",
        value: "GEMINI_PLUS_LINK",
      },
    ],
  },
];