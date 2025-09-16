require('dotenv').config();
const v = process.env.DB_NAME || process.env.DATABASE_URL || '';
console.log('DB_NAME raw (JSON):', JSON.stringify(process.env.DB_NAME));
console.log('DATABASE_URL raw (JSON):', JSON.stringify(process.env.DATABASE_URL));
console.log('DB_NAME char codes:', (process.env.DB_NAME || '').split('').map(c => c.charCodeAt(0)));
console.log('DATABASE_URL char codes (first 80 chars):', (process.env.DATABASE_URL || '').slice(0,80).split('').map(c => c.charCodeAt(0)));
process.exit(0);