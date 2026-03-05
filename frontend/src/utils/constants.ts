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
export const formatFee = (fee: any, baseAmount: number) => {
  const value = fee?.value || 0;
  const type = fee?.type || "fixed";

  if (type === "percentage") {
    const calculated = (baseAmount * value) / 100;
    return `${value} % ($${calculated})`;
  }

  return `$${value}`;
};
export const moneyFormat = (val: any) => Number(val || 0).toFixed(2);
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
        value: "https://docs.google.com/document/d/1bwuk_mmEAklCQCFwOd9q_dee0d0c7SWp/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
      },
      {
        companyName: "Capital First Group",
        fileName: "Capital First Plus Contract",
        value: "https://docs.google.com/document/d/1r6cXjt2X4VRE0Ewa-m6-1PVNPWT4Nnln/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
      },

      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Contract",
        value: "https://docs.google.com/document/d/16ok1yK_hkbvfe7ukMuNikEUfVlc4-RpV/edit?usp=sharing&ouid=109784674424040536778&rtpof=true&sd=true",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Plus Contract",
        value: "https://docs.google.com/document/d/1f2TfvPyavMcJk41KUmQxiZ1saRVr-KBp/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",

      },

      {
        companyName: "Gemini Fund",
        fileName: "Gemini Contract",
        value: "https://docs.google.com/document/d/10TBnayFlGj4JcB_xP5qGHOFbMhCxmcLA/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Plus Contract",
        value: "https://docs.google.com/document/d/1rdvdcjnh10ch1uWKq4VNKkKki3RmLKCn/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
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
        value: "https://docs.google.com/document/d/1jR_YoFxjh93Jy5xNsnhvEqrTxFEvn7ZS/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance payoff letter",
        value: "https://docs.google.com/document/d/15ztJissqGsgAkwU9YQdbo2g3BAIayN-8/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",

      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund payoff letter",
        value: "https://docs.google.com/document/d/1gQqkub3l-6QWjuGhEHgDP7Sl4eJe_n5C/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
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
        value: "https://docs.google.com/document/d/1QajW0eZ6-U_OJU47nHsSEp4LT2YeJMmy/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
      },
      {
        companyName: "Claim Advance, Inc.",
        fileName: "Claim Advance Reduction Letter",
        value: "https://docs.google.com/document/d/1Xau3GjTThF8W6Zr9azckP6mlRgA9fhUx/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",

      },
      {
        companyName: "Gemini Fund",
        fileName: "Gemini Fund Reduction letter",
        value: "https://docs.google.com/document/d/1V4gymcPcliv63YVgBkhL5X3ddIs6FWPN/edit?usp=drive_link&ouid=109784674424040536778&rtpof=true&sd=true",
      },
    ],
  },
];