let dbInstance;
let adminInstance;

function initialize() {
  if (dbInstance) return;
  
  const admin = require('firebase-admin');
  let serviceAccount;
  
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let rawCreds = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (rawCreds.startsWith('"') && rawCreds.endsWith('"')) {
        rawCreds = rawCreds.slice(1, -1);
      }
      serviceAccount = JSON.parse(rawCreds);
      
      // Handle potential double-escaped newlines in the private key
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      } else if (serviceAccount.privateKey) {
        serviceAccount.privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
    } else {
      try {
        // Try to load from local file if env vars are missing
        serviceAccount = require('../madburning-72643-firebase-adminsdk-fbsvc-4c47b6f60b.json');
      } catch (e) {
        console.error("❌ Firebase service account not found in ENV or local JSON file.");
      }
    }

    if (serviceAccount && (serviceAccount.projectId || serviceAccount.project_id)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✅ Firebase Admin initialized successfully.");
    } else {
      console.error("❌ Firebase Admin could not be initialized: Missing credentials.");
    }
  } catch (err) {
    console.error("❌ Firebase Initialization Error:", err.message);
  }

  // Safely get Firestore instance
  try {
    dbInstance = admin.firestore();
    
    // Enable REST fallback for serverless environments (like Vercel) to prevent gRPC cold-start hangs
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      dbInstance.settings({ 
        preferRest: true,
        ignoreUndefinedProperties: true
      });
      console.log("ℹ️ Firestore REST mode enabled for serverless environment.");
    }
  } catch (e) {
    console.error("❌ Firestore access error:", e.message);
  }
  
  adminInstance = admin;
}

module.exports = {
  get db() {
    initialize();
    return dbInstance;
  },
  get admin() {
    initialize();
    return adminInstance;
  }
};
