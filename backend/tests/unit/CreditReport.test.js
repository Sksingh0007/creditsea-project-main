const mongoose = require("mongoose");
const CreditReport = require("../../models/CreditReport");

const MONGODB_TEST_URI = "mongodb://localhost:27017/creditsea-test-models";

beforeAll(async () => {
  await mongoose.connect(MONGODB_TEST_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await CreditReport.deleteMany({});
});

describe("CreditReport Model Unit Tests", () => {
  const validReportData = {
    userId: "user_test123", // ADD userId field
    basicDetails: {
      name: "John Doe",
      mobilePhone: "9876543210",
      pan: "ABCDE1234F",
      creditScore: 750,
    },
    reportSummary: {
      totalAccounts: 3,
      activeAccounts: 2,
      closedAccounts: 1,
      currentBalanceAmount: 100000,
      securedAccountsAmount: 60000,
      unsecuredAccountsAmount: 40000,
      last7DaysEnquiries: 2,
    },
    creditAccounts: [
      {
        type: "Credit Card",
        bank: "HDFC Bank",
        accountNumber: "XXXX-1234",
        currentBalance: 50000,
        amountOverdue: 0,
        address: "Mumbai",
        status: "Active",
      },
    ],
    addresses: ["123 Main St, Mumbai", "456 Park Ave, Delhi"],
    fileName: "test-report.xml",
  };

  describe("Model Creation", () => {
    test("should create a valid credit report with userId", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();

      expect(savedReport._id).toBeDefined();
      expect(savedReport.userId).toBe("user_test123");
      expect(savedReport.basicDetails.name).toBe("John Doe");
      expect(savedReport.basicDetails.creditScore).toBe(750);
      expect(savedReport.creditAccounts.length).toBe(1);
      expect(savedReport.addresses.length).toBe(2);
      expect(savedReport.uploadedAt).toBeDefined();
      expect(savedReport.createdAt).toBeDefined();
      expect(savedReport.updatedAt).toBeDefined();
    });

    test("should require userId field", async () => {
      const dataWithoutUserId = { ...validReportData };
      delete dataWithoutUserId.userId;

      const report = new CreditReport(dataWithoutUserId);

      await expect(report.save()).rejects.toThrow();
    });

    test("should create report with minimal required fields including userId", async () => {
      const minimalReport = {
        userId: "user_test456",
        basicDetails: {
          name: "Jane Doe",
          creditScore: 650,
        },
        reportSummary: {
          totalAccounts: 0,
          activeAccounts: 0,
          closedAccounts: 0,
          currentBalanceAmount: 0,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 0,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      };

      const report = new CreditReport(minimalReport);
      const savedReport = await report.save();

      expect(savedReport._id).toBeDefined();
      expect(savedReport.userId).toBe("user_test456");
      expect(savedReport.basicDetails.name).toBe("Jane Doe");
    });

    test("should handle multiple credit accounts", async () => {
      const multiAccountData = {
        ...validReportData,
        creditAccounts: [
          {
            type: "Credit Card",
            bank: "HDFC",
            accountNumber: "CC-001",
            currentBalance: 25000,
            amountOverdue: 0,
            status: "Active",
          },
          {
            type: "Personal Loan",
            bank: "ICICI",
            accountNumber: "PL-002",
            currentBalance: 75000,
            amountOverdue: 5000,
            status: "Active",
          },
          {
            type: "Auto Loan",
            bank: "SBI",
            accountNumber: "AL-003",
            currentBalance: 50000,
            amountOverdue: 0,
            status: "Active",
          },
        ],
      };

      const report = new CreditReport(multiAccountData);
      const savedReport = await report.save();

      expect(savedReport.creditAccounts.length).toBe(3);
      expect(savedReport.creditAccounts[0].type).toBe("Credit Card");
      expect(savedReport.creditAccounts[1].type).toBe("Personal Loan");
      expect(savedReport.creditAccounts[2].type).toBe("Auto Loan");
    });
  });

  describe("Timestamps", () => {
    test("should auto-generate timestamps on creation", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();

      expect(savedReport.createdAt).toBeInstanceOf(Date);
      expect(savedReport.updatedAt).toBeInstanceOf(Date);
      expect(savedReport.uploadedAt).toBeInstanceOf(Date);
    });

    test("should update updatedAt on modification", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();
      const originalUpdatedAt = savedReport.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      savedReport.basicDetails.name = "Updated Name";
      const updatedReport = await savedReport.save();

      expect(updatedReport.basicDetails.name).toBe("Updated Name");
      expect(updatedReport.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe("Queries with userId", () => {
    test("should find reports by userId", async () => {
      await CreditReport.create([
        {
          ...validReportData,
          userId: "user_1",
          basicDetails: { ...validReportData.basicDetails, name: "User 1" },
        },
        {
          ...validReportData,
          userId: "user_2",
          basicDetails: { ...validReportData.basicDetails, name: "User 2" },
        },
        {
          ...validReportData,
          userId: "user_1",
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 1 Report 2",
          },
        },
      ]);

      const user1Reports = await CreditReport.find({ userId: "user_1" });
      expect(user1Reports.length).toBe(2);

      const user2Reports = await CreditReport.find({ userId: "user_2" });
      expect(user2Reports.length).toBe(1);
    });

    test("should find reports by credit score range and userId", async () => {
      await CreditReport.create([
        {
          ...validReportData,
          userId: "user_1",
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 1",
            creditScore: 800,
          },
        },
        {
          ...validReportData,
          userId: "user_1",
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 1 B",
            creditScore: 650,
          },
        },
        {
          ...validReportData,
          userId: "user_2",
          basicDetails: {
            ...validReportData.basicDetails,
            name: "User 2",
            creditScore: 750,
          },
        },
      ]);

      const highScoreReports = await CreditReport.find({
        userId: "user_1",
        "basicDetails.creditScore": { $gte: 750 },
      });

      expect(highScoreReports.length).toBe(1);
      expect(highScoreReports[0].basicDetails.creditScore).toBe(800);
    });

    test("should sort reports by uploadedAt descending for specific user", async () => {
      const report1 = await CreditReport.create({
        ...validReportData,
        userId: "user_1",
        basicDetails: { ...validReportData.basicDetails, name: "First" },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const report2 = await CreditReport.create({
        ...validReportData,
        userId: "user_1",
        basicDetails: { ...validReportData.basicDetails, name: "Second" },
      });

      const reports = await CreditReport.find({ userId: "user_1" }).sort({
        uploadedAt: -1,
      });

      expect(reports[0].basicDetails.name).toBe("Second");
      expect(reports[1].basicDetails.name).toBe("First");
    });
  });

  describe("Updates and Deletions", () => {
    test("should update specific fields", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();

      savedReport.basicDetails.creditScore = 800;
      const updatedReport = await savedReport.save();

      expect(updatedReport.basicDetails.creditScore).toBe(800);
    });

    test("should delete report by ID and userId", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();
      const reportId = savedReport._id;

      await CreditReport.findOneAndDelete({
        _id: reportId,
        userId: "user_test123",
      });

      const found = await CreditReport.findById(reportId);
      expect(found).toBeNull();
    });

    test("should not delete report if userId does not match", async () => {
      const report = new CreditReport(validReportData);
      const savedReport = await report.save();
      const reportId = savedReport._id;

      // Try to delete with wrong userId
      await CreditReport.findOneAndDelete({
        _id: reportId,
        userId: "wrong_user",
      });

      // Report should still exist
      const found = await CreditReport.findById(reportId);
      expect(found).not.toBeNull();
    });

    test("should count total documents for specific user", async () => {
      await CreditReport.create({ ...validReportData, userId: "user_1" });
      await CreditReport.create({
        ...validReportData,
        userId: "user_1",
        basicDetails: { ...validReportData.basicDetails, name: "Another User" },
      });
      await CreditReport.create({ ...validReportData, userId: "user_2" });

      const count = await CreditReport.countDocuments({ userId: "user_1" });
      expect(count).toBe(2);
    });
  });
});
