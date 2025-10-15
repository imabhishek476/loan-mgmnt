const express = require("express");
const {
  createUser,
  getUsers,
} = require("../controllers/userService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const userRouter = express.Router();
userRouter.route("/store").post(isAuthenticated, isAdmin, createUser);
userRouter.route("/search").get(isAuthenticated, isAdmin, getUsers);


module.exports = userRouter;
