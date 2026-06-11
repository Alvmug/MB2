import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Home() {
  const { menu, menuLoading, addToCart, resolveProductImage } = useCart();
  const navigate = useNavigate();

  // Influencer app form state
  const [infName, setInfName] = useState('');
  const [infEmail, setInfEmail] = useState('');
  const [infInsta, setInfInsta] = useState('');
  const [formErr, setFormErr] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Testimonials and Featured items
  const [testimonials, setTestimonials] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);

  useEffect(() => {
    // Load local storage community testimonials
    try {
      const savedMsgs = localStorage.getItem('mb_messages');
      if (savedMsgs) {
        setTestimonials(JSON.parse(savedMsgs));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (menuLoading || !menu || Object.keys(menu).length === 0) return;

    // Resolve featured items
    const allItems = Object.values(menu).flat();
    const promotionItems = Array.isArray(menu.Promotion) && menu.Promotion.length
      ? menu.Promotion
      : allItems.filter(item => item.badge === 'hot' || item.badge === 'popular');

    // Pick 2 random items
    const selectRandom = (arr, count) => {
      const pool = [...arr];
      const selected = [];
      while (pool.length && selected.length < count) {
        const index = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(index, 1)[0]);
      }
      return selected;
    };

    setFeaturedItems(selectRandom(promotionItems, 2));
  }, [menu, menuLoading]);

  // Capture referral code if in query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('mb_ref', ref.trim().toUpperCase());
    }
  }, []);

  const handlePromotionClick = (e) => {
    e.preventDefault();
    localStorage.setItem('openCat', 'Promotion');
    navigate('/menu');
  };

  const submitInfluencerApp = async (e) => {
    e.preventDefault();
    if (!infName || !infEmail || !infInsta) {
      setFormErr('All fields are required.');
      return;
    }
    setFormErr('');
    setFormSubmitting(true);

    try {
      // 1. Submit application to Firestore
      await addDoc(collection(db, 'influencer_applications'), {
        name: infName,
        email: infEmail,
        instagram: infInsta,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Call web3forms email notification API
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '50a45877-21bd-48ee-bbec-75e256bdcb84',
          subject: 'Mad Burning — New Influencer Application',
          from_name: infName,
          email: infEmail,
          to: 'madburning49@gmail.com',
          message: `New influencer application:\n\nName: ${infName}\nEmail: ${infEmail}\nAccount: ${infInsta}`,
          replyto: infEmail
        })
      }).catch(() => {});

      setFormSuccess(true);
    } catch (e) {
      console.error('Submission error:', e);
      setFormErr('Submission failed. Please check your connection and try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div>
      {/* HERO SECTION */}
      <div className="hero">
        <div className="hero-content">
          <div className="hero-flame">
            <div className="yuyu-wrap">
              <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning logo" className="yuyu-img" />
            </div>
          </div>
          <h1>
            <span className="t-fire">MAD</span>
            <br />
            <span className="t-gold">BURNING</span>
          </h1>
          <p style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: 'var(--fire)',
            letterSpacing: '2px',
            marginTop: '-0.5rem',
            marginBottom: '0.5rem',
            textShadow: '0 0 20px rgba(227, 24, 55, 0.4)',
            fontWeight: 400,
            textTransform: 'uppercase'
          }}>
            Fast Food
          </p>
          <p className="hero-sub">
            Burgers so good, they're dangerously addictive.
            <br />
            Order online. Grab & go or get it delivered.
          </p>
          
          <div className="hero-btns">
            <Link to="/menu" className="btn btn-fire">
              <i className="fa-solid fa-burger"></i> See Full Menu
            </Link>
            <Link to="/order" className="btn btn-outline">
              <i className="fa-solid fa-box"></i> Order Now
            </Link>
            <a href="#promotion" className="btn-promo-hero" onClick={handlePromotionClick}>
              <span className="btn-promo-fire"><i className="fa-solid fa-fire"></i></span>
              <span className="btn-promo-text">Hot Promotions</span>
              <span className="btn-promo-badge">NEW</span>
            </a>
          </div>
        </div>
      </div>

      {/* FEATURED / FAN FAVORITES */}
      <div className="section">
        <div className="section-inner">
          <h2 className="section-title center">
            <i className="fa-solid fa-fire" style={{ color: 'var(--fire)', marginRight: '0.5rem' }}></i>
            <span>Fan Favorites</span>
          </h2>
          
          {menuLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p style={{ marginTop: '1rem' }}>Igniting the grill...</p>
            </div>
          ) : (
            <div className="menu-grid">
              {featuredItems.map((item) => (
                <div className="menu-card" key={item.id}>
                  <div className="menu-card-thumb">
                    <img 
                      src={resolveProductImage(item.name, item.image)} 
                      alt={item.name} 
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
                    }}></div>
                    {item.badge && (
                      <span className={`badge badge-${item.badge.toLowerCase()}`}>
                        {item.badge.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="menu-card-body">
                    <h3>{item.name}</h3>
                    <div className="menu-card-footer">
                      <span className="price">{item.price.toLocaleString()} Rwf</span>
                      {item.inStock === false ? (
                        <button className="add-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                          Sold Out
                        </button>
                      ) : (
                        <button className="add-btn" onClick={() => addToCart(item)}>
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/menu" className="btn btn-fire">View Full Menu →</Link>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section section-dark">
        <div className="section-inner">
          <h2 className="section-title center">How It <span>Works</span></h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-icon"><i className="fa-solid fa-mobile-screen-button"></i></div>
              <h3>Browse Menu</h3>
              <p>Check out our fire menu and pick your favorites</p>
            </div>
            <div className="step">
              <div className="step-icon"><i className="fa-solid fa-cart-shopping"></i></div>
              <h3>Add to Cart</h3>
              <p>Add items and customize your order your way</p>
            </div>
            <div className="step">
              <div className="step-icon"><i className="fa-solid fa-clipboard-list"></i></div>
              <h3>Place Order</h3>
              <p>Fill in your details — grab or delivery, your call</p>
            </div>
            <div className="step">
              <div className="step-icon"><i className="fa-solid fa-fire"></i></div>
              <h3>Enjoy!</h3>
              <p>Get your food hot, fresh, and ready to burn</p>
            </div>
          </div>
        </div>
      </div>

      {/* INFLUENCER APPLICATION */}
      <div className="section" id="influencer-apply" style={{
        background: 'linear-gradient(135deg,#0a0a0a 0%,#1a0500 50%,#0a0a0a 100%)'
      }}>
        <div className="section-inner" style={{ maxWidth: '780px' }}>
          <h2 className="section-title center">
            <i className="fa-solid fa-fire" style={{ color: 'var(--fire)', marginRight: '0.5rem' }}></i>
            Become a <span>Mad Burning</span> Influencer
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '1rem' }}>
            Earn commissions by sharing your unique referral link. Every order from your audience = money in your pocket.
          </p>

          <div className="perks-grid">
            <div className="perk-card">
              <i className="fa-solid fa-fire"></i>
              <strong>Earn Commission</strong>
              <p>Get paid per order</p>
            </div>
            <div className="perk-card">
              <i className="fa-solid fa-link"></i>
              <strong>Unique Link</strong>
              <p>Your own referral link</p>
            </div>
            <div className="perk-card">
              <i className="fa-solid fa-chart-line"></i>
              <strong>Track Orders</strong>
              <p>Live order dashboard</p>
            </div>
            <div className="perk-card">
              <i className="fa-solid fa-money-bill-wave"></i>
              <strong>Real Earnings</strong>
              <p>Track your income</p>
            </div>
          </div>

          {!formSuccess ? (
            <div className="form-box" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-color)' }}>
                <i className="fa-solid fa-user-plus" style={{ color: 'var(--fire)', marginRight: '0.5rem' }}></i>
                Apply Now — It's Free
              </h3>
              {formErr && (
                <div className="alert alert-error">{formErr}</div>
              )}
              <form onSubmit={submitInfluencerApp}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="Your full name"
                    value={infName}
                    onChange={(e) => setInfName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    placeholder="you@example.com"
                    value={infEmail}
                    onChange={(e) => setInfEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Influencer Account (Instagram / TikTok / YouTube) *</label>
                  <input 
                    type="text" 
                    placeholder="https://instagram.com/yourhandle or @yourhandle"
                    value={infInsta}
                    onChange={(e) => setInfInsta(e.target.value)}
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-fire btn-block" 
                  disabled={formSubmitting}
                  style={{ marginTop: '0.5rem', fontSize: '1rem' }}
                >
                  {formSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                      Submit Application
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              background: '#161616',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '20px',
              padding: '3rem 2rem'
            }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '3rem', color: '#22c55e', display: 'block', marginBottom: '1rem' }}></i>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Application Submitted!</h3>
              <p style={{ color: 'var(--text-dim)' }}>
                We've received your application. Our team will review it and send your referral link to your email within 24 hours.
              </p>
              <Link to="/influencer-dashboard" className="btn btn-fire" style={{ marginTop: '1.5rem' }}>
                Go to Dashboard →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* COMMUNITY FEEDBACK / TESTIMONIALS */}
      {testimonials.length > 0 && (
        <div className="section section-dark">
          <div className="section-inner">
            <h2 className="section-title center">What Our <span>Community Says</span></h2>
            <div className="testimonials-grid">
              {testimonials.map((msg, index) => (
                <div className="testimonial-card" key={index}>
                  <div className="stars" style={{ fontSize: '0.8rem', color: 'var(--fire)', marginBottom: '0.4rem' }}>
                    {msg.subject}
                  </div>
                  <p>&ldquo;{msg.message}&rdquo;</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>&mdash; {msg.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
