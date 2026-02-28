/**
 * Password Hash Generator for Demo Data
 * 
 * This Node.js script generates bcrypt hashes for your demo user passwords.
 * 
 * Usage:
 *   node generate_password_hash.js
 * 
 * Then copy the generated hashes and update your MongoDB users.
 */

const bcrypt = require('bcryptjs');

// Define your passwords here
const passwords = {
  admin: 'admin123',           // Change this!
  shopOwner: 'owner123',       // Change this!
  operator1: 'ahmed123',       // Change this!
  operator2: 'fatima123'       // Change this!
};

console.log('\n🔐 Generating bcrypt password hashes...\n');
console.log('============================================\n');

// Generate hashes
const hashes = {};
for (const [key, password] of Object.entries(passwords)) {
  hashes[key] = bcrypt.hashSync(password, 10);
}

// Display MongoDB update commands
console.log('📋 Copy and paste these commands into mongosh:\n');
console.log('// Update Admin password');
console.log(`db.users.updateOne(`);
console.log(`  { email: 'admin@confirmed.tn' },`);
console.log(`  { $set: { password: '${hashes.admin}' } }`);
console.log(`);\n`);

console.log('// Update Shop Owner password');
console.log(`db.users.updateOne(`);
console.log(`  { email: 'owner@techstore.tn' },`);
console.log(`  { $set: { password: '${hashes.shopOwner}' } }`);
console.log(`);\n`);

console.log('// Update Operator 1 password');
console.log(`db.users.updateOne(`);
console.log(`  { email: 'ahmed.hassan@techstore.tn' },`);
console.log(`  { $set: { password: '${hashes.operator1}' } }`);
console.log(`);\n`);

console.log('// Update Operator 2 password');
console.log(`db.users.updateOne(`);
console.log(`  { email: 'fatima.zahra@techstore.tn' },`);
console.log(`  { $set: { password: '${hashes.operator2}' } }`);
console.log(`);\n`);

console.log('============================================\n');
console.log('✅ Done! Run these commands in mongosh to set passwords.\n');
console.log('📝 Login Credentials:\n');
console.log(`   Admin:      admin@confirmed.tn / ${passwords.admin}`);
console.log(`   Shop Owner: owner@techstore.tn / ${passwords.shopOwner}`);
console.log(`   Operator 1: ahmed.hassan@techstore.tn / ${passwords.operator1}`);
console.log(`   Operator 2: fatima.zahra@techstore.tn / ${passwords.operator2}`);
console.log('\n⚠️  Remember to change these passwords in production!\n');
