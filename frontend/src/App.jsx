import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import "./App.css";
import UploadPage from "./pages/UploadPage";
import ReportsListPage from "./pages/ReportsListPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";


function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <span className="logo-icon">💳</span>
              CreditSea
            </Link>

            <SignedIn>
              <ul className="nav-menu">
                <li className="nav-item">
                  <Link to="/">
                    <button className="nav-link">Upload</button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/reports">
                    <button className="nav-link">Reports</button>
                  </Link>
                </li>
                <li className="user-item">
                  <UserButton />
                </li>
              </ul>
            </SignedIn>

            <SignedOut>
              <ul className="nav-menu">
                <li className="nav-item">
                  <Link to="/sign-in">
                    <button className="nav-link">Sign In</button>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/sign-up">
                    <button className="nav-link">Sign Up</button>
                  </Link>
                </li>
              </ul>
            </SignedOut>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute>
                  <ReportDetailPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2025 CreditSea - Credit Report Management System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
