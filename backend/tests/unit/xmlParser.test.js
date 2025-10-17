const { parseXML } = require("../../utils/xmlParser");
const fs = require("fs").promises;
const path = require("path");

describe("XML Parser Unit Tests", () => {
  afterEach(async () => {
    // Clean up any test files created
    const testFiles = [
      "test-credit-report.xml",
      "test-no-score.xml",
      "test-accounts.xml",
      "test-invalid.xml",
      "test-empty.xml",
    ];

    for (const file of testFiles) {
      const filePath = path.join(__dirname, file);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // File doesn't exist, ignore
      }
    }
  });

  describe("parseXML - Valid XML", () => {
    test("should parse valid XML file with all fields correctly", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant>
            <n>John Doe</n>
            <Telephone><Number>9876543210</Number></Telephone>
            <Identifier><PAN>ABCDE1234F</PAN></Identifier>
          </Applicant>
          <Score><Value>750</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Institution>HDFC Bank</Institution>
              <AccountNumber>1234</AccountNumber>
              <Status>Active</Status>
              <CurrentBalance>50000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
              <Address>Mumbai</Address>
            </Account>
          </Accounts>
          <Enquiries>
            <Enquiry><Date>2024-10-10</Date></Enquiry>
          </Enquiries>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-credit-report.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      // Test structure
      expect(result).toHaveProperty("basicDetails");
      expect(result).toHaveProperty("reportSummary");
      expect(result).toHaveProperty("creditAccounts");
      expect(result).toHaveProperty("addresses");

      // Test basic details
      expect(result.basicDetails.name).toBe("John Doe");
      expect(result.basicDetails.mobilePhone).toBe("9876543210");
      expect(result.basicDetails.pan).toBe("ABCDE1234F");
      expect(result.basicDetails.creditScore).toBe(750);

      // Test credit accounts
      expect(result.creditAccounts.length).toBe(1);
      expect(result.creditAccounts[0].type).toBe("Credit Card");
      expect(result.creditAccounts[0].bank).toBe("HDFC Bank");
      expect(result.creditAccounts[0].currentBalance).toBe(50000);

      // Test report summary
      expect(result.reportSummary.totalAccounts).toBe(1);
    });

    test("should handle missing optional fields gracefully", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant><n>Jane Doe</n></Applicant>
          <Accounts></Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-no-score.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      expect(result.basicDetails.creditScore).toBe(0);
      expect(result.basicDetails.mobilePhone).toBeTruthy();
      expect(result.creditAccounts).toEqual([]);
    });
  });

  describe("parseXML - Account Calculations", () => {
    test("should calculate active and closed accounts correctly", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant><n>Test User</n></Applicant>
          <Score><Value>700</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Status>Active</Status>
              <CurrentBalance>10000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
            <Account>
              <AccountType>Personal Loan</AccountType>
              <Status>Closed</Status>
              <CurrentBalance>0</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
            <Account>
              <AccountType>Auto Loan</AccountType>
              <Status>Active</Status>
              <CurrentBalance>50000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
          </Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-accounts.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      expect(result.reportSummary.totalAccounts).toBe(3);
      expect(result.reportSummary.activeAccounts).toBe(2);
      expect(result.reportSummary.closedAccounts).toBe(1);
    });

    test("should calculate total balances correctly", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant><n>Balance Test</n></Applicant>
          <Score><Value>680</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Status>Active</Status>
              <CurrentBalance>25000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
            <Account>
              <AccountType>Personal Loan</AccountType>
              <Status>Active</Status>
              <CurrentBalance>75000</CurrentBalance>
              <AmountOverdue>5000</AmountOverdue>
            </Account>
          </Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-accounts.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      expect(result.reportSummary.currentBalanceAmount).toBe(100000);
      expect(result.creditAccounts[1].amountOverdue).toBe(5000);
    });

    test("should categorize secured and unsecured accounts", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant><n>Category Test</n></Applicant>
          <Score><Value>720</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Auto Loan</AccountType>
              <Status>Active</Status>
              <CurrentBalance>50000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Status>Active</Status>
              <CurrentBalance>25000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
            </Account>
          </Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-accounts.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      // Auto Loan should be secured
      expect(result.reportSummary.securedAccountsAmount).toBe(50000);
      // Credit Card should be unsecured
      expect(result.reportSummary.unsecuredAccountsAmount).toBe(25000);
    });
  });

  describe("parseXML - Error Handling", () => {
    test("should throw error for invalid XML", async () => {
      const invalidXML = `This is not valid XML content at all`;

      const testFilePath = path.join(__dirname, "test-invalid.xml");
      await fs.writeFile(testFilePath, invalidXML);

      await expect(parseXML(testFilePath)).rejects.toThrow();
    });

    test("should throw error for non-existent file", async () => {
      await expect(parseXML("non-existent-file.xml")).rejects.toThrow();
    });

    test("should handle empty XML gracefully", async () => {
      const emptyXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport></CreditReport>`;

      const testFilePath = path.join(__dirname, "test-empty.xml");
      await fs.writeFile(testFilePath, emptyXML);

      const result = await parseXML(testFilePath);

      expect(result.creditAccounts).toEqual([]);
      expect(result.reportSummary.totalAccounts).toBe(0);
    });
  });

  describe("parseXML - Address Extraction", () => {
    test("should extract and deduplicate addresses", async () => {
      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant><n>Address Test</n></Applicant>
          <Score><Value>690</Value></Score>
          <Accounts>
            <Account>
              <AccountType>Credit Card</AccountType>
              <Status>Active</Status>
              <CurrentBalance>10000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
              <Address>Mumbai Address</Address>
            </Account>
            <Account>
              <AccountType>Personal Loan</AccountType>
              <Status>Active</Status>
              <CurrentBalance>50000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
              <Address>Delhi Address</Address>
            </Account>
            <Account>
              <AccountType>Auto Loan</AccountType>
              <Status>Active</Status>
              <CurrentBalance>30000</CurrentBalance>
              <AmountOverdue>0</AmountOverdue>
              <Address>Mumbai Address</Address>
            </Account>
          </Accounts>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-accounts.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      // Should have 2 unique addresses (Mumbai deduplicated)
      expect(result.addresses.length).toBe(2);
      expect(result.addresses).toContain("Mumbai Address");
      expect(result.addresses).toContain("Delhi Address");
    });
  });

  describe("parseXML - Credit Enquiries", () => {
    test("should count recent enquiries (last 7 days)", async () => {
      const today = new Date();
      const recentDate = new Date(today);
      recentDate.setDate(today.getDate() - 3); // 3 days ago

      const oldDate = new Date(today);
      oldDate.setDate(today.getDate() - 10); // 10 days ago

      const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
        <CreditReport>
          <Applicant><n>Enquiry Test</n></Applicant>
          <Score><Value>730</Value></Score>
          <Accounts></Accounts>
          <Enquiries>
            <Enquiry><Date>${
              recentDate.toISOString().split("T")[0]
            }</Date></Enquiry>
            <Enquiry><Date>${
              oldDate.toISOString().split("T")[0]
            }</Date></Enquiry>
            <Enquiry><Date>${today.toISOString().split("T")[0]}</Date></Enquiry>
          </Enquiries>
        </CreditReport>`;

      const testFilePath = path.join(__dirname, "test-accounts.xml");
      await fs.writeFile(testFilePath, mockXML);

      const result = await parseXML(testFilePath);

      // Should count 2 enquiries within last 7 days
      expect(result.reportSummary.last7DaysEnquiries).toBe(2);
    });
  });
});
