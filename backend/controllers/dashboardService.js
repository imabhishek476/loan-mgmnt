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

    const today = moment();
    let from = null,
      to = null;

    if (type === "day") {
      from = today.clone().startOf("day");
      to = today.clone().endOf("day");
    } else if (type === "week") {
      from = today.clone().startOf("week");
      to = today.clone().endOf("week");
    } else if (type === "month") {
      from = today.clone().startOf("month");
      to = today.clone().endOf("month");
    }

    const skip = (page - 1) * limit;

    const loans = await Loan.find({ status: { $nin: ["Paid Off", "Merged"] } })
         .populate("client", "fullName")
         .populate("company", "companyName")
         .lean();
    const enrichedLoans = loans
      .map((loan) => {
        const calc = calculateLoanAmounts(loan);
        const upcomingTenure = loan.tenures
          .map((t) => ({
            ...t,
            startDate: moment(loan.issueDate, "MM-DD-YYYY")
              .add(
                loan.tenures.indexOf(t) === 0
                  ? 0
                  : loan.tenures[loan.tenures.indexOf(t) - 1].term * 30,
                "days"
              )
              .format("MM-DD-YYYY"),
            endDate: t.endDate,
          }))
          .find((t) => {
            const end = moment(t.endDate, "MM-DD-YYYY");
            return end.isSameOrAfter(from) && end.isSameOrBefore(to);
          });

        if (!upcomingTenure) return null; // skip if no upcoming payoff in period

      return {
        ...loan,
        clientName: loan.client?.fullName || "",
        companyName: loan.company?.companyName || "",
        calc: {
            ...calc,
            startDate: upcomingTenure.startDate,
            endDate: upcomingTenure.endDate,
            dynamicTerm: upcomingTenure.term,
          },
          currentTerm: upcomingTenure.term,
          endDate: upcomingTenure.endDate,
          issueDate: loan.issueDate,
          subTotal: calc?.subtotal || 0,
          total: calc?.total || 0,
          paidAmount: loan.paidAmount || 0,
          remaining: calc?.remaining || 0,
          status: loan.status,
        };
      })
      .filter(Boolean); 

    const paginated = enrichedLoans.slice(skip, skip + Number(limit));

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total: enrichedLoans.length,
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
