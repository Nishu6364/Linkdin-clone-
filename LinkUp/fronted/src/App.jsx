 import React from 'react'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { userDataContext } from './context/UserContext';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import Network from './pages/Network';
import Profile from './pages/Profile';
import Notification from './pages/notification';
import SavedPosts from './pages/SavedPosts';
import Chat from './pages/Chat';
import Friends from './pages/Friends';

function App() {
  let { userData }=useContext(userDataContext)
  return (
   <Routes>
    <Route path='/' element={userData?<Home/>:<Navigate to="/login"/>}/>
    <Route path='/signup' element={userData?<Navigate to="/"/>:<Signup/>}/>
    <Route path='/login' element={userData?<Navigate to="/"/>:<Login/>}/>
    <Route path='/forgot-password' element={userData?<Navigate to="/"/>:<ForgotPassword/>}/>
    <Route path='/reset-password' element={userData?<Navigate to="/"/>:<ResetPassword/>}/>
    <Route path ='/Network' element={userData?<Network/>:<Navigate to="/login"/>}/>
    <Route path ='/Profile' element={userData?<Profile/>:<Navigate to="/login"/>}/>
      <Route path='/notification' element={userData?<Notification/>:<Navigate to="/login"/>}/>
    <Route path='/saved-posts' element={userData?<SavedPosts/>:<Navigate to="/login"/>}/>
    <Route path='/chat' element={userData?<Chat/>:<Navigate to="/login"/>}/>
    <Route path='/friends' element={userData?<Friends/>:<Navigate to="/login"/>}/>

   </Routes>
  )
}

export default App
