import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GerenteDashboard from "./pages/GerenteDashboard";
import OperadorDashboard from "./pages/OperadorDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/gerente/dashboard" element={<GerenteDashboard />} />
        <Route path="/operador/dashboard" element={<OperadorDashboard />} />
        <Route path="*" element={<Login />} /> {/* Rota para casos não encontrados */}
      </Routes>
    </Router>
  );
}

export default App;
