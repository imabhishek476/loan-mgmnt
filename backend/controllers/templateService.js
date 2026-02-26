const { Template } = require("../models/Template");
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