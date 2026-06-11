import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mb_user_email');
    if (saved) {
      setSavedEmail(saved);
    }
  }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    localStorage.setItem('mb_user_email', email);
    navigate('/order');
  };

  const handleLogout = () => {
    localStorage.removeItem('mb_user_email');
    setSavedEmail('');
    setEmail('');
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--card-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 40px var(--fire-glow)',
        zIndex: 2
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.7rem',
          marginBottom: '1.8rem'
        }}>
          <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.6rem', fontFamily: 'Anton', letterSpacing: '1px' }}>
            MAD BURNING
          </span>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Welcome Back <i className="fa-solid fa-fire" style={{ color: 'var(--fire)' }}></i>
        </h2>
        
        {savedEmail ? (
          <div>
            <div style={{
              textAlign: 'center',
              padding: '1.2rem',
              background: 'var(--fire-glow)',
              border: '1px solid rgba(255, 69, 0, 0.2)',
              borderRadius: '12px',
              marginBottom: '1.2rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                Signed in as <strong style={{ color: 'var(--fire)' }}>{savedEmail}</strong>
              </p>
            </div>
            <Link to="/order" className="btn btn-fire btn-block" style={{ textAlign: 'center', marginBottom: '0.6rem' }}>
              Go to Order →
            </Link>
            <button className="btn btn-dark btn-block" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
              Enter your email to access your order
            </p>
            
            {errorMsg && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-fire btn-block" style={{ padding: '1rem', fontSize: '1rem', marginTop: '0.3rem' }}>
              Continue to Order →
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1.2rem 0', color: 'var(--border-color)', fontSize: '0.8rem' }}>
          <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></span>
          <span>or</span>
          <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></span>
        </div>

        <Link to="/" className="btn btn-dark btn-block" style={{ textAlign: 'center' }}>
          ← Back to Home
        </Link>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/admin" style={{ color: 'var(--text-dim)', textDecoration: 'none' }} className="hover-fire">
            <i className="fa-solid fa-lock"></i> Admin Portal
          </Link>
          <span style={{ color: 'var(--border-color)', margin: '0 0.5rem' }}>|</span>
          <Link to="/influencer-dashboard" style={{ color: 'var(--text-dim)', textDecoration: 'none' }} className="hover-fire">
            <i className="fa-solid fa-users"></i> Influencer Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
