import moment from "moment";
export const convertToNumber = (val: any): number =>
    typeof val === "string" ? parseFloat(val) || 0 : val || 0;
export const convertToUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});
export const isDateBefore = (d1: string, d2: string) => {
    return moment(d1, "MM-DD-YYYY").isBefore(moment(d2, "MM-DD-YYYY"));
};
