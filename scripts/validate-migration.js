// Compares document counts per collection between the source Cosmos DB and the
// target Oracle Autonomous JSON Database after running migrate-cosmos-to-oracle.sh,
// and runs the aggregation patterns ($lookup / $group) actually used by the
// NexusCart services against the target to confirm Oracle Database API for
// MongoDB compatibility before cutting Azure Container Apps over.
//
// Usage:
//   SOURCE_MONGODB_URI="..." TARGET_MONGODB_URI="..." node validate-migration.js

const mongoose = require("mongoose");

const SOURCE_URI = process.env.SOURCE_MONGODB_URI;
const TARGET_URI = process.env.TARGET_MONGODB_URI;
const TARGET_SCHEMA = process.env.TARGET_SCHEMA || "nexuscart";

if (!SOURCE_URI || !TARGET_URI) {
  console.error("Set SOURCE_MONGODB_URI and TARGET_MONGODB_URI");
  process.exit(1);
}

// Oracle Database API for MongoDB's listCollections() doesn't reliably return
// a driver-compatible cursor, so enumerate the known collections directly
// instead (verified against backend/*/src/models/*.ts mongoose.model() calls).
const KNOWN_COLLECTIONS = [
  "users",
  "products",
  "orders",
  "payments",
  "businesses",
  "reviews",
  "promotions",
  "banners",
  "bannertemplates",
  "notificationlogs",
  "settings",
  "verificationcodes",
];

async function countsFor(connection, dbName) {
  const db = dbName ? connection.useDb(dbName, { useCache: true }) : connection.db;
  const counts = {};
  for (const name of KNOWN_COLLECTIONS) {
    try {
      counts[name] = await db.collection(name).countDocuments();
    } catch (err) {
      counts[name] = `ERROR: ${err.message}`;
    }
  }
  return counts;
}

async function main() {
  const source = await mongoose.createConnection(SOURCE_URI, { serverSelectionTimeoutMS: 20000 }).asPromise();
  const target = await mongoose.createConnection(TARGET_URI, { serverSelectionTimeoutMS: 20000 }).asPromise();

  const sourceCounts = await countsFor(source);
  const targetCounts = await countsFor(target, TARGET_SCHEMA);

  console.log("\n=== Document count comparison ===");
  const allCollections = new Set([...Object.keys(sourceCounts), ...Object.keys(targetCounts)]);
  let mismatches = 0;
  for (const name of allCollections) {
    const s = sourceCounts[name] ?? "MISSING";
    const t = targetCounts[name] ?? "MISSING";
    const ok = s === t;
    if (!ok) mismatches++;
    console.log(`${ok ? "OK  " : "DIFF"}  ${name}: source=${s} target=${t}`);
  }

  // Aggregation compatibility checks matching real service query patterns.
  console.log("\n=== Aggregation compatibility checks (against target) ===");
  const targetDb = target.useDb(TARGET_SCHEMA, { useCache: true });

  const checks = [
    {
      name: "orders: $group by status with $sum",
      collection: "orders",
      pipeline: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
    },
    {
      name: "orders -> users: $lookup join",
      collection: "orders",
      pipeline: [
        { $limit: 1 },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
      ],
    },
    {
      name: "reviews: $match + $group avg rating",
      collection: "reviews",
      pipeline: [{ $group: { _id: "$productId", avgRating: { $avg: "$rating" } } }],
    },
  ];

  for (const check of checks) {
    try {
      const result = await targetDb.collection(check.collection).aggregate(check.pipeline).toArray();
      console.log(`OK    ${check.name} (${result.length} result rows)`);
    } catch (err) {
      console.log(`FAIL  ${check.name}: ${err.message}`);
    }
  }

  await source.close();
  await target.close();

  if (mismatches > 0) {
    console.error(`\n${mismatches} collection(s) have mismatched counts. Investigate before cutover.`);
    process.exit(1);
  }
  console.log("\nAll collection counts match.");
}

main().catch((err) => {
  console.error("Validation failed:", err);
  process.exit(1);
});
