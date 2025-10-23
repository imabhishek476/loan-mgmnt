const express = require("express");
const {
  createUser,
  getAllUsers,
  // getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const userRouter = express.Router();

userRouter.get("/allusers", isAuthenticated, isAdmin, getAllUsers);
userRouter.post("/", isAuthenticated, isAdmin, createUser);
// userRouter.get("/:id", isAuthenticated, isAdmin, getUserById);
userRouter.put("/:id", isAuthenticated, isAdmin, updateUser);
userRouter.delete("/:id", isAuthenticated, isAdmin, deleteUser);

module.exports = userRouter;
