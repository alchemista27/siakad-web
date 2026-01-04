import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import InputNilai from "./pages/InputNilai";
import RekapNilai from "./pages/RekapNilai";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/kelas/:id/nilai"
          element={
            <ProtectedRoute>
              <InputNilai />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kelas/:id/rekap"
          element={
            <ProtectedRoute>
              <RekapNilai />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;