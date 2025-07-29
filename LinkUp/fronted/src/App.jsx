 import React from 'react'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import { userDataContext } from './context/UserContext';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import Network from './pages/Network';
import Profile from './pages/Profile';
import Notification from './pages/notification';
import SavedPosts from './pages/SavedPosts';

function App() {
  let { userData }=useContext(userDataContext)
  return (
   <Routes>
    <Route path='/' element={userData?<Home/>:<Navigate to="/login"/>}/>
    <Route path='/signup' element={userData?<Navigate to="/"/>:<Signup/>}/>
    <Route path='/login' element={userData?<Navigate to="/"/>:<Login/>}/>
    <Route path ='/Network' element={userData?<Network/>:<Navigate to="/login"/>}/>
    <Route path ='/Profile' element={userData?<Profile/>:<Navigate to="/login"/>}/>
      <Route path='/notification' element={userData?<Notification/>:<Navigate to="/login"/>}/>
    <Route path='/saved-posts' element={userData?<SavedPosts/>:<Navigate to="/login"/>}/>

   </Routes>
  )
}

export default App
