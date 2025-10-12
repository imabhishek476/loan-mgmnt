import { Client } from "../models/Client.js";
import { Loan } from "../models/loan.js";
import Company from "../models/companies.js";

export const getDashboardStats = async (req, res) => {
  try {
    
    const totalClientsAgg = await Client.aggregate([
      { $count: "totalClients" },
    ]);
    const totalClients = totalClientsAgg[0]?.totalClients || 0;
    const totalLoansAgg = await Loan.aggregate([{ $count: "totalLoans" }]);
    const totalLoans = totalLoansAgg[0]?.totalLoans || 0;

   
    const totalCompaniesAgg = await Company.aggregate([
      { $count: "totalCompanies" },
    ]);
    const totalCompanies = totalCompaniesAgg[0]?.totalCompanies || 0;

    const totalLoanAmountAgg = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: "$totalLoan" } } },
    ]);
    const totalLoanAmount = totalLoanAmountAgg[0]?.total || 0;

    const totalPaymentsAgg = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);
    const totalPayments = totalPaymentsAgg[0]?.total || 0;

    const loansByCompany = await Loan.aggregate([
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "companyData",
        },
      },
      { $unwind: "$companyData" },
      {
        $group: {
          _id: "$companyData.companyName",
          totalAmount: { $sum: "$totalLoan" },
          count: { $sum: 1 },
        },
      },
    ]);

    const loanByClient = await Loan.aggregate([
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "clientData",
        },
      },
      { $unwind: "$clientData" },
      {
        $group: {
          _id: "$clientData.fullName",
          totalAmount: { $sum: "$totalLoan" },
        },
      },
    ]);

    res.json({
      totalClients,
      totalLoans,
      totalCompanies,
      totalLoanAmount,
      totalPayments,
      loansByCompany,
      loanByClient,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};
