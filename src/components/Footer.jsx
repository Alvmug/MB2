import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-col">
          <Link to="/" className="logo">
            <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning" />
            MAD BURNING
          </Link>
          <p>Burgers so good, they're dangerously addictive. Born from fire, built for flavor.</p>
        </div>
        
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/menu">Menu</Link></li>
            <li><Link to="/order">Order Online</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/admin">Admin Portal</Link></li>
            <li><Link to="/influencer-dashboard">Influencer Portal</Link></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>Follow Us</h4>
          <a 
            href="https://www.instagram.com/mad_burning?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginTop: '0.3rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '25px',
              background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(220,39,67,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#fff" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @mad_burning
          </a>
          <br />
          <a 
            href="https://www.tiktok.com/@mad_burning" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginTop: '0.7rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '25px',
              backgroundColor: '#010101',
              border: '1px solid #333',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,255,255,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#fff" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
            </svg>
            @mad_burning
          </a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1.5rem',
          marginBottom: '1.2rem',
          paddingBottom: '1.2rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
            📍 <span><strong>Kigali</strong> – Kanombe Sector</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
            ⏰ <span><strong>10:30am – 22:30pm</strong> · Mon – Sun</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
            📞 <a href="tel:0796899214" style={{ color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.5px' }}>0796 899 214</a>
          </span>
        </div>
        <p style={{ color: 'var(--fire)', fontWeight: 800, fontSize: '1rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          <i className="fa-solid fa-fire"></i> MadBurning – Taste the Fire! <i className="fa-solid fa-fire"></i>
        </p>
        <p>© 2026 Mad Burning. All rights reserved.</p>
      </div>
    </footer>
  );
}
