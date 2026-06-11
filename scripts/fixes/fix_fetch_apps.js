const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'public', 'admin', 'index.html');
let content = fs.readFileSync(file, 'utf8');

// Fix _fetchApplications to remove orderBy (requires index)
const oldFetch = `  window._fetchApplications = async () => {
    try {
      const q = query(collection(db, 'influencer_applications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ _fsId: d.id, ...d.data() }));
    } catch(e) { return []; }
  };`;

const newFetch = `  window._fetchApplications = async () => {
    try {
      const snap = await getDocs(collection(db, 'influencer_applications'));
      return snap.docs.map(d => ({ _fsId: d.id, ...d.data() }))
        .sort((a, b) => {
          const at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
          const bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
          return bt - at;
        });
    } catch(e) { console.error('fetchApplications error:', e); return []; }
  };`;

if (content.includes(oldFetch)) {
  content = content.replace(oldFetch, newFetch);
  console.log('Fixed _fetchApplications - removed orderBy');
} else {
  console.log('Not found - trying partial match');
  content = content.replace(
    /window\._fetchApplications = async \(\) => \{[\s\S]*?const q = query\(collection\(db, 'influencer_applications'\), orderBy\('createdAt', 'desc'\)\);[\s\S]*?\};/,
    newFetch
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Done');
