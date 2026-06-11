import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import Toast from './components/Toast';

import Home from './pages/Home';
import Menu from './pages/Menu';
import Order from './pages/Order';
import About from './pages/About';
import Contact from './pages/Contact';
import CustomerLogin from './pages/CustomerLogin';
import InfluencerRegister from './pages/InfluencerRegister';
import InfluencerDashboard from './pages/InfluencerDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

import './styles/index.css';
import { useCart } from './context/CartContext';

function MainLayout({ children }) {
  const location = useLocation();
  const { menuLoading } = useCart();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    if (!menuLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1200); // 1.2s delay for premium transition feel
      return () => clearTimeout(timer);
    }
  }, [menuLoading]);

  // Disable Navbar, Footer, and Cart Sidebar for admin spaces and influencer dashboards
  const isDashboard = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/influencer-dashboard');

  if (showSplash && !isDashboard) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-fire-container">
            <div className="flame-particle p-1"></div>
            <div className="flame-particle p-2"></div>
            <div className="flame-particle p-3"></div>
            <div className="flame-particle p-4"></div>
            <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning Logo" className="splash-logo" style={{ zIndex: 10, position: 'relative' }} />
          </div>
          <h1 className="splash-title">MAD BURNING</h1>
          <p className="splash-subtitle">FEEL THE HEAT. TASTE THE BURN.</p>
          <div className="splash-loader">
            <div className="splash-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isDashboard && <Navbar />}
      {!isDashboard && <CartSidebar />}
      <main style={{ flex: 1 }}>{children}</main>
      {!isDashboard && <Footer />}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/order" element={<Order />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/influencer" element={<InfluencerRegister />} />
            <Route path="/influencer-dashboard" element={<InfluencerDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </MainLayout>
      </CartProvider>
    </Router>
  );
}
