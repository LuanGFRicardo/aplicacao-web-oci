import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import GerenteDashboard from "./pages/GerenteDashboard";
import OperadorDashboard from "./pages/OperadorDashboard";

import Cadastro from "./pages/Cadastro";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/gerente/dashboard" element={<GerenteDashboard />} />
        <Route path="/operador/dashboard" element={<OperadorDashboard />} />
        <Route path="*" element={<Login />} /> {/* Rota para casos não encontrados */}
        <Route path="/cadastro" element={<Cadastro />}/>
      </Routes>
    </Router>
  );
}

export default App;
