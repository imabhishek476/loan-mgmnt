const express = require('express');
const { login, logout,me } = require("../controllers/authService");
const authRouter = express.Router();

authRouter.route('/login').post(login);
authRouter.route('/logout').post(logout);
authRouter.get("/me", me);
module.exports = authRouter;
