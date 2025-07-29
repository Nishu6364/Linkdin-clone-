import React, { useContext, useState } from 'react'
import logo from "../assets/logo.png"
import { useNavigate } from "react-router-dom"
import { authDataContext } from '../context/AuthContext'
import axios from "axios"
import { userDataContext } from '../context/UserContext'
import Toast from '../components/Toast'

function Signup() {
  const [show, setShow] = useState(false)
  const { serverUrl } = useContext(authDataContext)
  let {userData,setUserData}=useContext(userDataContext)
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [showToast, setShowToast] = useState(false)
  const handleSignUp = async (e) => {
    e.preventDefault()
    setErr("") // Clear previous errors
    setLoading(true)
  
    // ✅ Custom validation for password length
    if (password.length < 8) {
      setErr("Password must be at least 8 characters")
      setLoading(false)
      return
    }
  
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        {
          firstName,
          lastName,
          userName,
          email: email.trim().toLowerCase(),
          password,
        },
        { withCredentials: true }
      )
  
      console.log(result)
      setUserData(result.data)
      
      // Show success toast
      setShowToast(true)
      
      // Navigate after a short delay to let user see the toast
      setTimeout(() => {
        navigate("/")
      }, 2000)

  
      // ✅ Clear inputs on success (stay on the page)
      setFirstName("")
      setLastName("")
      setUserName("")
      setEmail("")
      setPassword("")
      setErr("")
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }
  
  

  return (
    <div className='w-full h-screen bg-[white] flex flex-col items-center justify-start gap-[10px]'>
      {showToast && (
        <Toast 
          message="Registration successful! Welcome email sent to your inbox." 
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      
      <div className='p-[30px] lg:p-[35px] w-full h-[120px] flex items-center'>
        <img src={logo} alt="logo" className="h-full object-contain" />
      </div>

      <form
        className='w-[90%] max-w-[400px] h-[600px] md:shadow-xl flex flex-col justify-center gap-[10px] p-[15px]'
        onSubmit={handleSignUp}
      >
        <h1 className='text-gray-800 text-[30px] font-semibold mb-[30px]'>Sign Up</h1>

        <input type="text" placeholder='Firstname' required value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className='w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' />

        <input type="text" placeholder='Lastname' required value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className='w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' />

        <input type="text" placeholder='Username' required value={userName} autoComplete='off'
          onChange={(e) => setUserName(e.target.value)}
          className='w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' />

        <input type="email" placeholder='Email' required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' />

        <div className='w-full h-[50px] border-2 border-gray-600 text-gray-800 text-[18px] rounded-md relative'>
          <input type={show ? "text" : "password"} placeholder='Password' minLength={8} required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full h-full border-none text-gray-800 text-[18px] px-[20px] py-[10px] rounded-md' />
          <span
            className='absolute right-[20px] top-[10px] text-[#24b2ff] cursor-pointer font-semibold'
            onClick={() => setShow(prev => !prev)}
          >
            {show ? "Hide" : "Show"}
          </span>
        </div>

        {err && <p className='text-center text-red-500'>*{err}</p>}

        <button className='w-full h-[50px] rounded-full bg-[#24b2ff] mt-[40px] text-white' disabled={loading}>
          {loading ? "Loading..." : "Sign Up"}
        </button>

        <p className='text-center cursor-pointer' onClick={() => navigate("/login")}>
          Already have an account? <span className='text-[#2a9bd8]'>Sign In</span>
        </p>
      </form>
    </div>
  )
}

export default Signup
