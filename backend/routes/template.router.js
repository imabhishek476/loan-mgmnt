const express = require("express");
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById
} = require("../controllers/templateService");

const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const templateRouter = express.Router();

templateRouter.get("/", isAuthenticated, getTemplates);
templateRouter.post("/", isAuthenticated, isAdmin, createTemplate);
templateRouter.put("/:id", isAuthenticated, isAdmin, updateTemplate);
templateRouter.get("/:id", isAuthenticated, getTemplateById);
templateRouter.delete("/:id", isAuthenticated, isAdmin, deleteTemplate);

module.exports = templateRouter;