import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export default function InfluencerRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [social, setSocial] = useState('');
  const [bio, setBio] = useState('');
  
  const [formErr, setFormErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setFormErr('Name, email and phone number are required.');
      return;
    }
    setFormErr('');
    setSubmitting(true);

    try {
      // Check for duplicate application email in Firestore
      try {
        const q = query(collection(db, 'influencer_applications'), where('email', '==', email.trim().toLowerCase()));
        const existing = await getDocs(q);
        if (!existing.empty) {
          setFormErr('An application with this email address already exists.');
          setSubmitting(false);
          return;
        }
      } catch (readErr) {
        // Read blocked by security rules, safe to skip duplicate check and submit
      }

      await addDoc(collection(db, 'influencer_applications'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        social: social.trim(),
        bio: bio.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setFormErr('Submission failed. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="inf-hero">
        <div>
          <h1>Become a <span className="t-fire">Mad Burning</span><br />Influencer</h1>
          <p>Earn commissions by sharing your unique referral link. Every order from your audience = money in your pocket.</p>
        </div>
      </div>

      <div className="inf-section">
        <div className="perks-grid">
          <div className="perk-card">
            <i className="fa-solid fa-fire"></i>
            <h4>Earn Commission</h4>
            <p>Get paid for every order from your link</p>
          </div>
          <div className="perk-card">
            <i className="fa-solid fa-link"></i>
            <h4>Unique Link</h4>
            <p>Your own referral link to share anywhere</p>
          </div>
          <div className="perk-card">
            <i className="fa-solid fa-chart-line"></i>
            <h4>Track Orders</h4>
            <p>See all orders from your audience live</p>
          </div>
          <div className="perk-card">
            <i className="fa-solid fa-mobile-screen"></i>
            <h4>Dashboard</h4>
            <p>Personal dashboard to track earnings</p>
          </div>
        </div>

        {!success ? (
          <div className="form-box">
            <h2><i className="fa-solid fa-user-plus" style={{ color: 'var(--fire)', marginRight: '0.5rem' }}></i> Apply Now</h2>
            {formErr && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {formErr}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  placeholder="07X XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Instagram / TikTok / YouTube Link</label>
                <input 
                  type="text" 
                  placeholder="https://instagram.com/yourhandle"
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Why do you want to partner with Mad Burning?</label>
                <textarea 
                  rows="3" 
                  placeholder="Tell us about yourself and your audience..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-fire btn-block"
                disabled={submitting}
              >
                {submitting ? (
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
          <div className="success-banner" style={{ display: 'block' }}>
            <i className="fa-solid fa-circle-check"></i>
            <h3>Application Submitted!</h3>
            <p>We've received your application. Our team will review it and send your referral link and credentials to your email within 24 hours.</p>
            <Link to="/" className="btn btn-fire" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              Back to Home
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Already an influencer?{' '}
            <Link to="/influencer-dashboard" style={{ color: 'var(--fire)', fontWeight: 700 }}>
              Login to your dashboard →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
