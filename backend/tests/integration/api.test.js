const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Mock Clerk before importing routes
jest.mock("@clerk/clerk-sdk-node");
const { clerkClient } = require("@clerk/clerk-sdk-node");

const express = require("express");
const cors = require("cors");
const uploadRoutes = require("../../routes/uploadRoutes");
const reportRoutes = require("../../routes/reportRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/upload", uploadRoutes);
app.use("/api/reports", reportRoutes);

const MONGODB_TEST_URI = "mongodb://localhost:27017/creditsea-test-api";

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

describe("API Integration Tests with Authentication", () => {
  const validToken = "valid-test-token";
  const invalidToken = "invalid-test-token";
  const userId = "user_test123";

  beforeEach(() => {
    // Mock Clerk token verification
    clerkClient.verifyToken.mockImplementation((token) => {
      if (token === validToken) {
        return Promise.resolve({ sub: userId });
      }
      return Promise.resolve(null);
    });
  });

  describe("POST /api/upload", () => {
    test("should upload and process XML file with valid auth token", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant>
            <n>API Test User</n>
            <Telephone><Number>1234567890</Number></Telephone>
            <Identifier><PAN>TEST12345A</PAN></Identifier>
          </Applicant>
          <Score><Value>720</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Institution>Test Bank</Institution>
              <AccountNumber>TEST123</AccountNumber>
              <Status>Active</Status>
              <CurrentBalance>25000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
          </Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-upload.xml");
      fs.writeFileSync(testFilePath, mockXML);

      const response = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${validToken}`)
        .attach("xmlFile", testFilePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.reportId).toBeDefined();
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.basicDetails.name).toBe("API Test User");
      expect(response.body.data.basicDetails.creditScore).toBe(720);

      fs.unlinkSync(testFilePath);
    });

    test("should reject upload without auth token", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?><CreditReport></CreditReport>`;
      const testFilePath = path.join(__dirname, "test-no-auth.xml");
      fs.writeFileSync(testFilePath, mockXML);

      const response = await request(app)
        .post("/api/upload")
        .attach("xmlFile", testFilePath)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Unauthorized");

      fs.unlinkSync(testFilePath);
    });

    test("should reject upload with invalid auth token", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?><CreditReport></CreditReport>`;
      const testFilePath = path.join(__dirname, "test-invalid-auth.xml");
      fs.writeFileSync(testFilePath, mockXML);

      const response = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${invalidToken}`)
        .attach("xmlFile", testFilePath)
        .expect(401);

      expect(response.body.success).toBe(false);

      fs.unlinkSync(testFilePath);
    });

    test("should reject non-XML files even with valid token", async () => {
      const txtFilePath = path.join(__dirname, "test.txt");
      fs.writeFileSync(txtFilePath, "This is a text file");

      await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${validToken}`)
        .attach("xmlFile", txtFilePath)
        .expect(400);

      fs.unlinkSync(txtFilePath);
    });

    test("should return error when no file is uploaded", async () => {
      const response = await request(app)
        .post("/api/upload")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("No file uploaded");
    });
  });

  describe("GET /api/reports", () => {
    test("should retrieve all reports for authenticated user", async () => {
      const response = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test("should return empty array for user with no reports", async () => {
      const CreditReport = require("../../models/CreditReport");
      await CreditReport.deleteMany({ userId });

      const response = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    test("should reject request without auth token", async () => {
      await request(app).get("/api/reports").expect(401);
    });

    test("should only return reports belonging to authenticated user", async () => {
      const CreditReport = require("../../models/CreditReport");

      // Create reports for different users
      await CreditReport.create({
        userId: "user_test123",
        basicDetails: { name: "User 1 Report", creditScore: 750 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 10000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 10000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });

      await CreditReport.create({
        userId: "different_user",
        basicDetails: { name: "Different User Report", creditScore: 680 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 20000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 20000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });

      const response = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].basicDetails.name).toBe("User 1 Report");
    });
  });

  describe("GET /api/reports/:id", () => {
    let reportId;
    let otherUserReportId;

    beforeEach(async () => {
      const CreditReport = require("../../models/CreditReport");

      // Create report for authenticated user
      const report = new CreditReport({
        userId: "user_test123",
        basicDetails: { name: "Test User", creditScore: 700 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 50000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 50000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });
      const saved = await report.save();
      reportId = saved._id;

      // Create report for different user
      const otherReport = new CreditReport({
        userId: "different_user",
        basicDetails: { name: "Other User", creditScore: 650 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 30000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 30000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });
      const savedOther = await otherReport.save();
      otherUserReportId = savedOther._id;
    });

    test("should retrieve own report by ID", async () => {
      const response = await request(app)
        .get(`/api/reports/${reportId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.basicDetails.name).toBe("Test User");
      expect(response.body.data.userId).toBe("user_test123");
    });

    test("should not retrieve other user's report", async () => {
      const response = await request(app)
        .get(`/api/reports/${otherUserReportId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });

    test("should return 404 for non-existent report", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/reports/${fakeId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });

    test("should reject request without auth token", async () => {
      await request(app).get(`/api/reports/${reportId}`).expect(401);
    });

    test("should return error for invalid ObjectId", async () => {
      const response = await request(app)
        .get("/api/reports/invalid-id")
        .set("Authorization", `Bearer ${validToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/reports/:id", () => {
    let reportId;
    let otherUserReportId;

    beforeEach(async () => {
      const CreditReport = require("../../models/CreditReport");

      const report = new CreditReport({
        userId: "user_test123",
        basicDetails: { name: "Delete Test", creditScore: 650 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 10000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 10000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });
      const saved = await report.save();
      reportId = saved._id;

      const otherReport = new CreditReport({
        userId: "different_user",
        basicDetails: { name: "Other User Report", creditScore: 700 },
        reportSummary: {
          totalAccounts: 1,
          activeAccounts: 1,
          closedAccounts: 0,
          currentBalanceAmount: 15000,
          securedAccountsAmount: 0,
          unsecuredAccountsAmount: 15000,
          last7DaysEnquiries: 0,
        },
        creditAccounts: [],
        addresses: [],
      });
      const savedOther = await otherReport.save();
      otherUserReportId = savedOther._id;
    });

    test("should delete own report successfully", async () => {
      const response = await request(app)
        .delete(`/api/reports/${reportId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/reports/${reportId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(404);
    });

    test("should not delete other user's report", async () => {
      const response = await request(app)
        .delete(`/api/reports/${otherUserReportId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");

      // Verify report still exists
      const CreditReport = require("../../models/CreditReport");
      const stillExists = await CreditReport.findById(otherUserReportId);
      expect(stillExists).not.toBeNull();
    });

    test("should return 404 when deleting non-existent report", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/reports/${fakeId}`)
        .set("Authorization", `Bearer ${validToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test("should reject delete request without auth token", async () => {
      await request(app).delete(`/api/reports/${reportId}`).expect(401);
    });
  });
});
