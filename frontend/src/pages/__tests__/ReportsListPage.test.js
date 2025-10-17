/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import ReportsListPage from "../ReportsListPage";

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));


jest.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    getToken: jest.fn(() => Promise.resolve("mock-token")),
    isSignedIn: true,
    userId: "user_test123",
  }),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ReportsListPage Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReports = [
    {
      _id: "1",
      basicDetails: {
        name: "John Doe",
        creditScore: 750,
      },
      fileName: "report1.xml",
      uploadedAt: "2024-10-15T10:00:00.000Z",
    },
    {
      _id: "2",
      basicDetails: {
        name: "Jane Smith",
        creditScore: 680,
      },
      fileName: "report2.xml",
      uploadedAt: "2024-10-14T10:00:00.000Z",
    },
  ];

  describe("Loading State", () => {
    test("shows loading spinner while fetching reports", () => {
      axios.get.mockImplementation(() => new Promise(() => {})); 
      renderWithRouter(<ReportsListPage />);

      expect(screen.getByText(/Loading reports/i)).toBeInTheDocument();
    });
  });

  describe("Reports Display", () => {
    test("displays list of reports", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
          count: 2,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    test("displays credit scores with correct styling", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        const score750 = screen.getByText("750");
        const score680 = screen.getByText("680");

        expect(score750).toHaveClass("excellent");
        expect(score680).toHaveClass("good");
      });
    });

    test("displays file names and upload dates", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("report1.xml")).toBeInTheDocument();
        expect(screen.getByText("report2.xml")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    test("shows empty state when no reports exist", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
          count: 0,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("No Reports Yet")).toBeInTheDocument();
        expect(
          screen.getByText(/Upload your first credit report/i)
        ).toBeInTheDocument();
      });
    });

    test("empty state has upload link", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        const uploadLink = screen.getByText("Upload Report");
        expect(uploadLink).toBeInTheDocument();
        expect(uploadLink.closest("a")).toHaveAttribute("href", "/");
      });
    });
  });

  describe("Report Actions", () => {
    test("view details button links to report detail page", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText("View Details");
        expect(viewButtons[0].closest("a")).toHaveAttribute(
          "href",
          "/reports/1"
        );
      });
    });

    test("delete button opens confirmation modal", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);


      await waitFor(() => {
        expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
        expect(
          screen.getByText(/delete this report permanently/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
      });
    });

    test("modal shows correct report name", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);


      await waitFor(() => {
        const nameElements = screen.getAllByText("John Doe");
        expect(nameElements.length).toBeGreaterThan(1);
      });
    });

    test("cancel button closes modal", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      });


      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);


      await waitFor(() => {
        expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();
      });
    });

    test("clicking overlay closes modal", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      });


      const overlay = document.querySelector(".modal-overlay");
      fireEvent.click(overlay);


      await waitFor(() => {
        expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();
      });
    });

    test("successfully deletes report when confirmed", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      axios.delete.mockResolvedValue({
        data: {
          success: true,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      });


      const confirmButton = document.querySelector(".confirm-delete-btn");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining("/api/reports/1"),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });


      await waitFor(() => {
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      });


      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    test("shows error message on delete failure", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      axios.delete.mockRejectedValue(new Error("Delete failed"));

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      });


      const confirmButton = document.querySelector(".confirm-delete-btn");
      fireEvent.click(confirmButton);


      await waitFor(() => {
        expect(
          screen.getByText(/Failed to delete report/i)
        ).toBeInTheDocument();
      });
    });

    test("delete button shows loading state", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      axios.delete.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { success: true } }), 100)
          )
      );

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });


      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
      });


      const confirmButton = document.querySelector(".confirm-delete-btn");
      fireEvent.click(confirmButton);


      await waitFor(() => {
        expect(screen.getByText("Deleting...")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("shows error message when fetch fails", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load reports/i)).toBeInTheDocument();
      });
    });
  });

  describe("Authorization", () => {
    test("includes authorization token in API request", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          data: mockReports,
        },
      });

      renderWithRouter(<ReportsListPage />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          expect.stringContaining("/api/reports"),
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
