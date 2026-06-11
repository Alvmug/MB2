import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const FALLBACK_MENU = {
  CHICKEN: [
    { id: 1, name: 'Chicken Burger', price: 3500, badge: 'hot', image: 'assets/Chicken Burger.PNG' },
    { id: 2, name: 'Chicken Burger & Chips', price: 4000, badge: null, image: 'assets/Chicken Burger & Chips.PNG' },
    { id: 3, name: 'Double Chicken Burger&Chips', price: 5000, badge: 'popular', image: 'assets/Double Chicken Burger& Chips.PNG' },
    { id: 4, name: 'Chicken Fries', price: 3000, badge: null, image: 'assets/Chicken Fries.PNG' },
    { id: 5, name: 'Omelette Burger & Chips', price: 3000, badge: 'new', image: 'assets/Omelette Burger & Chips.PNG' }
  ],
  BOX_CHICKEN: [
    { id: 19, name: 'Chicken Burger & Chips & Fanta', price: 5200, badge: null, image: 'assets/Chicken Burger & Chips & Fanta.PNG' },
    { id: 20, name: 'Double Chicken Burger & Chips & Fanta', price: 6200, badge: 'popular', image: 'assets/Double Chicken Burger& Chips & Fanta.PNG' },
    { id: 21, name: 'Chicken Fries & Fanta', price: 4200, badge: 'new', image: 'assets/Chicken Fries & Fanta.PNG' }
  ],
  BEEF: [
    { id: 7, name: 'Beef Burger', price: 3000, badge: 'popular', image: 'assets/Beef Burger.PNG' },
    { id: 8, name: 'Beef Burger & Chips', price: 3500, badge: null, image: 'assets/Beef Burger & Chips.PNG' },
    { id: 9, name: 'Double Beef Burger & Chips', price: 4500, badge: 'hot', image: 'assets/Double Beef Burger & Chips.PNG' },
    { id: 10, name: 'Beef Fries', price: 2500, badge: 'new', image: 'assets/Beef Fries.PNG' }
  ],
  BOX_BEEF: [
    { id: 22, name: 'Beef Burger & Chips & Fanta', price: 4700, badge: null, image: 'assets/Beef Burger & Chips & Fanta.PNG' },
    { id: 23, name: 'Double Beef Burger & Chips & Fanta', price: 5700, badge: null, image: 'assets/Double Beef Burger & Chips & Fanta.PNG' },
    { id: 24, name: 'Beef Fries & Fanta', price: 3700, badge: 'new', image: 'assets/Beef Fries & Fanta.PNG' }
  ],
  Extras: [
    { id: 14, name: 'Sauces', price: 1000, badge: 'new', image: 'assets/Sauces.jpeg' },
    { id: 15, name: 'Cheese', price: 500, badge: null, image: 'assets/Cheese.png' },
    { id: 16, name: 'Fanta', price: 1200, badge: null, image: 'assets/Fanta.PNG' },
    { id: 17, name: 'Chips', price: 2000, badge: 'new', image: 'assets/Chips.jpeg' }
  ],
  Promotion: [
    { id: 25, name: '2 Burgers & 2 Chips', price: 6000, badge: 'hot', image: 'assets/2 Beef Burger & 2 Chips.PNG' },
    { id: 26, name: '2 Chicken Burger & 2 Chips', price: 7000, badge: 'popular', image: 'assets/2 Chicken Burger & 2 Chips.PNG' },
    { id: 27, name: '4 Beef Burger & 4 Chips', price: 10000, badge: 'new', image: 'assets/4 Beef Burger & 4 Chips.PNG' },
    { id: 28, name: '4 Chicken Burger & 4 Chips', price: 12000, badge: 'new', image: 'assets/4 Chicken Burger & 4 Chips.PNG' }
  ]
};

const STATIC_IMAGE_ASSETS = [
  { "name": "2 Beef Burger & 2 Chips", "file": "assets/2 Beef Burger & 2 Chips.PNG" },
  { "name": "2 Chicken Burger & 2 Chips", "file": "assets/2 Chicken Burger & 2 Chips.PNG" },
  { "name": "4 Beef Burger & 4 Chips", "file": "assets/4 Beef Burger & 4 Chips.PNG" },
  { "name": "4 Chicken Burger & 4 Chips", "file": "assets/4 Chicken Burger & 4 Chips.PNG" },
  { "name": "Beef Burger", "file": "assets/Beef Burger.PNG" },
  { "name": "Beef Burger & Chips", "file": "assets/Beef Burger & Chips.PNG" },
  { "name": "Beef Burger & Chips & Fanta", "file": "assets/Beef Burger & Chips & Fanta.PNG" },
  { "name": "Beef Fries", "file": "assets/Beef Fries.PNG" },
  { "name": "Beef Fries & Fanta", "file": "assets/Beef Fries & Fanta.PNG" },
  { "name": "Cheese", "file": "assets/Cheese.png" },
  { "name": "Chicken Burger", "file": "assets/Chicken Burger.PNG" },
  { "name": "Chicken Burger & Chips", "file": "assets/Chicken Burger & Chips.PNG" },
  { "name": "Chicken Burger & Chips & Fanta", "file": "assets/Chicken Burger & Chips & Fanta.PNG" },
  { "name": "Chicken Fries", "file": "assets/Chicken Fries.PNG" },
  { "name": "Chicken Fries & Fanta", "file": "assets/Chicken Fries & Fanta.PNG" },
  { "name": "Chips", "file": "assets/Chips.jpeg" },
  { "name": "Double Beef Burger & Chips", "file": "assets/Double Beef Burger & Chips.PNG" },
  { "name": "Double Beef Burger & Chips & Fanta", "file": "assets/Double Beef Burger & Chips & Fanta.PNG" },
  { "name": "Double Chicken Burger& Chips", "file": "assets/Double Chicken Burger& Chips.PNG" },
  { "name": "Double Chicken Burger& Chips & Fanta", "file": "assets/Double Chicken Burger& Chips & Fanta.PNG" },
  { "name": "Fanta", "file": "assets/Fanta.PNG" },
  { "name": "Omelette Burger & Chips", "file": "assets/Omelette Burger & Chips.PNG" },
  { "name": "Sauces", "file": "assets/Sauces.jpeg" }
];

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('mb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [menu, setMenu] = useState({});
  const [productImages, setProductImages] = useState(STATIC_IMAGE_ASSETS);
  const [menuLoading, setMenuLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('mb_cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (message) => {
    setToast({ show: true, message });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const normalizeProductKey = (value) => {
    return String(value || '')
      .replace(/\.(png|jpe?g|webp|avif)$/i, '')
      .replace(/&/g, ' and ')
      .replace(/[_-]+/g, ' ')
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .toLowerCase();
  };

  const PRODUCT_IMAGE_ALIASES = {
    '2 burgers and 2 chips': '2 beef burger and 2 chips',
    '2 burger and 2 chips': '2 beef burger and 2 chips'
  };

  const resolveProductImage = (productName, defaultImage) => {
    const productKey = normalizeProductKey(productName);
    const lookupKey = PRODUCT_IMAGE_ALIASES[productKey] || productKey;
    const compactLookupKey = lookupKey.replace(/\s+/g, '');

    const exact = productImages.find(asset => normalizeProductKey(asset.name || asset.file) === lookupKey);
    if (exact) return exact.file;

    const compact = productImages.find(asset => normalizeProductKey(asset.name || asset.file).replace(/\s+/g, '') === compactLookupKey);
    if (compact) return compact.file;

    return defaultImage || 'assets/mad_burning_logo_final.png';
  };

  const loadMenu = async () => {
    setMenuLoading(true);

    const fetchWithTimeout = async (url, options = {}) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    try {
      // Try to load images list with 5s timeout
      const imgRes = await fetchWithTimeout('/api/product-images');
      if (imgRes.ok) {
        const imgs = await imgRes.json();
        if (Array.isArray(imgs) && imgs.length) {
          setProductImages(imgs);
        }
      }
    } catch (e) {
      console.warn('Could not load dynamic product images, using static fallback.', e);
    }

    try {
      const response = await fetchWithTimeout('/api/menu');
      if (!response.ok) throw new Error('Menu server error');
      const data = await response.json();
      
      const isValidMenu = data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).some(k => Array.isArray(data[k]));
      if (isValidMenu) {
        setMenu(data);
      } else {
        setMenu(FALLBACK_MENU);
      }
    } catch (error) {
      console.warn('Failed to load remote menu, using fallback menu', error);
      setMenu(FALLBACK_MENU);
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const addToCart = (product) => {
    if (product.inStock === false) {
      showToast(`${product.name} is out of stock!`);
      return;
    }
    setCart((prevCart) => {
      const existing = prevCart.find((item) => String(item.id) === String(product.id));
      if (existing) {
        showToast(`${product.name} quantity updated!`);
        return prevCart.map((item) =>
          String(item.id) === String(product.id) ? { ...item, qty: item.qty + 1 } : item
        );
      }
      showToast(`${product.name} added to cart!`);
      return [...prevCart, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: resolveProductImage(product.name, product.image),
        qty: 1
      }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => String(item.id) !== String(id)));
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (String(item.id) === String(id)) {
          const newQty = item.qty + delta;
          return newQty <= 0 ? null : { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
    showToast('Cart cleared!');
  };

  const cartTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = () => cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        menu,
        menuLoading,
        toast,
        cartOpen,
        setCartOpen,
        showToast,
        closeToast,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartTotal,
        cartCount,
        resolveProductImage,
        loadMenu
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
