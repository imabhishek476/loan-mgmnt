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