/**
 * Audit MongoDB for Docker E2E test data. Read-only — does not delete.
 * Run: npm run audit:e2e   (from backend/)
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_restaurant';

const PATTERNS = [
  /e2e_mgr_/i,
  /docker_e2e_/i,
  /Docker E2E/i,
  /Docker Burger/i,
  /123 Docker Test Street/i,
  /_1786954\d+/i,
];

function isE2E(doc) {
  return PATTERNS.some((p) => p.test(JSON.stringify(doc)));
}

function pick(col, doc) {
  const base = { _id: String(doc._id) };
  switch (col) {
    case 'restaurants':
      return { ...base, name: doc.name, status: doc.status };
    case 'users':
      return { ...base, username: doc.username, role: doc.role };
    case 'customers':
      return { ...base, email: doc.email, fullName: doc.fullName, phone: doc.phone };
    case 'orders':
      return {
        ...base,
        restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
        customerId: doc.customerId ? String(doc.customerId) : null,
        status: doc.status,
        totalAmount: doc.totalAmount,
      };
    case 'addresses':
      return { ...base, label: doc.label, fullAddress: doc.fullAddress };
    case 'menuitems':
      return { ...base, name: doc.name };
    case 'categories':
      return { ...base, name: doc.name };
    case 'reservations':
      return { ...base, status: doc.status };
    case 'reviews':
      return { ...base, rating: doc.rating };
    default:
      return { ...base, snippet: JSON.stringify(doc).slice(0, 120) };
  }
}

async function main() {
  const label = MONGO_URI.includes('mongodb+srv') ? 'Atlas (primary dev)' : 'Local MongoDB';
  console.log(`\n=== Audit: ${label} ===`);
  console.log(`URI: ${MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const cols = (await db.listCollections().toArray()).map((c) => c.name).sort();

  const e2e = {};
  const all = {};

  for (const col of cols) {
    const docs = await db.collection(col).find({}).toArray();
    if (!docs.length) continue;
    all[col] = docs.map((d) => pick(col, d));
    const hits = docs.filter(isE2E).map((d) => pick(col, d));
    if (hits.length) e2e[col] = hits;
  }

  const admins = await db
    .collection('users')
    .find({ role: 'super_admin' })
    .project({ username: 1, role: 1, createdAt: 1, updatedAt: 1 })
    .toArray();

  console.log('=== E2E candidates ===');
  console.log(JSON.stringify(e2e, null, 2));
  console.log('\n=== All documents ===');
  for (const [col, docs] of Object.entries(all)) {
    console.log(`\n[${col}] (${docs.length})`);
    docs.forEach((d) => console.log(' ', JSON.stringify(d)));
  }
  console.log('\n=== Superadmin accounts ===');
  admins.forEach((a) =>
    console.log(
      ' ',
      JSON.stringify({
        _id: String(a._id),
        username: a.username,
        role: a.role,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }),
    ),
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
