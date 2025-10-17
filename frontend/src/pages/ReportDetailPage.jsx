import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ReportDetailPage.css";
import { useAuth } from "@clerk/clerk-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { getToken } = useAuth();

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE}/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching report:", err);
      setError("Failed to load report");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="error-container">
        <p>{error || "Report not found"}</p>
        <button onClick={() => navigate("/reports")} className="back-btn">
          Back to Reports
        </button>
      </div>
    );
  }

  const { basicDetails, reportSummary, creditAccounts, addresses } = report;

  return (
    <div className="report-detail-page">
      <div className="report-header">
        <button onClick={() => navigate("/reports")} className="back-button">
          ← Back to Reports
        </button>
        <h1>Credit Report Details</h1>
      </div>
      <section className="report-section">
        <h2 className="section-title">
          <span className="section-icon">👤</span>
          Basic Details
        </h2>
        <div className="details-grid">
          <div className="detail-card">
            <label>Name</label>
            <p>{basicDetails.name}</p>
          </div>
          <div className="detail-card">
            <label>Mobile Phone</label>
            <p>{basicDetails.mobilePhone}</p>
          </div>
          <div className="detail-card">
            <label>PAN</label>
            <p>{basicDetails.pan}</p>
          </div>
          <div className="detail-card highlight">
            <label>Credit Score</label>
            <p
              className={`score ${
                basicDetails.creditScore >= 750
                  ? "excellent"
                  : basicDetails.creditScore >= 650
                  ? "good"
                  : "fair"
              }`}
            >
              {basicDetails.creditScore}
            </p>
          </div>
        </div>
      </section>


      <section className="report-section">
        <h2 className="section-title">
          <span className="section-icon">📊</span>
          Report Summary
        </h2>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">🏦</div>
            <h3>Total Accounts</h3>
            <p className="summary-value">{reportSummary.totalAccounts}</p>
          </div>
          <div className="summary-card active">
            <div className="summary-icon">✅</div>
            <h3>Active Accounts</h3>
            <p className="summary-value">{reportSummary.activeAccounts}</p>
          </div>
          <div className="summary-card closed">
            <div className="summary-icon">❌</div>
            <h3>Closed Accounts</h3>
            <p className="summary-value">{reportSummary.closedAccounts}</p>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <h3>Current Balance</h3>
            <p className="summary-value">
              ₹{reportSummary.currentBalanceAmount.toLocaleString()}
            </p>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🔒</div>
            <h3>Secured Amount</h3>
            <p className="summary-value">
              ₹{reportSummary.securedAccountsAmount.toLocaleString()}
            </p>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🔓</div>
            <h3>Unsecured Amount</h3>
            <p className="summary-value">
              ₹{reportSummary.unsecuredAccountsAmount.toLocaleString()}
            </p>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🔍</div>
            <h3>Recent Enquiries</h3>
            <p className="summary-value">{reportSummary.last7DaysEnquiries}</p>
            <span className="summary-subtitle">Last 7 days</span>
          </div>
        </div>
      </section>


      <section className="report-section">
        <h2 className="section-title">
          <span className="section-icon">💳</span>
          Credit Accounts Information
        </h2>
        {creditAccounts.length === 0 ? (
          <p className="no-data">No credit accounts found</p>
        ) : (
          <div className="accounts-list">
            {creditAccounts.map((account, index) => (
              <div key={index} className="account-card">
                <div className="account-header">
                  <h3>{account.type}</h3>
                  <span
                    className={`status-badge ${
                      account.status.toLowerCase().includes("active")
                        ? "active"
                        : "closed"
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
                <div className="account-details">
                  <div className="account-row">
                    <span className="account-label">Bank:</span>
                    <span className="account-value">{account.bank}</span>
                  </div>
                  <div className="account-row">
                    <span className="account-label">Account Number:</span>
                    <span className="account-value">
                      {account.accountNumber}
                    </span>
                  </div>
                  <div className="account-row">
                    <span className="account-label">Current Balance:</span>
                    <span className="account-value balance">
                      ₹{account.currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="account-row">
                    <span className="account-label">Amount Overdue:</span>
                    <span
                      className={`account-value ${
                        account.amountOverdue > 0 ? "overdue" : ""
                      }`}
                    >
                      ₹{account.amountOverdue.toLocaleString()}
                    </span>
                  </div>
                  {account.address !== "N/A" && (
                    <div className="account-row">
                      <span className="account-label">Address:</span>
                      <span className="account-value">{account.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      {addresses && addresses.length > 0 && (
        <section className="report-section">
          <h2 className="section-title">
            <span className="section-icon">📍</span>
            Addresses
          </h2>
          <div className="addresses-list">
            {addresses.map((address, index) => (
              <div key={index} className="address-item">
                <span className="address-number">{index + 1}</span>
                <p>{address}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ReportDetailPage;
