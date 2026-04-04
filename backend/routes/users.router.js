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

userRouter.get("/allusers", isAuthenticated,getAllUsers);
userRouter.post("/", isAuthenticated,createUser);
// userRouter.get("/:id", isAuthenticated,getUserById);
userRouter.put("/:id", isAuthenticated,updateUser);
userRouter.delete("/:id", isAuthenticated, isAdmin, deleteUser);

module.exports = userRouter;
