const User = require("../models/User");
const bcrypt = require("bcrypt");

const createAuditLog  = require("../utils/auditLog"); 
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, userRole } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email already in use. Please use a different email." });
    }
    // const hashed = password ? await bcrypt.hash(password, 10) : "";
    const user = await User.create({ name, email, password: password, userRole });
    const loggedInUser = await User.findById(req.user?.id).select("name email");

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `User "${user.name || user.email}" created by ${loggedInUser?.name || loggedInUser?.email || ""}`,
      "User",
      user._id,
      { after: user }
    );

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, "i");
      query = { $or: [{ name: regex }, { email: regex }, { role: regex }] };
    }
    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users,
      message: "Users fetched successfully",
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData = { ...rest };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const updated = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    const loggedInUser = await User.findById(req.user?.id).select("name email");
    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `User "${updated.name || updated.email}" updated by ${
        loggedInUser?.name || loggedInUser?.email || ""
      }`,
      "User",
      updated._id,
      { before: existingUser, after: updated }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const loggedInUser = await User.findById(req.user?.id).select("name email");

    await createAuditLog(
      req.user?.id || null,
      req.user?.userRole || null,
      `User "${user.name || user.email}" deleted by ${
        loggedInUser?.name || loggedInUser?.email || ""
      }`,
      "User",
      user._id,
      { before: user }
    );
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
