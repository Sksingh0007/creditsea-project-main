const mongoose = require("mongoose");

const creditAccountSchema = new mongoose.Schema({
  type: String,
  bank: String,
  accountNumber: String,
  currentBalance: Number,
  amountOverdue: Number,
  address: String,
  status: String,
});

const creditReportSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    basicDetails: {
      name: String,
      mobilePhone: String,
      pan: String,
      creditScore: Number,
    },

    reportSummary: {
      totalAccounts: Number,
      activeAccounts: Number,
      closedAccounts: Number,
      currentBalanceAmount: Number,
      securedAccountsAmount: Number,
      unsecuredAccountsAmount: Number,
      last7DaysEnquiries: Number,
    },

    creditAccounts: [creditAccountSchema],

    addresses: [String],

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    fileName: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CreditReport", creditReportSchema);
