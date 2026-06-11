import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function Menu() {
  const { menu, menuLoading, addToCart, resolveProductImage } = useCart();
  const [activeTab, setActiveTab] = useState('CHICKEN');
  const [searchQuery, setSearchQuery] = useState('');

  // Read set category from Home promotions click
  useEffect(() => {
    const savedCat = localStorage.getItem('openCat');
    if (savedCat) {
      setActiveTab(savedCat);
      localStorage.removeItem('openCat');
    }
  }, []);

  if (menuLoading) {
    return (
      <div className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          <i className="fa-solid fa-spinner fa-spin fa-3x" style={{ color: 'var(--fire)' }}></i>
          <p style={{ marginTop: '1.2rem', fontWeight: 600 }}>Firing up the engines...</p>
        </div>
      </div>
    );
  }

  // Get categories list
  const categories = Object.keys(menu || {});

  // Get active tab items and filter by search query
  const rawItems = menu[activeTab] || [];
  const filteredItems = rawItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCategoryName = (name) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  return (
    <div className="section" style={{
      background: 'linear-gradient(rgba(10,10,10,0.92), rgba(10,10,10,0.92)), url("/assets/menu.PNG?v=1") center center / cover no-repeat fixed',
      minHeight: '80vh'
    }}>
      <div className="section-inner">
        <h2 className="section-title center">Our Flame-Grilled <span>Menu</span></h2>

        {/* Search bar */}
        <div style={{ 
          maxWidth: '500px', 
          margin: '0 auto 2.5rem', 
          position: 'relative'
        }}>
          <i className="fa-solid fa-magnifying-glass" style={{
            position: 'absolute',
            left: '1.2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}></i>
          <input 
            type="text" 
            placeholder="Search our delicious items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(10, 10, 10, 0.85)',
              border: '2px solid var(--border-color)',
              color: 'var(--text-color)',
              padding: '0.9rem 1.2rem 0.9rem 3.2rem',
              borderRadius: '30px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.25s, box-shadow 0.25s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--fire)';
              e.target.style.boxShadow = '0 0 15px var(--fire-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Tab Controls */}
        <div className="cat-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn ${activeTab === cat ? 'btn-fire' : 'btn-dark'}`}
              onClick={() => {
                setActiveTab(cat);
                setSearchQuery('');
              }}
              style={{ padding: '0.65rem 1.6rem', fontSize: '0.9rem', textTransform: 'capitalize' }}
            >
              {formatCategoryName(cat)}
            </button>
          ))}
        </div>

        {/* Grid Display */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🍔</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>No items found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try searching for something else in this category!</p>
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => (
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
                        + Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
