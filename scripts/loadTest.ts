import { initializeApp as initAdmin, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, FieldValue } from "firebase-admin/firestore";
import { joinList } from "../src/lib/listFirestore";
import { QUEUE_COLLECTION } from "../src/lib/eventConfig";

// Set environment for client SDK to use emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

// Initialize Admin SDK (it automatically uses FIRESTORE_EMULATOR_HOST when set)
const adminApp = initAdmin({ projectId: "demo-op-website" });
const adminDb = getAdminFirestore(adminApp);

const SEED_COUNT = 500;
const TEST_DATE = QUEUE_COLLECTION.dateKey;
const TEST_SLOT = QUEUE_COLLECTION.timeslots[0].key;
const SLOT_DOC_ID = `${TEST_DATE}_${TEST_SLOT}`;
const SLOT_CAP = QUEUE_COLLECTION.slotCap;

async function setupEmulator() {
  console.log("Setting up emulator data via Admin SDK...");
  
  // Seed roster for 1000000 to 1000000 + SEED_COUNT
  const batch1 = adminDb.batch();
  for (let i = 0; i < SEED_COUNT; i++) {
    const studentId = String(1000000 + i);
    const ref = adminDb.collection("roster").doc(studentId);
    batch1.set(ref, {
      fullName: `Test User ${i}`,
      programme: "Testing",
      eligible: true,
      uploadedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch1.commit();

  // Seed slot doc
  await adminDb.collection("counter").doc(SLOT_DOC_ID).set({
    count: 0,
    cap: SLOT_CAP,
  });

  console.log("Setup complete.\n");
}

async function runValidTest() {
  console.log(`--- Test 1: ${SEED_COUNT} Valid Users (Cap is ${SLOT_CAP}) ---`);
  
  const promises = [];
  const start = Date.now();
  
  for (let i = 0; i < SEED_COUNT; i++) {
    const studentId = String(1000000 + i);
    promises.push(
      joinList("queue", {
        fullName: `Test User ${i}`,
        studentId,
        studentEmail: `${studentId}@sd.taylors.edu.my`,
        personalEmail: `test${i}@gmail.com`,
        phoneNumber: "0123456789",
        collectDetails: {
          date: TEST_DATE,
          timeslot: TEST_SLOT,
        }
      }).catch((e) => e.message)
    );
  }

  const results = await Promise.all(promises);
  const end = Date.now();
  
  const successCount = results.filter(r => r === undefined).length;
  const slotFullCount = results.filter(r => r === "Slot full").length;
  const otherErrors = results.filter(r => r !== undefined && r !== "Slot full");
  
  console.log(`Test completed in ${end - start}ms`);
  console.log(`Successful registrations: ${successCount}`);
  console.log(`"Slot full" rejections: ${slotFullCount}`);
  if (otherErrors.length > 0) {
    console.log(`Unexpected errors:`, otherErrors.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
  }

  // Validate database state
  const snap = await adminDb.collection("counter").doc(SLOT_DOC_ID).get();
  const actualCount = snap.data()?.count;
  
  console.log(`\nValidation:`);
  console.log(`Successes ≤ Cap: ${successCount <= SLOT_CAP ? "✅" : "❌"}`);
  console.log(`Counter exactly matches successes: ${actualCount === successCount ? "✅" : "❌"} (${actualCount})`);
  console.log(`No unexpected errors: ${otherErrors.length === 0 ? "✅" : "❌"}\n`);
}

async function runInvalidTest() {
  console.log(`--- Test 2: 100 Unlisted Users (Not on roster) ---`);
  
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const studentId = String(9000000 + i); // These are not seeded in roster
    promises.push(
      joinList("queue", {
        fullName: `Invalid User ${i}`,
        studentId,
        studentEmail: `${studentId}@sd.taylors.edu.my`,
        personalEmail: `invalid${i}@gmail.com`,
        phoneNumber: "0123456789",
        collectDetails: {
          date: TEST_DATE,
          timeslot: TEST_SLOT,
        }
      }).catch((e) => e.message)
    );
  }

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r === undefined).length;
  const permDeniedCount = results.filter(r => String(r).includes("permission-denied") || String(r).includes("Missing or insufficient permissions")).length;
  
  console.log(`Successful registrations: ${successCount}`);
  console.log(`Permission denied rejections: ${permDeniedCount}`);
  
  console.log(`\nValidation:`);
  console.log(`Zero successes: ${successCount === 0 ? "✅" : "❌"}`);
  console.log(`All failed with permission-denied: ${permDeniedCount === 100 ? "✅" : "❌"}\n`);
}

async function run() {
  await setupEmulator();
  await runValidTest();
  await runInvalidTest();
  process.exit(0);
}

run();
