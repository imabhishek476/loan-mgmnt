const express = require("express");


const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");
const { addClientNote, getClientNotes, deleteClientNote, updateClientNote } = require("../controllers/clientsNotesService");

const clientNotesRouter = express.Router();

clientNotesRouter.post("/store", isAuthenticated, addClientNote);
clientNotesRouter.put("/:id", isAuthenticated, updateClientNote);
clientNotesRouter.get("/:clientId", isAuthenticated, getClientNotes);
clientNotesRouter.delete("/:id", isAuthenticated, isAdmin, deleteClientNote);

module.exports = clientNotesRouter;