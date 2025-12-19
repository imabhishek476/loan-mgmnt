const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { LoanPayment } = require("../models/LoanPayment");
const moment = require("moment");
const { ObjectId } = require("mongodb");
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
  const totalProfit = totalPaymentsAmount - totalLoanAmount;
  return {
    totalClients: await Client.countDocuments(),
    totalCompanies: await Company.countDocuments(),
    totalLoans: await Loan.countDocuments(),
    totalLoanAmount,
    totalPaymentsAmount,
    totalPaidOffLoans: totalPaidOrMergedLoans,
    loansByCompany,
    loanByClient: [],
    totalProfit,
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
const getFilteredStats = async (req, res) => {
  try {
    const { company, fromDate, toDate } = req.query;
    const match = {};
    if (company) match.company = new ObjectId(company);
    let fromDateObj, toDateObj;
    if (fromDate && toDate) {
      const [fromMM, fromDD, fromYYYY] = fromDate.split("-").map(Number);
      const [toMM, toDD, toYYYY] = toDate.split("-").map(Number);
      fromDateObj = new Date(fromYYYY, fromMM - 1, fromDD);
      toDateObj = new Date(toYYYY, toMM - 1, toDD, 23, 59, 59, 999);
    }
    const loans = await Loan.aggregate([
      {
        $addFields: {
          issueDateObj: {
            $dateFromString: { dateString: "$issueDate", format: "%m-%d-%Y" },
          },
        },
      },
      {
        $match: {
          ...match,
          ...(fromDateObj && toDateObj
            ? { issueDateObj: { $gte: fromDateObj, $lte: toDateObj } }
            : {}),
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
        $lookup: {
          from: "loanpayments",
          let: { loanId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$loanId", "$$loanId"] },
                ...(fromDateObj && toDateObj
                  ? {
                      paidDate: {
                        $gte: fromDateObj,
                        $lte: toDateObj,
                      },
                    }
                  : {}),
              },
            },
          ],
          as: "payments",
        },
      },
      {
        $group: {
          _id: "$company",
          companyName: { $first: "$companyData.companyName" },
          companyColor: { $first: "$companyData.backgroundColor" },

          totalLoanAmount: { $sum: { $ifNull: ["$subTotal", 0] } },
          totalPaidOffAmount: {
            $sum: { $sum: "$payments.paidAmount" },
          },

          totalInterestAmount: { $sum: { $ifNull: ["$interestAmount", 0] } },
          totalPrincipleAmount: { $sum: { $ifNull: ["$baseAmount", 0] } },
          loanCount: { $sum: 1 },
        },
      },
      {
        $addFields: {
          totalProfit: {
            $subtract: ["$totalPaidOffAmount", "$totalLoanAmount"],
          },
        },
      },
    ]);
    const stats = loans.reduce(
      (acc, cur) => {
        acc.totalLoanAmount += cur.totalLoanAmount;
        acc.totalPaymentsAmount += cur.totalPaidOffAmount;
        acc.totalInterestAmount += cur.totalInterestAmount;
        acc.totalPrincipleAmount += cur.totalPrincipleAmount;
        acc.totalLoans += cur.loanCount;
        return acc;
      },
      {
        totalLoanAmount: 0,
        totalPaymentsAmount: 0,
        totalInterestAmount: 0,
        totalPrincipleAmount: 0,
        totalLoans: 0,
      }
    );
    stats.totalProfit = stats.totalPaymentsAmount - stats.totalLoanAmount;
    return res.json({ loansByCompany: loans, stats });
  } catch (err) {
    console.error("Filtered stats error:", err);
    res.status(500).json({
      message: "Error fetching filtered dashboard stats",
    });
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
    } else {
      // If 'all' or any other value, set a wide range
      from = new Date("1970-01-01");
      to = new Date("2100-12-31");
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
      { $sort: { "tenures.endDateObj": 1 } },
      { $skip: skip },
      { $limit: Number(limit) },
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
  getFilteredStats,
  getDashboardStats,
  getPayoffStats,
};
