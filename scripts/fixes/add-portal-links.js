const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'public/index.html',
  'public/menu.html',
  'public/order.html',
  'public/about.html',
  'public/contact.html'
];

// Normalize newlines to \n for robust matching
const clean = str => str.replace(/\r\n/g, '\n').trim();

const targetPattern = clean(`
      <h4>Quick Links</h4>
      <ul>
        <li><a href="menu.html">Menu</a></li>
        <li><a href="order.html">Order Online</a></li>
        <li><a href="about.html">About Us</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
`);

const replacement = `      <h4>Quick Links</h4>
      <ul>
        <li><a href="menu.html">Menu</a></li>
        <li><a href="order.html">Order Online</a></li>
        <li><a href="about.html">About Us</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="admin/login.html">Admin Portal</a></li>
        <li><a href="influencer-dashboard.html">Influencer Portal</a></li>
      </ul>`;

filesToUpdate.forEach(relativePath => {
  const filePath = path.join(__dirname, '..', '..', relativePath);
  if (fs.existsSync(filePath)) {
    let rawContent = fs.readFileSync(filePath, 'utf8');
    // Keep track of line ending type
    const isCRLF = rawContent.includes('\r\n');
    let content = rawContent.replace(/\r\n/g, '\n');

    if (content.includes(targetPattern)) {
      content = content.replace(targetPattern, replacement);
      // Convert back to CRLF if the original file had it
      if (isCRLF) {
        content = content.replace(/\n/g, '\r\n');
      }
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated footer links in: ${relativePath}`);
    } else {
      console.log(`⚠️ Target footer pattern not found in: ${relativePath}`);
    }
  } else {
    console.error(`❌ File not found: ${relativePath}`);
  }
});
