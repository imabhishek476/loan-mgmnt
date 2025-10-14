const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Missing credentials" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Invalid user" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
  
    res.cookie("jwtToken", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      secure:true,
      sameSite: "none",
    });

    res.json({
      user: { id: user._id, email: user.email, role: user.userRole, name: user.name },
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("jwtToken");
  res.json({ msg: "Logged out" });
};


exports.me = async (req, res) => {
  try {
    const token = req.cookies.jwtToken;
    if (!token) return res.status(401).json({ msg: "No token found" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    // console.log("isAdmin middleware passed",user);

   
    res.status(201).json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.userRole,
    });
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
