
const Company = require("../models/companies");

exports.CompaniesCreate = async (req, res) => {
  try {
    const body = req.body;
    const companyData = {
      companyName: body.companyName,
      companyCode: body.companyCode,
      description: body.description,
      phone: body.phone,
      email: body.email,
      website: body.website,
      address: body.address,
      activeCompany: body.activeCompany,
      interestRate: {
        monthlyRate: Number(body.interestRate?.monthlyRate ?? body.interestRate ?? 0),
        interestType: body.interestRate?.interestType ?? body.interestType ?? "flat",
      },
      fees: {
        administrativeFee: body.adminFee,
        applicationFee: body.applicationFee,
        attorneyReviewFee: body.attorneyFee,
        brokerFee: body.brokerFee,
        annualMaintenanceFee: body.maintenanceFee,
      },
      loanTerms: body.loanTerms,
      freshLoanRules: {
        enabled: body.enableFreshLoanRules,
        minMonthsBetweenLoans: body.minimumMonthsBetween,
        allowOverlappingLoans: body.allowOverlappingLoans,
        requireFullPayoff: body.requireFullPayoff,
      },
      payoffSettings: {
        allowEarlyPayoff: body.allowEarlyPayoff,
        earlyPayoffPenalty: body.earlyPayoffPenalty,
        earlyPayoffDiscount: body.earlyPayoffDiscount,
        gracePeriodDays: body.gracePeriodDays,
        lateFeeAmount: body.lateFeeAmount,
        lateFeeGraceDays: body.lateFeeGraceDays,
      },
    };

    const existing = await Company.findOne({ companyCode: companyData.companyCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Company with this code already exists",
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
      message: error.message,
    });
  }
};
exports.AllCompanies = async (req, res) => {
  try {
    const { search } = req.query;
    let companies;

    if (search) {
      const regex = new RegExp(search, "i");
      companies = await Company.find({
        $or: [
          { companyName: regex },
          { companyCode: regex }
        ]
      });
    } else {
      companies = await Company.find();
    }

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
    const companyData = {
      companyName: body.companyName,
      companyCode: body.companyCode,
      description: body.description,
      phone: body.phone,
      email: body.email,
      website: body.website,
      address: body.address,
      activeCompany: body.activeCompany,
      interestRate: {
        monthlyRate: body.interestRate?.monthlyRate ?? body.interestRate,
        interestType: body.interestRate?.interestType ?? body.interestType,
      },
      fees: {
        administrativeFee: body.adminFee ?? body.fees?.administrativeFee,
        applicationFee: body.applicationFee ?? body.fees?.applicationFee,
        attorneyReviewFee: body.attorneyFee ?? body.fees?.attorneyReviewFee,
        brokerFee: body.brokerFee ?? body.fees?.brokerFee,
        annualMaintenanceFee: body.maintenanceFee ?? body.fees?.annualMaintenanceFee,
      },
      loanTerms: body.loanTerms,
      freshLoanRules: {
        enabled: body.enableFreshLoanRules ?? body.freshLoanRules?.enabled,
        minMonthsBetweenLoans: body.minimumMonthsBetween ?? body.freshLoanRules?.minMonthsBetweenLoans,
        allowOverlappingLoans: body.allowOverlappingLoans ?? body.freshLoanRules?.allowOverlappingLoans,
        requireFullPayoff: body.requireFullPayoff ?? body.freshLoanRules?.requireFullPayoff,
      },
      payoffSettings: {
        allowEarlyPayoff: body.allowEarlyPayoff ?? body.payoffSettings?.allowEarlyPayoff,
        earlyPayoffPenalty: body.earlyPayoffPenalty ?? body.payoffSettings?.earlyPayoffPenalty,
        earlyPayoffDiscount: body.earlyPayoffDiscount ?? body.payoffSettings?.earlyPayoffDiscount,
        gracePeriodDays: body.gracePeriodDays ?? body.payoffSettings?.gracePeriodDays,
        lateFeeAmount: body.lateFeeAmount ?? body.payoffSettings?.lateFeeAmount,
        lateFeeGraceDays: body.lateFeeGraceDays ?? body.payoffSettings?.lateFeeGraceDays,
      },
    };
    const updatedCompany = await Company.findByIdAndUpdate(id, companyData, {
      new: true,
      runValidators: true,
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
      message: error.message,
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

