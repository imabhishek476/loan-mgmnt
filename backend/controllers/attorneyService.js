const {Attorney} = require("../models/Attorney");
const createAuditLog = require("../utils/auditLog");
const User = require("../models/User");
const {Client}  = require("../models/Client");

exports.createAttorney = async (req, res) => {
  try {
    const body = req.body;

    const attorneyData = {
      fullName: body.fullName,
      email: body.email?.trim().toLowerCase() || "",
      phone: body.phone || "",
      firmName: body.firmName || "",
      address: body.address || "",
      memo: body.memo || "",
      isActive: body.isActive ?? true,
    };

    if (!attorneyData.fullName) {
      return res.status(400).json({
        success: false,
        message: "Attorney name is required",
      });
    }

    const existing = await Attorney.findOne({
      fullName: { $regex: `^${attorneyData.fullName}$`, $options: "i" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Attorney with this name already exists",
      });
    }

    const user = await User.findById(req.user?.id).select("name email");
    const createdBy = user?.name || user?.email || "";

    const newAttorney = await Attorney.create(attorneyData);

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Attorney "${newAttorney.fullName}" created by ${createdBy}`,
      "Attorney",
      newAttorney._id,
      { after: newAttorney }
    );

    res.status(201).json({
      success: true,
      message: "Attorney created successfully",
      data: newAttorney,
    });
  } catch (error) {
    console.error("Error in AttorneyStore:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.allAttorney = async (req, res) => {
  try {
    const { search } = req.query;

    let query;

    if (search) {
      const regex = new RegExp(search, "i");
      query = Attorney.find({
        $or: [
          { fullName: regex },
          { email: regex },
          { phone: regex },
          { firmName: regex },
        ],
      });
    } else {
      query = Attorney.find();
    }

    const attorneys = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: attorneys,
      message: attorneys.length
        ? "Attorneys fetched successfully"
        : "No attorneys found matching your search",
    });
  } catch (error) {
    console.error("Error in AllAttorneys:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateAttorney = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const attorneyData = {
      fullName: body.fullName,
      email: body.email?.trim().toLowerCase() || "",
      phone: body.phone || "",
      firmName: body.firmName || "",
      address: body.address || "",
      memo: body.memo || "",
      isActive: body.isActive,
    };

    const updatedAttorney = await Attorney.findByIdAndUpdate(
      id,
      attorneyData,
      { new: true, runValidators: true }
    );

    if (!updatedAttorney) {
      return res.status(404).json({
        success: false,
        message: "Attorney not found",
      });
    }

    const user = await User.findById(req.user?.id).select("name email");
    const updatedBy = user?.name || user?.email || "";

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Attorney "${updatedAttorney.fullName}" updated by ${updatedBy}`,
      "Attorney",
      updatedAttorney._id,
      { after: updatedAttorney }
    );

    res.status(200).json({
      success: true,
      message: "Attorney updated successfully",
      data: updatedAttorney,
    });
  } catch (error) {
    console.error("Error in updateAttorney:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attorney",
    });
  }
};
exports.deleteAttorney = async (req, res) => {
  try {
    const { id } = req.params;

    const attorney = await Attorney.findByIdAndDelete(id);
    if (!attorney) {
      return res.status(404).json({
        success: false,
        error: "Attorney not found",
      });
    }
    // ✅ Clean client references
    const updatedClients = await Client.updateMany(
      { attorneyId: id },
      {
        $set: {
          attorneyId: null,
          attorneyName: "",
        },
      }
    );

    const user = await User.findById(req.user?.id).select("name email");
    const deletedBy = user?.name || user?.email || "";

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `Attorney "${attorney.fullName}" deleted by ${deletedBy}`,
      "Attorney",
      attorney._id,
      {
        before: attorney,
        affectedClients: updatedClients.modifiedCount,
      }
    );

    res.status(200).json({
      success: true,
      message: `Attorney deleted. ${updatedClients.modifiedCount} client(s) updated.`,
    });
  } catch (error) {
    console.error("Error deleting attorney:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
exports.formatAttorneyPhones = async (req, res) => {
  try {
    const attorneys = await Attorney.find().select("_id phone");

    if (!attorneys.length) {
      return res.json({
        success: true,
        message: "No attorneys found",
      });
    }

    const bulkOps = [];

    attorneys.forEach((attorney) => {
      if (!attorney.phone) return;

      const digits = attorney.phone.toString().replace(/\D/g, "").slice(0, 10);

      let formattedPhone = attorney.phone;

      if (digits.length < 4) {
        formattedPhone = digits;
      } else if (digits.length < 7) {
        formattedPhone = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else if (digits.length === 10) {
        formattedPhone = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }

      if (formattedPhone !== attorney.phone) {
        bulkOps.push({
          updateOne: {
            filter: { _id: attorney._id },
            update: { $set: { phone: formattedPhone } },
          },
        });
      }
    });

    if (bulkOps.length > 0) {
      await Attorney.bulkWrite(bulkOps);
    }

    return res.json({
      success: true,
      message: "Attorney phone numbers updated successfully",
      totalUpdated: bulkOps.length,
    });

  } catch (error) {
    console.error("FixAttorneyPhones Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating attorney phone numbers",
      error: error.message,
    });
  }
};