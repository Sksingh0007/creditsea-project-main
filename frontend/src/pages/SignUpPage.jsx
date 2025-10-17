import React from "react";
import { SignUp } from "@clerk/clerk-react";
import "./AuthPages.css";

function SignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Start managing your credit reports securely</p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}

export default SignUpPage;
