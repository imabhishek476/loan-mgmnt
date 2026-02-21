const express = require("express");


const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");
const { addClientNote, getClientNotes, deleteClientNote, updateClientNote } = require("../controllers/clientsNotesService");

const clientNotesRouter = express.Router();

clientNotesRouter.post("/store", isAuthenticated, isAdmin, addClientNote);
clientNotesRouter.put("/:id", isAuthenticated, isAdmin, updateClientNote);
clientNotesRouter.get("/:clientId", isAuthenticated, isAdmin, getClientNotes);
clientNotesRouter.delete("/:id", isAuthenticated, isAdmin, deleteClientNote);

module.exports = clientNotesRouter;