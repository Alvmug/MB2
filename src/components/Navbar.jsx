import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { cartCount, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const count = cartCount();

  const handleToggleMobile = () => setMobileOpen(!mobileOpen);
  const handleCloseMobile = () => setMobileOpen(false);

  return (
    <nav>
      <Link to="/" className="logo" onClick={handleCloseMobile}>
        <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning" />
        MAD BURNING
      </Link>
      
      <button className="nav-toggle" onClick={handleToggleMobile}>
        {mobileOpen ? '✕' : '☰'}
      </button>

      <ul className={mobileOpen ? 'open' : ''}>
        <li>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={handleCloseMobile}
            end
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/menu" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={handleCloseMobile}
          >
            Menu
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/order" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={handleCloseMobile}
          >
            Order
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/about" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={handleCloseMobile}
          >
            About
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={handleCloseMobile}
          >
            Contact
          </NavLink>
        </li>
      </ul>

      <button className="cart-btn" onClick={() => setCartOpen(true)}>
        <i className="fa-solid fa-cart-shopping"></i> Cart{' '}
        {count > 0 && <span className="cart-badge">{count}</span>}
      </button>
    </nav>
  );
}
