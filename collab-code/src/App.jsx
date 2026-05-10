import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import SnippetsPage from './pages/SnippetsPage.jsx'

function useAuth() {
  return !!localStorage.getItem('token')
}

function PrivateRoute({ children }) {
  return useAuth() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/editor/:roomId" element={<PrivateRoute><EditorPage /></PrivateRoute>} />
      <Route path="/snippets" element={<PrivateRoute><SnippetsPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
