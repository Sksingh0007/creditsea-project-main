/* eslint-disable no-undef */
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import ReportDetailPage from "../ReportDetailPage";

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));


jest.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    getToken: jest.fn(() => Promise.resolve("mock-token")),
    isSignedIn: true,
    userId: "user_test123",
  }),
}));

const mockReport = {
  _id: "123",
  userId: "user_test123",
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
    currentBalanceAmount: 150000,
    securedAccountsAmount: 100000,
    unsecuredAccountsAmount: 50000,
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
    {
      type: "Personal Loan",
      bank: "ICICI Bank",
      accountNumber: "XXXX-5678",
      currentBalance: 100000,
      amountOverdue: 5000,
      address: "Delhi",
      status: "Active",
    },
  ],
  addresses: ["123 Main St, Mumbai", "456 Park Ave, Delhi"],
};

const renderWithRouter = (initialRoute = "/reports/123") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/reports/:id" element={<ReportDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("ReportDetailPage Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Loading State", () => {
    test("shows loading spinner while fetching report", async () => {
      axios.get.mockImplementation(() => new Promise(() => {})); 

      renderWithRouter();

      expect(screen.getByText(/Loading report/i)).toBeInTheDocument();
    });
  });

  describe("Report Display", () => {
    test("displays basic details section", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      expect(screen.getByText("9876543210")).toBeInTheDocument();
      expect(screen.getByText("ABCDE1234F")).toBeInTheDocument();
      expect(screen.getByText("750")).toBeInTheDocument();
    });

    test("displays report summary statistics", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      expect(screen.getByText(/Total Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/Closed Accounts/i)).toBeInTheDocument();


      const totalAccounts = screen.getByText("3");
      expect(totalAccounts).toBeInTheDocument();
    });

    test("displays credit accounts information", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("Credit Card")).toBeInTheDocument();
      });

      expect(screen.getByText("Personal Loan")).toBeInTheDocument();
      expect(screen.getByText("HDFC Bank")).toBeInTheDocument();
      expect(screen.getByText("ICICI Bank")).toBeInTheDocument();
    });

    test("displays addresses section", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("123 Main St, Mumbai")).toBeInTheDocument();
      });

      expect(screen.getByText("456 Park Ave, Delhi")).toBeInTheDocument();
    });

    test("applies correct CSS class for excellent credit score", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        const scoreElement = screen.getByText("750");
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement).toHaveClass("excellent");
      });
    });

    test("shows overdue amounts in red", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("Personal Loan")).toBeInTheDocument();
      });


      const overdueElements = screen.getAllByText(/5,000/);
      expect(overdueElements.length).toBeGreaterThan(0);
    });

    test("displays no data message when no credit accounts", async () => {
      const reportWithNoAccounts = {
        ...mockReport,
        creditAccounts: [],
      };

      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: reportWithNoAccounts,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(
          screen.getByText("No credit accounts found")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("shows error when report fetch fails", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load report/i)).toBeInTheDocument();
      });


      expect(screen.getByText("Back to Reports")).toBeInTheDocument();
    });

    test("shows error when report not found", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: false,
          message: "Report not found",
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Report not found/i)).toBeInTheDocument();
      });
    });

    test("shows error when report data is null", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: null,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Report not found/i)).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    test("back button navigates to reports list", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const backButton = screen.getByText("← Back to Reports");
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/reports");
    });

    test("back button in error state navigates to reports list", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText(/Failed to load report/i)).toBeInTheDocument();
      });

      const backButton = screen.getByText("Back to Reports");
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/reports");
    });
  });

  describe("Data Formatting", () => {
    test("formats currency amounts correctly", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      expect(screen.getByText(/1,50,000/)).toBeInTheDocument(); 
      expect(screen.getByText(/1,00,000/)).toBeInTheDocument(); 
      expect(screen.getByText(/50,000/)).toBeInTheDocument(); 
    });

    test("shows correct status badges", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("Credit Card")).toBeInTheDocument();
      });


      const statusBadges = screen.getAllByText("Active");
      expect(statusBadges.length).toBe(2); 
    });
  });

  describe("Authorization", () => {
    test("includes authorization token in API request", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReport,
        },
      });

      renderWithRouter();

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("/api/reports/123"),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });
    });
  });
});
