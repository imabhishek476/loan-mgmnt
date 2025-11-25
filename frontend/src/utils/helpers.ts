export const convertToNumber = (val: any): number =>
    typeof val === "string" ? parseFloat(val) || 0 : val || 0;
