const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { LoanPayment } = require("../models/LoanPayment");
const moment = require("moment");

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
        totalAmount: { $sum: "$subTotal" },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalPaymentsAgg = await LoanPayment.aggregate([
    { $group: { _id: null, total: { $sum: "$paidAmount" } } },
  ]);
  const totalPaymentsAmount = totalPaymentsAgg[0]?.total || 0;

    const totalLoanAmountAgg = await Loan.aggregate([
  { $group: { _id: null, total: { $sum: "$subTotal" } } },
    ]);
    const totalLoanAmount = totalLoanAmountAgg[0]?.total || 0;

  const totalPaidOrMergedLoans = await Loan.countDocuments({
 status: { $in: ["Paid Off", "Merged"] },
});
  return {
    totalClients: await Client.countDocuments(),
    totalCompanies: await Company.countDocuments(),
    totalLoans: await Loan.countDocuments(),
    totalLoanAmount,
    totalPaymentsAmount,
    totalPaidOffLoans: totalPaidOrMergedLoans,
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

const getPayoffStats = async (req, res) => {
  try {
    const { type = "week", page = 1, limit = 10 } = req.query;

    const today = moment();
    let from = null;
    let to = null;

    if (type === "day") {
      from = today.clone().startOf("day").toDate();
      to = today.clone().endOf("day").toDate();
    } else if (type === "week") {
      from = today.clone().startOf("week").toDate();
      to = today.clone().endOf("week").toDate();
    } else if (type === "month") {
      from = today.clone().startOf("month").toDate();
      to = today.clone().endOf("month").toDate();
    }

    const skip = (page - 1) * limit;

    const loans = await Loan.aggregate([
      // Exclude paid or merged loans
      { $match: { status: { $nin: ["Paid Off", "Merged"] } } },

      // Unwind the tenures array to check each tenure individually
      { $unwind: "$tenures" },

      // Convert tenure endDate string to ISODate
      {
        $addFields: {
          "tenures.endDateObj": {
            $dateFromString: {
              dateString: "$tenures.endDate",
              format: "%m-%d-%Y",
            },
          },
        },
      },
      {
        $match: {
          "tenures.endDateObj": { $gte: from, $lte: to },
        },
      },
      {
        $lookup: {
          from: "clients",
          localField: "client",
          foreignField: "_id",
          as: "client",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $addFields: {
          clientName: { $arrayElemAt: ["$client.fullName", 0] },
          companyName: { $arrayElemAt: ["$company.companyName", 0] },
          companycolour: { $arrayElemAt: ["$company.backgroundColor", 0] },
        },
      },

      // Project only fields you need
      {
        $project: {
          client: 0,
          company: 0,
          "tenures._id": 0,
          "tenures.__v": 0,
        },
      },

      // Sort by tenure endDate
      { $sort: { "tenures.endDateObj": 1 } },

      // Pagination
      { $skip: skip },
      { $limit: Number(limit) },
    ]);

    const totalCount = await Loan.aggregate([
      { $match: { status: { $nin: ["Paid Off", "Merged"] } } },
      { $unwind: "$tenures" },
      {
        $addFields: {
          "tenures.endDateObj": {
            $dateFromString: {
              dateString: "$tenures.endDate",
              format: "%m-%d-%Y",
            },
          },
        },
      },
      { $match: { "tenures.endDateObj": { $gte: from, $lte: to } } },
      { $count: "count" },
    ]);

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total: totalCount[0]?.count || 0,
      data: loans,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payoff stats" });
  }
};



module.exports = {
  getLoansByCompanyByDate,
  getDashboardStatsByDate,
  getDashboardStats,
  getPayoffStats,
};
