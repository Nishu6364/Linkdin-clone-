import React,{ createContext } from 'react'
export const authDataContext=createContext()
// auth context is a parent  ist isuse to wrpa class
function AuthContext({children}) {
  const serverUrl = import.meta.env.VITE_SERVER_URL || "https://linkup-backend-blwa.onrender.com"

  let value ={
    serverUrl

  }
  return (
    <div>
    <authDataContext.Provider value={value}>
    {children}
    </authDataContext.Provider>
      
    </div>
  )
}

export default AuthContext

