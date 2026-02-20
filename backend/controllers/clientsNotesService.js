
const createAuditLog = require("../utils/auditLog");
const { ClientNote } = require("../models/ClientNote");

exports.addClientNote = async (req, res) => {
  try {
    const { clientId, text, date } = req.body;

    if (!clientId || !text) {
      return res.status(400).json({
        success: false,
        message: "clientId and text are required",
      });
    }

    let note = await ClientNote.create({
      clientId,
      text,
      date: date || new Date(),
      createdBy: req.user?.id || null,
    });

    // ✅ Re-fetch populated version
    note = await ClientNote.findById(note._id)
      .populate("createdBy", "fullName");

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      note,
    });
  } catch (error) {
    console.error("addClientNote error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate note error (index issue)",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getClientNotes = async (req, res) => {
  try {
    const { clientId } = req.params;

    const notes = await ClientNote.find({ clientId })
      .sort({ date: -1, createdAt: -1 })   // ✅ KEY FIX
      .populate("createdBy", "fullName");

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("getClientNotes error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteClientNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await ClientNote.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    await createAuditLog(
      req.user?.id,
      req.user?.userRole,
      `Deleted client note`,
      "ClientNote",
      id,
      { before: note }
    );

    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("deleteClientNote error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

