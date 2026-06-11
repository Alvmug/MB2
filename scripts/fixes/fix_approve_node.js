const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'public', 'admin', 'index.html');
let content = fs.readFileSync(file, 'utf8');

// Find approveApp start and rejectApp end
const approveStart = content.indexOf('  async function approveApp(fsId, name, email) {');
const afterReject = content.indexOf('  function logout()');

if (approveStart === -1 || afterReject === -1) {
  console.log('Could not find functions. approveStart:', approveStart, 'afterReject:', afterReject);
  process.exit(1);
}

const before = content.substring(0, approveStart);
const after = content.substring(afterReject);

const newFunctions = `  async function approveApp(fsId, name, email) {
    const code = prompt('Set referral code for ' + name + ' (e.g. ' + name.split(' ')[0].toUpperCase() + '20):');
    if (!code) return;
    const commission = parseInt(prompt('Commission % (e.g. 10):') || '10');
    const password = Math.random().toString(36).slice(2, 10).toUpperCase();
    const refCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const refLink = 'https://madburning.com/?ref=' + refCode;
    const dashLink = 'https://madburning.com/influencer-dashboard.html';

    if (window._approveApplication) {
      await window._approveApplication(fsId, name, email, refCode, password, commission);
    }

    try {
      const res = await fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPass },
        body: JSON.stringify({ to: email, name: name, refCode: refCode, refLink: refLink, password: password, commission: commission, dashLink: dashLink })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Approved! Email sent to ' + email + '\\n\\nCode: ' + refCode + '\\nLink: ' + refLink);
      } else {
        alert('Approved!\\n\\nEmail failed: ' + (data.message || 'error') + '\\n\\nSend manually to: ' + email + '\\nCode: ' + refCode + '\\nPassword: ' + password + '\\nLink: ' + refLink);
      }
    } catch(e) {
      alert('Approved!\\n\\nEmail error. Send manually to: ' + email + '\\nCode: ' + refCode + '\\nPassword: ' + password + '\\nLink: ' + refLink);
    }

    fetchApplications();
  }

  async function rejectApp(fsId) {
    if (!confirm('Reject and remove this application?')) return;
    if (window._deleteFirestoreApplication) {
      await window._deleteFirestoreApplication(fsId);
    }
    fetchApplications();
  }

`;

const result = before + newFunctions + after;
fs.writeFileSync(file, result, 'utf8');
console.log('Done - approveApp and rejectApp replaced cleanly');
