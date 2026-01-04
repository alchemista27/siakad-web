import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import InputNilai from "./pages/InputNilai";

function App() {
  return (
    <Router>
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
      </Routes>
    </Router>
  );
};

export default App;