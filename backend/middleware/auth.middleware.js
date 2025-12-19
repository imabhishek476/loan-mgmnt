const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.isAuthenticated = async (req, res, next) => {
  const token = req.headers.cookie?.split('=')[1] || req.headers.authorization?.split(' ')[1];
  if (token == null) {
    return res.status(401).json({ msg: "No token, please login first" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userData = await User.findById(decoded?.id);
    req.user = userData;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token invalid" });
  }
};


exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }
    const user = await User.findById(req.user.id);
    const role = user.userRole.toLowerCase();

    const allowedRoles = ["admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        msg: "Only admins can performs this action",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      msg: "Server Error",
      error: error.message,
    });
  }
};
