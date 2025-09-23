const express = require('express');
const { login, logout } = require("../controllers/authService");
const authRouter = express.Router();

authRouter.route('/login').post(login);
authRouter.route('/logout').post(logout);

module.exports = authRouter;
