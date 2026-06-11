import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const pass = sessionStorage.getItem('mb_admin_pass');
    if (pass) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter the administrator password.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth', {
        headers: { 'x-admin-password': password }
      });
      const data = await res.json();

      if (res.status === 200) {
        sessionStorage.setItem('mb_admin_pass', password);
        navigate('/admin');
      } else {
        setErrorMsg(data.message || 'Incorrect password.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to the authentication server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--card-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,.5), 0 0 40px var(--fire-glow)'
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
            MAD ADMIN
          </span>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Admin Sign In
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem', marginBottom: '1.8rem' }}>
          Enter password to access control panel
        </p>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Master Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-fire btn-block" 
            style={{ padding: '0.95rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i> Accessing...</>
            ) : (
              'Unlock Control Panel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
