const { admin, db } = require('./config/firebase');

/**
 * Sets custom claims for a user (e.g., role: 'admin' or 'influencer').
 * This is the foundation of our RBAC system.
 */
async function setRole(uid, role) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`✅ Successfully set role "${role}" for user ${uid}`);
    
    // Also sync to a 'users' collection for easy querying in the dashboard
    await db.collection('users').doc(uid).set({
      uid,
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
  } catch (error) {
    console.error(`❌ Error setting role:`, error);
  }
}

/**
 * Records an entry in the auditLogs collection.
 */
async function logAction(actorId, action, metadata = {}) {
  try {
    await db.collection('auditLogs').add({
      actorId,
      action,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: metadata.ip || 'unknown'
    });
  } catch (error) {
    console.error('❌ Failed to write audit log:', error);
  }
}

/**
 * Ledger-based Commission creation.
 * To be called when an order is marked as 'paid'.
 */
async function createCommissionEntry(orderId, orderData) {
  if (!orderData.referralCode || !orderData.influencerId) return;

  const commissionAmount = Math.round((orderData.amount * (orderData.commissionRate || 10)) / 100);

  try {
    await db.collection('commissions').add({
      orderId,
      influencerId: orderData.influencerId,
      amount: commissionAmount,
      status: 'pending', // Becomes 'available' after X days or order 'delivered'
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      referralCode: orderData.referralCode
    });

    // Update influencer's pending balance
    await db.collection('influencers').doc(orderData.influencerId).update({
      pendingEarnings: admin.firestore.FieldValue.increment(commissionAmount),
      totalEarnings: admin.firestore.FieldValue.increment(commissionAmount)
    });

    console.log(`💰 Commission of ${commissionAmount} generated for ${orderData.influencerId}`);
  } catch (error) {
    console.error('❌ Commission entry failed:', error);
  }
}

module.exports = { setRole, logAction, createCommissionEntry };
