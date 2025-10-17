/* eslint-disable no-undef */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import UploadPage from "../UploadPage";

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

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("UploadPage Component Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders upload page with all elements", () => {
      renderWithRouter(<UploadPage />);

      expect(screen.getByText("Upload Credit Report")).toBeInTheDocument();
      expect(screen.getByText(/Upload an Experian XML/i)).toBeInTheDocument();
      expect(screen.getByText("Drag & Drop XML file here")).toBeInTheDocument();
      expect(screen.getByText("Upload & Process")).toBeInTheDocument();
    });

    test("submit button is disabled initially", () => {
      renderWithRouter(<UploadPage />);

      const submitButton = screen.getByText("Upload & Process");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("File Selection", () => {
    test("allows XML file selection", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(screen.getByText("test.xml")).toBeInTheDocument();
      expect(screen.getByText(/0.01 KB/i)).toBeInTheDocument();
    });

    test("shows error for non-XML files", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      expect(
        screen.getByText(/Please select a valid XML file/i)
      ).toBeInTheDocument();
      expect(screen.queryByText("test.txt")).not.toBeInTheDocument();
    });

    test("enables submit button when valid file is selected", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      expect(submitButton).not.toBeDisabled();
    });

    test("clears error when valid file is selected after invalid file", () => {
      renderWithRouter(<UploadPage />);

      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });


      const invalidFile = new File(["test"], "test.txt", {
        type: "text/plain",
      });
      fireEvent.change(input, { target: { files: [invalidFile] } });
      expect(
        screen.getByText(/Please select a valid XML file/i)
      ).toBeInTheDocument();


      const validFile = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      fireEvent.change(input, { target: { files: [validFile] } });

      expect(
        screen.queryByText(/Please select a valid XML file/i)
      ).not.toBeInTheDocument();
      expect(screen.getByText("test.xml")).toBeInTheDocument();
    });
  });

  describe("File Removal", () => {
    test("allows removing selected file", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByText("test.xml")).toBeInTheDocument();

      const removeButton = screen.getByText("Remove");
      fireEvent.click(removeButton);

      expect(screen.queryByText("test.xml")).not.toBeInTheDocument();
      expect(screen.getByText("Drag & Drop XML file here")).toBeInTheDocument();
    });

    test("disables submit button after file removal", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const removeButton = screen.getByText("Remove");
      fireEvent.click(removeButton);

      const submitButton = screen.getByText("Upload & Process");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Drag and Drop", () => {
    test("handles valid XML file drop", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "dropped.xml", {
        type: "text/xml",
      });
      const dropZone = document.querySelector(".drop-zone");

      fireEvent.dragOver(dropZone);
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(screen.getByText("dropped.xml")).toBeInTheDocument();
    });

    test("shows error for invalid file drop", () => {
      renderWithRouter(<UploadPage />);

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const dropZone = document.querySelector(".drop-zone");

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(
        screen.getByText(/Please drop a valid XML file/i)
      ).toBeInTheDocument();
    });
  });

  describe("File Upload", () => {
    test("submits file successfully and shows success message", async () => {
      const mockResponse = {
        data: {
          success: true,
          reportId: "123456",
          message: "File uploaded successfully",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringMatching(/\/api\/upload$/),
          expect.any(FormData),
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "multipart/form-data",
              Authorization: "Bearer mock-token",
            }),
          })
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(/File uploaded successfully/i)
        ).toBeInTheDocument();
      });
    });

    test("shows error message on upload failure", async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: "Failed to process XML file",
          },
        },
      });

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to process XML file/i)
        ).toBeInTheDocument();
      });
    });

    test("shows loading state during upload", async () => {
      axios.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ data: { success: true, reportId: "123" } }),
              1000
            )
          )
      );

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Processing...")).toBeInTheDocument();
      });
    });

    test("navigates to report detail page after successful upload", async () => {
      const mockResponse = {
        data: {
          success: true,
          reportId: "abc123",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/reports/abc123");
        },
        { timeout: 3000 }
      );
    });

    test("clears file after successful upload", async () => {
      const mockResponse = {
        data: {
          success: true,
          reportId: "123",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByText("test.xml")).toBeInTheDocument();

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/File uploaded successfully/i)
        ).toBeInTheDocument();
      });


      await waitFor(() => {
        expect(screen.queryByText("test.xml")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    test("shows generic error when no response message", async () => {
      axios.post.mockRejectedValue(new Error("Network Error"));

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to upload file/i)).toBeInTheDocument();
      });
    });

    test("button stays disabled when no file selected", () => {
      renderWithRouter(<UploadPage />);

      const submitButton = screen.getByText("Upload & Process");


      expect(submitButton).toBeDisabled();


      fireEvent.click(submitButton);


      expect(submitButton).toBeDisabled();
    });

    test("includes authorization token in upload request", async () => {
      const mockResponse = {
        data: {
          success: true,
          reportId: "123",
        },
      };

      axios.post.mockResolvedValue(mockResponse);

      renderWithRouter(<UploadPage />);

      const file = new File(["<xml>test</xml>"], "test.xml", {
        type: "text/xml",
      });
      const input = screen.getByLabelText(/Drag & Drop XML file here/i, {
        selector: "input",
      });

      fireEvent.change(input, { target: { files: [file] } });

      const submitButton = screen.getByText("Upload & Process");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(FormData),
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
