import React, { useContext, useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { authDataContext } from "../context/AuthContext";
import axios from "axios";

function ForgotPassword() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/forgot-password`,
        { email },
        { withCredentials: true }
      );

      if (result.status === 200) {
        setMessage("Password reset email sent successfully! Check your inbox.");
        setEmail("");
      }
    } catch (error) {
      setError(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[white] flex flex-col items-center justify-start gap-[10px]">
      <div className="p-[30px] lg:p-[35px] w-full h-[120px] flex items-center">
        <img src={logo} alt="logo" className="h-full object-contain" />
      </div>

      <form
        className="w-[90%] max-w-[400px] h-[500px] md:shadow-xl flex flex-col justify-center gap-[10px] p-[15px]"
        onSubmit={handleForgotPassword}
      >
        <h1 className="text-gray-800 text-[30px] font-semibold mb-[20px]">
          Forgot Password
        </h1>
        
        <p className="text-gray-600 text-[16px] mb-[30px]">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md"
        />

        {error && <p className="text-center text-red-500">*{error}</p>}
        {message && <p className="text-center text-green-500">{message}</p>}

        <button
          className="w-full h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p
          className="text-center cursor-pointer mt-4"
          onClick={() => navigate("/login")}
        >
          Remember your password?{" "}
          <span className="text-[#2a9bd8]">Sign In</span>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;
