import React, { useContext, useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { authDataContext } from "../context/AuthContext";
import axios from "axios";
import { userDataContext } from '../context/UserContext'

function Login() {
  let [show, setShow] = useState(false);
  let { serverUrl } = useContext(authDataContext);
   let {userData,setUserData}=useContext(userDataContext)
  let navigate = useNavigate();

  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [loading, setLoading] = useState(false);
  let [err, setErr] = useState("");
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/login`,
        {
          email,
          password,
        },
        { withCredentials: true }
      );

      // If login is successful (e.g., status 200 or based on your API response)
      if (result.status === 200) {
        // console.log("Login successful", result.data);
        setUserData(result.data)
        navigate("/")

        // ✅ Clear inputs
        setEmail("");
        setPassword("");
        setErr("");

        // ✅ Optional: Navigate to another page if needed
        // navigate("/dashboard");
      }
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong");
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
        className="w-[90%] max-w-[400px] h-[600px] md:shadow-xl flex flex-col justify-center gap-[10px] p-[15px]"
        onSubmit={handleSignIn}
      >
        <h1 className="text-gray-800 text-[30px] font-semibold mb-[30px]">
          Sign In
        </h1>

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md"
        />

        <div className="w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] rounded-md relative">
          <input
            type={show ? "text" : "password"}
            placeholder="Password"
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

        {err && <p className="text-center text-red-500">*{err}</p>}

        <button
          className="w-full h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        <p
          className="text-center cursor-pointer text-[#2a9bd8] mb-2"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </p>

        <p
          className="text-center cursor-pointer"
          onClick={() => navigate("/signup")}
        >
          want to create an account?{" "}
          <span className="text-[#2a9bd8]">Sign Up</span>
        </p>
      </form>
    </div>
  );
}

export default Login;
