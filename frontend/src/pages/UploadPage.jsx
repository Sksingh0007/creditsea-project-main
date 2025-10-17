import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UploadPage.css";
import { useAuth } from "@clerk/clerk-react";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".xml")) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please select a valid XML file");
        setFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".xml")) {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please drop a valid XML file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("xmlFile", file);

    try {
      const token = await getToken();
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("File uploaded successfully!");
      setFile(null);


      setTimeout(() => {
        navigate(`/reports/${response.data.reportId}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>Upload Credit Report</h1>
          <p>Upload an Experian XML credit report file for analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div
            className={`drop-zone ${file ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              accept=".xml"
              onChange={handleFileChange}
              className="file-input"
            />

            {!file ? (
              <label htmlFor="file-input" className="drop-label">
                <div className="upload-icon">📄</div>
                <h3>Drag & Drop XML file here</h3>
                <p>or</p>
                <span className="browse-btn">Browse Files</span>
                <p className="file-info">Supported format: XML (Max 10MB)</p>
              </label>
            ) : (
              <div className="file-selected">
                <div className="file-icon">✅</div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">❌</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              {success}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              "Upload & Process"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UploadPage;
