const axios = require("axios");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

/**
 * Extracts the Google Docs file ID from a full Google Docs URL.
 * Supports both /d/<id>/edit and /d/<id> formats.
 *
 * @param {string} googleDocUrl - The full Google Docs URL
 * @returns {string} - The extracted file ID
 */
function extractGoogleDocId(googleDocUrl) {
  const match = googleDocUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error("Invalid Google Docs URL: could not extract file ID.");
  }
  return match[1];
}

/**
 * Builds the Google Docs export URL that returns the file as a .docx binary.
 *
 * @param {string} fileId - The Google Docs file ID
 * @returns {string} - The export URL
 */
function buildExportUrl(fileId) {
  return `https://docs.google.com/document/d/${fileId}/export?format=docx`;
}

/**
 * Downloads a publicly shared Google Doc as a .docx buffer.
 *
 * NOTE: The Google Doc must be shared as "Anyone with the link can view".
 *
 * @param {string} googleDocUrl - The full Google Docs share URL
 * @returns {Promise<Buffer>} - The raw .docx file buffer
 */
async function downloadGoogleDocAsDocx(googleDocUrl) {
  const fileId = extractGoogleDocId(googleDocUrl);
  const exportUrl = buildExportUrl(fileId);

  const response = await axios.get(exportUrl, {
    responseType: "arraybuffer",
    // Follow redirects (Google usually redirects the export request)
    maxRedirects: 5,
    timeout: 30000,
  });

  return Buffer.from(response.data);
}

/**
 * Replaces {placeholder} tags in a .docx template buffer with the provided data,
 * and returns the filled-in document as a Buffer.
 *
 * Uses PizZip to unzip the .docx and Docxtemplater to do the replacement.
 * Docxtemplater uses {tag} syntax by default.
 *
 * @param {Buffer} docxBuffer   - Raw .docx file buffer
 * @param {Object} data         - Key/value map of placeholder → replacement value
 *                                e.g. { name: "John Doe", date: "2024-01-01" }
 * @returns {Buffer} - The generated .docx file buffer with placeholders replaced
 */
function fillDocxTemplate(docxBuffer, data) {
  // Load the .docx binary into PizZip
  const zip = new PizZip(docxBuffer);

  // Create a Docxtemplater instance from the zip archive
  const doc = new Docxtemplater(zip, {
    // Throw a structured error instead of a silent failure
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "__", // Return empty string for missing placeholders
  });

  // Replace all {key} placeholders with the corresponding values from `data`
    function flattenObject(obj, prefix = "", res = {}) {
      for (let key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          flattenObject(value, newKey, res);
        } else if (Array.isArray(value)) {
          res[newKey] = value.filter(Boolean).join(", ");
        } else {
          res[newKey] = value !== null && value !== undefined ? String(value) : "__";
        }
      }
      return res;
    }

    const flatData = flattenObject(data);

    doc.render(flatData);

  // Generate the final .docx as a Node.js Buffer
  const outputBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return outputBuffer;
}

/**
 * High-level helper: fetches a Google Doc, fills in placeholders, and returns
 * the final .docx Buffer ready to be streamed back to the client.
 *
 * @param {string} googleDocUrl - Publicly shared Google Docs URL
 * @param {Object} data         - Placeholder data { key: value, ... }
 * @returns {Promise<Buffer>}   - Filled .docx buffer
 */
async function generateDocumentFromGoogleDoc(googleDocUrl, data) {
  const docxBuffer = await downloadGoogleDocAsDocx(googleDocUrl);
  const filledBuffer = fillDocxTemplate(docxBuffer, data);
  return filledBuffer;
}

module.exports = {
  generateDocumentFromGoogleDoc,
  downloadGoogleDocAsDocx,
  fillDocxTemplate,
  extractGoogleDocId,
};
