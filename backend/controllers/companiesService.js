
const Company = require("../models/companies");

exports.CompaniesCreate = async (req, res) => {
  try {
    const body = req.body;

    const companyData = {
      companyName: body.companyName,
      // companyCode: body.companyCode,
      description: body.description,
      phone: body.phone,
      email: body.email,
      website: body.website,
      address: body.address,
      activeCompany: body.activeCompany ?? true,
      backgroundColor: body.backgroundColor ?? "#555555",

      interestRate: {
        monthlyRate: Number(body.interestRate?.monthlyRate ?? body.interestRate ?? 0),
        interestType: body.interestRate?.interestType ?? body.interestType ?? "flat",
      },

      fees: {
        administrativeFee: {
          value: Number(body.adminFee ?? 0),
          type: body.adminFeeType ?? "flat",
        },
        applicationFee: {
          value: Number(body.applicationFee ?? 0),
          type: body.applicationFeeType ?? "flat",
        },
        attorneyReviewFee: {
          value: Number(body.attorneyFee ?? 0),
          type: body.attorneyFeeType ?? "flat",
        },
        brokerFee: {
          value: Number(body.brokerFee ?? 0),
          type: body.brokerFeeType ?? "flat",
        },
        annualMaintenanceFee: {
          value: Number(body.maintenanceFee ?? 0),
          type: body.maintenanceFeeType ?? "flat",
        },
      },

      loanTerms: Array.isArray(body.loanTerms) ? body.loanTerms.map(Number) : [],

      freshLoanRules: {
        enabled: Boolean(body.enableFreshLoanRules),
        minMonthsBetweenLoans: Number(body.minimumMonthsBetween ?? 0),
        allowOverlappingLoans: Boolean(body.allowOverlappingLoans),
        requireFullPayoff: Boolean(body.requireFullPayoff),
      },

      payoffSettings: {
        allowEarlyPayoff: Boolean(body.allowEarlyPayoff),
        earlyPayoffPenalty: Number(body.earlyPayoffPenalty ?? 0),
        earlyPayoffDiscount: Number(body.earlyPayoffDiscount ?? 0),
        gracePeriodDays: Number(body.gracePeriodDays ?? 0),
        lateFeeAmount: Number(body.lateFeeAmount ?? 0),
        lateFeeGraceDays: Number(body.lateFeeGraceDays ?? 0),
      },
    };

    const existing = await Company.findOne({
      companyName: { $regex: `^${companyData.companyName}$`, $options: "i" },
});
    if (existing) {
      return res.status(400).json({
        success: false,
      message: "Company with this name already exists",
      });
    }

    const newCompany = await Company.create(companyData);

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: newCompany,
    });
  } catch (error) {
    console.error("Error in CompaniesCreate:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.AllCompanies = async (req, res) => {
  try {
    const { search } = req.query;
    let companiesQuery;

    if (search) {
      const regex = new RegExp(search, "i");
      companiesQuery = Company.find({
        $or: [
          { companyName: regex },
        ],
      });
    } else {
      companiesQuery = Company.find();
    }
    const companies = await companiesQuery.sort({ createdAt: -1 });

    if (!companies.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No companies found matching your search",
      });
    }

    res.status(200).json({
      success: true,
      data: companies,
      message: "Companies fetched successfully",
    });
  } catch (error) {
    console.error("Error in AllCompanies:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const getFee = (valueKey, typeKey) => ({
      value: Number(body[valueKey] ?? 0),
      type: body[typeKey] ?? "flat",
    });

    const companyData = {
      companyName: body.companyName,
      // companyCode: body.companyCode,
      description: body.description,
      phone: body.phone,
      email: body.email,
      website: body.website,
      address: body.address,
      activeCompany: body.activeCompany,
      backgroundColor: body.backgroundColor ?? "#ffffff",
      interestRate: {
        monthlyRate: Number(body.interestRate?.monthlyRate ?? body.interestRate ?? 0),
        interestType: body.interestRate?.interestType ?? body.interestType ?? "flat",
      },

      fees: {
        administrativeFee: getFee("adminFee", "adminFeeType"),
        applicationFee: getFee("applicationFee", "applicationFeeType"),
        attorneyReviewFee: getFee("attorneyFee", "attorneyFeeType"),
        brokerFee: getFee("brokerFee", "brokerFeeType"),
        annualMaintenanceFee: getFee("maintenanceFee", "maintenanceFeeType"),
      },

      loanTerms: Array.isArray(body.loanTerms) ? body.loanTerms.map(Number) : [],

      freshLoanRules: {
        enabled: body.enableFreshLoanRules ?? false,
        minMonthsBetweenLoans: Number(body.minimumMonthsBetween ?? 0),
        allowOverlappingLoans: body.allowOverlappingLoans ?? false,
        requireFullPayoff: body.requireFullPayoff ?? false,
      },

      payoffSettings: {
        allowEarlyPayoff: body.allowEarlyPayoff ?? false,
        earlyPayoffPenalty: Number(body.earlyPayoffPenalty ?? 0),
        earlyPayoffDiscount: Number(body.earlyPayoffDiscount ?? 0),
        gracePeriodDays: Number(body.gracePeriodDays ?? 0),
        lateFeeAmount: Number(body.lateFeeAmount ?? 0),
        lateFeeGraceDays: Number(body.lateFeeGraceDays ?? 0),
      },
    };

    const updatedCompany = await Company.findByIdAndUpdate(id, companyData, {
      new: true,
      runValidators: true,
      context: 'query',
    });

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    console.error("Error in updateCompany:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update company",
    });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByIdAndDelete(id);
    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    res.status(200).json({ success: true, message: "Company deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

