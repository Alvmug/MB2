import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const KIGALI_NEIGHBORHOODS = [
  { name: 'Kanombe (Sector Center)', lat: -1.9612, lng: 30.1471 },
  { name: 'Kibagabaga', lat: -1.9333, lng: 30.1222 },
  { name: 'Remera', lat: -1.9583, lng: 30.1215 },
  { name: 'Kimihurura', lat: -1.9531, lng: 30.0822 },
  { name: 'Kiyovu', lat: -1.9500, lng: 30.0600 },
  { name: 'Kicukiro', lat: -1.9833, lng: 30.1000 },
  { name: 'Nyarutarama', lat: -1.9400, lng: 30.1000 },
  { name: 'Gikondo', lat: -1.9680, lng: 30.0750 },
  { name: 'Kagugu', lat: -1.9167, lng: 30.0833 },
  { name: 'Kacyiru', lat: -1.9442, lng: 30.0894 }
];

export default function Order() {
  const { cart, cartTotal, clearCart, resolveProductImage } = useCart();

  // Form states
  const [fname, setFname] = useState('');
  const [fphone, setFphone] = useState('');
  const [orderType, setOrderType] = useState('grab');
  const [faddress, setFaddress] = useState('');
  const [fnotes, setFnotes] = useState('');
  const [freferral, setFreferral] = useState('');
  
  // Geolocation states
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading' | 'granted' | 'denied'
  const [locationErrorMsg, setLocationErrorMsg] = useState('');

  // Interactive Map states & refs
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedZone, setSelectedZone] = useState('');
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Referral code verification states
  const [verifiedReferral, setVerifiedReferral] = useState(null);
  const [influencerName, setInfluencerName] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);
  const [referralMsg, setReferralMsg] = useState({ text: '', color: '' });
  const refDebounce = useRef(null);

  // Form submit / payment modal states
  const [formErr, setFormErr] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payNetwork, setPayNetwork] = useState(''); // 'MTN' | 'AIRTEL'
  const [payPhone, setPayPhone] = useState('');
  const [payError, setPayError] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payLoaderMsg, setPayLoaderMsg] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  // Active checkout stats
  const [currentTxRef, setCurrentTxRef] = useState('');
  const [successState, setSuccessState] = useState(false);
  const [lastOrderInfo, setLastOrderInfo] = useState(null);
  const [countdownText, setCountdownText] = useState('30:00');
  const [countdownPercent, setCountdownPercent] = useState(100);
  const [timerFinished, setTimerFinished] = useState(false);
  
  const verifyInterval = useRef(null);
  const countdownInterval = useRef(null);

  // Geolocation detector
  const requestLocation = (isManual = false) => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationErrorMsg('Geolocation not supported by your browser.');
      return;
    }

    setLocationStatus('loading');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude,
          granted: true,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setCustomerLocation(coords);
        setLocationStatus('granted');
        if (isManual) {
          alert("Location access granted! You can now place your order.");
        }
      },
      (err) => {
        let msg = 'Location access denied.';
        if (err.code === 2) msg = 'Location details unavailable.';
        if (err.code === 3) msg = 'Location request timed out.';
        setLocationStatus('denied');
        setLocationErrorMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
    
    // Auto-fill customer email if logged in
    try {
      const email = localStorage.getItem('mb_user_email');
      if (email && !fname) {
        setFname(email.split('@')[0]);
      }
    } catch(e){}

    // Auto-set referral from localStorage
    const savedRef = localStorage.getItem('mb_ref');
    if (savedRef) {
      setFreferral(savedRef);
      performRealTimeVerify(savedRef);
    }

    // Resume active countdown timer if it exists
    const activeEndTime = localStorage.getItem('mb_active_countdown');
    if (activeEndTime) {
      const now = new Date().getTime();
      const target = new Date(activeEndTime).getTime();
      if (target > now) {
        setSuccessState(true);
        const savedOrders = JSON.parse(localStorage.getItem('mb_orders') || '[]');
        if (savedOrders.length > 0) {
          setLastOrderInfo(savedOrders[0]);
        }
        startCountdown(activeEndTime);
      } else {
        localStorage.removeItem('mb_active_countdown');
      }
    }

    return () => {
      if (verifyInterval.current) clearInterval(verifyInterval.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  // Load Leaflet dynamically when orderType is 'delivery'
  useEffect(() => {
    if (orderType === 'delivery') {
      // Load Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setMapLoaded(true);
        document.body.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    }
  }, [orderType]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (orderType === 'delivery' && mapLoaded && window.L && document.getElementById('map-container')) {
      const defaultLat = customerLocation?.lat || -1.957866;
      const defaultLng = customerLocation?.lng || 30.112702;

      // Initialize map if not yet done
      if (!mapRef.current) {
        const map = window.L.map('map-container').setView([defaultLat, defaultLng], 14);
        
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const flameIcon = window.L.icon({
          iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e31837" width="48px" height="48px"><path d="M12 2c0 0-1.7 3.5-3.3 5.2C7.2 8.8 6 10.7 6 12.8c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.1-1.2-4-2.7-5.6C13.7 5.5 12 2 12 2zm0 13c-1.1 0-2-.9-2-2 0-1 1-2.2 2-3.2 1 1 2 2.2 2 3.2 0 1.1-.9 2-2 2z"/></svg>',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        const marker = window.L.marker([defaultLat, defaultLng], { 
          draggable: true,
          icon: flameIcon
        }).addTo(map);
        marker.bindPopup("Drag me to your exact delivery location! 🔥").openPopup();

        // Update location coordinates on dragend
        marker.on('dragend', () => {
          const newPos = marker.getLatLng();
          setCustomerLocation({
            lat: newPos.lat,
            lng: newPos.lng,
            granted: true,
            accuracy: 0,
            timestamp: new Date().toISOString()
          });
          setLocationStatus('granted');
        });

        // Click map to reposition marker
        map.on('click', (e) => {
          const newPos = e.latlng;
          marker.setLatLng(newPos);
          setCustomerLocation({
            lat: newPos.lat,
            lng: newPos.lng,
            granted: true,
            accuracy: 0,
            timestamp: new Date().toISOString()
          });
          setLocationStatus('granted');
        });

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        // Map is already initialized, just make sure marker and view match state
        if (customerLocation) {
          const currentMarkerPos = markerRef.current.getLatLng();
          if (Math.abs(currentMarkerPos.lat - customerLocation.lat) > 0.0001 || Math.abs(currentMarkerPos.lng - customerLocation.lng) > 0.0001) {
            markerRef.current.setLatLng([customerLocation.lat, customerLocation.lng]);
            mapRef.current.setView([customerLocation.lat, customerLocation.lng]);
          }
        }
      }
    }

    return () => {
      // Clean up map when hidden/unmounted
      if (mapRef.current && (orderType !== 'delivery' || !mapLoaded)) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [orderType, mapLoaded, customerLocation?.lat, customerLocation?.lng]);

  // Center map when zone changes
  const handleZoneChange = (e) => {
    const zoneIndex = e.target.value;
    setSelectedZone(zoneIndex);
    if (zoneIndex === '') return;

    const zone = KIGALI_NEIGHBORHOODS[Number(zoneIndex)];
    const newCoords = {
      lat: zone.lat,
      lng: zone.lng,
      granted: true,
      accuracy: 0,
      timestamp: new Date().toISOString()
    };
    
    setCustomerLocation(newCoords);
    setLocationStatus('granted');

    // Pan map to new zone
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([zone.lat, zone.lng]);
      mapRef.current.setView([zone.lat, zone.lng], 15);
    }
  };

  // Referral code debounced verification
  const handleReferralChange = (e) => {
    const code = e.target.value.trim().toUpperCase();
    setFreferral(code);

    if (refDebounce.current) clearTimeout(refDebounce.current);
    
    if (!code) {
      setReferralMsg({ text: '', color: '' });
      setVerifiedReferral(null);
      return;
    }

    setReferralMsg({ text: 'Checking code...', color: '#888' });
    refDebounce.current = setTimeout(() => {
      performRealTimeVerify(code);
    }, 600);
  };

  const performRealTimeVerify = async (code) => {
    try {
      const res = await fetch('/api/referrals/verify/' + encodeURIComponent(code));
      const data = await res.json();
      if (data.valid) {
        setReferralMsg({ 
          text: `✅ Valid code — ${data.influencerName}`, 
          color: '#22c55e' 
        });
        setVerifiedReferral(code);
        setInfluencerName(data.influencerName);
        setCommissionRate(data.commission);
        localStorage.setItem('mb_ref', code);
      } else {
        setReferralMsg({ 
          text: `❌ ${data.message || 'Invalid referral code.'}`, 
          color: '#error' 
        });
        setVerifiedReferral(null);
      }
    } catch(e) { 
      console.error('Verify error:', e);
      setReferralMsg({ text: '', color: '' });
      setVerifiedReferral(null);
    }
  };

  // Checkout modal trigger
  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (orderType === 'delivery' && !customerLocation) {
      setLocationStatus('denied');
      setLocationErrorMsg('Location access or selecting a delivery zone is required to place your order.');
      return;
    }

    const errors = [];
    if (!fname) errors.push('Name is required.');
    if (!fphone) errors.push('Phone number is required.');
    if (orderType === 'delivery' && !faddress) errors.push('Delivery address is required.');
    if (cart.length === 0) errors.push('Your cart is empty.');

    if (errors.length) {
      setFormErr(errors.join(' '));
      return;
    }

    setFormErr('');
    setPayPhone(fphone);
    setPayNetwork('');
    setPayError('');
    setPayLoading(false);
    setPaySuccess(false);
    setPayModalOpen(true);
  };

  // Submit Flutterwave payment transaction
  const submitPayment = async () => {
    if (!payNetwork) {
      setPayError('Please choose your mobile money network.');
      return;
    }

    // Rwandan phone format validation
    let cleanPhone = payPhone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('07')) {
      cleanPhone = '250' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+250')) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (!/^2507[2389]\d{7}$/.test(cleanPhone)) {
      setPayError('Invalid Rwandan phone number. Use 07... or 2507...');
      return;
    }

    setPayError('');
    setPayLoading(true);
    setPayLoaderMsg('Initiating Mobile Money payment transaction...');

    const total = cartTotal();
    const reference = 'MB-' + Date.now();
    setCurrentTxRef(reference);

    const finalLoc = orderType === 'delivery' ? customerLocation : { lat: -1.9612, lng: 30.1471, accuracy: 0, granted: false };

    try {
      const payload = {
        phone: cleanPhone,
        amount: total,
        network: payNetwork,
        name: fname,
        tx_ref: reference,
        items: cart,
        orderType: orderType,
        address: orderType === 'delivery' ? faddress : 'Grab & Go Shop Pickup',
        notes: fnotes,
        location: finalLoc,
        referralCode: verifiedReferral
      };

      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.status === 'success') {
        // Order pending created in DB, now poll verification API
        setPayLoaderMsg('Payment prompt sent! Please type pin code on your mobile phone to approve transaction.');
        startPaymentVerification(reference);
      } else {
        setPayLoading(false);
        setPayError(data.message || 'Payment initiation failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setPayLoading(false);
      setPayError('Server connection error. Please try again.');
    }
  };

  // Verification Poller
  const startPaymentVerification = (txRef) => {
    if (verifyInterval.current) clearInterval(verifyInterval.current);

    let attempts = 0;
    const maxAttempts = 40; // ~2 mins max

    verifyInterval.current = setInterval(async () => {
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(verifyInterval.current);
        setPayLoading(false);
        setPayError('Payment confirmation timed out. If you made a payment, please contact support.');
        return;
      }

      try {
        const res = await fetch(`/api/verify/${txRef}`);
        const data = await res.json();

        if (data.status === 'success') {
          // Confirmed paid!
          clearInterval(verifyInterval.current);
          handleCheckoutSuccess(txRef);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
      }
    }, 4000);
  };

  // Post-payment success flow
  const handleCheckoutSuccess = async (txRef) => {
    const total = cartTotal();
    const now = new Date();
    const endTime = new Date(now.getTime() + 30 * 60000); // 30 mins from now

    const finalLocation = orderType === 'delivery' && customerLocation ? customerLocation : { lat: -1.9612, lng: 30.1471, accuracy: 0, granted: false };

    const orderData = {
      id: txRef,
      customerName: fname,
      phone: fphone,
      amount: total,
      type: orderType,
      address: orderType === 'delivery' ? faddress : 'Grab & Go Shop Pickup',
      items: cart,
      status: 'paid',
      orderedAt: now.toISOString(),
      location: finalLocation,
      referralCode: verifiedReferral,
      influencerName: influencerName,
      commissionRate: commissionRate
    };

    setLastOrderInfo(orderData);
    setSuccessState(true);
    setPayModalOpen(false);

    // Save locally
    const savedOrders = JSON.parse(localStorage.getItem('mb_orders') || '[]');
    savedOrders.unshift(orderData);
    localStorage.setItem('mb_orders', JSON.stringify(savedOrders));
    localStorage.setItem('mb_active_countdown', endTime.toISOString());

    // Submit Firestore order sync from client side (redundancy fallback)
    try {
      await setDoc(doc(db, 'orders', txRef), {
        customerName: fname,
        phone: fphone,
        amount: total,
        network: payNetwork,
        items: cart,
        orderType: orderType,
        address: orderType === 'delivery' ? faddress : 'Grab & Go Shop Pickup',
        notes: fnotes,
        latitude: finalLocation.lat,
        longitude: finalLocation.lng,
        locationGranted: orderType === 'delivery' ? !!customerLocation : false,
        status: 'paid',
        referred: !!verifiedReferral,
        referralOwnerId: verifiedReferral || null,
        referralCode: verifiedReferral || null,
        influencerName: influencerName || null,
        commissionRate: commissionRate || null,
        commissionAmount: verifiedReferral ? Math.round(total * commissionRate / 100) : 0,
        commissionStatus: verifiedReferral ? 'paid' : null,
        orderedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp(),
        paymentTime: now.toISOString(),
        countdownEndTime: endTime.toISOString(),
        orderStatus: 'preparing'
      });
    } catch(e) {
      console.error('Firestore redundancy sync failed:', e);
    }

    // Clear cart context
    clearCart();

    // Trigger timer
    startCountdown(endTime.toISOString());
  };

  // Timer counter calculations
  const startCountdown = (endTimeStr) => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    const endTime = new Date(endTimeStr).getTime();
    const duration = 30 * 60 * 1000; // 30 mins in ms

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        clearInterval(countdownInterval.current);
        setCountdownText('00:00');
        setCountdownPercent(0);
        setTimerFinished(true);
        localStorage.removeItem('mb_active_countdown');
        return;
      }

      const minutes = Math.floor(difference / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);
      const formattedMin = minutes < 10 ? '0' + minutes : minutes;
      const formattedSec = seconds < 10 ? '0' + seconds : seconds;

      setCountdownText(`${formattedMin}:${formattedSec}`);
      setCountdownPercent(Math.max(0, Math.min(100, (difference / duration) * 100)));
    };

    updateTimer();
    countdownInterval.current = setInterval(updateTimer, 1000);
  };

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="section-inner">
        <h2 className="section-title center">Place Your <span>Order</span></h2>

        {!successState ? (
          /* CHECKOUT INTERFACE */
          cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>
                <i className="fa-solid fa-cart-shopping"></i>
              </span>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Your cart is empty</h3>
              <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Add some hot items before placing an order.</p>
              <Link to="/menu" className="btn btn-fire">Browse Menu</Link>
            </div>
          ) : (
            <div className="order-layout">
              <form className="form-box" onSubmit={handleOpenPayment}>
                <h3>Your Details</h3>
                {formErr && (
                  <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>
                    {formErr}
                  </div>
                )}

                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Names"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    placeholder="07X XXX XXXX"
                    value={fphone}
                    onChange={(e) => setFphone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Order Type</label>
                  <div className="order-type-btns">
                    <button 
                      type="button"
                      className={`order-type-btn ${orderType === 'grab' ? 'active' : ''}`}
                      onClick={() => setOrderType('grab')}
                    >
                      <i className="fa-solid fa-person-running"></i> Grab & Go
                    </button>
                    <button 
                      type="button"
                      className={`order-type-btn ${orderType === 'delivery' ? 'active' : ''}`}
                      onClick={() => setOrderType('delivery')}
                    >
                      <i className="fa-solid fa-car"></i> Delivery
                    </button>
                  </div>
                </div>

                {orderType === 'delivery' && (
                  <div className="form-group">
                    <label>Delivery Address</label>
                    <input 
                      type="text" 
                      placeholder="123 Main St, Kigali Kanombe"
                      value={faddress}
                      onChange={(e) => setFaddress(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Special Notes (optional)</label>
                  <textarea 
                    rows="3" 
                    placeholder="No onions, extra sauce..."
                    value={fnotes}
                    onChange={(e) => setFnotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Referral Code (optional)</label>
                  <input 
                    type="text" 
                    placeholder="Enter influencer code" 
                    value={freferral}
                    onChange={handleReferralChange}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {referralMsg.text && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      marginTop: '0.4rem', 
                      color: referralMsg.color === '#error' ? 'var(--error)' : referralMsg.color
                    }}>
                      {referralMsg.text}
                    </div>
                  )}
                </div>

                {orderType === 'delivery' && (
                  <>
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)' }}>
                        <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--fire)' }}></i>
                        Choose Delivery Zone / Sector
                      </label>
                      <select 
                        className="delivery-zone-select"
                        value={selectedZone}
                        onChange={handleZoneChange}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-color)',
                          fontSize: '0.95rem',
                          marginTop: '0.4rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">-- Pre-select Kigali Sector (or drag pin below) --</option>
                        {KIGALI_NEIGHBORHOODS.map((zone, index) => (
                          <option key={index} value={index}>{zone.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Geolocation capturing banners */}
                    {locationStatus === 'loading' && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1.2rem', textAlign: 'center', fontSize: '0.85rem' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--fire)', marginRight: '0.5rem' }}></i>
                        Detecting your geolocation parameters...
                      </div>
                    )}

                    {locationStatus === 'denied' && (
                      <div className="location-banner" style={{ marginBottom: '1.2rem' }}>
                        <div style={{ fontSize: '1.5rem', color: '#ffc107' }}>
                          <i className="fa-solid fa-location-dot"></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#f0f0f0' }}>Location Access Required</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {locationErrorMsg || 'Please grant location permissions or select a zone above.'}
                          </p>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-fire btn-sm" 
                          onClick={() => requestLocation(true)}
                        >
                          Detect
                        </button>
                      </div>
                    )}

                    {locationStatus === 'granted' && (
                      <div style={{ color: 'var(--success)', background: 'var(--success-glow)', padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', marginBottom: '1.2rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-check-circle" style={{ marginRight: '0.5rem' }}></i> 
                        Location captured successfully ({customerLocation?.lat?.toFixed(5)}, {customerLocation?.lng?.toFixed(5)})
                      </div>
                    )}

                    {/* Interactive Leaflet Map */}
                    <div className="map-wrap" style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-color)',
                      marginBottom: '1.5rem'
                    }}>
                      <div id="map-container" className="map-container-el" style={{ height: '250px', width: '100%', zIndex: 1 }}>
                        {!mapLoaded && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem', color: 'var(--fire)' }}></i>
                            Loading interactive Kigali map...
                          </div>
                        )}
                      </div>
                      <div className="map-info-banner" style={{
                        background: 'rgba(15,15,15,0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '0.8rem 1.2rem',
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '0.8rem',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Drag the pin to adjust your exact delivery house.</span>
                        {customerLocation && (
                          <strong style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>
                            {customerLocation.lat.toFixed(5)}, {customerLocation.lng.toFixed(5)}
                          </strong>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  className="btn btn-fire btn-block"
                  disabled={orderType === 'delivery' && locationStatus !== 'granted'}
                >
                  <i className="fa-solid fa-fire"></i> Place Order — {cartTotal().toLocaleString()} Rwf
                </button>
              </form>

              {/* SUMMARY PANEL */}
              <div className="form-box">
                <h3>Order Summary</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {cart.map((item) => (
                    <div className="summary-item" key={item.id}>
                      <span>{item.name} × {item.qty}</span>
                      <span>{(item.price * item.qty).toLocaleString()} Rwf</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '0.8rem' }}>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{cartTotal().toLocaleString()} Rwf</span>
                  </div>
                </div>
                <Link to="/menu" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
                  ← Edit Cart
                </Link>
              </div>
            </div>
          )
        ) : (
          /* SUCCESS STATE */
          <div className="success-box" style={{ maxWidth: '620px' }}>
            <span className="success-icon" style={{ fontSize: '4rem', color: 'var(--fire)', marginBottom: '1rem', display: 'block' }}>
              <i className="fa-solid fa-fire-burner"></i>
            </span>
            
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.8rem', lineHeight: 1.3 }}>
              🔥 Thank you for ordering from <span style={{ color: 'var(--fire)' }}>Mad Burning</span> 🔥
              <br />
              <small style={{ fontSize: '1rem', color: 'var(--text-dim)', display: 'block', marginTop: '0.5rem' }}>
                Call <a href="tel:0796899214" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 700 }}>0796 899 214</a> after 30 minutes to fetch your order.
              </small>
            </h2>

            <p style={{ color: '#f0f0f0', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Your order is being prepared by our chefs.
            </p>

            <div className="countdown-box">
              <div className="countdown-timer">{countdownText}</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${countdownPercent}%` }}></div>
              </div>
            </div>

            {timerFinished && (
              <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginBottom: '1.2rem' }}>
                  30 minutes completed! Your food is hot and fresh. Call our counter to pick it up:
                </p>
                <a 
                  href="tel:0796899214" 
                  className="btn btn-fire" 
                  style={{
                    fontSize: '1.2rem',
                    padding: '1rem 2.5rem',
                    borderRadius: '50px',
                    boxShadow: '0 10px 25px rgba(255,69,0,0.4)'
                  }}
                >
                  <i className="fa-solid fa-phone"></i> Call Mad Burning
                </a>
              </div>
            )}

            {lastOrderInfo && (
              <div className="order-items-list" style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'hsl(0,0%,5%)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--gold)', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                  Ordered Items
                </h4>
                {lastOrderInfo.items.map((item, idx) => (
                  <div className="summary-item" key={idx} style={{ borderBottomColor: 'hsl(0,0%,8%)' }}>
                    <span>{item.name} × {item.qty}</span>
                    <span>{(item.price * item.qty).toLocaleString()} Rwf</span>
                  </div>
                ))}
                <div className="summary-total" style={{ borderTop: 'none', marginTop: '1rem' }}>
                  <span>Total Paid</span>
                  <span>{lastOrderInfo.amount.toLocaleString()} Rwf</span>
                </div>
              </div>
            )}

            <Link to="/menu" className="btn btn-dark" style={{ marginTop: '2rem', borderRadius: '30px', padding: '0.8rem 2rem' }}>
              <i className="fa-solid fa-fire"></i> Order More
            </Link>
          </div>
        )}
      </div>

      {/* FLUTTERWAVE GATEWAY MODAL */}
      <div className={`pay-overlay ${payModalOpen ? 'open' : ''}`}>
        <div className="pay-modal">
          {!payLoading ? (
            /* Step 1: Input details */
            <div>
              <h3><i className="fa-solid fa-fire"></i> Choose Payment</h3>
              <div className="pay-amount">{cartTotal().toLocaleString()} Rwf</div>
              
              <div className="pay-options">
                <button 
                  type="button"
                  className={`pay-option ${payNetwork === 'MTN' ? 'selected' : ''}`}
                  onClick={() => setPayNetwork('MTN')}
                >
                  <span className="pay-logo">
                    <img src="/assets/mtn.PNG?v=1" alt="MTN MoMo" />
                  </span>
                  MTN MoMo
                </button>
                <button 
                  type="button"
                  className={`pay-option ${payNetwork === 'AIRTEL' ? 'selected' : ''}`}
                  onClick={() => setPayNetwork('AIRTEL')}
                >
                  <span className="pay-logo">
                    <img src="/assets/air.PNG?v=1" alt="Airtel Money" />
                  </span>
                  Airtel Money
                </button>
              </div>

              <div className="pay-phone-group">
                <label>MoMo Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="07X XXX XXXX"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  maxLength={13}
                />
              </div>

              <div style={{ 
                background: 'rgba(255, 69, 0, 0.06)', 
                border: '1px solid rgba(255, 69, 0, 0.2)', 
                borderRadius: '12px', 
                padding: '0.9rem 1rem', 
                marginBottom: '1rem', 
                textAlign: 'center' 
              }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Send payment to code
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)', letterSpacing: '3px', margin: '0.1rem 0' }}>
                  004421
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', margin: 0 }}>
                  Mad Burning Partner Merchant Code
                </p>
              </div>

              {payError && <div className="pay-error">{payError}</div>}
              
              <button 
                type="button" 
                className="pay-btn" 
                onClick={submitPayment}
                disabled={!payNetwork}
              >
                Pay Now →
              </button>
              <button type="button" className="pay-cancel" onClick={() => setPayModalOpen(false)}>
                Cancel
              </button>
            </div>
          ) : (
            /* Step 2: Verification Loader */
            <div className="pay-loader" style={{ textAlign: 'center' }}>
              <div className="pay-spinner" style={{ margin: '0 auto 1.5rem' }}></div>
              <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Processing transaction...
              </p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', margin: '0.5rem 0 0' }}>
                {payLoaderMsg}
              </p>
              
              {payError && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="pay-error">{payError}</div>
                  <button 
                    type="button" 
                    className="pay-cancel" 
                    onClick={() => {
                      if (verifyInterval.current) clearInterval(verifyInterval.current);
                      setPayLoading(false);
                    }}
                  >
                    Back / Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
