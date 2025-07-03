const fs = require('fs');
const crypto = require('crypto');

// Read payload
const payload = fs.readFileSync(__dirname + '/payload.json', 'utf8');

// Use the exact webhook secret from your .env file or hardcoded temporarily
const secret = 'localtestsecret07'; // <- Replace this with real secret

// Generate HMAC SHA256 signature
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('Generated Signature:', signature);
