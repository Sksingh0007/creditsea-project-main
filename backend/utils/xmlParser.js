const xml2js = require("xml2js");
const fs = require("fs").promises;


const getText = (obj, path) => {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (!current || !current[key]) return null;
    current = current[key];
  }

  if (Array.isArray(current) && current.length > 0) {
    return current[0];
  }
  return current;
};

const parseXML = async (filePath) => {
  try {
    const xmlData = await fs.readFile(filePath, "utf-8");
    const parser = new xml2js.Parser({ explicitArray: true });
    const result = await parser.parseStringPromise(xmlData);

    // Extract data based on typical Experian XML structure
    const report = result.CreditReport || result.INProfileResponse || result;

    // Basic Details
    const basicDetails = {
      name:
        getText(report, "Applicant.0.Name.0") ||
        getText(report, "Header.0.Applicant.0.Name.0") ||
        getText(report, "Name.0") ||
        "N/A",
      mobilePhone:
        getText(report, "Applicant.0.Telephone.0.Number.0") ||
        getText(report, "Telephone.0") ||
        getText(report, "Mobile.0") ||
        "N/A",
      pan:
        getText(report, "Applicant.0.Identifier.0.PAN.0") ||
        getText(report, "PAN.0") ||
        "N/A",
      creditScore: parseInt(
        getText(report, "Score.0.Value.0") ||
          getText(report, "CreditScore.0") ||
          "0"
      ),
    };


    const accounts = report.Accounts?.[0]?.Account || report.Account || [];

    const creditAccounts = [];
    let totalBalance = 0;
    let securedAmount = 0;
    let unsecuredAmount = 0;
    let activeCount = 0;
    let closedCount = 0;
    const addressSet = new Set();

    accounts.forEach((acc) => {
      const accountType =
        getText(acc, "AccountType.0") || getText(acc, "Type.0") || "Unknown";
      const status =
        getText(acc, "Status.0") ||
        getText(acc, "AccountStatus.0") ||
        "Unknown";
      const balance = parseFloat(
        getText(acc, "CurrentBalance.0") || getText(acc, "Balance.0") || 0
      );
      const overdue = parseFloat(
        getText(acc, "AmountOverdue.0") || getText(acc, "Overdue.0") || 0
      );


      if (status.toLowerCase().includes("active") || status === "11") {
        activeCount++;
      } else if (status.toLowerCase().includes("closed")) {
        closedCount++;
      }


      const securedTypes = ["auto loan", "home loan", "mortgage", "secured"];
      const isSecured = securedTypes.some((type) =>
        accountType.toLowerCase().includes(type)
      );

      if (isSecured) {
        securedAmount += balance;
      } else {
        unsecuredAmount += balance;
      }

      totalBalance += balance;


      const address =
        getText(acc, "Address.0") || getText(acc, "Subscriber.0.Address.0");
      if (address) addressSet.add(address);

      creditAccounts.push({
        type: accountType,
        bank:
          getText(acc, "Institution.0") ||
          getText(acc, "Subscriber.0.Name.0") ||
          "N/A",
        accountNumber:
          getText(acc, "AccountNumber.0") || getText(acc, "Number.0") || "N/A",
        currentBalance: balance,
        amountOverdue: overdue,
        address: address || "N/A",
        status: status,
      });
    });


    const enquiries = report.Enquiries?.[0]?.Enquiry || report.Enquiry || [];
    const recentEnquiries = enquiries.filter((enq) => {
      const dateStr = getText(enq, "Date.0");
      if (!dateStr) return false;
      const enquiryDate = new Date(dateStr);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return enquiryDate >= sevenDaysAgo;
    });


    const reportSummary = {
      totalAccounts: accounts.length,
      activeAccounts: activeCount,
      closedAccounts: closedCount,
      currentBalanceAmount: totalBalance,
      securedAccountsAmount: securedAmount,
      unsecuredAccountsAmount: unsecuredAmount,
      last7DaysEnquiries: recentEnquiries.length,
    };

    return {
      basicDetails,
      reportSummary,
      creditAccounts,
      addresses: Array.from(addressSet),
    };
  } catch (error) {
    console.error("XML Parsing Error:", error);
    throw new Error("Failed to parse XML file: " + error.message);
  }
};

module.exports = { parseXML };
