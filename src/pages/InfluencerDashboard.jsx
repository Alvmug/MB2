import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function InfluencerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Dashboard states
  const [influencerData, setInfluencerData] = useState(null);
  const [earningsStats, setEarningsStats] = useState({
    totalEarnings: 0,
    totalOrders: 0,
    commissionRate: 10,
    refCode: ''
  });
  
  const [conversions, setConversions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  
  // Dialog / Toast states
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });
  const [toastShow, setToastShow] = useState(false);

  const triggerToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setToastShow(true);
    setTimeout(() => setToastShow(false), 3500);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          
          if (idTokenResult.claims.role !== 'influencer') {
            triggerToast('Unauthorized access. Profile is not an approved partner.', 'error');
            await signOut(auth);
            setUser(null);
            setLoading(false);
            return;
          }

          setUser(currentUser);
          
          // Load profile document
          const docRef = doc(db, 'influencers', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setInfluencerData(data);
            
            // Set base stats
            setEarningsStats(prev => ({
              ...prev,
              commissionRate: data.commissionRate || 10,
              refCode: data.refCode || ''
            }));
            
            // Fetch earnings, conversions and withdrawals
            fetchPartnerData(data.refCode, currentUser.uid);
          }
        } catch (err) {
          console.error('Auth state validation error:', err);
          triggerToast('Error validating profile.', 'error');
        }
      } else {
        setUser(null);
        setInfluencerData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchPartnerData = async (refCode, uid) => {
    if (!refCode) return;
    
    try {
      // 1. Fetch referral earnings from API
      const res = await fetch(`/api/influencer/earnings/${refCode}`);
      const data = await res.json();
      
      if (data.status === 'success') {
        setEarningsStats(prev => ({
          ...prev,
          totalEarnings: data.storedEarnings ?? data.earnings ?? 0,
          totalOrders: data.storedOrders ?? data.totalOrders ?? 0,
        }));
        
        setConversions(data.orders || []);
      }
    } catch (e) {
      console.warn('API earnings fetch failed, falling back to Firestore search', e);
    }

    try {
      // 2. Fetch withdrawal requests from Firestore
      const wQuery = query(
        collection(db, 'withdrawals'), 
        where('influencerId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const wSnap = await getDocs(wQuery);
      const list = [];
      wSnap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setWithdrawals(list);
    } catch (e) {
      console.error('Withdrawals fetch failed', e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) {
      triggerToast('Please input email and password.', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPass);
      triggerToast('Dashboard unlocked!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Authentication failed: ' + err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      triggerToast('Signed out successfully.', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  const copyRefLink = () => {
    const link = `${window.location.origin}/?ref=${earningsStats.refCode}`;
    navigator.clipboard.writeText(link).then(() => {
      triggerToast('Referral link copied to clipboard!', 'success');
    });
  };

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 1000) {
      triggerToast('Minimum payout is 1,000 Rwf.', 'error');
      return;
    }
    if (!withdrawPhone) {
      triggerToast('Please provide your payout mobile money phone number.', 'error');
      return;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      triggerToast('Submitting payout request...', 'info');

      const res = await fetch('/api/influencer/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: Number(withdrawAmount), 
          paymentDetails: withdrawPhone,
          paymentMethod: 'Mobile Money'
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        triggerToast('Payout request submitted successfully! Pending review.', 'success');
        setWithdrawAmount('');
        // Refresh dashboard data
        fetchPartnerData(earningsStats.refCode, auth.currentUser.uid);
      } else {
        triggerToast(data.message || 'Payout request failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Withdrawal connection failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          <i className="fa-solid fa-spinner fa-spin fa-3x" style={{ color: 'var(--fire)' }}></i>
          <p style={{ marginTop: '1.2rem', fontWeight: 600 }}>Loading partner session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER BAR */}
      <nav style={{ background: 'rgba(15,15,15,0.7)', borderBottom: '1px solid var(--border-color)', boxShadow: 'none' }}>
        <div className="logo">
          <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <span>MAD PARTNER</span>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 700 }}>
              {influencerData?.name || user.email}
            </span>
            <button 
              onClick={handleLogout} 
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.1rem', cursor: 'pointer' }}
              className="hover-fire"
            >
              <i className="fa-solid fa-power-off"></i>
            </button>
          </div>
        )}
      </nav>

      {/* DASHBOARD ROUTING PANELS */}
      {!user ? (
        /* LOGIN MODE */
        <section style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '3rem 1.5rem',
          background: 'radial-gradient(circle at center, hsla(16, 100%, 50%, 0.05) 0%, black 100%)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(15, 15, 15, 0.75)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            boxShadow: '0 30px 80px rgba(0,0,0,0.7)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.4rem' }}>Welcome Back</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Sign in to your influencer dashboard</p>
            </div>
            
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Secret Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-fire btn-block"
                style={{ padding: '0.95rem', borderRadius: '14px', fontSize: '1.05rem', marginTop: '1.5rem' }}
                disabled={authLoading}
              >
                {authLoading ? (
                  <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i> Authenticating...</>
                ) : (
                  'Unlock Dashboard'
                )}
              </button>
            </form>
            
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
              Don't have a partner account?{' '}
              <Link to="/influencer" style={{ color: 'var(--fire)', fontWeight: 700 }}>
                Apply Today
              </Link>
            </p>
          </div>
        </section>
      ) : (
        /* DASHBOARD MODE */
        <section className="section" style={{ flex: 1, padding: '3rem 1.5rem' }}>
          <div className="section-inner" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Stats grid banner */}
            <div className="stats-grid">
              <div className="stat-card" style={{ borderBottom: '4px solid var(--fire)' }}>
                <span className="label">Total Earnings</span>
                <span className="value">{(earningsStats.totalEarnings).toLocaleString()} Rwf</span>
                <span className="trend up" style={{ fontSize: '0.75rem' }}>
                  <i className="fa-solid fa-circle-check"></i> READY FOR WITHDRAWAL
                </span>
              </div>
              
              <div className="stat-card">
                <span className="label">Successful Referrals</span>
                <span className="value">{earningsStats.totalOrders}</span>
                <span className="trend" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Total orders from your link
                </span>
              </div>
              
              <div className="stat-card">
                <span className="label">Commission Rate</span>
                <span className="value">{earningsStats.commissionRate}%</span>
                <span className="trend" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Fixed percentage rate per order
                </span>
              </div>
              
              <div className="stat-card" style={{ background: 'rgba(255, 69, 0, 0.05)', borderColor: 'rgba(255, 69, 0, 0.2)' }}>
                <span className="label" style={{ color: 'var(--fire)' }}>Your Referral Code</span>
                <span className="value" style={{ color: 'var(--fire)', fontFamily: 'monospace' }}>{earningsStats.refCode}</span>
                <button 
                  onClick={copyRefLink} 
                  className="btn btn-fire btn-sm"
                  style={{ width: '100%', padding: '0.45rem', borderRadius: '10px', fontSize: '0.75rem', textTransform: 'uppercase' }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* Conversions grid */}
            <div className="contact-layout" style={{ gridTemplateColumns: '2fr 1.2fr', maxWidth: '100%' }}>
              
              {/* Recent referred sales */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Conversions</h4>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '20px', color: 'var(--text-dim)' }}>
                    LIVE FEED
                  </span>
                </div>
                
                <div className="table-container">
                  {conversions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
                      <i className="fa-solid fa-ghost" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}></i>
                      <p style={{ fontWeight: 700 }}>No conversions recorded yet.</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Share your link to begin earning!</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Order Date</th>
                          <th>Amount</th>
                          <th>Your Cut</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversions.map((o, index) => {
                          const date = o.orderedAt || o.createdAt;
                          const formattedDate = date ? new Date(date).toLocaleDateString() : '—';
                          const commission = o.commissionAmount ?? Math.round((o.amount || 0) * earningsStats.commissionRate / 100);
                          return (
                            <tr key={index}>
                              <td>{formattedDate}</td>
                              <td style={{ fontWeight: 700 }}>{(o.amount || 0).toLocaleString()} Rwf</td>
                              <td style={{ fontWeight: 700, color: 'var(--success)' }}>{commission.toLocaleString()} Rwf</td>
                              <td>
                                <span className="badge-status status-paid">Paid</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Withdraw request card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-box">
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.5rem' }}>
                    Request Payout
                  </h4>
                  
                  <form onSubmit={submitWithdrawal}>
                    <div className="form-group">
                      <label>Amount (Rwf)</label>
                      <input 
                        type="number" 
                        placeholder="Min 1,000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Money Number</label>
                      <input 
                        type="tel" 
                        placeholder="07XXXXXXXX"
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value)}
                        required
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-fire btn-block" style={{ marginTop: '0.5rem', borderRadius: '12px' }}>
                      Request Payout
                    </button>
                  </form>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
                    Payments are processed within 24-48 hours.
                    <br />
                    Minimum threshold is 1,000 Rwf.
                  </p>
                </div>

                {/* Withdraw History List */}
                <div className="form-box" style={{ padding: '1.5rem' }}>
                  <h5 style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    Payout History
                  </h5>
                  {withdrawals.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No withdrawal logs found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {withdrawals.map((w, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '0.4rem 0', borderBottom: '1px solid hsl(0,0%,10%)' }}>
                          <div>
                            <span style={{ fontWeight: 700 }}>{w.amount.toLocaleString()} Rwf</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{w.paymentDetails}</div>
                          </div>
                          <span className={`badge-status status-${w.status}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                            {w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </section>
      )}

      {/* DYNAMIC TOASTS */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 2000,
        transform: toastShow ? 'translateY(0)' : 'translateY(100px)',
        opacity: toastShow ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: toastShow ? 'auto' : 'none',
        background: 'var(--card-color)',
        border: `1px solid ${toastMsg.type === 'error' ? 'var(--error)' : toastMsg.type === 'info' ? 'var(--gold)' : 'var(--success)'}`,
        padding: '1.2rem 1.8rem',
        borderRadius: '14px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
        fontWeight: 600,
        fontSize: '0.95rem',
        color: toastMsg.type === 'error' ? 'var(--error)' : toastMsg.type === 'info' ? 'var(--gold)' : 'var(--success)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>{toastMsg.type === 'error' ? '❌' : toastMsg.type === 'info' ? 'ℹ️' : '🔥'}</span>
        <span>{toastMsg.text}</span>
      </div>
    </div>
  );
}
