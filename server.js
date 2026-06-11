// ── MAD BURNING — Payment Backend (Node.js + Express) ──
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const { db, admin } = require('./config/firebase');
const getFieldValue = () => (admin && admin.firestore) ? admin.firestore.FieldValue : null;

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets from React production build if it exists, otherwise public folder
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Middleware to check if DB is initialized
app.use((req, res, next) => {
  if (!db && req.path.startsWith('/api/admin')) {
    return res.status(503).json({ status: 'error', message: 'Database not initialized. Check server logs.' });
  }
  next();
});


async function updateReferralStats(code, amount, commissionAmount) {
  if (!code) return;
  try {
    const fv = getFieldValue();
    await db.collection('referrals').doc(code.toUpperCase()).update({
      totalOrders: fv ? fv.increment(1) : 1,
      totalRevenue: fv ? fv.increment(Number(amount) || 0) : Number(amount) || 0,
      totalCommission: fv ? fv.increment(Number(commissionAmount) || 0) : Number(commissionAmount) || 0
    });
  } catch (err) {
    console.error('Failed to update referral stats:', err);
  }
}

async function logAction(actorId, action, metadata = {}) {
  try {
    await db.collection('auditLogs').add({
      actorId: actorId || 'system',
      action,
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Failed to write audit log:', error);
  }
}

async function verifyInfluencerToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', message: 'No token provided' });
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.role !== 'influencer') {
      res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
      return null;
    }
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ status: 'error', message: 'Invalid token' });
    return null;
  }
}

// ── Simple Request Logger ──
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}); // Serve static files from the root directory

const ADMIN_PASS = (process.env.ADMIN_PASSWORD || 'mad123').trim();

// ── Admin Auth Middleware ──
const adminAuth = (req, res, next) => {
  const adminPassHeader = (req.headers['x-admin-password'] || '').trim();
  if (adminPassHeader === ADMIN_PASS) {
    next();
  } else {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
};

// Lightweight password check used by the admin login page.
// Keep this independent of Firestore so dashboard access is not blocked by data-load errors.
app.get('/api/admin/auth', adminAuth, (req, res) => {
  res.json({ status: 'success' });
});

const FLW_SECRET = process.env.FLW_SECRET_KEY;

const productImageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);
const ignoredProductImages = new Set(['air', 'favicon', 'logo', 'mtn', 'yuyu']);

function titleFromAsset(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function scanProductImages() {
  const localAssetsDir = path.join(__dirname, 'public', 'assets');
  const vercelAssetsDir = path.join(process.cwd(), 'public', 'assets');
  const assetsDir = fs.existsSync(localAssetsDir) ? localAssetsDir : vercelAssetsDir;
  return fs.readdirSync(assetsDir, { withFileTypes: true })
    .filter(file => {
      const ext = path.extname(file.name).toLowerCase();
      const base = file.name.replace(/\.[^.]+$/, '').toLowerCase();
      return file.isFile() && productImageExts.has(ext) && !ignoredProductImages.has(base);
    })
    .map(file => ({ name: titleFromAsset(file.name), file: `assets/${file.name}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const nodemailer = require('nodemailer');
const GMAIL_USER = (process.env.GMAIL_USER || '').trim();
const GMAIL_PASS = (process.env.GMAIL_APP_PASS || '').trim().replace(/\s+/g, '');

app.get('/api/product-images', (req, res) => {
  try {
    res.json(scanProductImages());
  } catch (err) {
    console.error('Product image scan failed:', err);
    res.status(500).json({ status: 'error', message: 'Failed to scan product images.' });
  }
});

// ── Send Approval Email via Gmail ──
app.post('/api/send-approval-email', adminAuth, async (req, res) => {
  const { to, name, refCode, refLink, password, commission, dashLink } = req.body;
  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ status: 'error', message: 'Email credentials not configured.' });
  }
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });
    await transporter.sendMail({
      from: '"Mad Burning" <' + GMAIL_USER + '>',
      to,
      subject: 'Welcome to the Fire! 🔥 Your Mad Burning Partnership is Approved',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #f0f0f0; border-radius: 20px; overflow: hidden; border: 1px solid #222;">
          <div style="background: linear-gradient(135deg, #ff4500 0%, #ff6600 100%); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 28px; letter-spacing: 1px; font-weight: 900;">🔥 MAD BURNING</h1>
            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Official Influencer Partnership</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #fff; margin-top: 0;">Hi ${name},</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Exciting news! Your application to become a Mad Burning Influencer has been <strong>Approved</strong>. We love your style and can't wait to see how you bring the heat to your audience.</p>
            
            <div style="background-color: #161616; border: 1px solid #333; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #ffcc00; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Partnership Details</h3>
              
              <div style="margin-bottom: 15px;">
                <span style="color: #888; display: block; font-size: 12px;">REFERRAL CODE</span>
                <span style="color: #ff4500; font-family: monospace; font-size: 24px; font-weight: 900;">${refCode}</span>
              </div>
              
              <div style="margin-bottom: 15px;">
                <span style="color: #888; display: block; font-size: 12px;">DASHBOARD PASSWORD</span>
                <span style="color: #fff; font-family: monospace; font-size: 18px; font-weight: 700;">${password}</span>
              </div>
              
              <div>
                <span style="color: #888; display: block; font-size: 12px;">COMMISSION RATE</span>
                <span style="color: #22c55e; font-weight: 700; font-size: 18px;">${commission}% per order</span>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #888; margin-bottom: 10px;">Share this link to start earning:</p>
            <div style="background: rgba(255, 69, 0, 0.1); border: 1px dashed #ff4500; padding: 15px; border-radius: 8px; word-break: break-all; text-align: center;">
              <a href="${refLink}" style="color: #ff4500; text-decoration: none; font-weight: 700;">${refLink}</a>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="${dashLink}" style="background: linear-gradient(135deg, #ff4500 0%, #ff6600 100%); color: #fff; padding: 18px 35px; border-radius: 12px; text-decoration: none; font-weight: 900; display: inline-block; box-shadow: 0 10px 20px rgba(255, 69, 0, 0.2);">GO TO MY DASHBOARD →</a>
            </div>
          </div>
          
          <div style="background-color: #111; padding: 30px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; color: #555; font-size: 12px;">&copy; 2025 Mad Burning Kigali. All rights reserved.</p>
            <p style="margin: 10px 0 0; color: #444; font-size: 12px;">Stay fired up! 🔥</p>
          </div>
        </div>
      `
    });
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Fetch Menu from Firestore ──
app.get('/api/menu', async (req, res) => {
  try {
    console.log("Fetching products from Firestore...");
    const snapshot = await db.collection('products').get();
    console.log("Products snapshot retrieved, size:", snapshot.size);
    const menu = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      const cat = data.category || 'Uncategorized';
      if (!menu[cat]) menu[cat] = [];
      menu[cat].push({ ...data, id: doc.id });
    });
    res.json(menu);
  } catch (err) {
    console.error("Error in /api/menu:", err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Initiate Mobile Money Payment ──
app.post('/api/pay', async (req, res) => {
  const { phone, amount, network, name, tx_ref, items, orderType, address, notes, location, referralCode } = req.body;

  if (!phone || !amount || !network) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields.' });
  }

  // ── Require Location ──
  if (!location || !location.lat || !location.lng) {
    return res.status(400).json({ status: 'error', message: 'Location access is required to place your order.' });
  }

  // ── Clean and Format Phone Number ──
  let phoneClean = phone.replace(/\s+/g, '');
  if (phoneClean.startsWith('07')) {
    phoneClean = '250' + phoneClean.substring(1);
  } else if (phoneClean.startsWith('+250')) {
    phoneClean = phoneClean.substring(1);
  }

  if (!/^2507[2389]\d{7}$/.test(phoneClean)) {
    return res.status(400).json({ status: 'error', message: 'Invalid Rwandan phone number. Use 07... or 2507...' });
  }

  const reference = tx_ref || 'MB-' + Date.now();

  let influencerInfo = null;
  let commissionAmount = 0;

  try {
    // ── Handle Referral ──
    if (referralCode) {
      const refSnap = await db.collection('referrals').doc(referralCode.toUpperCase()).get();
      if (refSnap.exists) {
        const refData = refSnap.data();
        influencerInfo = {
          code: referralCode.toUpperCase(),
          name: refData.influencerName,
          rate: refData.commission || 10
        };
        commissionAmount = Math.round((amount * influencerInfo.rate) / 100);
      }
    }

    // 1. Create Pending Order in Firestore
      await db.collection('orders').doc(reference).set({
      customerName: name || 'Anonymous',
      phone: phoneClean,
      amount: amount,
      network: network,
      items: items || [],
      orderType: orderType || 'grab',
      address: address || '',
      notes: notes || '',
      latitude: location.lat,
      longitude: location.lng,
      locationGranted: true,
      status: req.body.status || 'pending',

      // Referral + commission tracking
      referred: !!influencerInfo,
      referralOwnerId: influencerInfo ? influencerInfo.code : null,
      referralCode: influencerInfo ? influencerInfo.code : null,
      influencerName: influencerInfo ? influencerInfo.name : null,
      commissionRate: influencerInfo ? influencerInfo.rate : null,
      commissionAmount: commissionAmount,
      commissionStatus: influencerInfo ? 'pending' : null,

      orderedAt: new Date(),
      createdAt: new Date(),
    });

    // 2. Initiate Payment with Flutterwave
    const payload = {
      tx_ref:       reference,
      amount:       amount,
      currency:     'RWF',
      email:        'customer@madburning.com',
      phone_number: phoneClean,
      fullname:     name || 'Mad Burning Customer',
      network:      network,
      redirect_url: `https://${req.headers.host}/order`,
    };

    const response = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_rwanda', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return res.json({ status: 'success', message: data.message, data: data.data });
    } else {
      return res.status(400).json({ status: 'error', message: data.message || 'Payment initiation failed.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error. Please try again.' });
  }
});

// ── Verify Payment ──
app.get('/api/verify/:tx_ref', async (req, res) => {
  const tx_ref = req.params.tx_ref;
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
      headers: { 'Authorization': `Bearer ${FLW_SECRET}` },
    });
    const data = await response.json();
    
    if (data.status === 'success' && data.data.status === 'successful') {
      // Update Order Status in Firestore
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000);
      const orderSnap = await db.collection('orders').doc(tx_ref).get();
      const orderData = orderSnap.exists ? orderSnap.data() : {};
      const hasReferral = !!(orderData.referralCode || orderData.referralOwnerId || orderData.referred);
      await db.collection('orders').doc(tx_ref).update({
        status: 'paid',
        flw_id: data.data.id,
        paidAt: now,
        paymentTime: now.toISOString(),
        countdownEndTime: endTime.toISOString(),
        orderStatus: 'preparing',
        commissionStatus: hasReferral ? 'paid' : null,
      });
      if (hasReferral && orderData.referralCode) {
        await updateReferralStats(orderData.referralCode, orderData.amount, orderData.commissionAmount);
      }
      return res.json({ status: 'success', message: 'Payment confirmed!' });
    }
    return res.json({ status: 'pending', message: 'Payment not yet confirmed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Verification failed.' });
  }
});

// ── Create Order (from frontend) ──
app.post('/api/orders', async (req, res) => {
  try {
    const { id, customerName, phone, type, address, notes, items, amount, status, location, referralCode } = req.body;
    
    // ── Require Location ──
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ status: 'error', message: 'Location access is required to place your order.' });
    }

    let influencerInfo = null;
    let commissionAmount = 0;
    const refCodeUpper = referralCode ? referralCode.toUpperCase() : null;

    if (refCodeUpper) {
      const refSnap = await db.collection('referrals').doc(refCodeUpper).get();
      if (refSnap.exists) {
        const refData = refSnap.data();
        influencerInfo = {
          code: refCodeUpper,
          name: refData.influencerName,
          rate: refData.commission || 10
        };
        commissionAmount = Math.round((amount || 0) * influencerInfo.rate / 100);
      }
    }

    await db.collection('orders').doc(id).set({
      customerName,
      phone,
      type,
      address: address || '',
      notes: notes || '',
      items,
      amount,
      status: status || 'pending',
      latitude: location.lat,
      longitude: location.lng,
      locationGranted: true,

      // Referral + commission tracking
      referred: !!influencerInfo,
      referralOwnerId: influencerInfo ? influencerInfo.code : null,
      referralCode: refCodeUpper,
      influencerName: influencerInfo ? influencerInfo.name : null,
      commissionRate: influencerInfo ? influencerInfo.rate : null,
      commissionAmount: commissionAmount,
      commissionStatus: influencerInfo ? ((status || 'pending') === 'paid' ? 'paid' : 'pending') : null,

      orderedAt: new Date(),
      createdAt: new Date(),
    });

    if (influencerInfo && (status === 'paid' || req.body.status === 'paid')) {
      await updateReferralStats(refCodeUpper, amount, commissionAmount);
    }

    res.json({ status: 'success', message: 'Order created.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create order.' });
  }
});

// ── ADMIN: Fetch All Orders ──
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orders.push({ 
        ...data, 
        id: doc.id, 
        orderNumber: data.id || doc.id 
      });
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch orders.' });
  }
});

// ── ADMIN: Update Order Status ──
app.patch('/api/admin/orders/:id', adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ status: 'error', message: 'Order not found.' });

    const orderData = orderSnap.data();
    if (status === 'paid' && orderData.status !== 'paid' && orderData.referralCode) {
      await updateReferralStats(orderData.referralCode, orderData.amount, orderData.commissionAmount);
    }

    const updateData = { status, updatedAt: new Date() };
    if (status === 'preparing') updateData.preparedAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();
    if (status === 'cancelled') updateData.cancelledAt = new Date();
    if (status === 'paid' && orderData.status !== 'paid') updateData.paidAt = new Date();

    await orderRef.update(updateData);
    res.json({ status: 'success', message: 'Order updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to update order.' });
  }
});

// ── ADMIN: Delete Order ──
app.delete('/api/admin/orders/:id', adminAuth, async (req, res) => {
  try {
    await db.collection('orders').doc(req.params.id).delete();
    res.json({ status: 'success', message: 'Order deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete order.' });
  }
});

// ── ADMIN: Manage Products (CRUD) ──
app.get('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const products = [];
    snapshot.forEach(doc => products.push({ ...doc.data(), id: doc.id }));
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch products.' });
  }
});

app.post('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const docRef = await db.collection('products').add({ ...req.body, createdAt: new Date() });
    res.json({ status: 'success', id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create product.' });
  }
});

app.patch('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    await db.collection('products').doc(req.params.id).update({ ...req.body, updatedAt: new Date() });
    res.json({ status: 'success', message: 'Product updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to update product.' });
  }
});

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    await db.collection('products').doc(req.params.id).delete();
    res.json({ status: 'success', message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete product.' });
  }
});

// ── ADMIN: Manage Referral Codes ──
app.get('/api/admin/referrals', adminAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('referrals').get();
    const referrals = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      referrals.push({ code: doc.id, ...data });
    });
    res.json(referrals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch referrals.' });
  }
});

app.post('/api/admin/referrals', adminAuth, async (req, res) => {
  try {
    const { code, influencerName, commission } = req.body;
    if (!code || !influencerName) {
      return res.status(400).json({ status: 'error', message: 'Code and influencer name are required.' });
    }
    const referralCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    await db.collection('referrals').doc(referralCode).set({
      influencerName,
      commission: commission || 10,
      totalOrders: 0,
      totalRevenue: 0,
      totalCommission: 0,
      createdAt: new Date(),
      active: true,
    });
    res.json({ status: 'success', code: referralCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to create referral code.' });
  }
});

app.patch('/api/admin/referrals/:code', adminAuth, async (req, res) => {
  try {
    const { active, commission } = req.body;
    const updateData = {};
    if (active !== undefined) updateData.active = active;
    if (commission !== undefined) updateData.commission = commission;
    
    await db.collection('referrals').doc(req.params.code).update(updateData);
    res.json({ status: 'success', message: 'Referral code updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to update referral code.' });
  }
});

app.delete('/api/admin/referrals/:code', adminAuth, async (req, res) => {
  try {
    await db.collection('referrals').doc(req.params.code).delete();
    res.json({ status: 'success', message: 'Referral code deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to delete referral code.' });
  }
});

// ── PUBLIC: Verify Referral Code ──
app.get('/api/referrals/verify/:code', async (req, res) => {
  try {
    const doc = await db.collection('referrals').doc(req.params.code.toUpperCase()).get();
    if (!doc.exists) {
      return res.json({ valid: false, message: 'Invalid referral code.' });
    }
    const data = doc.data();
    if (!data.active) {
      return res.json({ valid: false, message: 'This referral code is no longer active.' });
    }
    res.json({ valid: true, influencerName: data.influencerName, commission: data.commission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Verification failed.' });
  }
});

// ── INFLUENCER: Get Earnings by Code ──
app.get('/api/influencer/earnings/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const referralDoc = await db.collection('referrals').doc(code).get();
    if (!referralDoc.exists) {
      return res.status(404).json({ status: 'error', message: 'Referral code not found.' });
    }
    const referralData = referralDoc.data();
    const ordersSnapshot = await db.collection('orders').where('referralCode', '==', code).get();
    const orders = [];
    let totalRevenue = 0;
    let earnings = 0;
    ordersSnapshot.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };
      const isPaid = order.status === 'paid' || order.commissionStatus === 'paid';
      if (!isPaid) return;
      orders.push(order);
      const orderAmount = Number(order.amount) || 0;
      totalRevenue += orderAmount;
      earnings += Number(order.commissionAmount) || Math.round(orderAmount * (Number(order.commissionRate) || referralData.commission || 10) / 100);
    });
    const commissionRate = referralData.commission || 10;
    res.json({
      status: 'success',
      code,
      influencerName: referralData.influencerName,
      commission: commissionRate,
      // Calculated from current orders
      calculatedOrders: orders.length,
      calculatedRevenue: totalRevenue,
      calculatedEarnings: earnings,
      // Stored in the referral document
      storedOrders: referralData.totalOrders || 0,
      storedRevenue: referralData.totalRevenue || 0,
      storedEarnings: referralData.totalCommission || 0,
      // For backwards compatibility or simplified UI use
      totalOrders: orders.length,
      totalRevenue,
      earnings,
      orders: orders.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch earnings.' });
  }
});

// ── INFLUENCER: Request Payout/Withdrawal ──
app.post('/api/influencer/withdraw', async (req, res) => {
  const decodedToken = await verifyInfluencerToken(req, res);
  if (!decodedToken) return;

  const { amount, paymentDetails, paymentMethod } = req.body;
  const uid = decodedToken.uid;

  if (!amount || amount < 1000) {
    return res.status(400).json({ status: 'error', message: 'Minimum withdrawal is 1,000 RWF' });
  }

  try {
    const influencerRef = db.collection('influencers').doc(uid);
    const influencerSnap = await influencerRef.get();

    if (!influencerSnap.exists) {
      return res.status(404).json({ status: 'error', message: 'Influencer profile not found' });
    }

    const data = influencerSnap.data();
    const availableBalance = (data.pendingEarnings || 0);

    if (amount > availableBalance) {
      return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
    }

    // Create Withdrawal Request
    const withdrawalDoc = await db.collection('withdrawals').add({
      influencerId: uid,
      influencerName: data.name,
      email: data.email || '',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Mobile Money',
      paymentDetails: paymentDetails || data.phone || 'Not provided',
      status: 'pending',
      createdAt: new Date()
    });

    // Deduct from pending balance and increment withdrawing
    await influencerRef.update({
      pendingEarnings: admin.firestore.FieldValue.increment(-amount),
      withdrawingEarnings: admin.firestore.FieldValue.increment(amount)
    });

    await logAction(uid, 'WITHDRAWAL_REQUESTED', { amount, withdrawalId: withdrawalDoc.id });

    res.json({ status: 'success', message: 'Withdrawal request submitted successfully', id: withdrawalDoc.id });
  } catch (err) {
    console.error('Withdrawal Request Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});


// ── ADMIN: Fetch Influencer Applications ──
app.get('/api/admin/applications', adminAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('influencer_applications').orderBy('createdAt', 'desc').get();
    const apps = [];
    snapshot.forEach(doc => {
      apps.push({ id: doc.id, ...doc.data() });
    });
    res.json(apps);
  } catch (err) {
    console.error("Get apps error:", err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch applications.' });
  }
});

// ── ADMIN: Approve Influencer Application ──
app.post('/api/admin/applications/:id/approve', adminAuth, async (req, res) => {
  const { code, commission } = req.body;
  if (!code) {
    return res.status(400).json({ status: 'error', message: 'Referral code is required.' });
  }
  
  const refCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const commRate = Number(commission) || 10;
  const password = Math.random().toString(36).slice(-8).toUpperCase();
  
  try {
    const appRef = db.collection('influencer_applications').doc(req.params.id);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }
    
    const appData = appSnap.data();

    // Create/get Firebase Auth User
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(appData.email);
      console.log('User already exists, updating custom claims...');
    } catch (e) {
      userRecord = await admin.auth().createUser({
        email: appData.email,
        password: password,
        displayName: appData.name,
      });
    }

    const uid = userRecord.uid;

    // Set Custom Claims for Auth Role
    await admin.auth().setCustomUserClaims(uid, { role: 'influencer' });

    // Create Influencer profile document
    await db.collection('influencers').doc(uid).set({
      uid,
      name: appData.name,
      email: appData.email,
      phone: appData.phone || '',
      refCode: refCode,
      commissionRate: commRate,
      status: 'active',
      totalEarnings: 0,
      paidEarnings: 0,
      pendingEarnings: 0,
      createdAt: new Date(),
    });
    
    // Create referral document
    await db.collection('referrals').doc(refCode).set({
      influencerName: appData.name,
      email: appData.email,
      commission: commRate,
      password: password,
      approved: true,
      active: true,
      totalOrders: 0,
      totalRevenue: 0,
      totalCommission: 0,
      createdAt: new Date(),
      uid: uid
    });
    
    // Update application status
    await appRef.update({ 
      status: 'approved', 
      referralCode: refCode, 
      influencerId: uid,
      updatedAt: new Date() 
    });

    await logAction('admin', 'INFLUENCER_APPROVED', { uid, email: appData.email, refCode });
    
    // Try sending approval email
    const refLink = `https://${req.headers.host}/order.html?ref=${refCode}`;
    const dashLink = `https://${req.headers.host}/influencer-dashboard.html`;
    
    if (GMAIL_USER && GMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: GMAIL_USER, pass: GMAIL_PASS }
        });
        
        await transporter.sendMail({
          from: `"Mad Burning" <${GMAIL_USER}>`,
          to: appData.email,
          subject: 'Welcome to the Fire! 🔥 Your Mad Burning Partnership is Approved',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #f0f0f0; border-radius: 20px; overflow: hidden; border: 1px solid #222;">
              <div style="background: linear-gradient(135deg, #ff4500 0%, #ff6600 100%); padding: 40px 20px; text-align: center;">
                <h1 style="margin: 0; color: #fff; font-size: 28px; letter-spacing: 1px; font-weight: 900;">🔥 MAD BURNING</h1>
                <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Official Influencer Partnership</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #fff; margin-top: 0;">Hi ${appData.name},</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Exciting news! Your application to become a Mad Burning Influencer has been <strong>Approved</strong>. We love your style and can't wait to see how you bring the heat to your audience.</p>
                
                <div style="background-color: #161616; border: 1px solid #333; border-radius: 12px; padding: 25px; margin: 30px 0;">
                  <h3 style="margin-top: 0; color: #ffcc00; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Partnership Details</h3>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="color: #888; display: block; font-size: 12px;">REFERRAL CODE</span>
                    <span style="color: #ff4500; font-family: monospace; font-size: 24px; font-weight: 900;">${refCode}</span>
                  </div>
                  
                  <div style="margin-bottom: 15px;">
                    <span style="color: #888; display: block; font-size: 12px;">DASHBOARD PASSWORD</span>
                    <span style="color: #fff; font-family: monospace; font-size: 18px; font-weight: 700;">${password}</span>
                  </div>
                  
                  <div>
                    <span style="color: #888; display: block; font-size: 12px;">COMMISSION RATE</span>
                    <span style="color: #22c55e; font-weight: 700; font-size: 18px;">${commRate}% per order</span>
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #888; margin-bottom: 10px;">Share this link to start earning:</p>
                <div style="background: rgba(255, 69, 0, 0.1); border: 1px dashed #ff4500; padding: 15px; border-radius: 8px; word-break: break-all; text-align: center;">
                  <a href="${refLink}" style="color: #ff4500; text-decoration: none; font-weight: 700;">${refLink}</a>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                  <a href="${dashLink}" style="background: linear-gradient(135deg, #ff4500 0%, #ff6600 100%); color: #fff; padding: 18px 35px; border-radius: 12px; text-decoration: none; font-weight: 900; display: inline-block; box-shadow: 0 10px 20px rgba(255, 69, 0, 0.2);">GO TO MY DASHBOARD →</a>
                </div>
              </div>
              
              <div style="background-color: #111; padding: 30px; text-align: center; border-top: 1px solid #222;">
                <p style="margin: 0; color: #555; font-size: 12px;">&copy; 2025 Mad Burning Kigali. All rights reserved.</p>
                <p style="margin: 10px 0 0; color: #444; font-size: 12px;">Stay fired up! 🔥</p>
              </div>
            </div>
          `
        });
        res.json({ status: 'success', password, code: refCode });
      } catch (mailErr) {
        console.error("Mail send error:", mailErr);
        res.json({ status: 'warning', message: 'Approved successfully, but failed to send notification email.', password, code: refCode });
      }
    } else {
      res.json({ status: 'warning', message: 'Approved successfully, but email credentials are not configured on the server.', password, code: refCode });
    }
  } catch (err) {
    console.error("Approve application error:", err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── ADMIN: Reject Influencer Application ──
app.post('/api/admin/applications/:id/reject', adminAuth, async (req, res) => {
  try {
    const appRef = db.collection('influencer_applications').doc(req.params.id);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      return res.status(404).json({ status: 'error', message: 'Application not found.' });
    }
    await appRef.update({ status: 'rejected', updatedAt: new Date() });
    res.json({ status: 'success' });
  } catch (err) {
    console.error("Reject application error:", err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── ADMIN: Fetch Dashboard Stats ──
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const ordersSnap = await db.collection('orders').get();
    const referralsSnap = await db.collection('referrals').get();
    const appsSnap = await db.collection('influencer_applications').where('status', '==', 'pending').get();

    let totalRevenue = 0;
    let totalOrders = 0;
    let paidOrders = 0;
    let refRevenue = 0;
    let refOrders = 0;

    const today = new Date().toISOString().slice(0, 10);
    let todayRevenue = 0;
    let todayOrders = 0;

    ordersSnap.forEach(doc => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      totalOrders++;
      
      const createdAt = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : null);
      const isToday = createdAt && createdAt.toISOString().slice(0, 10) === today;

      if (data.status === 'paid') {
        paidOrders++;
        totalRevenue += amount;
        if (isToday) {
          todayRevenue += amount;
          todayOrders++;
        }
        if (data.referred) {
          refOrders++;
          refRevenue += amount;
        }
      }
    });

    res.json({
      overview: {
        totalRevenue,
        totalOrders,
        paidOrders,
        todayRevenue,
        todayOrders,
        pendingApplications: appsSnap.size,
        activeInfluencers: referralsSnap.size
      },
      referrals: {
        totalRevenue: refRevenue,
        totalOrders: refOrders
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats.' });
  }
});

// SPA fallback for React Router - serve index.html for any non-API routes
if (fs.existsSync(distPath)) {
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Mad Burning server running on port ${PORT}`));
}

module.exports = app;
