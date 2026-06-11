import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toast, closeToast } = useCart();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        closeToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, closeToast]);

  if (!toast.show) return null;

  const toastType = toast.type || 'success'; // 'success' | 'error' | 'info'

  return (
    <div className={`toast show ${toastType}`}>
      <span className="toast-emoji">
        {toastType === 'success' ? '🔥' : toastType === 'error' ? '❌' : 'ℹ️'}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}
