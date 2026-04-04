const express = require("express");
const {CompaniesCreate,AllCompanies,updateCompany,deleteCompany} = require("../controllers/companiesService");
const { isAuthenticated, isAdmin } = require("../middleware/auth.middleware");

const companiesRouter = express.Router();

companiesRouter.route("/store").post(isAuthenticated,CompaniesCreate);
companiesRouter.route("/allcompanies").get(isAuthenticated, AllCompanies);
companiesRouter.route("/update/:id").put(isAuthenticated, updateCompany);
companiesRouter.route("/delete/:id").delete(isAuthenticated, isAdmin, deleteCompany);


module.exports = companiesRouter;
