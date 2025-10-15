const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { LoanPayment } = require("../models/LoanPayment");

const calculateStats = async () => {
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

  const totalPaymentsAgg = await LoanPayment.aggregate([
    { $group: { _id: null, total: { $sum: "$paidAmount" } } },
  ]);
  const totalPaymentsAmount = totalPaymentsAgg[0]?.total || 0;

    const totalLoanAmountAgg = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: "$totalLoan" } } },
    ]);
    const totalLoanAmount = totalLoanAmountAgg[0]?.total || 0;

  const totalPaidOffLoans = await Loan.countDocuments({ status: "Paid Off" });
  return {
    totalClients: await Client.countDocuments(),
    totalCompanies: await Company.countDocuments(),
    totalLoans: await Loan.countDocuments(),
    totalLoanAmount,
    totalPaymentsAmount,
    totalPaidOffLoans,
    loansByCompany,
    loanByClient: [],
  };
};

const getLoansByCompanyByDate = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Please provide from and to dates" });
    }
    const allLoans = await Loan.find();
    // console.log(
    //   "All loans in DB:",
    //   allLoans.map((l) => ({ id: l._id, issueDate: l.issueDate }))
    // );

    const loansByCompany = await Loan.aggregate([
      {
        $match: {
          issueDate: { $gte: from, $lte: to }, 
        },
      },
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

    const payments = await LoanPayment.aggregate([
      {
        $match: {
          paidDate: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paidAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      loansByCompany,
      totalPaymentsAmount: payments[0]?.totalPaid || 0,
      totalPaymentsCount: payments[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching data" });
  }
};
const getDashboardStatsByDate = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Please provide from and to dates" });
    }

    const stats = await calculateStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error fetching filtered dashboard stats" });
  }
};

const getDashboardStats = async (req, res) => {
  const stats = await calculateStats();
  res.json(stats);
};

module.exports = {
  getLoansByCompanyByDate,
  getDashboardStatsByDate,
  getDashboardStats,
};
