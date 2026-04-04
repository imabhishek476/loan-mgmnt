const express = require("express");
const attorneyRouter = express.Router();

const { createAttorney, allAttorney, updateAttorney, deleteAttorney,formatAttorneyPhones} = require("../controllers/attorneyService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

attorneyRouter.post("/add", isAuthenticated,createAttorney);
attorneyRouter.get("/", isAuthenticated,allAttorney);
attorneyRouter.put("/:id", isAuthenticated,updateAttorney);
attorneyRouter.delete("/:id", isAuthenticated, isAdmin, deleteAttorney);

module.exports = attorneyRouter;