import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminPass, setAdminPass] = useState('');
  
  // Navigation section
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');

  // Modals & Forms
  const [activeModal, setActiveModal] = useState(''); // '', 'product', 'referral', 'order-details', 'stat-details'
  
  // Product Form states
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCat, setProdCat] = useState('CHICKEN');
  const [prodImage, setProdImage] = useState('');
  const [prodImageList, setProdImageList] = useState([]);
  
  // Referral Form states
  const [refName, setRefName] = useState('');
  const [refCode, setRefCode] = useState('');
  const [refCommission, setRefCommission] = useState(10);
  
  // Details views
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatType, setSelectedStatType] = useState('');
  
  // Toast notifications
  const [toastText, setToastText] = useState('');
  const [toastType, setToastType] = useState('success');
  const [toastShow, setToastShow] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  // Interactive Map states & refs for Admin
  const [adminMapLoaded, setAdminMapLoaded] = useState(false);
  const adminMapRef = useRef(null);

  const triggerToast = (text, type = 'success') => {
    setToastText(text);
    setToastType(type);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 3000);
  };

  // 1. Session authorization check
  useEffect(() => {
    const pass = sessionStorage.getItem('mb_admin_pass');
    if (!pass) {
      navigate('/admin/login');
    } else {
      setAdminPass(pass);
    }
  }, [navigate]);

  // Load Chart.js dynamically
  useEffect(() => {
    if (window.Chart) {
      setChartLoaded(true);
    } else {
      const existingScript = document.getElementById('chartjs-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'chartjs-script';
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
          setChartLoaded(true);
        };
        script.onerror = () => {
          console.error("Failed to load Chart.js");
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', () => setChartLoaded(true));
      }
    }
  }, []);

  // Update chart when script loaded or active tab changed
  useEffect(() => {
    if (chartLoaded && orders && orders.length && activeTab === 'dashboard') {
      renderSalesChart(orders);
    }
  }, [chartLoaded, orders, activeTab]);

  // 2. Fetch current tab data
  useEffect(() => {
    if (!adminPass) return;
    
    let isMounted = true;
    
    const initialLoad = async () => {
      setLoading(true);
      await refreshData();
      if (isMounted) {
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 1200); // Premium transition delay
      }
    };
    
    initialLoad();

    // Auto-refresh data silently in background every 10 seconds (real-time updates)
    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [adminPass, activeTab]);

  // Initialize and update Leaflet Map in Admin (handles both details & live tracking maps)
  useEffect(() => {
    let mapInstance = null;
    let animationInterval = null;
    
    if ((activeModal === 'order-details' || activeModal === 'track-location') && selectedOrder && selectedOrder.latitude && selectedOrder.longitude) {
      const initAdminMap = () => {
        if (!window.L) return;
        const containerId = activeModal === 'track-location' ? 'admin-track-map-container' : 'admin-map-container';
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clean up previous map if container already has one
        if (adminMapRef.current) {
          if (adminMapRef.current.riderInterval) {
            clearInterval(adminMapRef.current.riderInterval);
          }
          adminMapRef.current.remove();
          adminMapRef.current = null;
        }

        const lat = Number(selectedOrder.latitude);
        const lng = Number(selectedOrder.longitude);

        // Center on customer
        const storeLat = -1.9583;
        const storeLng = 30.1215; // Remera Hub location

        const map = window.L.map(containerId).setView([lat, lng], 14);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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

        const customerMarker = window.L.marker([lat, lng], { icon: flameIcon }).addTo(map);
        customerMarker.bindPopup(`<b>${selectedOrder.customerName}</b><br/>${selectedOrder.address || 'Delivery Location'}`).openPopup();

        if (activeModal === 'track-location') {
          const storeIcon = window.L.icon({
            iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffaa00" width="48px" height="48px"><path d="M12 2L2 22h20L12 2zm0 4.5L18.5 19H5.5L12 6.5z"/></svg>',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
          });

          const storeMarker = window.L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);
          storeMarker.bindPopup(`<b>Mad Burning Shop</b><br/>Remera Hub`).openPopup();

          // Connect with a dashed polyline path
          const pathLine = window.L.polyline([[storeLat, storeLng], [lat, lng]], {
            color: 'var(--fire)',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 10'
          }).addTo(map);

          // Add animated rider marker along polyline
          const riderMarker = window.L.marker([storeLat, storeLng], {
            icon: window.L.divIcon({
              className: 'delivery-rider-icon',
              html: '<div class="rider-pulsing-circle">🏍️</div>',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })
          }).addTo(map);

          let pct = 0;
          animationInterval = setInterval(() => {
            pct += 0.01;
            if (pct > 1) pct = 0;
            const currentLat = storeLat + (lat - storeLat) * pct;
            const currentLng = storeLng + (lng - storeLng) * pct;
            riderMarker.setLatLng([currentLat, currentLng]);
          }, 150);

          map.riderInterval = animationInterval;

          // Adjust bounds
          const bounds = window.L.latLngBounds([[storeLat, storeLng], [lat, lng]]);
          map.fitBounds(bounds, { padding: [50, 50] });

          // Telemetry distance & ETA display
          const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c; // Distance in km
          };

          const distanceKm = calculateDistance(storeLat, storeLng, lat, lng);
          const distanceStr = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} meters` : `${distanceKm.toFixed(2)} km`;
          const etaMinutes = Math.round(distanceKm * 2 + 5); // 30km/h avg speed + 5 mins prep
          const etaStr = `${etaMinutes} mins`;

          setTimeout(() => {
            const distanceEl = document.getElementById('telemetry-distance');
            const etaEl = document.getElementById('telemetry-eta');
            if (distanceEl) distanceEl.innerText = distanceStr;
            if (etaEl) etaEl.innerText = etaStr;
          }, 150);
        }

        adminMapRef.current = map;
        mapInstance = map;
        
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 300);
      };

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
        script.onload = () => {
          setAdminMapLoaded(true);
          initAdminMap();
        };
        document.body.appendChild(script);
      } else {
        setAdminMapLoaded(true);
        setTimeout(initAdminMap, 150);
      }
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      if (adminMapRef.current) {
        if (adminMapRef.current.riderInterval) {
          clearInterval(adminMapRef.current.riderInterval);
        }
        adminMapRef.current.remove();
        adminMapRef.current = null;
      }
    };
  }, [activeModal, selectedOrder?.id, selectedOrder?.latitude, selectedOrder?.longitude]);

  const refreshData = async () => {
    if (activeTab === 'dashboard') await loadDashboard();
    else if (activeTab === 'orders') await loadOrders();
    else if (activeTab === 'products') await loadProducts();
    else if (activeTab === 'referrals') await loadReferrals();
    else if (activeTab === 'applications') await loadApplications();
  };

  // API wrapper
  const apiCall = async (path, opts = {}) => {
    const headers = { 
      'x-admin-password': adminPass, 
      'Content-Type': 'application/json', 
      ...opts.headers 
    };
    try {
      const res = await fetch(path, { ...opts, headers });
      if (res.status === 401) {
        sessionStorage.removeItem('mb_admin_pass');
        navigate('/admin/login');
        return null;
      }
      return res.json();
    } catch (e) {
      console.error("API Error on " + path, e);
      return { status: 'error', message: e.message };
    }
  };

  // Loaders
  const loadDashboard = async () => {
    // Stats overview
    const statsData = await apiCall('/api/admin/stats');
    if (statsData && statsData.status !== 'error') {
      setStats(statsData);
    }
    
    // Recent orders
    const ordersData = await apiCall('/api/admin/orders');
    if (Array.isArray(ordersData)) {
      setOrders(ordersData);
      setTimeout(() => renderSalesChart(ordersData), 200);
    }

    // Top referrals list
    const referralsData = await apiCall('/api/admin/referrals');
    if (Array.isArray(referralsData)) {
      setReferrals(referralsData);
    }
  };

  const loadOrders = async () => {
    const data = await apiCall('/api/admin/orders');
    if (Array.isArray(data)) {
      setOrders(data);
    }
  };

  const loadProducts = async () => {
    const data = await apiCall('/api/admin/products');
    if (Array.isArray(data)) {
      setProducts(data);
    }
    // Load image dropdown files
    const images = await apiCall('/api/product-images');
    if (Array.isArray(images)) {
      setProdImageList(images);
    }
  };

  const loadReferrals = async () => {
    const data = await apiCall('/api/admin/referrals');
    if (Array.isArray(data)) {
      setReferrals(data);
    }
  };

  const loadApplications = async () => {
    const data = await apiCall('/api/admin/applications');
    if (Array.isArray(data)) {
      setApplications(data);
    }
  };

  // Render Chart.js daily line plot
  const renderSalesChart = (ordersList) => {
    if (!window.Chart || !chartRef.current) return;

    // Daily revenue calculation
    const dailyData = {};
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      dailyData[dateStr] = 0;
      
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ key: dateStr, label });
    }

    ordersList.forEach(o => {
      if (o.status === 'paid' || o.status === 'delivered') {
        const createdAt = o.createdAt?.toDate?.() 
          || (o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : null)
          || (o.createdAt ? new Date(o.createdAt) : null);
        if (createdAt) {
          const dateStr = createdAt.toISOString().slice(0, 10);
          if (dailyData[dateStr] !== undefined) {
            dailyData[dateStr] += Number(o.amount) || 0;
          }
        }
      }
    });

    const labels = days.map(d => d.label);
    const dataset = days.map(d => dailyData[d.key]);

    const ctx = chartRef.current.getContext('2d');
    
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const flamePlugin = {
      id: 'flamePlugin',
      afterDraw: (chart) => {
        const meta = chart.getDatasetMeta(0);
        const flameEl = document.getElementById('chart-flame');
        if (!meta || !meta.data || meta.data.length === 0 || !flameEl) {
          if (flameEl) flameEl.style.display = 'none';
          return;
        }

        const lastPoint = meta.data[meta.data.length - 1];
        if (lastPoint && !lastPoint.skip) {
          const x = lastPoint.x;
          const y = lastPoint.y;
          flameEl.style.left = `${x}px`;
          flameEl.style.top = `${y}px`;
          flameEl.style.display = 'block';
        } else {
          flameEl.style.display = 'none';
        }
      }
    };

    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (Rwf)',
          data: dataset,
          borderColor: '#e31837',
          backgroundColor: 'rgba(227, 24, 55, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#e31837',
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: '#9ca3af' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { 
              color: '#9ca3af',
              callback: function(value) { return value.toLocaleString() + ' Rwf'; }
            }
          }
        }
      },
      plugins: [flamePlugin]
    });
  };

  // Orders managers
  const handleOrderStatusUpdate = async (id, status) => {
    if (!status) return;
    const res = await apiCall(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res && res.status === 'success') {
      triggerToast('Order status updated successfully!');
      refreshData();
    } else {
      triggerToast('Status update failed.', 'error');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this order?')) return;
    const res = await apiCall(`/api/admin/orders/${id}`, {
      method: 'DELETE'
    });
    if (res && res.status === 'success') {
      triggerToast('Order deleted successfully.');
      setActiveModal('');
      refreshData();
    } else {
      triggerToast('Deletion failed.', 'error');
    }
  };

  const exportCSV = () => {
    if (!orders || !orders.length) {
      triggerToast('No orders to export', 'error');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Type', 'Amount (Rwf)', 'Status', 'Referral Code', 'Influencer Name'];
    const rows = orders.map(o => {
      const date = o.createdAt ? new Date(o.createdAt?.toDate?.() || o.createdAt).toLocaleString() : '';
      return [
        o.id,
        `"${date}"`,
        `"${o.customerName}"`,
        `"${o.phone}"`,
        o.type,
        o.amount,
        o.status,
        o.referralCode || '',
        `"${o.influencerName || ''}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mad_burning_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Sales CSV exported!');
  };

  // Products catalog managers
  const handleOpenAddProduct = () => {
    setProdId('');
    setProdName('');
    setProdPrice('');
    setProdCat('CHICKEN');
    if (prodImageList.length > 0) {
      setProdImage(prodImageList[0].file);
    } else {
      setProdImage('');
    }
    setActiveModal('product');
  };

  const handleOpenEditProduct = (p) => {
    setProdId(p.id);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdCat(p.category);
    setProdImage(p.image);
    setActiveModal('product');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      price: Number(prodPrice),
      category: prodCat,
      image: prodImage
    };

    const url = prodId ? `/api/admin/products/${prodId}` : '/api/admin/products';
    const method = prodId ? 'PATCH' : 'POST';

    const res = await apiCall(url, {
      method,
      body: JSON.stringify(payload)
    });

    if (res && res.status === 'success') {
      triggerToast('Product saved successfully.');
      setActiveModal('');
      refreshData();
    } else {
      triggerToast('Failed to save product.', 'error');
    }
  };

  const handleToggleStock = async (p) => {
    const inStock = p.inStock === false;
    const res = await apiCall(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ inStock })
    });
    if (res && res.status === 'success') {
      triggerToast(inStock ? 'Product marked in-stock.' : 'Product marked sold-out.');
      refreshData();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    const res = await apiCall(`/api/admin/products/${id}`, {
      method: 'DELETE'
    });
    if (res && res.status === 'success') {
      triggerToast('Product deleted.');
      refreshData();
    }
  };

  // Referrals managers
  const handleSaveReferral = async (e) => {
    e.preventDefault();
    if (!refName || !refCode) {
      triggerToast('Fields are required.', 'error');
      return;
    }

    const payload = {
      influencerName: refName,
      code: refCode.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      commission: Number(refCommission)
    };

    const res = await apiCall('/api/admin/referrals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.status === 'success') {
      triggerToast('Referral code created!');
      setRefName('');
      setRefCode('');
      setRefCommission(10);
      setActiveModal('');
      refreshData();
    } else {
      triggerToast(res.message || 'Creation failed.', 'error');
    }
  };

  const handleToggleReferral = async (r) => {
    const active = !r.active;
    const res = await apiCall(`/api/admin/referrals/${r.code}`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    if (res && res.status === 'success') {
      triggerToast(active ? 'Referral code activated.' : 'Referral code disabled.');
      refreshData();
    }
  };

  const handleDeleteReferral = async (code) => {
    if (!window.confirm(`Delete referral code ${code}?`)) return;
    const res = await apiCall(`/api/admin/referrals/${code}`, {
      method: 'DELETE'
    });
    if (res && res.status === 'success') {
      triggerToast('Referral code deleted.');
      refreshData();
    }
  };

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/?ref=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      triggerToast(`Referral link for ${code} copied!`);
    });
  };

  // Application managers
  const handleApproveApp = async (app) => {
    const suggestedCode = app.name.split(' ')[0].toUpperCase() + '10';
    const code = window.prompt(`Set partner referral code for ${app.name}:`, suggestedCode);
    if (!code) return;
    
    const commission = window.prompt(`Set commission percentage rate (e.g. 10):`, '10');
    if (!commission) return;

    triggerToast('Processing approval transaction...', 'info');

    try {
      const res = await apiCall(`/api/admin/applications/${app.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ 
          code: code.toUpperCase(), 
          commission: Number(commission) 
        })
      });

      if (res && res.status === 'success') {
        triggerToast(`Application approved! Notification email dispatched to ${app.email}`, 'success');
        refreshData();
      } else if (res && res.status === 'warning') {
        triggerToast(`Approved: ${res.message}`, 'success');
        refreshData();
      } else {
        triggerToast(res?.message || 'Approval failed.', 'error');
      }
    } catch(err) {
      console.error(err);
      triggerToast('Approval failed.', 'error');
    }
  };

  const handleRejectApp = async (id) => {
    if (!window.confirm('Reject this application?')) return;
    const res = await apiCall(`/api/admin/applications/${id}/reject`, {
      method: 'POST'
    });
    if (res && res.status === 'success') {
      triggerToast('Application rejected.');
      refreshData();
    } else {
      triggerToast('Rejection transaction failed.', 'error');
    }
  };

  // Sign out
  const logout = () => {
    sessionStorage.removeItem('mb_admin_pass');
    navigate('/admin/login');
  };

  // Format Helper
  const formatDateString = (dateObj) => {
    if (!dateObj) return '—';
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj._seconds ? dateObj._seconds * 1000 : dateObj);
    return d.toLocaleString();
  };

  // Filtered orders selector
  const filteredOrdersList = orders.filter(o => {
    const matchQ = o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) || 
                   o.phone.toLowerCase().includes(orderSearch.toLowerCase());
    const matchF = orderFilter === 'all' || o.status === orderFilter;
    return matchQ && matchF;
  });

  if (loading && adminPass) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <div className="splash-fire-container">
            <div className="flame-particle p-1"></div>
            <div className="flame-particle p-2"></div>
            <div className="flame-particle p-3"></div>
            <div className="flame-particle p-4"></div>
            <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning Logo" className="splash-logo" style={{ zIndex: 10, position: 'relative' }} />
          </div>
          <h1 className="splash-title">MAD ADMIN</h1>
          <p className="splash-subtitle">LOADING CONTROL PANEL...</p>
          <div className="splash-loader">
            <div className="splash-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR PANEL */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.05em' }}>
          <img src="/assets/mad_burning_logo_final.png" alt="Mad Burning" style={{ width: '32px', height: '32px', border: '1px solid var(--fire)', objectFit: 'contain' }} />
          <span>MAD ADMIN</span>
        </div>
        <div className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <i className="fa-solid fa-chart-pie"></i>
            <span>Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <i className="fa-solid fa-bag-shopping"></i>
            <span>Orders</span>
          </div>
          <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <i className="fa-solid fa-burger"></i>
            <span>Products</span>
          </div>
          <div className={`nav-item ${activeTab === 'referrals' ? 'active' : ''}`} onClick={() => setActiveTab('referrals')}>
            <i className="fa-solid fa-share-nodes"></i>
            <span>Referrals</span>
          </div>
          <div className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
            <i className="fa-solid fa-users-viewfinder"></i>
            <span>Applications</span>
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <i className="fa-solid fa-gear"></i>
            <span>Settings</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="nav-item" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* MAIN DATA SECTION */}
      <main className="dash-main">
        <header className="topbar">
          <h2 style={{ textTransform: 'capitalize' }}>{activeTab}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn" onClick={refreshData} style={{ padding: '0.5rem 1rem' }}>
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
            <div style={{ background: 'var(--border-color)', padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600 }}>
              Admin Portal
            </div>
          </div>
        </header>

        <div className="dash-content">

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <div className="stats-grid">
                <div className="stat-card" onClick={() => { setSelectedStatType('revenue'); setActiveModal('stat-details'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">Total Revenue</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>details <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i></span>
                  </div>
                  <span className="value">{(stats.overview?.totalRevenue || 0).toLocaleString()} Rwf</span>
                  <span className="trend up"><i className="fa-solid fa-arrow-up"></i> Lifetime Net</span>
                </div>
                
                <div className="stat-card" onClick={() => { setSelectedStatType('today'); setActiveModal('stat-details'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">Today's Sales</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>details <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i></span>
                  </div>
                  <span className="value">{(stats.overview?.todayRevenue || 0).toLocaleString()} Rwf</span>
                  <span className="trend up">{stats.overview?.todayOrders || 0} orders today</span>
                </div>
                
                <div className="stat-card" onClick={() => { setSelectedStatType('orders'); setActiveModal('stat-details'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">Paid Orders</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>details <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i></span>
                  </div>
                  <span className="value">{stats.overview?.paidOrders || 0}</span>
                  <span className="trend">out of {stats.overview?.totalOrders || 0} total</span>
                </div>

                <div className="stat-card" onClick={() => { setSelectedStatType('influencers'); setActiveModal('stat-details'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">Influencers</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>details <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.6rem' }}></i></span>
                  </div>
                  <span className="value">{stats.overview?.activeInfluencers || 0}</span>
                  <span className="trend">{stats.overview?.pendingApplications || 0} pending applications</span>
                </div>
              </div>

              {/* Chart Line trend */}
              <div className="table-container" style={{ padding: '2rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>
                    <i className="fa-solid fa-chart-line" style={{ color: 'var(--fire)', marginRight: '0.5rem' }}></i> 
                    Revenue Trend (Last 7 Days)
                  </h3>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Period aggregate calculations
                  </span>
                </div>
                 <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                  <canvas ref={chartRef}></canvas>
                  <div id="chart-flame" style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    display: 'none',
                    transform: 'translate(-50%, -100%)',
                    zIndex: 10
                  }}>
                    <div className="flame-container-chart">
                      <div className="flame-chart-core"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent lists split */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="table-container">
                  <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Recent Sales</h3>
                    <button className="btn btn-dark btn-sm" onClick={() => setActiveTab('orders')}>View All</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((o, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'monospace' }}>#{o.id.toString().slice(-6)}</td>
                          <td><strong>{o.customerName}</strong><br /><small>{o.type === 'delivery' ? '🚗' : '🏃'} {o.type}</small></td>
                          <td>{(o.amount || 0).toLocaleString()} Rwf</td>
                          <td>
                            <span className={`badge-status status-${o.status}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-container">
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Top Performers</h3>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals
                        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                        .slice(0, 5)
                        .map((r, idx) => (
                          <tr key={idx}>
                            <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)' }}>{r.code}</span></td>
                            <td style={{ fontWeight: 700 }}>{(r.totalRevenue || 0).toLocaleString()} Rwf</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. ORDERS VIEW */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Order Entries</h3>
                  <button className="btn btn-dark btn-sm" onClick={exportCSV}>
                    <i className="fa-solid fa-file-csv" style={{ color: 'var(--success)' }}></i> Export CSV
                  </button>
                </div>
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}></i>
                  <input 
                    type="text" 
                    placeholder="Search customer name or phone..." 
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{ paddingLeft: '2.6rem', background: 'var(--card-color)', border: '1px solid var(--border-color)', borderRadius: '30px', color: '#fff', fontSize: '0.9rem', width: '100%' }}
                  />
                </div>
              </div>

              {/* Status toggles */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['all', 'pending', 'preparing', 'delivered', 'cancelled'].map((filter) => (
                  <button
                    key={filter}
                    className={`btn btn-sm ${orderFilter === filter ? 'btn-fire' : 'btn-dark'}`}
                    onClick={() => setOrderFilter(filter)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Referral</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrdersList.map((o, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{o.id.slice(-6)}</td>
                        <td><strong>{o.customerName}</strong><br /><small>{o.phone}</small></td>
                        <td><span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>{o.type}</span></td>
                        <td style={{ fontWeight: 700 }}>{(o.amount || 0).toLocaleString()} Rwf</td>
                        <td>
                          <span className={`badge-status status-${o.status}`}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--gold)' }}>
                          {o.referred ? (o.influencerName || o.referralCode) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button className="btn btn-dark" style={{ padding: '0.4rem' }} onClick={() => { setSelectedOrder(o); setActiveModal('order-details'); }} title="View Details">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            {o.latitude && (
                              <button className="btn btn-dark" style={{ padding: '0.4rem', color: 'var(--fire)' }} onClick={() => { setSelectedOrder(o); setActiveModal('track-location'); }} title="Track Location">
                                <i className="fa-solid fa-map-location-dot"></i>
                              </button>
                            )}
                            <select 
                              value={o.status} 
                              onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                              className="btn btn-dark" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--card-color)' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrdersList.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                          No orders matched current filter parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PRODUCTS VIEW */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Catalog Items</h3>
                <button className="btn btn-fire" onClick={handleOpenAddProduct}>
                  <i className="fa-solid fa-plus"></i> Add Product
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Availability</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <img 
                            src={`/${p.image}`} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                            onError={(e) => { e.target.src = '/assets/mad_burning_logo_final.png'; }}
                            alt={p.name}
                          />
                        </td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td style={{ fontWeight: 700 }}>{(p.price || 0).toLocaleString()} Rwf</td>
                        <td>
                          <button 
                            className={`btn btn-sm ${p.inStock !== false ? 'btn-outline' : 'btn-dark'}`}
                            onClick={() => handleToggleStock(p)}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderColor: p.inStock !== false ? 'var(--success)' : 'var(--border-color)', color: p.inStock !== false ? 'var(--success)' : 'var(--text-muted)' }}
                          >
                            {p.inStock !== false ? (
                              <><i className="fa-solid fa-circle-check" style={{ marginRight: '0.3rem' }}></i> In Stock</>
                            ) : (
                              <><i className="fa-solid fa-circle-xmark" style={{ marginRight: '0.3rem' }}></i> Out of Stock</>
                            )}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-dark btn-sm" onClick={() => handleOpenEditProduct(p)}>Edit</button>
                            <button className="btn btn-dark btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. REFERRALS VIEW */}
          {activeTab === 'referrals' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Partner Referrals</h3>
                <button className="btn btn-fire" onClick={() => setActiveModal('referral')}>
                  <i className="fa-solid fa-plus"></i> New Referral Code
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Influencer</th>
                      <th>Commission</th>
                      <th>Revenue (Rwf)</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)', fontSize: '1.1rem' }}>{r.code}</td>
                        <td><strong>{r.influencerName}</strong></td>
                        <td>{r.commission || 10}%</td>
                        <td style={{ fontWeight: 700 }}>{(r.totalRevenue || 0).toLocaleString()} Rwf</td>
                        <td>
                          <span className={`badge-status ${r.active ? 'status-paid' : 'status-cancelled'}`}>
                            {r.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-dark btn-sm" onClick={() => handleCopyLink(r.code)} title="Copy referral link">
                              <i className="fa-solid fa-copy"></i>
                            </button>
                            <button className="btn btn-dark btn-sm" onClick={() => handleToggleReferral(r)}>
                              {r.active ? 'Disable' : 'Enable'}
                            </button>
                            <button className="btn btn-dark btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDeleteReferral(r.code)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. APPLICATIONS VIEW */}
          {activeTab === 'applications' && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Influencer Submissions</h3>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Contact Details</th>
                      <th>Social Account</th>
                      <th>Statement Bio</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app, idx) => (
                      <tr key={idx} style={{ background: app.status === 'pending' ? 'rgba(255, 69, 0, 0.02)' : 'none' }}>
                        <td><strong>{app.name}</strong></td>
                        <td>{app.email}<br /><small style={{ color: 'var(--text-dim)' }}>{app.phone || 'No phone'}</small></td>
                        <td>
                          <a 
                            href={app.social?.startsWith('http') ? app.social : `https://instagram.com/${app.social}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'var(--fire)', fontWeight: 600 }}
                          >
                            <i className="fa-brands fa-instagram"></i> {app.social?.split('/').pop() || 'Account'}
                          </a>
                        </td>
                        <td>
                          <button 
                            className="btn btn-dark btn-sm" 
                            onClick={() => window.alert(`Partner Statement Bio:\n\n${app.bio || 'No bio provided'}`)}
                          >
                            Read Statement
                          </button>
                        </td>
                        <td>
                          {app.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn btn-fire btn-sm" onClick={() => handleApproveApp(app)}>Approve</button>
                              <button className="btn btn-dark btn-sm" onClick={() => handleRejectApp(app.id)}>Reject</button>
                            </div>
                          ) : (
                            <span className={`badge-status ${app.status === 'approved' ? 'status-paid' : 'status-cancelled'}`}>
                              {app.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {applications.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                          No applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="form-box" style={{ maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '1.5rem' }}>System Credentials</h3>
              
              <div className="form-group">
                <label>Administrator Session Token Password</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="password" value="••••••••" readOnly style={{ flex: 1 }} />
                  <button className="btn btn-dark" onClick={() => window.alert('To change master credentials, update ADMIN_PASSWORD key in server .env configuration file and reboot service.')}>
                    Change Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODALS DIALOGS ── */}

      {/* PRODUCT MODAL */}
      {activeModal === 'product' && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{prodId ? 'Edit Product' : 'Add Product'}</h3>
              <button className="close-btn" onClick={() => setActiveModal('')}>✕</button>
            </div>
            
            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Price (Rwf)</label>
                <input 
                  type="number" 
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={prodCat} onChange={(e) => setProdCat(e.target.value)}>
                  <option value="CHICKEN">CHICKEN</option>
                  <option value="BEEF">BEEF</option>
                  <option value="Extras">Extras</option>
                  <option value="BoxCombos">Box Combos</option>
                  <option value="Promotion">Promotion</option>
                </select>
              </div>

              <div className="form-group">
                <label>Product Image Asset</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    value={prodImage} 
                    onChange={(e) => setProdImage(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {prodImageList.map((img, idx) => (
                      <option value={img.file} key={idx}>{img.name}</option>
                    ))}
                  </select>
                   <img 
                    src={prodImage ? `/${prodImage}` : '/assets/mad_burning_logo_final.png'} 
                    alt="Preview" 
                    style={{ width: '50px', height: '50px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    onError={(e) => { e.target.src = '/assets/mad_burning_logo_final.png'; }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-fire" style={{ flex: 1 }}>Save Product</button>
                <button type="button" className="btn btn-dark" style={{ flex: 1 }} onClick={() => setActiveModal('')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFERRAL CODE MODAL */}
      {activeModal === 'referral' && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Referral Code</h3>
              <button className="close-btn" onClick={() => setActiveModal('')}>✕</button>
            </div>
            
            <form onSubmit={handleSaveReferral}>
              <div className="form-group">
                <label>Influencer Name</label>
                <input 
                  type="text" 
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required 
                />
              </div>
              <div className="form-group">
                <label>Referral Code Prefix</label>
                <input 
                  type="text" 
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="e.g. JANE10"
                  style={{ textTransform: 'uppercase' }}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Commission Rate (%)</label>
                <input 
                  type="number" 
                  value={refCommission}
                  onChange={(e) => setRefCommission(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-fire" style={{ flex: 1 }}>Create Code</button>
                <button type="button" className="btn btn-dark" style={{ flex: 1 }} onClick={() => setActiveModal('')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {activeModal === 'order-details' && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Order Details (#{selectedOrder.id.slice(-6)})</h3>
              <button className="close-btn" onClick={() => setActiveModal('')}>✕</button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ background: '#0a0a0a', borderRadius: '12px', padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Customer Profile</p>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{selectedOrder.customerName}</h4>
                <p style={{ color: 'var(--fire)', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedOrder.phone}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Ordered: {formatDateString(selectedOrder.orderedAt || selectedOrder.createdAt)}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Timeline</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem' }}>
                  <div style={{ position: 'absolute', left: '5px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-color)' }}></div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></div>
                    <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>Ordered</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateString(selectedOrder.orderedAt || selectedOrder.createdAt)}</p>
                  </div>

                  {selectedOrder.paidAt && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)' }}></div>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>Payment Confirmed</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateString(selectedOrder.paidAt)}</p>
                    </div>
                  )}

                  {selectedOrder.preparedAt && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--fire)' }}></div>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>Preparing</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateString(selectedOrder.preparedAt)}</p>
                    </div>
                  )}

                  {selectedOrder.status === 'delivered' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></div>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700 }}>Delivered</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateString(selectedOrder.deliveredAt || selectedOrder.updatedAt)}</p>
                    </div>
                  )}

                  {selectedOrder.status === 'cancelled' && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--error)' }}></div>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--error)' }}>Cancelled</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>{formatDateString(selectedOrder.cancelledAt || selectedOrder.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Order Items</p>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyItems: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{item.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>{item.price.toLocaleString()} Rwf × {item.qty}</p>
                    </div>
                    <p style={{ fontWeight: 700 }}>{(item.price * item.qty).toLocaleString()} Rwf</p>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderTop: '2px solid var(--border-color)' }}>
                  <h4 style={{ margin: 0 }}>Total</h4>
                  <h3 style={{ margin: 0, color: 'var(--gold)' }}>{(selectedOrder.amount || 0).toLocaleString()} Rwf</h3>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fulfillment</p>
                <p style={{ marginBottom: '0.5rem' }}><strong>Type:</strong> {selectedOrder.type === 'delivery' ? '🚗 Delivery' : '🏃 Grab & Go'}</p>
                {selectedOrder.address && <p style={{ marginBottom: '0.5rem' }}><strong>Address:</strong> {selectedOrder.address}</p>}
                {selectedOrder.notes && <p style={{ marginBottom: '0.5rem', background: '#1a1a1a', padding: '0.8rem', borderRadius: '8px' }}><strong>Notes:</strong> {selectedOrder.notes}</p>}
                {selectedOrder.latitude ? (
                  <>
                    <div className="map-wrap" style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-color)',
                      marginTop: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div id="admin-map-container" style={{ height: '220px', width: '100%', zIndex: 1 }}>
                        {!adminMapLoaded && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem', color: 'var(--fire)' }}></i>
                            Loading interactive delivery map...
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveModal('track-location')}
                      className="btn btn-fire" 
                      style={{ width: '100%', justifyContent: 'center', marginTop: '0.8rem', background: 'var(--success)', borderColor: 'var(--success)' }}
                    >
                      <i className="fa-solid fa-location-crosshairs"></i> Track Live Location
                    </button>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-fire" 
                      style={{ width: '100%', justifyContent: 'center', marginTop: '0.8rem' }}
                    >
                      <i className="fa-solid fa-map-location-dot"></i> View on Google Maps
                    </a>
                  </>
                ) : (
                  <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>No location coordinates captured.</p>
                )}
              </div>

              {selectedOrder.referred && (
                <div style={{ border: '1px solid var(--gold)', background: 'rgba(255,204,0,0.05)', padding: '1rem', borderRadius: '12px' }}>
                  <p style={{ color: 'var(--gold)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Referral Metadata</p>
                  <p style={{ margin: 0 }}><strong>Influencer:</strong> {selectedOrder.influencerName || '—'}</p>
                  <p style={{ margin: 0 }}><strong>Code:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedOrder.referralCode}</span></p>
                  <p style={{ margin: 0 }}><strong>Commission Cut:</strong> {selectedOrder.commissionAmount ? selectedOrder.commissionAmount.toLocaleString() + ' Rwf' : '—'}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-fire" style={{ flex: 1 }} onClick={() => setActiveModal('')}>Close</button>
              <button 
                className="btn btn-dark" 
                style={{ color: 'var(--error)', border: '1px solid var(--error)' }} 
                onClick={() => handleDeleteOrder(selectedOrder.id)}
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACK LOCATION MODAL */}
      {activeModal === 'track-location' && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h3>Live Delivery Tracking (#{selectedOrder.id.slice(-6)})</h3>
              <button className="close-btn" onClick={() => setActiveModal('')}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#0a0a0a', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Customer Profile</p>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{selectedOrder.customerName}</h4>
                  <p style={{ color: 'var(--fire)', fontWeight: 600, margin: '0.2rem 0' }}>{selectedOrder.phone}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: 0 }}>{selectedOrder.address}</p>
                </div>

                <div style={{ background: '#0a0a0a', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Fulfillment Status</p>
                  <span className={`badge-status status-${selectedOrder.status}`} style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                    {selectedOrder.status}
                  </span>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>
                    <strong>Type:</strong> {selectedOrder.type === 'delivery' ? '🚗 Delivery' : '🏃 Grab & Go'}
                  </p>
                </div>

                {selectedOrder.latitude ? (
                  <div style={{ background: 'rgba(227, 24, 55, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--fire)' }}>
                    <p style={{ color: 'var(--fire)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.3rem', fontWeight: 700 }}>Telemetry</p>
                    <p style={{ fontSize: '0.8rem', margin: '0.2rem 0' }}>
                      <strong>Est. Distance:</strong> <span id="telemetry-distance">Calculating...</span>
                    </p>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>
                      <strong>Est. Delivery ETA:</strong> <span id="telemetry-eta">Calculating...</span>
                    </p>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedOrder.latitude ? (
                  <>
                    <div className="map-wrap" style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'var(--bg-color)',
                      minHeight: '350px'
                    }}>
                      <div id="admin-track-map-container" style={{ height: '350px', width: '100%', zIndex: 1 }}>
                        {!adminMapLoaded && (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem', color: 'var(--fire)' }}></i>
                            Initializing telemetry map...
                          </div>
                        )}
                      </div>
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-fire" 
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <i className="fa-solid fa-map-location-dot"></i> Open in Google Maps
                    </a>
                  </>
                ) : (
                  <div style={{ height: '100%', minHeight: '350px', border: '1px dashed var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
                    <i className="fa-solid fa-location-slash" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}></i>
                    <h4>No Coordinates Captured</h4>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>This order was placed without active location telemetry or is a "Grab & Go" pickup order.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-fire" style={{ width: '100%' }} onClick={() => setActiveModal('')}>Close Tracking</button>
            </div>
          </div>
        </div>
      )}

      {/* STATISTICS DETAILS MODAL */}
      {activeModal === 'stat-details' && stats && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>
                {selectedStatType === 'revenue' ? 'Revenue Breakdown' :
                 selectedStatType === 'today' ? "Today's Sales Breakdown" :
                 selectedStatType === 'orders' ? 'Orders Breakdown' :
                 'Partner Referrals Breakdown'}
              </h3>
              <button className="close-btn" onClick={() => setActiveModal('')}>✕</button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {selectedStatType === 'revenue' && (() => {
                const paidOrDelivered = orders.filter(o => o.status === 'paid' || o.status === 'delivered');
                const totalNet = paidOrDelivered.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                const totalGross = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                const commissionTotal = paidOrDelivered.filter(o => o.referred).reduce((sum, o) => sum + (Number(o.commissionAmount) || 0), 0);
                const deliveryRevenue = paidOrDelivered.filter(o => o.type === 'delivery').reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                const grabRevenue = paidOrDelivered.filter(o => o.type !== 'delivery').reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                
                const aov = paidOrDelivered.length ? Math.round(totalNet / paidOrDelivered.length) : 0;
                const deliveryPct = totalNet ? Math.round((deliveryRevenue / totalNet) * 100) : 0;
                const grabPct = totalNet ? Math.round((grabRevenue / totalNet) * 100) : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Net Realized Revenue</p>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.2rem' }}>{totalNet.toLocaleString()} Rwf</h3>
                      </div>
                      <i className="fa-solid fa-wallet" style={{ fontSize: '2rem', color: 'var(--success)', opacity: 0.8 }}></i>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Gross Revenue</p>
                        <h4 style={{ fontSize: '1.2rem', marginTop: '0.2rem', fontWeight: 700 }}>{totalGross.toLocaleString()} Rwf</h4>
                      </div>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Average Order Value</p>
                        <h4 style={{ fontSize: '1.2rem', marginTop: '0.2rem', fontWeight: 700 }}>{aov.toLocaleString()} Rwf</h4>
                      </div>
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Commissions Paid</p>
                        <h4 style={{ fontSize: '1.3rem', color: 'var(--gold)', fontWeight: 700, marginTop: '0.2rem' }}>{commissionTotal.toLocaleString()} Rwf</h4>
                      </div>
                      <i className="fa-solid fa-gift" style={{ fontSize: '1.5rem', color: 'var(--gold)', opacity: 0.8 }}></i>
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Revenue Source Split</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span>🚗 Delivery</span>
                            <strong>{deliveryRevenue.toLocaleString()} Rwf ({deliveryPct}%)</strong>
                          </div>
                          <div style={{ height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${deliveryPct}%`, background: 'var(--fire)' }}></div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span>🏃 Grab & Go / Pickup</span>
                            <strong>{grabRevenue.toLocaleString()} Rwf ({grabPct}%)</strong>
                          </div>
                          <div style={{ height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${grabPct}%`, background: 'var(--gold)' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedStatType === 'today' && (() => {
                const todayStr = new Date().toISOString().slice(0, 10);
                const todayOrdersList = orders.filter(o => {
                  const d = o.createdAt?.toDate?.() 
                    || (o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : null)
                    || (o.createdAt ? new Date(o.createdAt) : null);
                  return d && d.toISOString().slice(0, 10) === todayStr;
                });

                const todayPaid = todayOrdersList.filter(o => o.status === 'paid' || o.status === 'delivered');
                const todayRevenueAmount = todayPaid.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                const deliveryCount = todayOrdersList.filter(o => o.type === 'delivery').length;
                const grabCount = todayOrdersList.filter(o => o.type !== 'delivery').length;

                const statusBreakdown = {
                  paid: todayOrdersList.filter(o => o.status === 'paid').length,
                  delivered: todayOrdersList.filter(o => o.status === 'delivered').length,
                  preparing: todayOrdersList.filter(o => o.status === 'preparing').length,
                  pending: todayOrdersList.filter(o => o.status === 'pending').length,
                  cancelled: todayOrdersList.filter(o => o.status === 'cancelled').length
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Today's Net Sales</p>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.2rem' }}>{todayRevenueAmount.toLocaleString()} Rwf</h3>
                      </div>
                      <i className="fa-solid fa-calendar-day" style={{ fontSize: '2rem', color: 'var(--success)', opacity: 0.8 }}></i>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Today's Orders</p>
                        <h4 style={{ fontSize: '1.5rem', marginTop: '0.2rem', fontWeight: 700 }}>{todayOrdersList.length}</h4>
                      </div>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Conversion Rate</p>
                        <h4 style={{ fontSize: '1.5rem', marginTop: '0.2rem', fontWeight: 700, color: 'var(--gold)' }}>{todayOrdersList.length ? Math.round((todayPaid.length / todayOrdersList.length) * 100) : 0}%</h4>
                      </div>
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Order Types (Today)</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                          <span style={{ fontSize: '1.2rem' }}>🚗</span>
                          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.3rem' }}>Delivery</p>
                          <strong style={{ fontSize: '1.1rem' }}>{deliveryCount}</strong>
                        </div>
                        <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
                        <div>
                          <span style={{ fontSize: '1.2rem' }}>🏃</span>
                          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.3rem' }}>Grab & Go</p>
                          <strong style={{ fontSize: '1.1rem' }}>{grabCount}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                      <h4 style={{ marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Status Distribution (Today)</h4>
                      <table style={{ width: '100%', border: 'none' }}>
                        <tbody>
                          <tr><td style={{ padding: '0.4rem 0', border: 'none', color: 'var(--success)' }}>✅ Paid / Ready</td><td style={{ textAlign: 'right', fontWeight: 700, border: 'none', padding: '0.4rem 0' }}>{statusBreakdown.paid}</td></tr>
                          <tr><td style={{ padding: '0.4rem 0', border: 'none', color: 'var(--success)' }}>🚗 Delivered</td><td style={{ textAlign: 'right', fontWeight: 700, border: 'none', padding: '0.4rem 0' }}>{statusBreakdown.delivered}</td></tr>
                          <tr><td style={{ padding: '0.4rem 0', border: 'none', color: 'var(--fire)' }}>🔥 Preparing</td><td style={{ textAlign: 'right', fontWeight: 700, border: 'none', padding: '0.4rem 0' }}>{statusBreakdown.preparing}</td></tr>
                          <tr><td style={{ padding: '0.4rem 0', border: 'none', color: 'var(--gold)' }}>⏳ Pending</td><td style={{ textAlign: 'right', fontWeight: 700, border: 'none', padding: '0.4rem 0' }}>{statusBreakdown.pending}</td></tr>
                          <tr><td style={{ padding: '0.4rem 0', border: 'none', color: 'var(--error)' }}>❌ Cancelled</td><td style={{ textAlign: 'right', fontWeight: 700, border: 'none', padding: '0.4rem 0' }}>{statusBreakdown.cancelled}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {selectedStatType === 'orders' && (() => {
                const totalCount = orders.length;
                const statusCounts = {
                  paid: orders.filter(o => o.status === 'paid').length,
                  delivered: orders.filter(o => o.status === 'delivered').length,
                  preparing: orders.filter(o => o.status === 'preparing').length,
                  pending: orders.filter(o => o.status === 'pending').length,
                  cancelled: orders.filter(o => o.status === 'cancelled').length
                };

                const paidOrDelivered = orders.filter(o => o.status === 'paid' || o.status === 'delivered');
                const conversionRate = totalCount ? Math.round((paidOrDelivered.length / totalCount) * 100) : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Lifetime Orders</p>
                        <h3 style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 700, marginTop: '0.2rem' }}>{totalCount}</h3>
                      </div>
                      <i className="fa-solid fa-boxes-stacked" style={{ fontSize: '2rem', color: 'var(--fire)', opacity: 0.8 }}></i>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Conversion Rate</p>
                        <h4 style={{ fontSize: '1.5rem', marginTop: '0.2rem', fontWeight: 700, color: 'var(--success)' }}>{conversionRate}%</h4>
                      </div>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Cancelled Orders</p>
                        <h4 style={{ fontSize: '1.5rem', marginTop: '0.2rem', fontWeight: 700, color: 'var(--error)' }}>{statusCounts.cancelled}</h4>
                      </div>
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                      <h4 style={{ marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Order Status Distribution</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {Object.entries(statusCounts).map(([status, count]) => {
                          const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
                          let color = 'var(--text-color)';
                          if (status === 'paid' || status === 'delivered') color = 'var(--success)';
                          if (status === 'preparing') color = 'var(--fire)';
                          if (status === 'pending') color = 'var(--gold)';
                          if (status === 'cancelled') color = 'var(--error)';
                          
                          return (
                            <div key={status}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                                <span style={{ textTransform: 'capitalize', color, fontWeight: 600 }}>{status}</span>
                                <span>{count} ({pct}%)</span>
                              </div>
                              <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: color }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedStatType === 'influencers' && (() => {
                const referralOrders = orders.filter(o => o.referred);
                const paidReferralOrders = referralOrders.filter(o => o.status === 'paid' || o.status === 'delivered');
                const refRevenue = paidReferralOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
                const totalCommission = paidReferralOrders.reduce((sum, o) => sum + (Number(o.commissionAmount) || 0), 0);
                
                const activeInfluencers = referrals.filter(r => r.active).length;
                const totalInfluencers = referrals.length;

                let topCode = '—';
                let topRevenue = 0;
                let topName = '—';
                if (referrals && referrals.length) {
                  const sorted = [...referrals].sort((a,b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
                  if (sorted[0] && sorted[0].totalRevenue > 0) {
                    topCode = sorted[0].code;
                    topRevenue = sorted[0].totalRevenue;
                    topName = sorted[0].influencerName;
                  }
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Referral Revenue</p>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--success)', fontWeight: 700, marginTop: '0.2rem' }}>{refRevenue.toLocaleString()} Rwf</h3>
                      </div>
                      <i className="fa-solid fa-share-nodes" style={{ fontSize: '2rem', color: 'var(--gold)', opacity: 0.8 }}></i>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Active Codes</p>
                        <h4 style={{ fontSize: '1.5rem', marginTop: '0.2rem', fontWeight: 700 }}>{activeInfluencers} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ {totalInfluencers}</span></h4>
                      </div>
                      <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Commission Cost</p>
                        <h4 style={{ fontSize: '1.5rem', marginTop: '0.2rem', fontWeight: 700, color: 'var(--fire)' }}>{totalCommission.toLocaleString()} Rwf</h4>
                      </div>
                    </div>

                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                      <h4 style={{ marginBottom: '0.8rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Top Performing Influencer</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Partner:</strong> {topName}</p>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Referral Code:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--gold)', fontWeight: 700 }}>{topCode}</span></p>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}><strong>Referred Sales:</strong> {topRevenue.toLocaleString()} Rwf</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button className="btn btn-fire" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveModal('')}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST PANEL */}
      <div style={{
        position: 'fixed',
        bottom: '2.5rem',
        right: '2.5rem',
        zIndex: 2000,
        transform: toastShow ? 'translateY(0)' : 'translateY(100px)',
        opacity: toastShow ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: toastShow ? 'auto' : 'none',
        background: 'var(--card-color)',
        border: `1px solid ${toastType === 'error' ? 'var(--error)' : toastType === 'info' ? 'var(--gold)' : 'var(--success)'}`,
        padding: '1.2rem 1.8rem',
        borderRadius: '16px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6)',
        fontWeight: 600,
        fontSize: '0.95rem',
        color: toastType === 'error' ? 'var(--error)' : toastType === 'info' ? 'var(--gold)' : 'var(--success)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>{toastType === 'error' ? '❌' : toastType === 'info' ? 'ℹ️' : '🔥'}</span>
        <span>{toastText}</span>
      </div>

    </div>
  );
}
