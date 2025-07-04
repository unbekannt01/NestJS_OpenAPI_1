const fs = require('fs');
const crypto = require('crypto');

const payload = fs.readFileSync(__dirname + '/payload.json', 'utf8');

const secret = 'localtestsecret07'; 

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

console.log('Generated Signature:', signature);
