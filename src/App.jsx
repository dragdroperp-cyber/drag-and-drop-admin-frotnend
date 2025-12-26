import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import SellerList from './pages/SellerList';
import SellerDetails from './pages/SellerDetails';
import PlanList from './pages/PlanList';
import SystemStatus from './pages/SystemStatus';
import Financial from './pages/Financial';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="sellers" element={<SellerList />} />
          <Route path="sellers/:id" element={<SellerDetails />} />
          <Route path="plans" element={<PlanList />} />
          <Route path="financial" element={<Financial />} />
          <Route path="system" element={<SystemStatus />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
