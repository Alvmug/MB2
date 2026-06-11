import React, { useState } from 'react';

export default function Contact() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const errors = [];

    if (!fname.trim()) errors.push('First name is required.');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('A valid email address is required.');
    }
    if (!subject) errors.push('Please select a subject.');
    if (!message.trim()) errors.push('Message cannot be empty.');

    if (errors.length > 0) {
      setErrorMsg(errors.join(' '));
      setSuccess(false);
      return;
    }

    setErrorMsg('');
    setSuccess(true);

    // Save message to localStorage
    try {
      const savedMessages = JSON.parse(localStorage.getItem('mb_messages') || '[]');
      savedMessages.unshift({
        name: `${fname.trim()} ${lname.trim()}`,
        subject: subject,
        message: message.trim(),
        time: new Date().toLocaleDateString()
      });
      // Limit to last 20 testimonials
      localStorage.setItem('mb_messages', JSON.stringify(savedMessages.slice(0, 20)));
    } catch(err) {
      console.error(err);
    }

    // Reset inputs
    setFname('');
    setLname('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="section">
      <div className="section-inner">
        <h2 className="section-title center">Get In <span>Touch</span></h2>

        <div className="contact-layout">
          {/* FIND US INFO */}
          <div className="form-box">
            <h3 style={{ color: 'var(--gold)', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-location-dot" style={{ marginRight: '0.5rem' }}></i> Find Us
            </h3>
            
            <div className="info-row">
              <span className="icon"><i className="fa-solid fa-location-dot"></i></span>
              <div>
                <h4>Address</h4>
                <p>Kigali – Kanombe Sector</p>
              </div>
            </div>
            
            <div className="info-row">
              <span className="icon"><i className="fa-solid fa-phone"></i></span>
              <div>
                <h4>Phone</h4>
                <p>
                  <a href="tel:0796899214" style={{ color: 'var(--gold)', fontWeight: 700 }}>
                    0796 899 214
                  </a>
                </p>
              </div>
            </div>
            
            <div className="info-row">
              <span className="icon"><i className="fa-solid fa-clock"></i></span>
              <div>
                <h4>Opening Hours</h4>
                <table className="hours-table">
                  <tbody>
                    <tr>
                      <td>Monday – Sunday</td>
                      <td>10:30am – 22:30pm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1.2rem',
              background: '#111',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <a 
                href="https://maps.app.goo.gl/fTZDFHZmhEJsGrwV9" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-fire btn-block"
                style={{ borderRadius: '10px' }}
              >
                <i className="fa-solid fa-map-location-dot" style={{ marginRight: '0.5rem' }}></i>
                View Us on Google Maps
              </a>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.7rem' }}>
                📍 Kigali – Kanombe Sector
              </p>
            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="form-box">
            <h3 style={{ color: 'var(--gold)', marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-envelope" style={{ marginRight: '0.5rem' }}></i> Send a Message
            </h3>

            {success && (
              <div className="alert alert-success">
                <i className="fa-solid fa-circle-check" style={{ marginRight: '0.5rem' }}></i> 
                Message sent successfully! Your feedback will appear on the testimonials list.
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-error">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendMessage}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    placeholder="John"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe"
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="">Select a subject...</option>
                  <option value="★ Feedback ★">Feedback</option>
                  <option value="Order Inquiry">Order Inquiry</option>
                  <option value="Catering Request">Catering Request</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea 
                  rows="5" 
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-fire btn-block">
                Send Message <i className="fa-solid fa-fire" style={{ marginLeft: '0.5rem' }}></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
