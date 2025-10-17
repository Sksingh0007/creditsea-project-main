import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./ReportsListPage.css";
import { useAuth } from "@clerk/clerk-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ReportsListPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    reportId: null,
    reportName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const { getToken } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE}/api/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReports(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error(" Error fetching reports:", err);
      setError("Failed to load reports");
      setLoading(false);
    }
  };

  const openDeleteModal = (id, name) => {
    setDeleteModal({ isOpen: true, reportId: id, reportName: name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, reportId: null, reportName: "" });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE}/api/reports/${deleteModal.reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReports(
        reports.filter((report) => report._id !== deleteModal.reportId)
      );
      closeDeleteModal();
    } catch (err) {
      console.error("❌ Error deleting report:", err);
      setError("Failed to delete report. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="reports-list-page">
      <div className="reports-header">
        <h1>Credit Reports</h1>
        <p>View all uploaded credit reports</p>
      </div>

      {reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Reports Yet</h2>
          <p>Upload your first credit report to get started</p>
          <Link to="/" className="upload-link-btn">
            Upload Report
          </Link>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report._id} className="report-card">
              <div className="report-card-header">
                <div className="report-icon">👤</div>
                <h3>{report.basicDetails?.name || "N/A"}</h3>
              </div>

              <div className="report-card-body">
                <div className="report-info">
                  <span className="info-label">Credit Score:</span>
                  <span
                    className={`credit-score ${
                      report.basicDetails?.creditScore >= 750
                        ? "excellent"
                        : report.basicDetails?.creditScore >= 650
                        ? "good"
                        : "fair"
                    }`}
                  >
                    {report.basicDetails?.creditScore || "N/A"}
                  </span>
                </div>
                <div className="report-info">
                  <span className="info-label">File Name:</span>
                  <span className="info-value">{report.fileName}</span>
                </div>
                <div className="report-info">
                  <span className="info-label">Uploaded:</span>
                  <span className="info-value">
                    {new Date(report.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="report-card-footer">
                <Link to={`/reports/${report._id}`} className="view-btn">
                  View Details
                </Link>
                <button
                  onClick={() =>
                    openDeleteModal(
                      report._id,
                      report.basicDetails?.name || report.fileName
                    )
                  }
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h1>❗ Confirm Deletion</h1>
              <button className="modal-close" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <h3>You're about to delete this report permanently:</h3>
              <p className="report-name-highlight">
                File Name: {deleteModal.reportName}
              </p>
              <p className="warning-text">
                This action <strong>cannot be undone</strong> and all associated
                data will be <strong>permanently deleted</strong>.
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsListPage;
