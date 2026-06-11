import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function CartSidebar() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQty,
    clearCart,
    cartTotal
  } = useCart();

  const handleClose = () => setCartOpen(false);

  return (
    <>
      <div 
        className={`cart-overlay ${cartOpen ? 'open' : ''}`} 
        onClick={handleClose}
      />
      <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2><i className="fa-solid fa-cart-shopping"></i> Your Cart</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="icon">🛒</span>
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img 
                  className="cart-thumb-img" 
                  src={item.image} 
                  alt={item.name} 
                />
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>{item.price.toLocaleString()} Rwf each</p>
                </div>
                <div className="cart-item-right">
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <span className="item-price">{(item.price * item.qty).toLocaleString()} Rwf</span>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row grand">
              <span>Total</span>
              <span>{cartTotal().toLocaleString()} Rwf</span>
            </div>
            <Link 
              to="/order" 
              className="btn btn-fire btn-block" 
              onClick={handleClose}
              style={{ marginTop: '0.8rem' }}
            >
              Continue to Order →
            </Link>
            <button 
              className="btn btn-dark btn-block" 
              style={{ marginTop: '0.6rem' }} 
              onClick={clearCart}
            >
              <i className="fa-solid fa-trash-can"></i> Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
