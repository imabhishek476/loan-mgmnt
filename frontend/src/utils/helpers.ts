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
  Active: "bg-green-100 text-green-700",
  "Paid Off": "bg-blue-100 text-blue-700",
  "Partial Payment": "bg-yellow-100 text-yellow-700",
  Merged: "bg-gray-200 text-gray-600",
  Fraud: "bg-red-100 text-red-700",
  Lost: "bg-rose-100 text-rose-700",
  Denied: "bg-purple-100 text-purple-700",
};