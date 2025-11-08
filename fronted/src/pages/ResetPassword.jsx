import React, { useContext, useState, useEffect } from "react";
import logo from "../assets/logo.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authDataContext } from "../context/AuthContext";
import axios from "axios";

function ResetPassword() {
  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError("Invalid reset link");
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/reset-password`,
        { 
          token,
          newPassword: password 
        },
        { withCredentials: true }
      );

      if (result.status === 200) {
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      setError(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="w-full h-screen bg-[white] flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[white] flex flex-col items-center justify-start gap-[10px]">
      <div className="p-[30px] lg:p-[35px] w-full h-[120px] flex items-center">
        <img src={logo} alt="logo" className="h-full object-contain" />
      </div>

      <form
        className="w-[90%] max-w-[400px] h-[600px] md:shadow-xl flex flex-col justify-center gap-[10px] p-[15px]"
        onSubmit={handleResetPassword}
      >
        <h1 className="text-gray-800 text-[30px] font-semibold mb-[20px]">
          Reset Password
        </h1>
        
        <p className="text-gray-600 text-[16px] mb-[30px]">
          Enter your new password below.
        </p>

        <div className="w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] rounded-md relative">
          <input
            type={show ? "text" : "password"}
            placeholder="New Password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-full border-none text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md"
          />
          <span
            className="absolute right-[20px] top-[10px] text-[#24b2ff] cursor-pointer font-semibold"
            onClick={() => setShow((prev) => !prev)}
          >
            {show ? "Hide" : "Show"}
          </span>
        </div>

        <div className="w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] rounded-md relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm New Password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full h-full border-none text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md"
          />
          <span
            className="absolute right-[20px] top-[10px] text-[#24b2ff] cursor-pointer font-semibold"
            onClick={() => setShowConfirm((prev) => !prev)}
          >
            {showConfirm ? "Hide" : "Show"}
          </span>
        </div>

        {error && <p className="text-center text-red-500">*{error}</p>}
        {message && <p className="text-center text-green-500">{message}</p>}

        <button
          className="w-full h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white"
          disabled={loading || !token}
        >
          {loading ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
