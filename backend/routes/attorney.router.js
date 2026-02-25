const express = require("express");
const attorneyRouter = express.Router();

const { createAttorney, allAttorney, updateAttorney, deleteAttorney} = require("../controllers/attorneyService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

attorneyRouter.post("/add", isAuthenticated, isAdmin, createAttorney);
attorneyRouter.get("/", isAuthenticated, isAdmin, allAttorney);
attorneyRouter.put("/:id", isAuthenticated, isAdmin, updateAttorney);
attorneyRouter.delete("/:id", isAuthenticated, isAdmin, deleteAttorney);

module.exports = attorneyRouter;