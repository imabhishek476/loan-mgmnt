const { Loan } = require("../models/loan");
const { Template } = require("../models/Template");
const createAuditLog = require("../utils/auditLog");
const {
  generateDocumentFromGoogleDoc,
} = require("../utils/documentGeneration");
/**
 * GET /templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const query = search
      ? { title: { $regex: search, $options: "i" } }
      : {};

    const templates = await Template.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: templates,
    });
  } catch (err) {
    console.error("GET TEMPLATES ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /templates
 */
exports.createTemplate = async (req, res) => {
  try {
    const template = await Template.create(req.body);

    res.json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (err) {
    console.error("CREATE TEMPLATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/**
 * PUT /templates/:id
 */
exports.updateTemplate = async (req, res) => {
  try {
    console.log("Updating template with ID:", req.params.id);
    console.log("Update data:", req.body);
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (err) {
    console.error("UPDATE TEMPLATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE /templates/:id
 */
exports.deleteTemplate = async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (err) {
    console.error("DELETE TEMPLATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("GET TEMPLATE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/**
 * POST /templates/generate-document
 *
 * Body:
 *   {
 *     "loanid": "123456789",
 *     "document_link": "https://docs.google.com/document/d/.../edit",
 *     "document_data": { "name": "John Doe", "date": "2024-01-01", ... }
 *   }
 *
 * Returns the filled .docx file as a download.
 */
exports.generateDocument = async (req, res) => {
  try {
    const { loanid, document_data, document_link, document_title } = req.body;

    if (!document_link) {
      return res.status(400).json({
        success: false,
        message: "document_link is required.",
      });
    }

    if (!document_data || typeof document_data !== "object") {
      return res.status(400).json({
        success: false,
        message: "document_data must be a non-empty JSON object.",
      });
    }

    // 🔹 Get loan details for logging
    const loan = await Loan.findById(loanid)
      .populate("client")
      .populate("company");

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    // Generate the filled .docx buffer
    const docxBuffer = await generateDocumentFromGoogleDoc(
      document_link,
      { ...document_data, document_title,loanid }
    );
    // 🔹 Create Audit Log
    await createAuditLog(
      req.user?._id,              // logged-in user ID (make sure auth middleware sets this)
      req.user?.role || "Admin",  // user role
      "Create Loan document",
      "loan",
      loan._id,
      {
        clientName: loan.client?.fullName,
        companyName: loan.company?.companyName,
        baseAmount: loan.baseAmount,
        documentTitle: document_title,
        loanId: loan._id,
      }
    );

    // 🔹 Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document_title || "generated-document"}.docx"`
    );
    res.setHeader("Content-Length", docxBuffer.length);

    return res.send(docxBuffer);
  } catch (err) {
    console.error("GENERATE DOCUMENT ERROR:", err);

    // Provide a friendlier message for template tag errors
    if (err.properties && err.properties.errors) {
      return res.status(422).json({
        success: false,
        message: "Template rendering failed. Check placeholder tags.",
        errors: err.properties.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};