const { Client } = require("../models/Client");
const { Loan } = require("../models/loan");
const Company = require("../models/companies");
const { LoanPayment } = require("../models/LoanPayment");
const { calculateLoanAmounts } = require("../utils/loanCalculation");
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

    const start = moment();

    let from = null, to = null;

    if (type === "day") {
      from = start.clone().startOf("day");  //today day..
      to = start.clone().endOf("day");
    } else if (type === "week") {
      from = start.clone().startOf("week");
      to = start.clone().endOf("week");
    } else if (type === "month") {
      from = start.clone().startOf("month");
      to = start.clone().endOf("month");
    }

    const skip = (page - 1) * limit;

    const query = {
      status: { $nin: ["Paid Off", "Merged"] },
    };
    if (!from && !to) {
      console.error(err);
      res.status(404).json({ message: "Something went wrong! Getting Payoff" });
    }
   
       const loans = await Loan.find(query)
         .populate("client", "fullName")
         .populate("company", "companyName")
         .lean();
    const enrichedLoans = loans.map((loan) => {
      const calc = calculateLoanAmounts(loan);

      return {
        ...loan,
        clientName: loan.client?.fullName ?? "",
        companyName: loan.company?.companyName ?? "",
        companyObject: loan.company ?? {},

        calc,

        subTotal: calc?.subtotal ?? 0,
        total: calc?.total ?? 0,
        paidAmount: loan.paidAmount ?? 0,
        remaining: calc?.remaining ?? 0,
        currentTerm: calc?.dynamicTerm ?? 0 ,
        issueDate: loan.issueDate,
        endDate: calc?.endDate, 
        status: loan.status,
      };
    });

    const filteredLoans = enrichedLoans.filter((loan) => {
      if (!loan.endDate) return false;

      const end = moment(loan.endDate);

      return end.isSameOrAfter(from) && end.isSameOrBefore(to);
    });

    const paginated = filteredLoans.slice(skip, skip + Number(limit));

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total: filteredLoans.length,
      data: paginated,
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
