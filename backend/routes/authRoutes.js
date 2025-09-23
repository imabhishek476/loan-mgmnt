const router = require("express").Router();
const { login, logout } = require("../controllers/authService");
const auth = require("../middleware/auth");

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, (req, res) => {
  res.json({ userId: req.user.id, email: req.user.email });
});

module.exports = router;
