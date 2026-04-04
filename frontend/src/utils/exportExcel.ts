import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const exportToExcel = (data: any[], fileName = "Payoff Report ") => {
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 🔥 AUTO WIDTH LOGIC
  const columnWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => (row[key] ? row[key].toString().length : 0))
    );

    return { wch: maxLength + 2 }; // padding
  });

  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Payoff");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(file, `${fileName}.xlsx`);
};