#!/usr/bin/env ts-node
/**
 * uploadRoster.ts — Admin SDK script to populate /roster/{studentId} in Firestore.
 *
 * Usage:
 *   npx ts-node scripts/uploadRoster.ts students.csv
 *
 * CSV format (with header row):
 *   studentId,fullName,programme,intake
 *
 * Requirements:
 *   - GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key JSON
 *   - npm install -D ts-node firebase-admin csv-parse
 *
 * The script is idempotent: re-running it with the same CSV will not create
 * duplicates (it uses set() with merge:false by default — existing docs are skipped).
 * Pass --overwrite to force-update existing records.
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
const OVERWRITE = process.argv.includes("--overwrite");
const csvPath   = process.argv[2];

if (!csvPath) {
  console.error("Usage: npx ts-node scripts/uploadRoster.ts <students.csv> [--overwrite]");
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS env var not set.");
  process.exit(1);
}

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Parse CSV
// ---------------------------------------------------------------------------
const csvContent = fs.readFileSync(path.resolve(csvPath), "utf-8");
const rows = parse(csvContent, { columns: true, skip_empty_lines: true }) as Array<{
  studentId: string;
  fullName:  string;
  programme: string;
  intake:    string;
}>;

console.log(`Parsed ${rows.length} rows from ${csvPath}`);

// ---------------------------------------------------------------------------
// Upload in batches of 500 (Firestore limit)
// ---------------------------------------------------------------------------
async function upload() {
  let written  = 0;
  let skipped  = 0;
  let errored  = 0;
  const BATCH  = 500;

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const batch = db.batch();

    for (const row of chunk) {
      const { studentId, fullName, programme, intake } = row;
      if (!studentId || !/^\d{7}$/.test(studentId)) {
        console.warn(`  Skipping invalid studentId: "${studentId}"`);
        errored++;
        continue;
      }

      const ref = db.collection("roster").doc(studentId);

      if (!OVERWRITE) {
        // Check existence — skip if already present
        const snap = await ref.get();
        if (snap.exists) {
          skipped++;
          continue;
        }
      }

      batch.set(ref, {
        fullName,
        programme,
        intake,
        eligible: true,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      written++;
    }

    await batch.commit();
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${written} written so far…`);
  }

  console.log("\nDone.");
  console.log(`  Written : ${written}`);
  console.log(`  Skipped : ${skipped} (already existed)`);
  console.log(`  Errored : ${errored} (invalid ID format)`);
}

upload().catch((err) => {
  console.error("Upload failed:", err);
  process.exit(1);
});
