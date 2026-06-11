import React from 'react';

export default function About() {
  return (
    <div>
      {/* ABOUT HERO */}
      <div className="about-hero">
        <span className="big-emoji"><i className="fa-solid fa-fire"></i></span>
        <h1>Born from <span className="t-fire">Fire</span>.<br />Built for <span className="t-gold">Flavor</span>.</h1>
        <p>Mad Burning started with one obsession — making the most insanely delicious burgers on the planet. We smash, we sear, we stack, and we never compromise on flavor.</p>
      </div>

      {/* OUR STORY */}
      <div className="section section-dark">
        <div className="section-inner" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 className="section-title center">Our <span>Story</span></h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.9, marginBottom: '1.5rem' }}>
            It started in a tiny kitchen in 2025. Two friends, and a dangerous obsession with the perfect burger. Word spread fast. The line outside the door grew longer. The flavors got bolder.
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', lineHeight: 1.9 }}>
            Today, Mad Burning is the go-to spot for anyone who wants real food with real heat. Every patty is fresh-ground daily. Every sauce is made in-house. Every bite is designed to make you come back for more.
          </p>
        </div>
      </div>

      {/* VALUES */}
      <div className="section">
        <div className="section-inner">
          <h2 className="section-title center">What We <span>Stand For</span></h2>
          <div className="values-grid">
            <div className="value-card">
              <span className="icon"><i className="fa-solid fa-drumstick-bite"></i></span>
              <h3>Fresh Daily</h3>
              <p>All patties are made fresh every morning. No frozen, no shortcuts, ever.</p>
            </div>
            <div className="value-card">
              <span className="icon"><i className="fa-solid fa-bolt"></i></span>
              <h3>Fast & Hot</h3>
              <p>Grab your order in 30 minutes or get it delivered straight to your door.</p>
            </div>
            <div className="value-card">
              <span className="icon"><i className="fa-solid fa-heart"></i></span>
              <h3>Made with Love</h3>
              <p>Every order is treated like it's going to our own family. That's the Mad Burning promise.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TEAM */}
      <div className="section section-dark">
        <div className="section-inner">
          <h2 className="section-title center">Meet the <span>Team</span></h2>
          <div className="team-grid">
            <div className="team-card">
              <span className="team-avatar"><i className="fa-solid fa-user-tie"></i></span>
              <h3>I.Patrick</h3>
              <p>Founder</p>
            </div>
            <div className="team-card">
              <span className="team-avatar"><i className="fa-solid fa-wand-magic-sparkles"></i></span>
              <h3>NG.Fidele</h3>
              <p>Co-Founder</p>
            </div>
            <div className="team-card">
              <span className="team-avatar"><i className="fa-solid fa-fire-burner"></i></span>
              <h3>N.Jean Paul</h3>
              <p>Chef</p>
            </div>
            <div className="team-card">
              <span className="team-avatar"><i className="fa-solid fa-user-gear"></i></span>
              <h3>Leila Chen</h3>
              <p>Operations Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
