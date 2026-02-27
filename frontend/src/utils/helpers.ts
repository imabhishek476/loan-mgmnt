import moment from "moment";
export const convertToNumber = (val: any): number => {
    const num = typeof val === "string" ? parseFloat(val) : Number(val);
    return isNaN(num) ? 0 : num;
};
export const convertToUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});
export const isDateBefore = (d1: string, d2: string) => {
    return moment(d1, "MM-DD-YYYY").isBefore(moment(d2, "MM-DD-YYYY"));
};
export const formatDate = (dateStr: string) =>
    moment(dateStr, "MM-DD-YYYY").format("MMM DD, YYYY");
export const normalizeDateObject = (date: Date) => {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 
        0,
        0,
        0
    );
};
export const ORIGIN = window.location.origin;
export const appTitle =
  ORIGIN === "https://app.claim-advance.com"
    ? "Claim Advance"
    : ORIGIN === "https://claim-advance.vercel.app"
    ? "ClaimAdvance UAT"
    : "Claim Advance";
export const formatCompact = (num: number) => {
  if (num >= 1_000_000_000)
    return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000)
    return (num / 1_000).toFixed(1) + "K";
  return num.toString();
};
export const getAppTitle = () => appTitle;
export const statusStyles: Record<string, string> = {
  Active: "bg-green-600 text-white",
  "Paid Off": "bg-blue-500 text-white",
  "Partial Payment": "bg-yellow-500 text-white",
  Merged: "bg-gray-500 text-white",
  Fraud: "bg-red-100 text-red-700",
  Lost: "bg-rose-100 text-rose-700",
  Denied: "bg-purple-100 text-purple-700",
};
export const LOAN_TYPE_OPTIONS = [
  { label: "Trip and Fall", value: "Trip and Fall" },
  { label: "Workers Comp", value: "Workers Comp" },
  { label: "MVA", value: "MVA" },
  { label: "Labor Law", value: "Labor Law" },
  { label: "Commercial", value: "Commercial" },
];

export const getLoanTypeOptions = () => LOAN_TYPE_OPTIONS;